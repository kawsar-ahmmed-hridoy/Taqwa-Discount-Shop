import { Request, Response } from 'express';
import { RequestWithUser } from '../../types';
import { recordAuditLog } from '../audit-logs/audit-logs.service';
import {
  listPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
} from './purchase-orders.service';

export const getPurchaseOrders = async (req: Request, res: Response): Promise<any> => {
  try {
    const status = req.query.status as 'PENDING' | 'DELIVERED' | 'CANCELLED' | undefined;
    const data = await listPurchaseOrders(status);
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch purchase orders' });
  }
};

export const postPurchaseOrder = async (req: Request, res: Response): Promise<any> => {
  try {
    const userReq = req as RequestWithUser;
    if (!userReq.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { supplierId, items, notes } = req.body as {
      supplierId: number;
      items: Array<{ productId: number; quantity: number; price: number }>;
      notes?: string;
    };

    const data = await createPurchaseOrder({
      supplierId,
      userId: Number(userReq.user.id),
      items,
      notes,
    });

    await recordAuditLog({
      userId: Number(userReq.user.id),
      actorRole: userReq.user.role,
      action: 'PURCHASE_ORDER_CREATED',
      entity: 'PURCHASE_ORDER',
      entityId: data.id,
      details: `${data.orderNo} created for ${data.supplier?.name ?? 'supplier'}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create purchase order' });
  }
};

export const putPurchaseOrderStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await updatePurchaseOrderStatus(Number(req.params.id), req.body);
    const userReq = req as RequestWithUser;
    if (userReq.user) {
      await recordAuditLog({
        userId: Number(userReq.user.id),
        actorRole: userReq.user.role,
        action: 'PURCHASE_ORDER_STATUS_UPDATED',
        entity: 'PURCHASE_ORDER',
        entityId: data.id,
        details: `${data.orderNo} moved to ${data.status}`,
        ipAddress: req.ip,
      });
    }
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};
