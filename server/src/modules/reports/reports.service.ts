import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

export const getSalesReport = async (query: { startDate?: string; endDate?: string }) => {
  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) where.createdAt.gte = new Date(query.startDate);
    if (query.endDate) where.createdAt.lte = new Date(query.endDate);
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { items: true, user: { select: { fullName: true } } },
  });

  return {
    sales,
    summary: {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
      totalDiscount: sales.reduce((sum, s) => sum + s.discount, 0),
      totalVAT: sales.reduce((sum, s) => sum + s.vat, 0),
    },
  };
};

export const getInventoryReport = async () => {
  const products = await prisma.product.findMany({ include: { category: true } });

  return {
    products,
    summary: {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0),
      lowStockItems: products.filter((p) => p.stockQuantity <= p.minStockLevel).length,
    },
  };
};

export const getExpenseReport = async (query: { startDate?: string; endDate?: string }) => {
  const where: { status: 'APPROVED'; expenseDate?: { gte?: Date; lte?: Date } } = { status: 'APPROVED' };
  if (query.startDate || query.endDate) {
    where.expenseDate = {};
    if (query.startDate) where.expenseDate.gte = new Date(query.startDate);
    if (query.endDate) where.expenseDate.lte = new Date(query.endDate);
  }

  const expenses = await prisma.expense.findMany({ where });

  return {
    expenses,
    summary: {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      byCategory: expenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {}),
    },
  };
};
