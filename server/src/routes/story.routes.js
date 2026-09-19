import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as storyController from '../controllers/story.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/feed', storyController.getFeedStories);
router.get('/user/:id', storyController.getUserStories);
router.post('/', storyController.createStory);
router.post('/:id/view', storyController.viewStory);
router.get('/:id/viewers', storyController.getStoryViewers);
router.delete('/:id', storyController.deleteStory);

export default router;
