import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth);
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  return res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
});

export default router;
