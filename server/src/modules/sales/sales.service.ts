import { PaymentMode, SaleStatus, RefundStatus } from '@prisma/client';
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
        status: SaleStatus.COMPLETED,
        items: { create: saleItems },
      },
      include: {
        customer: true,
        user: { select: { id: true, fullName: true, email: true } },
        items: { include: { product: true } },
        refunds: true,
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
        refunds: true,
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
      refunds: true,
    },
});

export const createRefundRequest = async (payload: {
  saleId: number;
  reason: string;
  amount: number;
  notes?: string;
}) => {
  const sale = await prisma.sale.findUnique({ where: { id: payload.saleId } });
  if (!sale) {
    throw new Error('Sale not found');
  }

  if (payload.amount > sale.total) {
    throw new Error('Refund amount cannot exceed sale total');
  }

  if (payload.amount <= 0) {
    throw new Error('Refund amount must be greater than 0');
  }

  const refund = await prisma.refund.create({
    data: {
      saleId: payload.saleId,
      reason: payload.reason,
      amount: payload.amount,
      notes: payload.notes,
      status: RefundStatus.PENDING,
    },
    include: {
      sale: { include: { customer: true, user: true } },
    },
  });

  return refund;
};

export const approveRefund = async (refundId: number, approvedBy: number, notes?: string) => {
  const refund = await prisma.refund.findUnique({ where: { id: refundId } });
  if (!refund) {
    throw new Error('Refund not found');
  }

  if (refund.status !== RefundStatus.PENDING) {
    throw new Error(`Cannot approve a refund with status: ${refund.status}`);
  }

  const updatedRefund = await prisma.refund.update({
    where: { id: refundId },
    data: {
      status: RefundStatus.APPROVED,
      approvedBy,
      notes: notes ?? refund.notes,
      updatedAt: new Date(),
    },
    include: {
      sale: { include: { customer: true, user: true } },
      approver: { select: { id: true, fullName: true, email: true } },
    },
  });

  return updatedRefund;
};

export const rejectRefund = async (refundId: number, reason: string) => {
  const refund = await prisma.refund.findUnique({ where: { id: refundId } });
  if (!refund) {
    throw new Error('Refund not found');
  }

  if (refund.status !== RefundStatus.PENDING) {
    throw new Error(`Cannot reject a refund with status: ${refund.status}`);
  }

  const updatedRefund = await prisma.refund.update({
    where: { id: refundId },
    data: {
      status: RefundStatus.REJECTED,
      notes: reason,
      updatedAt: new Date(),
    },
    include: {
      sale: { include: { customer: true, user: true } },
    },
  });

  return updatedRefund;
};

export const processRefund = async (refundId: number) => {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { sale: true },
  });

  if (!refund) {
    throw new Error('Refund not found');
  }

  if (refund.status !== RefundStatus.APPROVED) {
    throw new Error('Only approved refunds can be processed');
  }

  const updatedRefund = await prisma.$transaction(async (tx) => {
    // Update refund status to PROCESSED
    const processed = await tx.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.PROCESSED,
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update sale status to REFUNDED
    await tx.sale.update({
      where: { id: refund.saleId },
      data: { status: SaleStatus.REFUNDED, updatedAt: new Date() },
    });

    // Restore stock for all items in the sale
    const saleItems = await tx.saleItem.findMany({
      where: { saleId: refund.saleId },
    });

    for (const item of saleItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }

    return processed;
  });

  return updatedRefund;
};

export const getSaleRefunds = async (saleId: number) => {
  const refunds = await prisma.refund.findMany({
    where: { saleId },
    include: {
      approver: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return refunds;
};

export const getRefund = async (id: number) =>
  prisma.refund.findUnique({
    where: { id },
    include: {
      sale: { include: { customer: true, user: true, items: { include: { product: true } } } },
      approver: { select: { id: true, fullName: true, email: true } },
    },
  });
