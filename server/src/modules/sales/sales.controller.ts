import { Request, Response } from 'express';
import { PaymentMode } from '@prisma/client';
import { RequestWithUser } from '../../types';
import { createSale, listSales, getSale } from './sales.service';

export const postSale = async (req: Request, res: Response): Promise<any> => {
  try {
    const userReq = req as RequestWithUser;
    if (!userReq.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { items, customerId, paymentMode, discount } = req.body as {
      items: Array<{ productId: number; quantity: number }>;
      customerId?: number;
      paymentMode: PaymentMode;
      discount?: number;
    };

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    const data = await createSale({
      userId: Number(userReq.user.id),
      items,
      customerId,
      paymentMode,
      discount,
    });

    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to create sale' });
  }
};

export const getSales = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const result = await listSales({ page, limit, startDate, endDate });
    return res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch sales' });
  }
};

export const getSaleById = async (req: Request, res: Response): Promise<any> => {
  const sale = await getSale(Number(req.params.id));
  if (!sale) {
    return res.status(404).json({ success: false, message: 'Sale not found' });
  }
  return res.json({ success: true, data: sale });
};

export const getInvoice = async (req: Request, res: Response): Promise<any> => {
  const sale = await getSale(Number(req.params.id));
  if (!sale) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }
  return res.json({ success: true, data: sale });
};
