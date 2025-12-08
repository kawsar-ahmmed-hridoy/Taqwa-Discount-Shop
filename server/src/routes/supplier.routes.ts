import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller';

const router = Router();
router.use(authenticate);
router.get('/', getSuppliers);
router.post('/', authorize(UserRole.OWNER, UserRole.MANAGER), createSupplier);
router.put('/:id', authorize(UserRole.OWNER, UserRole.MANAGER), updateSupplier);
router.delete('/:id', authorize(UserRole.OWNER), deleteSupplier);
export default router;