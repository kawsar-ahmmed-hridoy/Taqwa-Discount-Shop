import { Router } from 'express';
import { login, signup, getCurrentUser, logout, resetPassword, forgotPassword, confirmForgotPassword } from './auth.controller';
import { authenticate } from '../../middleware';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/confirm', confirmForgotPassword);
//egulo protected route, tai authenticate middleware use kora hoyeche
router.post('/logout', authenticate, logout);
router.post('/reset-password', authenticate, resetPassword);
router.get('/me', authenticate, getCurrentUser);
router.get('/profile', authenticate, getCurrentUser);

export default router;
