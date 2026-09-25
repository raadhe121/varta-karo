import { Op } from 'sequelize';
import { Post, Like, Save, Share, Comment, User, Follow, sequelize } from '../models/index.js';
import { isFriend, canView, getFriendIds } from '../services/visibility.service.js';
import { createNotification } from '../services/notification.service.js';

function publicUser(user) {
  const { id, name, username, avatarUrl, avatarColor } = user;
  return { id, name, username, avatarUrl, avatarColor };
}

// `followingIds` lets callers batch-resolve "do I follow this author" for a
// whole page of posts with a single Follow query instead of one per post.
async function serializePost(post, viewerId, followingIds = null) {
  const [likeCount, viewerLike, commentCount, saveCount, viewerSave, shareCount] = await Promise.all([
    Like.count({ where: { postId: post.id } }),
    Like.findOne({ where: { postId: post.id, userId: viewerId } }),
    Comment.count({ where: { postId: post.id } }),
    Save.count({ where: { postId: post.id } }),
    Save.findOne({ where: { postId: post.id, userId: viewerId } }),
    Share.count({ where: { postId: post.id } }),
  ]);

  const followedByMe = followingIds
    ? followingIds.has(post.authorId)
    : Boolean(await Follow.findOne({ where: { followerId: viewerId, followingId: post.authorId } }));

  return {
    id: post.id,
    author: publicUser(post.author),
    content: post.content,
    imageUrl: post.imageUrl,
    mediaType: post.mediaType,
    visibility: post.visibility,
    likeCount,
    likedByMe: Boolean(viewerLike),
    commentCount,
    saveCount,
    savedByMe: Boolean(viewerSave),
    shareCount,
    followedByMe: post.authorId === viewerId ? undefined : followedByMe,
    createdAt: post.createdAt,
  };
}

