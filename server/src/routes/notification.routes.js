import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', notificationController.listNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/:id/read', notificationController.markRead);
router.post('/read-all', notificationController.markAllRead);

export default router;
