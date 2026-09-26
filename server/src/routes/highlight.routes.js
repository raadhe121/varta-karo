import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as highlightController from '../controllers/highlight.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/user/:userId', highlightController.listHighlights);
router.post('/', highlightController.createHighlight);
router.post('/:id/stories', highlightController.addStoriesToHighlight);
router.delete('/:id', highlightController.deleteHighlight);

export default router;
