import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as contactController from '../controllers/contact.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', contactController.listContacts);
router.get('/requests/incoming', contactController.listIncomingRequests);
router.post('/request/:userId', contactController.sendRequest);
router.post('/:requestId/accept', contactController.acceptRequest);

export default router;
