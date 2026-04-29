import { Router } from 'express';
import { authenticate } from '../../middleware';
import {
	getNotifications,
	putNotificationRead,
	putAllNotificationsRead,
	postNotification,
} from './notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/', postNotification);
router.put('/read-all', putAllNotificationsRead);
router.put('/:id/read', putNotificationRead);

export default router;
