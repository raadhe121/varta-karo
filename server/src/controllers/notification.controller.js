import { Notification, User, Post } from '../models/index.js';

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

  return res.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      postId: n.postId,
      postSummary: n.post ? (n.post.content ? n.post.content.slice(0, 80) : '(photo)') : null,
      read: n.read,
      createdAt: n.createdAt,
      actor: publicActor(n.actor),
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
