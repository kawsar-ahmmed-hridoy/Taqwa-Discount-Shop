import { Router } from 'express';
import { authenticate } from '../../middleware';
import { getDashboard } from './dashboard.controller';

const router = Router();

router.use(authenticate);

router.get('/', getDashboard);

export default router;
