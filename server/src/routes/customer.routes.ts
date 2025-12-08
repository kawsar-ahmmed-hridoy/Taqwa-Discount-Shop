import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getCustomers, createCustomer, updateCustomer, getCustomerHistory } from '../controllers/customer.controller';

const router = Router();
router.use(authenticate);
router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.get('/:id/history', getCustomerHistory);
export default router;