import { Router } from 'express';
import { body } from 'express-validator';
import {
  createSale,
  getSales,
  getSaleById,
  getInvoice,
} from '../controllers/sale.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isInt().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
    body('paymentMode').isIn(['CASH', 'CARD', 'UPI']).withMessage('Valid payment mode is required'),
  ],
  createSale
);

router.get('/', getSales);
router.get('/:id', getSaleById);
router.get('/invoice/:id', getInvoice);

export default router;