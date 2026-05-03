import { getPrismaClient } from '../../config';
import {
  hashPassword,
  comparePassword,
  generateToken,
  isValidEmail,
  sendPasswordResetVerificationEmail,
} from '../../utils';
import { AuthError, ConflictError, NotFoundError, ValidationError } from '../../errors';
import {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  ResetPasswordRequest,
  ForgotPasswordRequest,
  ConfirmForgotPasswordRequest,
} from './auth.types';
import { recordAuditLog } from '../audit-logs/audit-logs.service';
import { config } from '../../config/app.config';

const prisma = getPrismaClient();

type PasswordResetVerificationRecord = {
  id: number;
  email: string;
  expiresAt: Date;
};

const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


const toAuthResponse = (user: {
  id: number;
  email: string;
  fullName: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
}): AuthResponse => {
  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.fullName,
    role: user.role,
  });

  return {
    token,
    user,
  };
};



export const loginService = async (request: LoginRequest): Promise<AuthResponse> => {
  const { email, password, ipAddress } = request;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw new AuthError('Invalid email or password');
  }

  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    throw new AuthError('Invalid email or password');
  }

  await recordAuditLog({
    userId: user.id,
    actorRole: user.role,
    action: 'LOGIN',
    entity: 'USER',
    entityId: user.id,
    details: 'User logged in successfully',
    ipAddress,
  });

  return toAuthResponse({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
};



export const signupService = async (request: SignupRequest): Promise<AuthResponse> => {
  const { email, password, fullName, role = 'STAFF', ipAddress } = request;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role,
      isActive: true,
    },
  });

  await recordAuditLog({
    userId: user.id,
    actorRole: user.role,
    action: 'SIGNUP',
    entity: 'USER',
    entityId: user.id,
    details: `User account created as ${user.role}`,
    ipAddress,
  });

  return toAuthResponse({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
};



export const getCurrentUserService = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};


export const resetPasswordService = async (request: ResetPasswordRequest): Promise<void> => {
  const { userId, currentPassword, newPassword, ipAddress } = request;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isCurrentValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentValid) {
    throw new AuthError('Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
  });

  await recordAuditLog({
    userId,
    actorRole: user.role,
    action: 'PASSWORD_RESET',
    entity: 'USER',
    entityId: userId,
    details: 'Password changed successfully',
    ipAddress,
  });
};

export const requestForgotPasswordVerification = async (
  request: ForgotPasswordRequest
): Promise<PasswordResetVerificationRecord | null> => {
  const email = request.email.trim().toLowerCase();

  if (!isValidEmail(email)) {
    throw new ValidationError('Please enter a valid email address');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true },
  });

  if (!user) {
    return null;
  }

  const code = generateVerificationCode();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + config.STAFF_VERIFICATION_EXPIRY_MINUTES * 60 * 1000);

  const verification = await prisma.passwordResetVerification.upsert({
    where: { email },
    update: {
      codeHash,
      attempts: 0,
      expiresAt,
    },
    create: {
      email,
      codeHash,
      expiresAt,
    },
    select: { id: true, email: true, expiresAt: true },
  });

  await sendPasswordResetVerificationEmail({
    to: user.email,
    fullName: user.fullName,
    code,
    expiresInMinutes: config.STAFF_VERIFICATION_EXPIRY_MINUTES,
  });

  return verification;
};

export const confirmForgotPasswordVerification = async (
  request: ConfirmForgotPasswordRequest
): Promise<void> => {
  const verification = await prisma.passwordResetVerification.findUnique({
    where: { id: request.verificationId },
  });

  if (!verification) {
    throw new NotFoundError('Verification request not found');
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    await prisma.passwordResetVerification.delete({ where: { id: verification.id } });
    throw new ValidationError('Verification code has expired');
  }

  const isValidCode = await comparePassword(request.code, verification.codeHash);
  if (!isValidCode) {
    await prisma.passwordResetVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ValidationError('Invalid verification code');
  }

  const user = await prisma.user.findUnique({
    where: { email: verification.email },
  });

  if (!user) {
    await prisma.passwordResetVerification.delete({ where: { id: verification.id } });
    throw new NotFoundError('User not found');
  }

  const passwordHash = await hashPassword(request.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });

    await tx.passwordResetVerification.delete({ where: { id: verification.id } });
  });

  await recordAuditLog({
    userId: user.id,
    actorRole: user.role,
    action: 'PASSWORD_RESET',
    entity: 'USER',
    entityId: user.id,
    details: 'Password changed after email verification',
  });
};


export const logoutService = async (userId: number, actorRole?: 'OWNER' | 'MANAGER' | 'STAFF', ipAddress?: string): Promise<void> => {
  await recordAuditLog({
    userId,
    actorRole,
    action: 'LOGOUT',
    entity: 'USER',
    entityId: userId,
    details: 'User logged out',
    ipAddress,
  });
};
