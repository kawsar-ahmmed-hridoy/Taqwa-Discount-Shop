import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient, PaymentMode } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const generateInvoiceNo = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const lastSale = await prisma.sale.findFirst({
    where: {
      invoiceNo: {
        startsWith: `INV-${year}${month}`,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let sequence = 1;
  if (lastSale) {
    const lastSequence = parseInt(lastSale.invoiceNo.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `INV-${year}${month}-${String(sequence).padStart(5, '0')}`;
};

export const createSale = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { items, customerId, paymentMode, discount = 0 } = req.body;

    const vatSetting = await prisma.settings.findUnique({
      where: { key: 'vat_rate' },
    });
    const vatRate = vatSetting ? parseFloat(vatSetting.value) : 5;

    let subtotal = 0;
    const saleItems: { productId: any; quantity: any; price: any; total: number; }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`,
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      const itemTotal = product.sellingPrice * item.quantity;
      subtotal += itemTotal;

      saleItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.sellingPrice,
        total: itemTotal,
      });
    }

    const discountAmount = (subtotal * discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const vat = (afterDiscount * vatRate) / 100;
    const total = afterDiscount + vat;

    const invoiceNo = await generateInvoiceNo();

    const sale = await prisma.$transaction(async (tx: { sale: { create: (arg0: { data: { invoiceNo: string; customerId: any; userId: number; subtotal: number; discount: number; vat: number; total: number; paymentMode: PaymentMode; items: { create: { productId: any; quantity: any; price: any; total: number; }[]; }; }; include: { items: { include: { product: boolean; }; }; customer: boolean; }; }) => any; }; product: { update: (arg0: { where: { id: any; }; data: { stockQuantity: { decrement: any; }; }; }) => any; findUnique: (arg0: { where: { id: any; }; }) => any; }; notification: { create: (arg0: { data: { type: string; title: string; message: string; }; }) => any; }; settings: { findUnique: (arg0: { where: { key: string; }; }) => any; }; customer: { update: (arg0: { where: { id: any; }; data: { loyaltyPoints: { increment: number; }; }; }) => any; }; }) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNo,
          customerId: customerId || null,
          userId: req.user!.id,
          subtotal,
          discount: discountAmount,
          vat,
          total,
          paymentMode: paymentMode as PaymentMode,
          items: {
            create: saleItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product && product.stockQuantity <= product.minStockLevel) {
          await tx.notification.create({
            data: {
              type: 'LOW_STOCK',
              title: 'Low Stock Alert',
              message: `Product "${product.name}" is running low. Current stock: ${product.stockQuantity}`,
            },
          });
        }
      }

      if (customerId) {
        const loyaltyRate = await tx.settings.findUnique({
          where: { key: 'loyalty_points_rate' },
        });
        const points = loyaltyRate ? Math.floor(total * parseFloat(loyaltyRate.value)) : Math.floor(total);

        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: {
              increment: points,
            },
          },
        });
      }

      return newSale;
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'SALE',
        entityId: sale.id,
        details: `Created sale: ${sale.invoiceNo} - Total: ${sale.total}`,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sale',
    });
  }
};

export const getSales = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({
      success: true,
      data: sales,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales',
    });
  }
};

export const getSaleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sale',
    });
  }
};

export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        user: {
          select: {
            fullName: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
    });
  }
};