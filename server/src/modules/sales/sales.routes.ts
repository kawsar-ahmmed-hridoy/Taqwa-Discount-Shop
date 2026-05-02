import { Router } from 'express';
import { authenticate } from '../../middleware';
import {
  postSale,
  getSales,
  getSaleById,
  getInvoice,
  requestRefund,
  approveRefundRequest,
  rejectRefundRequest,
  processRefundRequest,
  getRefundDetails,
  listSaleRefunds,
} from './sales.controller';

const router = Router();

router.use(authenticate);

// Specific routes first (must come before generic :id routes)
router.get('/invoice/:id', getInvoice);
router.post('/refund/request', requestRefund);
router.get('/refund/:id', getRefundDetails);
router.put('/refund/:id/approve', approveRefundRequest);
router.put('/refund/:id/reject', rejectRefundRequest);
router.put('/refund/:id/process', processRefundRequest);
router.get('/:saleId/refunds', listSaleRefunds);

// Generic routes (must come last)
router.post('/', postSale);
router.get('/', getSales);
router.get('/:id', getSaleById);

export default router;
