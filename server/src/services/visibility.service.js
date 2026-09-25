import { Follow } from '../models/index.js';

// "Friend" means a mutual follow — both users follow each other. This is the
// one relationship primitive the app has (no separate request/accept graph),
// and it backs post/story "friends" visibility as well as the profile check.
export async function isFriend(userIdA, userIdB) {
  if (userIdA === userIdB) return true;
  const [a, b] = await Promise.all([
    Follow.findOne({ where: { followerId: userIdA, followingId: userIdB } }),
    Follow.findOne({ where: { followerId: userIdB, followingId: userIdA } }),
  ]);
  return Boolean(a && b);
}

export async function canView(visibility, viewerId, ownerId) {
  if (viewerId === ownerId) return true;
  if (visibility === 'public') return true;
  if (visibility === 'only_me') return false;
  return isFriend(viewerId, ownerId);
}

export async function getFriendIds(userId) {
  const [following, followers] = await Promise.all([
    Follow.findAll({ where: { followerId: userId } }),
    Follow.findAll({ where: { followingId: userId } }),
  ]);
  const followerIds = new Set(followers.map((f) => f.followerId));
  return following.map((f) => f.followingId).filter((id) => followerIds.has(id));
}
