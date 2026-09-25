import { Op } from 'sequelize';
import { Follow, User } from '../models/index.js';
import { createNotification } from '../services/notification.service.js';

function publicUser(user) {
  const { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt } = user;
  return { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt };
}

export async function follow(req, res) {
  const followingId = req.params.userId;
  if (followingId === req.userId) {
    return res.status(400).json({ message: 'Cannot follow yourself' });
  }

  const target = await User.findByPk(followingId);
  if (!target) return res.status(404).json({ message: 'User not found' });

  const [row, created] = await Follow.findOrCreate({
    where: { followerId: req.userId, followingId },
  });
  if (created) {
    await createNotification({ recipientId: followingId, actorId: req.userId, type: 'follow' }, req.app.get('io'));
  }
  return res.status(201).json(row);
}

export async function unfollow(req, res) {
  await Follow.destroy({ where: { followerId: req.userId, followingId: req.params.userId } });
  return res.status(204).send();
}

export async function listFollowers(req, res) {
  const rows = await Follow.findAll({
    where: { followingId: req.params.userId },
    include: [{ model: User, as: 'follower' }],
  });
  return res.json(rows.map((r) => publicUser(r.follower)));
}

export async function listFollowing(req, res) {
  const rows = await Follow.findAll({
    where: { followerId: req.params.userId },
    include: [{ model: User, as: 'following' }],
  });
  return res.json(rows.map((r) => publicUser(r.following)));
}

// Users who follow the caller back and are followed by the caller — the only
// people the caller can start a direct chat with (see conversation.controller
// .createConversation, which enforces this same mutual-follow rule).
export async function listMutualFollows(req, res) {
  const [following, followers] = await Promise.all([
    Follow.findAll({ where: { followerId: req.userId } }),
    Follow.findAll({ where: { followingId: req.userId } }),
  ]);
  const followerIds = new Set(followers.map((f) => f.followerId));
  const mutualIds = following.map((f) => f.followingId).filter((id) => followerIds.has(id));
  if (mutualIds.length === 0) return res.json([]);

  const users = await User.findAll({ where: { id: { [Op.in]: mutualIds } } });
  return res.json(users.map(publicUser));
}