export async function getFeed(req, res) {
  const { before, limit = 20 } = req.query;

  const [friendIds, followingRows] = await Promise.all([
    getFriendIds(req.userId),
    Follow.findAll({ where: { followerId: req.userId } }),
  ]);
  const followingIds = followingRows.map((f) => f.followingId);

  const orConditions = [{ authorId: req.userId }];
  if (friendIds.length > 0) {
    orConditions.push({ authorId: { [Op.in]: friendIds }, visibility: { [Op.in]: ['public', 'friends'] } });
  }
  if (followingIds.length > 0) {
    orConditions.push({ authorId: { [Op.in]: followingIds }, visibility: 'public' });
  }

  const where = { [Op.or]: orConditions };
  if (before) {
    where.createdAt = { [Op.lt]: new Date(before) };
  }

  const posts = await Post.findAll({
    where,
    include: [{ model: User, as: 'author' }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
  });

  const followingIdSet = new Set(followingIds);
  return res.json(await Promise.all(posts.map((p) => serializePost(p, req.userId, followingIdSet))));
}

// Shown when the caller's own feed is empty (nobody followed yet, or
// nobody they follow has posted): a grab-bag of public posts from other
// users, each carrying `followedByMe` so the client can show a Follow
// button inline and help a fresh account find people to follow.
export async function getDiscoverPosts(req, res) {
  const { limit = 20 } = req.query;

  const [followingRows, posts] = await Promise.all([
    Follow.findAll({ where: { followerId: req.userId } }),
    Post.findAll({
      where: { visibility: 'public', authorId: { [Op.ne]: req.userId } },
      include: [{ model: User, as: 'author' }],
      order: sequelize.random(),
      limit: Number(limit),
    }),
  ]);
  const followingIdSet = new Set(followingRows.map((f) => f.followingId));

  return res.json(await Promise.all(posts.map((p) => serializePost(p, req.userId, followingIdSet))));
}

export async function getReels(req, res) {
  const { before, limit = 10 } = req.query;

  const where = {
    mediaType: 'video',
    [Op.or]: [{ authorId: req.userId }, { visibility: 'public' }],
  };
  if (before) {
    where.createdAt = { [Op.lt]: new Date(before) };
  }

  const [posts, followingRows] = await Promise.all([
    Post.findAll({
      where,
      include: [{ model: User, as: 'author' }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
    }),
    Follow.findAll({ where: { followerId: req.userId } }),
  ]);
  const followingIdSet = new Set(followingRows.map((f) => f.followingId));

  return res.json(await Promise.all(posts.map((p) => serializePost(p, req.userId, followingIdSet))));
}

export async function getUserPosts(req, res) {
  const { id } = req.params;
  const { before, limit = 20 } = req.query;

  const where = { authorId: id };
  if (req.userId !== id) {
    const friend = await isFriend(req.userId, id);
    where.visibility = friend ? { [Op.in]: ['public', 'friends'] } : 'public';
  }
  if (before) {
    where.createdAt = { [Op.lt]: new Date(before) };
  }

  const posts = await Post.findAll({
    where,
    include: [{ model: User, as: 'author' }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
  });

  return res.json(await Promise.all(posts.map((p) => serializePost(p, req.userId))));
}

export async function createPost(req, res) {
  const { content, imageUrl, mediaType, visibility = 'public' } = req.body;
  if (!content && !imageUrl) {
    return res.status(400).json({ message: 'A post needs content or media' });
  }
  if (!['public', 'friends', 'only_me'].includes(visibility)) {
    return res.status(400).json({ message: 'Invalid visibility' });
  }
  if (mediaType && !['image', 'video'].includes(mediaType)) {
    return res.status(400).json({ message: 'Invalid mediaType' });
  }

  const post = await Post.create({
    authorId: req.userId,
    content: content ?? null,
    imageUrl: imageUrl ?? null,
    mediaType: imageUrl ? mediaType || 'image' : null,
    visibility,
  });
  const full = await Post.findByPk(post.id, { include: [{ model: User, as: 'author' }] });
  return res.status(201).json(await serializePost(full, req.userId));
}

export async function deletePost(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.authorId !== req.userId) return res.status(403).json({ message: 'Only the author can delete this post' });

  await post.destroy();
  return res.status(204).send();
}

export async function toggleLike(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (!(await canView(post.visibility, req.userId, post.authorId))) {
    return res.status(403).json({ message: 'Not allowed to view this post' });
  }

  const existing = await Like.findOne({ where: { postId: post.id, userId: req.userId } });
  if (existing) {
    await existing.destroy();
  } else {
    await Like.create({ postId: post.id, userId: req.userId });
    await createNotification(
      { recipientId: post.authorId, actorId: req.userId, type: 'like', postId: post.id },
      req.app.get('io')
    );
  }

  const likeCount = await Like.count({ where: { postId: post.id } });
  return res.json({ liked: !existing, likeCount });
}

export async function toggleSave(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (!(await canView(post.visibility, req.userId, post.authorId))) {
    return res.status(403).json({ message: 'Not allowed to view this post' });
  }

  const existing = await Save.findOne({ where: { postId: post.id, userId: req.userId } });
  if (existing) {
    await existing.destroy();
  } else {
    await Save.create({ postId: post.id, userId: req.userId });
  }

  const saveCount = await Save.count({ where: { postId: post.id } });
  return res.json({ saved: !existing, saveCount });
}

export async function sharePost(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (!(await canView(post.visibility, req.userId, post.authorId))) {
    return res.status(403).json({ message: 'Not allowed to view this post' });
  }

  await Share.create({ postId: post.id, userId: req.userId });
  const shareCount = await Share.count({ where: { postId: post.id } });
  return res.json({ shareCount });
}

export async function listComments(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (!(await canView(post.visibility, req.userId, post.authorId))) {
    return res.status(403).json({ message: 'Not allowed to view this post' });
  }

  const comments = await Comment.findAll({
    where: { postId: post.id },
    include: [{ model: User, as: 'author' }],
    order: [['createdAt', 'ASC']],
    limit: 200,
  });

  return res.json(
    comments.map((c) => ({
      id: c.id,
      content: c.content,
      author: publicUser(c.author),
      createdAt: c.createdAt,
    }))
  );
}

export async function addComment(req, res) {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (!(await canView(post.visibility, req.userId, post.authorId))) {
    return res.status(403).json({ message: 'Not allowed to view this post' });
  }

  const { content } = req.body;
  if (!content) return res.status(400).json({ message: 'content is required' });

  const comment = await Comment.create({ postId: post.id, authorId: req.userId, content });
  await createNotification(
    { recipientId: post.authorId, actorId: req.userId, type: 'comment', postId: post.id },
    req.app.get('io')
  );
  const author = await User.findByPk(req.userId);
  return res.status(201).json({ id: comment.id, content: comment.content, author: publicUser(author), createdAt: comment.createdAt });
}
