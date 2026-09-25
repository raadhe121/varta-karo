import { Op } from 'sequelize';
import { User, Follow, Block, Post, Like, Comment } from '../models/index.js';
import { canView } from '../services/visibility.service.js';

function publicUser(user) {
  const { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt } = user;
  return { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt };
}

function fullUser(user) {
  const {
    id, name, username, email, phone, avatarUrl, avatarColor, bio,
    coverPhotoUrl, work, education, location, links, profileVisibility,
    status, lastSeenAt,
  } = user;
  return {
    id, name, username, email, phone, avatarUrl, avatarColor, bio,
    coverPhotoUrl, work, education, location, links, profileVisibility,
    status, lastSeenAt,
  };
}

export async function getMe(req, res) {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(fullUser(user));
}

export async function updateMe(req, res) {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const {
    name, bio, avatarUrl, avatarColor,
    coverPhotoUrl, work, education, location, links, profileVisibility,
  } = req.body;

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (avatarColor !== undefined) user.avatarColor = avatarColor;
  if (coverPhotoUrl !== undefined) user.coverPhotoUrl = coverPhotoUrl;
  if (work !== undefined) user.work = work;
  if (education !== undefined) user.education = education;
  if (location !== undefined) user.location = location;
  if (links !== undefined) user.links = links;
  if (profileVisibility !== undefined) {
    if (!['public', 'friends', 'only_me'].includes(profileVisibility)) {
      return res.status(400).json({ message: 'Invalid profileVisibility' });
    }
    user.profileVisibility = profileVisibility;
  }
  await user.save();

  return res.json(fullUser(user));
}

export async function searchUsers(req, res) {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);

  const users = await User.findAll({
    where: {
      id: { [Op.ne]: req.userId },
      [Op.or]: [
        { username: { [Op.like]: `%${q}%` } },
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
      ],
    },
    limit: 20,
  });

  return res.json(users.map(publicUser));
}

export async function getSuggestions(req, res) {
  const limit = Math.min(Number(req.query.limit) || 8, 20);

  const followingRows = await Follow.findAll({ where: { followerId: req.userId } });
  const myFollowingIds = followingRows.map((f) => f.followingId);
  const excludeIds = [req.userId, ...myFollowingIds];

  const candidates = await User.findAll({
    where: { id: { [Op.notIn]: excludeIds } },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  if (candidates.length === 0) return res.json([]);

  const candidateIdSet = new Set(candidates.map((c) => c.id));

  // Rank by how many people the viewer already follows also follow this
  // candidate — a "followed by people you follow" signal, now that Follow is
  // the only relationship graph (no separate accepted-friends graph).
  const overlapRows =
    myFollowingIds.length > 0
      ? await Follow.findAll({
          where: { followerId: { [Op.in]: myFollowingIds }, followingId: { [Op.in]: [...candidateIdSet] } },
        })
      : [];

  const mutualCounts = new Map();
  for (const row of overlapRows) {
    mutualCounts.set(row.followingId, (mutualCounts.get(row.followingId) || 0) + 1);
  }

  const ranked = candidates
    .map((user) => ({ user, mutualCount: mutualCounts.get(user.id) || 0 }))
    .sort((a, b) => b.mutualCount - a.mutualCount)
    .slice(0, limit);

  return res.json(
    ranked.map(({ user, mutualCount }) => ({
      ...publicUser(user),
      mutualCount,
      note:
        mutualCount > 0
          ? `Followed by ${mutualCount} ${mutualCount === 1 ? 'person' : 'people'} you follow`
          : 'New to VartaKaro',
    }))
  );
}

export async function getProfile(req, res) {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const [followerCount, followingCount, following, followedBy, blocked, blockedByOwner] = await Promise.all([
    Follow.count({ where: { followingId: id } }),
    Follow.count({ where: { followerId: id } }),
    Follow.findOne({ where: { followerId: req.userId, followingId: id } }),
    Follow.findOne({ where: { followerId: id, followingId: req.userId } }),
    req.userId === id ? null : Block.findOne({ where: { blockerId: req.userId, blockedId: id } }),
    req.userId === id ? null : Block.findOne({ where: { blockerId: id, blockedId: req.userId } }),
  ]);

  // The owner blocked the viewer — hide everything real about them, same
  // treatment as their anonymized entry in a shared conversation.
  if (blockedByOwner) {
    return res.json({
      id: user.id,
      name: 'Unknown User',
      username: null,
      avatarUrl: null,
      avatarColor: '#9CA3AF',
      coverPhotoUrl: null,
      bio: null,
      status: 'offline',
      lastSeenAt: null,
      isSelf: false,
      isFollowing: false,
      isFollowedBy: false,
      isBlocked: Boolean(blocked),
      blockedByOther: true,
      followerCount: 0,
      followingCount: 0,
      about: null,
    });
  }

  const showAbout = await canView(user.profileVisibility, req.userId, id);

  return res.json({
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    avatarColor: user.avatarColor,
    coverPhotoUrl: user.coverPhotoUrl,
    bio: user.bio,
    status: user.status,
    lastSeenAt: user.lastSeenAt,
    isSelf: req.userId === id,
    isFollowing: Boolean(following),
    isFollowedBy: Boolean(followedBy),
    isBlocked: Boolean(blocked),
    blockedByOther: false,
    followerCount,
    followingCount,
    profileVisibility: req.userId === id ? user.profileVisibility : undefined,
    about: showAbout
      ? { work: user.work, education: user.education, location: user.location, links: user.links || [] }
      : null,
  });
}

export async function getMyActivity(req, res) {
  const [posts, likes, comments] = await Promise.all([
    Post.findAll({ where: { authorId: req.userId }, order: [['createdAt', 'DESC']], limit: 50 }),
    Like.findAll({
      where: { userId: req.userId },
      include: [{ model: Post, as: 'post' }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    }),
    Comment.findAll({
      where: { authorId: req.userId },
      include: [{ model: Post, as: 'post' }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    }),
  ]);

  const entries = [
    ...posts.map((p) => ({
      type: 'post',
      createdAt: p.createdAt,
      summary: p.content ? p.content.slice(0, 140) : '(photo)',
      postId: p.id,
    })),
    ...likes.map((l) => ({
      type: 'like',
      createdAt: l.createdAt,
      summary: l.post ? (l.post.content ? l.post.content.slice(0, 140) : '(photo)') : 'a post',
      postId: l.postId,
    })),
    ...comments.map((c) => ({
      type: 'comment',
      createdAt: c.createdAt,
      summary: c.content.slice(0, 140),
      postId: c.postId,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.json(entries.slice(0, 50));
}
