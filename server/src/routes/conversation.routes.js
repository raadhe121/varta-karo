import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as conversationController from '../controllers/conversation.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', conversationController.listConversations);
router.post('/', conversationController.createConversation);
router.patch('/:id', conversationController.updateConversation);
router.post('/:id/participants', conversationController.addParticipants);
router.get('/:id/messages', conversationController.getMessages);

export default router;
