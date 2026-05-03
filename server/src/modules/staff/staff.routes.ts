import { Router } from 'express';
import { authenticate, authorize } from '../../middleware';
import { getStaff, postStaff, postStaffVerification, putStaff, removeStaff } from './staff.controller';

const router = Router();

router.use(authenticate, authorize('OWNER', 'MANAGER'));
router.get('/', getStaff);
router.post('/', postStaff);
router.post('/verification/confirm', postStaffVerification);
router.put('/:id', putStaff);
router.delete('/:id', removeStaff);

export default router;
