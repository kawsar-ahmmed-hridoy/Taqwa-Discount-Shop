import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getNotifications, markAsRead } from '../controllers/notification.controller';

const router = Router();
router.use(authenticate);
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
export default router;