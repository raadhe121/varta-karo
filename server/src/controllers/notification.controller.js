import { Notification, User, Post, Follow } from '../models/index.js';

function publicActor(user) {
  const { id, name, username, avatarUrl, avatarColor } = user;
  return { id, name, username, avatarUrl, avatarColor };
}

export async function listNotifications(req, res) {
  const notifications = await Notification.findAll({
    where: { recipientId: req.userId },
    include: [
      { model: User, as: 'actor' },
      { model: Post, as: 'post' },
    ],
    order: [['createdAt', 'DESC']],
    limit: 50,
  });

  // Lets a 'follow'/'follow_accept' notification show whether the recipient
  // already follows that actor back, so the UI can render a Follow/Following
  // button inline instead of just a link to their profile.
  const actorIds = [...new Set(notifications.filter((n) => n.type === 'follow' || n.type === 'follow_accept').map((n) => n.actorId))];
  const followingBackRows =
    actorIds.length > 0 ? await Follow.findAll({ where: { followerId: req.userId, followingId: actorIds } }) : [];
  const followingBackSet = new Set(followingBackRows.map((f) => f.followingId));

  return res.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      postId: n.postId,
      postSummary: n.post ? (n.post.content ? n.post.content.slice(0, 80) : '(photo)') : null,
      read: n.read,
      createdAt: n.createdAt,
      actor: publicActor(n.actor),
      isFollowingBack: n.type === 'follow' || n.type === 'follow_accept' ? followingBackSet.has(n.actorId) : undefined,
    }))
  );
}

export async function getUnreadCount(req, res) {
  const count = await Notification.count({ where: { recipientId: req.userId, read: false } });
  return res.json({ count });
}

export async function markRead(req, res) {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification || notification.recipientId !== req.userId) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  notification.read = true;
  await notification.save();
  return res.json({ id: notification.id, read: true });
}

export async function markAllRead(req, res) {
  await Notification.update({ read: true }, { where: { recipientId: req.userId, read: false } });
  return res.status(204).send();
}
