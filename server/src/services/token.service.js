import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}
