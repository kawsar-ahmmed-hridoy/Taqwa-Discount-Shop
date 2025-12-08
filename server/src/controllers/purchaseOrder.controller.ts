import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const generateOrderNo = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const lastOrder = await prisma.purchaseOrder.findFirst({
    where: { orderNo: { startsWith: `PO-${year}${month}` } },
    orderBy: { createdAt: 'desc' },
  });
  let sequence = 1;
  if (lastOrder) {
    sequence = parseInt(lastOrder.orderNo.split('-')[2]) + 1;
  }
  return `PO-${year}${month}-${String(sequence).padStart(5, '0')}`;
};

export const getPurchaseOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch purchase orders' });
  }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, items, notes } = req.body;
    let total = 0;
    const orderItems = items.map((item: any) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      return { ...item, total: itemTotal };
    });

    const orderNo = await generateOrderNo();
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId,
        userId: req.user!.id,
        total,
        notes,
        items: { create: orderItems },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });

    await prisma.notification.create({
      data: {
        type: 'PURCHASE_ORDER',
        title: 'New Purchase Order',
        message: `Purchase order ${orderNo} created for ${order.supplier.name}`,
      },
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create purchase order' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, deliveryDate } = req.body;
    const order = await prisma.purchaseOrder.update({
      where: { id: Number(req.params.id) },
      data: {
        status,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      },
      include: { items: true },
    });

    if (status === 'DELIVERED') {
      await prisma.$transaction(
        order.items.map((item: { productId: any; quantity: any; }) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          })
        )
      );
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};
