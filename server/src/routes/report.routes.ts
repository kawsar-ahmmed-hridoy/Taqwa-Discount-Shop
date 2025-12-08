import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getSalesReport, getInventoryReport, getExpenseReport } from '../controllers/report.controller';

const router = Router();
router.use(authenticate);
router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.get('/expenses', getExpenseReport);
export default router;