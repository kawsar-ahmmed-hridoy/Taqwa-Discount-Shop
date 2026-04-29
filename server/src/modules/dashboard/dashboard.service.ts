import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

export const getDashboardData = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySales, lowStockProducts, pendingOrders, notifications, recentSales, topProductsRaw] = await Promise.all([
    prisma.sale.findMany({ where: { createdAt: { gte: today } } }),
    prisma.product.findMany({ where: { isActive: true } }),
    prisma.purchaseOrder.findMany({ where: { status: 'PENDING' } }),
    prisma.notification.findMany({ where: { isRead: false }, take: 10, orderBy: { createdAt: 'desc' } }),
    prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { customer: { select: { name: true } } },
    }),
    prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: { gte: today },
        },
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
  ]);

  const productIds = topProductsRaw.map((row) => row.productId);
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
    : [];

  const productMap = new Map(products.map((p) => [p.id, p.name]));
  const topProducts = topProductsRaw.map((row) => ({
    id: row.productId,
    name: productMap.get(row.productId) || 'Unknown Product',
    quantity: row._sum.quantity || 0,
    revenue: row._sum.total || 0,
  }));

  return {
    todaySales: {
      count: todaySales.length,
      revenue: todaySales.reduce((sum, s) => sum + s.total, 0),
      discounts: todaySales.reduce((sum, s) => sum + s.discount, 0),
    },
    lowStock: lowStockProducts.filter((p) => p.stockQuantity <= p.minStockLevel).length,
    pendingOrders: pendingOrders.length,
    notifications: notifications.length,
    topProducts,
    recentSales: recentSales.map((sale) => ({
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      customer: sale.customer?.name || 'Walk-in Customer',
      total: sale.total,
      createdAt: sale.createdAt,
    })),
  };
};
