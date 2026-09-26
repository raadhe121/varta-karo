import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as userController from '../controllers/user.controller.js';
import { getUserPosts } from '../controllers/post.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.patch('/me/username', userController.updateUsername);
router.patch('/me/email', userController.updateEmail);
router.patch('/me/password', userController.updatePassword);
router.get('/me/activity', userController.getMyActivity);
router.get('/search', userController.searchUsers);
router.get('/suggestions', userController.getSuggestions);
router.get('/:id/profile', userController.getProfile);
router.get('/:id/posts', getUserPosts);

export default router;
