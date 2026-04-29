import { PaymentMode } from '@prisma/client';
import { getPrismaClient } from '../../config';

const prisma = getPrismaClient();

const generateInvoiceNo = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const lastSale = await prisma.sale.findFirst({
    where: { invoiceNo: { startsWith: `INV-${year}${month}` } },
    orderBy: { createdAt: 'desc' },
  });

  let sequence = 1;
  if (lastSale) {
    sequence = Number(lastSale.invoiceNo.split('-')[2]) + 1;
  }

  return `INV-${year}${month}-${String(sequence).padStart(5, '0')}`;
};


export const createSale = async (payload: {
  userId: number;
  customerId?: number;
  paymentMode: PaymentMode;
  discount?: number;
  items: Array<{ productId: number; quantity: number }>;
}) => {
  const vatSetting = await prisma.settings.findUnique({ where: { key: 'vat_rate' } });
  const vatRate = vatSetting ? Number(vatSetting.value) : 5;

  let subtotal = 0;
  const saleItems: Array<{ productId: number; quantity: number; price: number; total: number }> = [];

  for (const item of payload.items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }
    if (product.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for product: ${product.name}`);
    }

    const total = product.sellingPrice * item.quantity;
    subtotal += total;
    saleItems.push({ productId: item.productId, quantity: item.quantity, price: product.sellingPrice, total });
  }
  

  const discountPercent = payload.discount ?? 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vat = (afterDiscount * vatRate) / 100;
  const total = afterDiscount + vat;

  const invoiceNo = await generateInvoiceNo();

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        invoiceNo,
        customerId: payload.customerId ?? null,
        userId: payload.userId,
        subtotal,
        discount: discountAmount,
        vat,
        total,
        paymentMode: payload.paymentMode,
        items: { create: saleItems },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    for (const item of payload.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    return created;
  });

  return sale;
};

export const listSales = async (query: {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
}) => {
  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};

  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) where.createdAt.gte = new Date(query.startDate);
    if (query.endDate) where.createdAt.lte = new Date(query.endDate);
  }

  const skip = (query.page - 1) * query.limit;
  const [data, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: true,
        user: { select: { id: true, fullName: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
};


export const getSale = async (id: number) =>
  prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      user: { select: { id: true, fullName: true, email: true } },
      items: { include: { product: true } },
    },
});
