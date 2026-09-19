import { Op } from 'sequelize';
import { FriendRequest } from '../models/index.js';

export async function isFriend(userIdA, userIdB) {
  if (userIdA === userIdB) return true;
  const row = await FriendRequest.findOne({
    where: {
      status: 'accepted',
      [Op.or]: [
        { requesterId: userIdA, addresseeId: userIdB },
        { requesterId: userIdB, addresseeId: userIdA },
      ],
    },
  });
  return Boolean(row);
}

export async function canView(visibility, viewerId, ownerId) {
  if (viewerId === ownerId) return true;
  if (visibility === 'public') return true;
  if (visibility === 'only_me') return false;
  return isFriend(viewerId, ownerId);
}

export async function getFriendIds(userId) {
  const rows = await FriendRequest.findAll({
    where: {
      status: 'accepted',
      [Op.or]: [{ requesterId: userId }, { addresseeId: userId }],
    },
  });
  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}
