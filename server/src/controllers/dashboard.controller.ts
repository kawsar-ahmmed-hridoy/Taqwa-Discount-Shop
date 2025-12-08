import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaySales, lowStock, pendingOrders, notifications] = await Promise.all([
      prisma.sale.findMany({ where: { createdAt: { gte: today } } }),
      prisma.product.findMany({ where: { stockQuantity: { lte: prisma.product.fields.minStockLevel } } }),
      prisma.purchaseOrder.findMany({ where: { status: 'PENDING' } }),
      prisma.notification.findMany({ where: { isRead: false }, take: 10, orderBy: { createdAt: 'desc' } }),
    ]);

    const data = {
      todaySales: {
        count: todaySales.length,
        revenue: todaySales.reduce((sum: any, s: { total: any; }) => sum + s.total, 0),
      },
      lowStock: lowStock.length,
      pendingOrders: pendingOrders.length,
      notifications: notifications.length,
    };

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};
