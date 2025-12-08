import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../controllers/staff.controller';

const router = Router();
router.use(authenticate, authorize(UserRole.OWNER, UserRole.MANAGER));
router.get('/', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);
export default router;