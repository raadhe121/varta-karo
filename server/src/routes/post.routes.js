import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as postController from '../controllers/post.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/feed', postController.getFeed);
router.post('/', postController.createPost);
router.delete('/:id', postController.deletePost);
router.post('/:id/like', postController.toggleLike);
router.get('/:id/comments', postController.listComments);
router.post('/:id/comments', postController.addComment);

export default router;
