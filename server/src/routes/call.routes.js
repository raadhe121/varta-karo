import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as callController from '../controllers/call.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', callController.listCalls);
router.post('/', callController.logCall);

export default router;
