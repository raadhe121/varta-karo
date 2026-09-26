import { Op } from 'sequelize';
import { Follow, FollowRequest, User } from '../models/index.js';
import { createNotification } from '../services/notification.service.js';

function publicUser(user) {
  const { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt } = user;
  return { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt };
}

// Public accounts: follow immediately, as before. Private accounts: park a
// FollowRequest instead -- no Follow row exists until the target accepts it.
export async function follow(req, res) {
  const followingId = req.params.userId;
  if (followingId === req.userId) {
    return res.status(400).json({ message: 'Cannot follow yourself' });
  }

  const target = await User.findByPk(followingId);
  if (!target) return res.status(404).json({ message: 'User not found' });

  const alreadyFollowing = await Follow.findOne({ where: { followerId: req.userId, followingId } });
  if (alreadyFollowing) {
    return res.status(200).json({ status: 'following', follow: alreadyFollowing });
  }

  if (target.isPrivate) {
    const [request, created] = await FollowRequest.findOrCreate({
      where: { requesterId: req.userId, targetId: followingId },
    });
    if (created) {
      await createNotification({ recipientId: followingId, actorId: req.userId, type: 'follow_request' }, req.app.get('io'));
    }
    return res.status(202).json({ status: 'requested', request });
  }

  const [row] = await Follow.findOrCreate({ where: { followerId: req.userId, followingId } });
  await createNotification({ recipientId: followingId, actorId: req.userId, type: 'follow' }, req.app.get('io'));
  return res.status(201).json({ status: 'following', follow: row });
}

export async function unfollow(req, res) {
  // Also cancels a pending request -- unfollow doubles as "cancel my ask" on
  // a private account the caller hasn't been accepted by yet.
  await Promise.all([
    Follow.destroy({ where: { followerId: req.userId, followingId: req.params.userId } }),
    FollowRequest.destroy({ where: { requesterId: req.userId, targetId: req.params.userId } }),
  ]);
  return res.status(204).send();
}

export async function listFollowRequests(req, res) {
  const rows = await FollowRequest.findAll({
    where: { targetId: req.userId },
    include: [{ model: User, as: 'requester' }],
    order: [['createdAt', 'DESC']],
  });
  return res.json(rows.map((r) => ({ id: r.id, requester: publicUser(r.requester), createdAt: r.createdAt })));
}

export async function acceptFollowRequest(req, res) {
  const request = await FollowRequest.findOne({ where: { id: req.params.requestId, targetId: req.userId } });
  if (!request) return res.status(404).json({ message: 'Follow request not found' });

  const [row] = await Follow.findOrCreate({
    where: { followerId: request.requesterId, followingId: req.userId },
  });
  await request.destroy();
  await createNotification(
    { recipientId: request.requesterId, actorId: req.userId, type: 'follow_accept' },
    req.app.get('io')
  );
  return res.json({ status: 'following', follow: row });
}

export async function rejectFollowRequest(req, res) {
  await FollowRequest.destroy({ where: { id: req.params.requestId, targetId: req.userId } });
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
