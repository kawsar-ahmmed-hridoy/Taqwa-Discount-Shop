import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { getExpenses, createExpense, approveExpense } from '../controllers/expense.controller';

const router = Router();
router.use(authenticate);
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id/approve', authorize(UserRole.OWNER), approveExpense);
export default router;