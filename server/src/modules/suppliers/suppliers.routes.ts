import { Router } from 'express';
import { authenticate, authorize } from '../../middleware';
import { getSuppliers, postSupplier, putSupplier, removeSupplier } from './suppliers.controller';

const router = Router();

router.use(authenticate);

router.get('/', getSuppliers);
router.post('/', authorize('OWNER', 'MANAGER'), postSupplier);
router.put('/:id', authorize('OWNER', 'MANAGER'), putSupplier);
router.delete('/:id', authorize('OWNER'), removeSupplier);

export default router;
