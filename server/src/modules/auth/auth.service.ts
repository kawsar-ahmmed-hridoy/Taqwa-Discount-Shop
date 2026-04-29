import { getPrismaClient } from '../../config';
import { hashPassword, comparePassword, generateToken } from '../../utils';
import { AuthError, ConflictError, NotFoundError } from '../../errors';
import { LoginRequest, SignupRequest, AuthResponse, ResetPasswordRequest } from './auth.types';

const prisma = getPrismaClient();


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
  const { email, password } = request;

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

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: 'User logged in successfully',
    },
  });

  return toAuthResponse({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
};



export const signupService = async (request: SignupRequest): Promise<AuthResponse> => {
  const { email, password, fullName, role = 'STAFF' } = request;

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

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'SIGNUP',
      entity: 'USER',
      entityId: user.id,
      details: 'User account created',
    },
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
  const { userId, currentPassword, newPassword } = request;
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

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PASSWORD_RESET',
      entity: 'USER',
      entityId: userId,
      details: 'Password changed successfully',
    },
  });
};


export const logoutService = async (userId: number): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'LOGOUT',
      entity: 'USER',
      entityId: userId,
      details: 'User logged out',
    },
  });
};
