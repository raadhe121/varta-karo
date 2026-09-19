import { Notification, User } from '../models/index.js';

function publicActor(user) {
  const { id, name, username, avatarUrl, avatarColor } = user;
  return { id, name, username, avatarUrl, avatarColor };
}

export async function createNotification({ recipientId, actorId, type, postId = null }, io) {
  if (recipientId === actorId) return null; // never notify yourself about your own action

  const notification = await Notification.create({ recipientId, actorId, type, postId });
  const actor = await User.findByPk(actorId);

  const payload = {
    id: notification.id,
    type: notification.type,
    postId: notification.postId,
    read: false,
    createdAt: notification.createdAt,
    actor: publicActor(actor),
  };

  io?.to(`user:${recipientId}`).emit('notification:new', payload);
  return payload;
}
