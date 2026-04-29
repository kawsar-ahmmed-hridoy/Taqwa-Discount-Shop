import { Router } from 'express';
import { authenticate, authorize } from '../../middleware';
import { getPurchaseOrders, postPurchaseOrder, putPurchaseOrderStatus } from './purchase-orders.controller';

const router = Router();

router.use(authenticate);
router.get('/', getPurchaseOrders);
router.post('/', authorize('OWNER', 'MANAGER'), postPurchaseOrder);
router.put('/:id/status', authorize('OWNER', 'MANAGER'), putPurchaseOrderStatus);

export default router;
