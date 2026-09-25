import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.get('/check-username', authController.checkUsername);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/otp/request', authController.requestOtp);
router.post('/otp/verify', authController.verifyOtp);

export default router;
