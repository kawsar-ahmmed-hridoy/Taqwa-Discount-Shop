import { ExpenseStatus } from '@prisma/client';
import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

export const listExpenses = async (query: { status?: ExpenseStatus; startDate?: string; endDate?: string }) => {
  const where: { status?: ExpenseStatus; expenseDate?: { gte?: Date; lte?: Date } } = {};

  if (query.status) where.status = query.status;
  if (query.startDate || query.endDate) {
    where.expenseDate = {};
    if (query.startDate) where.expenseDate.gte = new Date(query.startDate);
    if (query.endDate) where.expenseDate.lte = new Date(query.endDate);
  }

  return prisma.expense.findMany({
    where,
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: { expenseDate: 'desc' },
  });
};

export const createExpense = async (payload: {
  userId: number;
  category: string;
  amount: number;
  description: string;
  expenseDate?: string;
}) => {
  return prisma.expense.create({
    data: {
      category: payload.category,
      amount: payload.amount,
      description: payload.description,
      userId: payload.userId,
      expenseDate: payload.expenseDate ? new Date(payload.expenseDate) : new Date(),
    },
  });
};

export const approveExpense = async (id: number, status: ExpenseStatus) =>
  prisma.expense.update({ where: { id }, data: { status } });
