import { Router } from 'express';
import { authenticate } from '../../middleware';
import { getCustomers, postCustomer, putCustomer, getCustomerSalesHistory } from './customers.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.post('/', postCustomer);
router.put('/:id', putCustomer);
router.get('/:id/history', getCustomerSalesHistory);

export default router;
