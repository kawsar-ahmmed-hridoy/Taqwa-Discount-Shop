import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

export const listSuppliers = async () => prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });

export const createSupplier = async (payload: {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
}) => prisma.supplier.create({ data: payload });

export const updateSupplier = async (id: number, payload: Partial<{ name: string; contactPerson: string; phone: string; email: string; address: string }>) =>
  prisma.supplier.update({ where: { id }, data: payload });

export const deleteSupplier = async (id: number) => prisma.supplier.delete({ where: { id } });
