import { Follow, User } from '../models/index.js';
import { createNotification } from '../services/notification.service.js';

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
