import { verifyAccessToken } from '../services/token.service.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing access token' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
}
