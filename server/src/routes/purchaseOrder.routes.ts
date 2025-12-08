import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { getPurchaseOrders, createPurchaseOrder, updateOrderStatus } from '../controllers/purchaseOrder.controller';

const router = Router();
router.use(authenticate);
router.get('/', getPurchaseOrders);
router.post('/', authorize(UserRole.OWNER, UserRole.MANAGER), createPurchaseOrder);
router.put('/:id/status', authorize(UserRole.OWNER, UserRole.MANAGER), updateOrderStatus);
export default router;