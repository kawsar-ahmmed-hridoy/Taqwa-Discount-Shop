import { Router } from 'express';
import { authenticate } from '../../middleware';
import { salesReport, inventoryReport, expenseReport } from './reports.controller';

const router = Router();

router.use(authenticate);

router.get('/sales', salesReport);
router.get('/inventory', inventoryReport);
router.get('/expenses', expenseReport);

export default router;
