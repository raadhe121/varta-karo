import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as collectionController from '../controllers/collection.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', collectionController.listCollections);
router.post('/', collectionController.createCollection);
router.delete('/:id', collectionController.deleteCollection);

export default router;
