import { Op } from 'sequelize';
import { Block } from '../models/index.js';

export async function isBlockedEitherWay(userIdA, userIdB) {
  const row = await Block.findOne({
    where: {
      [Op.or]: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
  return Boolean(row);
}

const ANONYMOUS_USER = {
  name: 'Unknown User',
  username: null,
  email: null,
  phone: null,
  avatarUrl: null,
  avatarColor: '#9CA3AF',
  bio: null,
  status: 'offline',
  lastSeenAt: null,
};

// Hides a blocker's identity from the person they blocked: the blocked side
// sees "Unknown User" with no avatar, same as if the account had vanished,
// so the block can't be reasoned about from the outside.
export function anonymizeIfBlockedMe(publicUserObj, blockedMe) {
  return blockedMe ? { id: publicUserObj.id, ...ANONYMOUS_USER } : publicUserObj;
}
