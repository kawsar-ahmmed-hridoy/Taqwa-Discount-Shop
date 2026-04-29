import { getPrismaClient } from '../../config';
import { hashPassword } from '../../utils';

const prisma = getPrismaClient();

export const listStaff = async () =>
  prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

export const createStaff = async (payload: {
  email: string;
  fullName: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
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

export const updateStaff = async (
  id: number,
  payload: Partial<{ email: string; fullName: string; role: 'OWNER' | 'MANAGER' | 'STAFF'; isActive: boolean }>
) => prisma.user.update({ where: { id }, data: payload, select: { id: true, email: true, fullName: true, role: true, isActive: true } });

export const deleteStaff = async (id: number) => prisma.user.delete({ where: { id } });
