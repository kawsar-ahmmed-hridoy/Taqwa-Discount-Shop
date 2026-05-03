import { getPrismaClient } from '../../config';
import { hashPassword, comparePassword, isGmailAddress, sendStaffVerificationEmail } from '../../utils';
import { ConflictError, NotFoundError, ValidationError } from '../../errors';
import { config } from '../../config/app.config';

const prisma = getPrismaClient();

type StaffRole = 'OWNER' | 'MANAGER' | 'STAFF';

const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const listStaff = async () =>
  prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

export const createStaff = async (payload: {
  email: string;
  fullName: string;
  role: StaffRole;
  password: string;
  isActive?: boolean;
}) => {
  const passwordHash = await hashPassword(payload.password);
  return prisma.user.create({
    data: {
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      password: passwordHash,
      isActive: payload.isActive ?? true,
    },
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });
};

export const requestStaffVerification = async (payload: {
  email: string;
  fullName: string;
  role: StaffRole;
  password: string;
  isActive?: boolean;
}) => {
  const email = payload.email.trim().toLowerCase();

  if (!isGmailAddress(email)) {
    throw new ValidationError('Please use a Gmail address for staff verification');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  const code = generateVerificationCode();
  const codeHash = await hashPassword(code);
  const passwordHash = await hashPassword(payload.password);
  const expiresAt = new Date(Date.now() + config.STAFF_VERIFICATION_EXPIRY_MINUTES * 60 * 1000);

  const verification = await prisma.staffVerification.upsert({
    where: { email },
    update: {
      fullName: payload.fullName,
      passwordHash,
      role: payload.role,
      isActive: payload.isActive ?? true,
      codeHash,
      attempts: 0,
      expiresAt,
    },
    create: {
      email,
      fullName: payload.fullName,
      passwordHash,
      role: payload.role,
      isActive: payload.isActive ?? true,
      codeHash,
      expiresAt,
    },
    select: { id: true, email: true, expiresAt: true },
  });

  await sendStaffVerificationEmail({
    to: email,
    fullName: payload.fullName,
    code,
    expiresInMinutes: config.STAFF_VERIFICATION_EXPIRY_MINUTES,
  });

  return verification;
};

export const confirmStaffVerification = async (payload: { verificationId: number; code: string }) => {
  const verification = await prisma.staffVerification.findUnique({
    where: { id: payload.verificationId },
  });

  if (!verification) {
    throw new NotFoundError('Verification request not found');
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    await prisma.staffVerification.delete({ where: { id: verification.id } });
    throw new ValidationError('Verification code has expired');
  }

  const isValidCode = await comparePassword(payload.code, verification.codeHash);
  if (!isValidCode) {
    await prisma.staffVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ValidationError('Invalid verification code');
  }

  const existingUser = await prisma.user.findUnique({ where: { email: verification.email } });
  if (existingUser) {
    await prisma.staffVerification.delete({ where: { id: verification.id } });
    throw new ConflictError('User with this email already exists');
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: verification.email,
        password: verification.passwordHash,
        fullName: verification.fullName,
        role: verification.role,
        isActive: verification.isActive,
      },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
    });

    await tx.staffVerification.delete({ where: { id: verification.id } });

    return user;
  });
};

export const updateStaff = async (
  id: number,
  payload: Partial<{ email: string; fullName: string; role: StaffRole; isActive: boolean }>
) => prisma.user.update({ where: { id }, data: payload, select: { id: true, email: true, fullName: true, role: true, isActive: true } });

export const deleteStaff = async (id: number) => {
  const [salesCount, expensesCount, purchaseOrderCount, auditLogCount] = await Promise.all([
    prisma.sale.count({ where: { userId: id } }),
    prisma.expense.count({ where: { userId: id } }),
    prisma.purchaseOrder.count({ where: { userId: id } }),
    prisma.auditLog.count({ where: { userId: id } }),
  ]);

  const hasHistory = salesCount > 0 || expensesCount > 0 || purchaseOrderCount > 0 || auditLogCount > 0;

  if (hasHistory) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
  }

  return prisma.user.delete({ where: { id } });
};
