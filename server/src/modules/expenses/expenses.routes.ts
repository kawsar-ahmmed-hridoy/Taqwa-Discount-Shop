import { Router } from 'express';
import { authenticate, authorize } from '../../middleware';
import { getExpenses, postExpense, putExpenseApproval } from './expenses.controller';

const router = Router();

router.use(authenticate);

router.get('/', getExpenses);
router.post('/', postExpense);
router.put('/:id/approve', authorize('OWNER'), putExpenseApproval);

export default router;
