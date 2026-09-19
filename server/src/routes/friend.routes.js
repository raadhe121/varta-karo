import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as friendController from '../controllers/friend.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', friendController.listFriends);
router.get('/requests/incoming', friendController.listIncomingFriendRequests);
router.post('/request/:userId', friendController.sendFriendRequest);
router.post('/:requestId/accept', friendController.acceptFriendRequest);
router.post('/:requestId/decline', friendController.declineFriendRequest);

export default router;
