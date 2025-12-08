import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { getSettings, updateSettings } from '../controllers/settings.controller';

const router = Router();
router.use(authenticate);
router.get('/', getSettings);
router.put('/', authorize(UserRole.OWNER), updateSettings);
export default router;