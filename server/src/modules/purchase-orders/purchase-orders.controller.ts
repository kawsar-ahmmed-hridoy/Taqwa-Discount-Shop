import { Request, Response } from 'express';
import { RequestWithUser } from '../../types';
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

    return res.status(201).json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create purchase order' });
  }
};

export const putPurchaseOrderStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await updatePurchaseOrderStatus(Number(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};
