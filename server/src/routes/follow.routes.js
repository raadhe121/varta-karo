import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as followController from '../controllers/follow.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/mutual', followController.listMutualFollows);
router.get('/:userId/followers', followController.listFollowers);
router.get('/:userId/following', followController.listFollowing);
router.post('/:userId', followController.follow);
router.delete('/:userId', followController.unfollow);

export default router;
