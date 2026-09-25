import { Op } from 'sequelize';
import { Block, Follow, User } from '../models/index.js';

function publicUser(user) {
  const { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt } = user;
  return { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt };
}

export async function blockUser(req, res) {
  const blockedId = req.params.userId;
  if (blockedId === req.userId) {
    return res.status(400).json({ message: 'Cannot block yourself' });
  }

  const target = await User.findByPk(blockedId);
  if (!target) return res.status(404).json({ message: 'User not found' });

  await Block.findOrCreate({ where: { blockerId: req.userId, blockedId } });

  // Blocking severs the relationship both ways so chat eligibility and feed
  // visibility (both gated on mutual follow) immediately reflect it.
  await Follow.destroy({
    where: {
      [Op.or]: [
        { followerId: req.userId, followingId: blockedId },
        { followerId: blockedId, followingId: req.userId },
      ],
    },
  });

  return res.status(204).send();
}

export async function unblockUser(req, res) {
  await Block.destroy({ where: { blockerId: req.userId, blockedId: req.params.userId } });
  return res.status(204).send();
}

export async function listBlocked(req, res) {
  const rows = await Block.findAll({
    where: { blockerId: req.userId },
    include: [{ model: User, as: 'blocked' }],
  });
  return res.json(rows.map((r) => publicUser(r.blocked)));
}
