import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

type PurchaseItemInput = {
  productId: number;
  quantity: number;
  price: number;
};

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
    sequence = Number(lastOrder.orderNo.split('-')[2]) + 1;
  }

  return `PO-${year}${month}-${String(sequence).padStart(5, '0')}`;
};

export const listPurchaseOrders = async (status?: 'PENDING' | 'DELIVERED' | 'CANCELLED') => {
  return prisma.purchaseOrder.findMany({
    where: status ? { status } : undefined,
    include: {
      supplier: true,
      user: { select: { id: true, fullName: true, email: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const createPurchaseOrder = async (payload: {
  supplierId: number;
  userId: number;
  notes?: string;
  items: PurchaseItemInput[];
}) => {
  let total = 0;
  const lineItems = payload.items.map((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    return { ...item, total: itemTotal };
  });

  const orderNo = await generateOrderNo();

  return prisma.purchaseOrder.create({
    data: {
      orderNo,
      supplierId: payload.supplierId,
      userId: payload.userId,
      notes: payload.notes,
      total,
      items: { create: lineItems },
    },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });
};

export const updatePurchaseOrderStatus = async (
  id: number,
  payload: { status: 'PENDING' | 'DELIVERED' | 'CANCELLED'; deliveryDate?: string }
) => {
  const order = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: payload.status,
      deliveryDate: payload.deliveryDate ? new Date(payload.deliveryDate) : undefined,
    },
    include: { items: true },
  });

  if (payload.status === 'DELIVERED') {
    await prisma.$transaction(
      order.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        })
      )
    );
  }

  return order;
};
