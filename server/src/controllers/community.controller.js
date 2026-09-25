import { Op } from 'sequelize';
import { Community, CommunityMember, CommunityPost, User } from '../models/index.js';

function publicUser(user) {
  const { id, name, username, avatarUrl, avatarColor } = user;
  return { id, name, username, avatarUrl, avatarColor };
}

async function serializeCommunity(community, viewerId) {
  const [memberCount, membership] = await Promise.all([
    CommunityMember.count({ where: { communityId: community.id } }),
    CommunityMember.findOne({ where: { communityId: community.id, userId: viewerId } }),
  ]);

  return {
    id: community.id,
    name: community.name,
    description: community.description,
    coverImageUrl: community.coverImageUrl,
    creator: community.creator ? publicUser(community.creator) : undefined,
    memberCount,
    isMember: Boolean(membership),
    myRole: membership?.role || null,
    createdAt: community.createdAt,
  };
}

export async function listCommunities(req, res) {
  const { search, mine } = req.query;

  const where = {};
  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }

  if (mine === 'true') {
    const rows = await CommunityMember.findAll({ where: { userId: req.userId } });
    const ids = rows.map((r) => r.communityId);
    if (ids.length === 0) return res.json([]);
    where.id = { [Op.in]: ids };
  }

  const communities = await Community.findAll({
    where,
    include: [{ model: User, as: 'creator' }],
    order: [['createdAt', 'DESC']],
    limit: 100,
  });

  return res.json(await Promise.all(communities.map((c) => serializeCommunity(c, req.userId))));
}

export async function createCommunity(req, res) {
  const { name, description, coverImageUrl } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }

  const community = await Community.create({
    name: name.trim(),
    description: description || null,
    coverImageUrl: coverImageUrl || null,
    creatorId: req.userId,
  });
  await CommunityMember.create({ communityId: community.id, userId: req.userId, role: 'admin' });

  const full = await Community.findByPk(community.id, { include: [{ model: User, as: 'creator' }] });
  return res.status(201).json(await serializeCommunity(full, req.userId));
}

export async function getCommunity(req, res) {
  const community = await Community.findByPk(req.params.id, { include: [{ model: User, as: 'creator' }] });
  if (!community) return res.status(404).json({ message: 'Community not found' });

  return res.json(await serializeCommunity(community, req.userId));
}

export async function deleteCommunity(req, res) {
  const community = await Community.findByPk(req.params.id);
  if (!community) return res.status(404).json({ message: 'Community not found' });
  if (community.creatorId !== req.userId) {
    return res.status(403).json({ message: 'Only the creator can delete this community' });
  }

  await CommunityPost.destroy({ where: { communityId: community.id } });
  await CommunityMember.destroy({ where: { communityId: community.id } });
  await community.destroy();
  return res.status(204).send();
}

export async function joinCommunity(req, res) {
  const community = await Community.findByPk(req.params.id);
  if (!community) return res.status(404).json({ message: 'Community not found' });

  const existing = await CommunityMember.findOne({ where: { communityId: community.id, userId: req.userId } });
  if (!existing) {
    await CommunityMember.create({ communityId: community.id, userId: req.userId, role: 'member' });
  }

  return res.json(await serializeCommunity(await Community.findByPk(community.id, { include: [{ model: User, as: 'creator' }] }), req.userId));
}

export async function leaveCommunity(req, res) {
  const community = await Community.findByPk(req.params.id);
  if (!community) return res.status(404).json({ message: 'Community not found' });
  if (community.creatorId === req.userId) {
    return res.status(400).json({ message: 'The creator can\'t leave — delete the community instead' });
  }

  await CommunityMember.destroy({ where: { communityId: community.id, userId: req.userId } });
  return res.status(204).send();
}

export async function listMembers(req, res) {
  const community = await Community.findByPk(req.params.id);
  if (!community) return res.status(404).json({ message: 'Community not found' });

  const members = await CommunityMember.findAll({
    where: { communityId: community.id },
    include: [{ model: User, as: 'user' }],
    order: [['createdAt', 'ASC']],
    limit: 500,
  });

  return res.json(members.map((m) => ({ ...publicUser(m.user), role: m.role, joinedAt: m.createdAt })));
}

async function requireMember(communityId, userId) {
  return CommunityMember.findOne({ where: { communityId, userId } });
}

export async function listPosts(req, res) {
  const community = await Community.findByPk(req.params.id);
  if (!community) return res.status(404).json({ message: 'Community not found' });
  if (!(await requireMember(community.id, req.userId))) {
    return res.status(403).json({ message: 'Join this community to see its posts' });
  }

  const { before, limit = 20 } = req.query;
  const where = { communityId: community.id };
  if (before) where.createdAt = { [Op.lt]: new Date(before) };

  const posts = await CommunityPost.findAll({
    where,
    include: [{ model: User, as: 'author' }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
  });

  return res.json(
    posts.map((p) => ({
      id: p.id,
      communityId: p.communityId,
      author: publicUser(p.author),
      content: p.content,
      imageUrl: p.imageUrl,
      mediaType: p.mediaType,
      createdAt: p.createdAt,
    }))
  );
}

export async function createPost(req, res) {
  const community = await Community.findByPk(req.params.id);
  if (!community) return res.status(404).json({ message: 'Community not found' });
  if (!(await requireMember(community.id, req.userId))) {
    return res.status(403).json({ message: 'Join this community to post here' });
  }

  const { content, imageUrl, mediaType } = req.body;
  if (!content && !imageUrl) {
    return res.status(400).json({ message: 'A post needs content or media' });
  }
  if (mediaType && !['image', 'video'].includes(mediaType)) {
    return res.status(400).json({ message: 'Invalid mediaType' });
  }

  const post = await CommunityPost.create({
    communityId: community.id,
    authorId: req.userId,
    content: content ?? null,
    imageUrl: imageUrl ?? null,
    mediaType: imageUrl ? mediaType || 'image' : null,
  });
  const author = await User.findByPk(req.userId);

  return res.status(201).json({
    id: post.id,
    communityId: post.communityId,
    author: publicUser(author),
    content: post.content,
    imageUrl: post.imageUrl,
    mediaType: post.mediaType,
    createdAt: post.createdAt,
  });
}

export async function deletePost(req, res) {
  const post = await CommunityPost.findByPk(req.params.postId);
  if (!post || post.communityId !== req.params.id) return res.status(404).json({ message: 'Post not found' });

  const membership = await requireMember(post.communityId, req.userId);
  const canDelete = post.authorId === req.userId || membership?.role === 'admin';
  if (!canDelete) return res.status(403).json({ message: 'Not allowed to delete this post' });

  await post.destroy();
  return res.status(204).send();
}
