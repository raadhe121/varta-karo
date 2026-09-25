import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as communityController from '../controllers/community.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', communityController.listCommunities);
router.post('/', communityController.createCommunity);
router.get('/:id', communityController.getCommunity);
router.delete('/:id', communityController.deleteCommunity);
router.post('/:id/join', communityController.joinCommunity);
router.post('/:id/leave', communityController.leaveCommunity);
router.get('/:id/members', communityController.listMembers);
router.get('/:id/posts', communityController.listPosts);
router.post('/:id/posts', communityController.createPost);
router.delete('/:id/posts/:postId', communityController.deletePost);

export default router;
