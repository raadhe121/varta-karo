import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as followController from '../controllers/follow.controller.js';

const router = Router();

router.use(requireAuth);
router.post('/:userId', followController.follow);
router.delete('/:userId', followController.unfollow);

export default router;
