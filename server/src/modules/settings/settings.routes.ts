import { Router } from 'express';
import { authenticate, authorize } from '../../middleware';
import { fetchSettings, putSettings } from './settings.controller';

const router = Router();

router.use(authenticate);
router.get('/', fetchSettings);
router.put('/', authorize('OWNER'), putSettings);

export default router;
