import { Router } from 'express';
import { authenticate, authorize } from '../../middleware';
import { getAuditLogs } from './audit-logs.controller';

const router = Router();

router.use(authenticate, authorize('OWNER', 'MANAGER'));
router.get('/', getAuditLogs);

export default router;