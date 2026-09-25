import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { OAuth2Client } from 'google-auth-library';
import { User, OtpCode } from '../models/index.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/token.service.js';
import { sendOtpCode } from '../services/otp.service.js';
import { env } from '../config/env.js';

const googleClient = new OAuth2Client(env.google.clientId);

function publicUser(user) {
  const { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt } = user;
  return { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt };
}

function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    user: publicUser(user),
  };
}

export async function register(req, res) {
  const { name, username, email, password, phone } = req.body;

  // Username is the only hard requirement — a quick "just pick a handle"
  // signup (no password) is supported alongside the full form. An account
  // created this way has no passwordHash, so it can't use /auth/login later;
  // it stays signed in via the refresh token issued here, same as the
  // anonymous random-chat flow this mirrors.
  if (!username) {
    return res.status(400).json({ message: 'username is required' });
  }

  const existing = await User.findOne({
    where: {
      [Op.or]: [{ username }, ...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    },
  });
  if (existing) {
    return res.status(409).json({ message: 'Username, email or phone already in use' });
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const user = await User.create({ name: name || username, username, email, phone, passwordHash });

  return res.status(201).json(issueTokens(user));
}

export async function checkUsername(req, res) {
  const username = String(req.query.username || '').trim();
  if (!username) {
    return res.status(400).json({ message: 'username is required' });
  }

  const existing = await User.findOne({ where: { username } });
  return res.json({ available: !existing });
}

export async function login(req, res) {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'identifier and password are required' });
  }

  const user = await User.findOne({
    where: { [Op.or]: [{ username: identifier }, { email: identifier }] },
  });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json(issueTokens(user));
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'refreshToken is required' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    return res.json(issueTokens(user));
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}

export async function logout(_req, res) {
  // Stateless JWTs: nothing to invalidate server-side for this MVP.
  return res.status(204).send();
}

async function uniqueUsernameFrom(seed) {
  const base = seed.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  let candidate = base;
  let n = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await User.findOne({ where: { username: candidate } })) {
    n += 1;
    candidate = `${base}${n}`;
  }
  return candidate;
}

export async function googleLogin(req, res) {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: 'idToken is required' });
  }
  if (!env.google.clientId) {
    return res.status(500).json({ message: 'Google sign-in is not configured on the server' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.google.clientId });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ message: 'Invalid Google token' });
  }

  const { sub: googleId, email, name, picture, email_verified: emailVerified } = payload;

  let user = await User.findOne({ where: { googleId } });

  if (!user && email && emailVerified) {
    user = await User.findOne({ where: { email } });
    if (user && !user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  }

  if (!user) {
    const username = await uniqueUsernameFrom(email ? email.split('@')[0] : name || 'user');
    user = await User.create({
      name: name || username,
      username,
      email: emailVerified ? email : undefined,
      googleId,
      avatarUrl: picture || undefined,
    });
  }

  return res.json(issueTokens(user));
}

export async function requestOtp(req, res) {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: 'phone is required' });
  }

  const code = await sendOtpCode(phone);
  const expiresAt = new Date(Date.now() + env.otp.expiresInMinutes * 60 * 1000);
  await OtpCode.create({ phone, code, expiresAt });

  return res.status(200).json({ message: 'OTP sent' });
}

export async function verifyOtp(req, res) {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ message: 'phone and code are required' });
  }

  const otp = await OtpCode.findOne({
    where: { phone, code, consumed: false },
    order: [['createdAt', 'DESC']],
  });

  if (!otp || otp.expiresAt < new Date()) {
    return res.status(401).json({ message: 'Invalid or expired code' });
  }

  otp.consumed = true;
  await otp.save();

  let user = await User.findOne({ where: { phone } });
  if (!user) {
    const suffix = phone.replace(/[^0-9]/g, '').slice(-6) || String(Date.now()).slice(-6);
    user = await User.create({
      name: 'New User',
      username: `user_${suffix}_${Math.floor(Math.random() * 1000)}`,
      phone,
    });
  }

  return res.json(issueTokens(user));
}
