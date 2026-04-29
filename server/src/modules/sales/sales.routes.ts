import { Router } from 'express';
import { authenticate } from '../../middleware';
import { postSale, getSales, getSaleById, getInvoice } from './sales.controller';

const router = Router();

router.use(authenticate);

router.post('/', postSale);
router.get('/', getSales);
router.get('/invoice/:id', getInvoice);
router.get('/:id', getSaleById);

export default router;
