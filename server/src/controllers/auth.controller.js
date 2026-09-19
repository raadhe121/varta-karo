import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, OtpCode } from '../models/index.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/token.service.js';
import { sendOtpCode } from '../services/otp.service.js';
import { env } from '../config/env.js';

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

  if (!name || !username || !password) {
    return res.status(400).json({ message: 'name, username and password are required' });
  }

  const existing = await User.findOne({
    where: {
      [Op.or]: [{ username }, ...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    },
  });
  if (existing) {
    return res.status(409).json({ message: 'Username, email or phone already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, username, email, phone, passwordHash });

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
