import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSalesReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { items: true, user: { select: { fullName: true } } },
    });

    const summary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum: any, s: { total: any; }) => sum + s.total, 0),
      totalDiscount: sales.reduce((sum: any, s: { discount: any; }) => sum + s.discount, 0),
      totalVAT: sales.reduce((sum: any, s: { vat: any; }) => sum + s.vat, 0),
    };

    res.json({ success: true, data: { sales, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate sales report' });
  }
};

export const getInventoryReport = async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
    });

    const summary = {
      totalProducts: products.length,
      totalValue: products.reduce((sum: any, p: { sellingPrice: any; stockQuantity: any; }) => sum + (p.sellingPrice * p.stockQuantity), 0),
      lowStockItems: products.filter((p: { stockQuantity: number; minStockLevel: number; }) => p.stockQuantity <= p.minStockLevel).length,
    };

    res.json({ success: true, data: { products, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate inventory report' });
  }
};

export const getExpenseReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = { status: 'APPROVED' };
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate as string);
      if (endDate) where.expenseDate.lte = new Date(endDate as string);
    }

    const expenses = await prisma.expense.findMany({ where });
    const summary = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum: any, e: { amount: any; }) => sum + e.amount, 0),
      byCategory: expenses.reduce((acc: any, e: { category: any; amount: any; }) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {}),
    };

    res.json({ success: true, data: { expenses, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate expense report' });
  }
};
