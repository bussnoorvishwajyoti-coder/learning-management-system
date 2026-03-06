import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public routes
router.post('/register', ...authController.register);
router.post('/login', ...authController.login);
router.post('/refresh', authController.refresh);

// Protected routes
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.me);

export default router;
