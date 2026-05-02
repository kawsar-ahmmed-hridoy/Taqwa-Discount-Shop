import { Request, Response } from 'express';
import { PaymentMode } from '@prisma/client';
import { RequestWithUser } from '../../types';
import { recordAuditLog } from '../audit-logs/audit-logs.service';
import {
  createSale,
  listSales,
  getSale,
  createRefundRequest,
  approveRefund,
  rejectRefund,
  processRefund,
  getSaleRefunds,
  getRefund,
} from './sales.service';

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

    await recordAuditLog({
      userId: Number(userReq.user.id),
      actorRole: userReq.user.role,
      action: 'SALE_COMPLETED',
      entity: 'SALE',
      entityId: data.id,
      details: `${data.invoiceNo} completed for ৳${Number(data.total).toFixed(2)}`,
      ipAddress: req.ip,
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

export const requestRefund = async (req: Request, res: Response): Promise<any> => {
  try {
    const userReq = req as RequestWithUser;
    const { saleId, reason, amount, notes } = req.body as {
      saleId: number;
      reason: string;
      amount: number;
      notes?: string;
    };

    if (!saleId || !reason || !amount) {
      return res.status(400).json({ success: false, message: 'saleId, reason, and amount are required' });
    }

    const refund = await createRefundRequest({ saleId, reason, amount, notes });
    if (userReq.user) {
      await recordAuditLog({
        userId: Number(userReq.user.id),
        actorRole: userReq.user.role,
        action: 'REFUND_REQUESTED',
        entity: 'REFUND',
        entityId: refund.id,
        details: `Sale ${saleId} refund requested for ৳${Number(amount).toFixed(2)}`,
        ipAddress: req.ip,
      });
    }
    return res.status(201).json({ success: true, data: refund });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to create refund request' });
  }
};

export const approveRefundRequest = async (req: Request, res: Response): Promise<any> => {
  try {
    const userReq = req as RequestWithUser;
    if (!userReq.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { notes } = req.body as { notes?: string };
    const refund = await approveRefund(Number(req.params.id), userReq.user.id, notes);
    await recordAuditLog({
      userId: Number(userReq.user.id),
      actorRole: userReq.user.role,
      action: 'REFUND_APPROVED',
      entity: 'REFUND',
      entityId: refund.id,
      details: `Refund ${refund.id} approved`,
      ipAddress: req.ip,
    });
    return res.json({ success: true, data: refund });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to approve refund' });
  }
};

export const rejectRefundRequest = async (req: Request, res: Response): Promise<any> => {
  try {
    const { reason } = req.body as { reason?: string };
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const refund = await rejectRefund(Number(req.params.id), reason);
    const userReq = req as RequestWithUser;
    if (userReq.user) {
      await recordAuditLog({
        userId: Number(userReq.user.id),
        actorRole: userReq.user.role,
        action: 'REFUND_REJECTED',
        entity: 'REFUND',
        entityId: refund.id,
        details: `Refund ${refund.id} rejected`,
        ipAddress: req.ip,
      });
    }
    return res.json({ success: true, data: refund });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to reject refund' });
  }
};

export const processRefundRequest = async (req: Request, res: Response): Promise<any> => {
  try {
    const refund = await processRefund(Number(req.params.id));
    const userReq = req as RequestWithUser;
    if (userReq.user) {
      await recordAuditLog({
        userId: Number(userReq.user.id),
        actorRole: userReq.user.role,
        action: 'REFUND_PROCESSED',
        entity: 'REFUND',
        entityId: refund.id,
        details: `Refund ${refund.id} processed`,
        ipAddress: req.ip,
      });
    }
    return res.json({ success: true, data: refund });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to process refund' });
  }
};

export const getRefundDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const refund = await getRefund(Number(req.params.id));
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Refund not found' });
    }
    return res.json({ success: true, data: refund });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to fetch refund details' });
  }
};

export const listSaleRefunds = async (req: Request, res: Response): Promise<any> => {
  try {
    const refunds = await getSaleRefunds(Number(req.params.saleId));
    return res.json({ success: true, data: refunds });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to fetch refunds' });
  }
};
