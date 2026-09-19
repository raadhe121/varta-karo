import { Op } from 'sequelize';
import { Story, StoryView, User, Follow } from '../models/index.js';
import { isFriend, getFriendIds } from '../services/visibility.service.js';

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

function publicUser(user) {
  const { id, name, username, avatarUrl, avatarColor } = user;
  return { id, name, username, avatarUrl, avatarColor };
}

async function serializeStory(story, viewerId) {
  const viewed =
    story.authorId === viewerId ? true : Boolean(await StoryView.findOne({ where: { storyId: story.id, viewerId } }));
  return {
    id: story.id,
    authorId: story.authorId,
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    caption: story.caption,
    createdAt: story.createdAt,
    expiresAt: story.expiresAt,
    viewedByMe: viewed,
  };
}

async function canViewStoriesOf(viewerId, authorId) {
  if (viewerId === authorId) return true;
  const [friend, following] = await Promise.all([
    isFriend(viewerId, authorId),
    Follow.findOne({ where: { followerId: viewerId, followingId: authorId } }),
  ]);
  return Boolean(friend || following);
}

export async function createStory(req, res) {
  const { mediaUrl, mediaType = 'image', caption } = req.body;
  if (!mediaUrl) return res.status(400).json({ message: 'mediaUrl is required' });
  if (!['image', 'video'].includes(mediaType)) return res.status(400).json({ message: 'Invalid mediaType' });

  const story = await Story.create({
    authorId: req.userId,
    mediaUrl,
    mediaType,
    caption: caption || null,
    expiresAt: new Date(Date.now() + STORY_LIFETIME_MS),
  });
  const author = await User.findByPk(req.userId);
  return res.status(201).json({ ...(await serializeStory(story, req.userId)), author: publicUser(author) });
}

export async function getFeedStories(req, res) {
  const [friendIds, followingRows] = await Promise.all([
    getFriendIds(req.userId),
    Follow.findAll({ where: { followerId: req.userId } }),
  ]);
  const authorIds = Array.from(new Set([req.userId, ...friendIds, ...followingRows.map((f) => f.followingId)]));

  const stories = await Story.findAll({
    where: { authorId: { [Op.in]: authorIds }, expiresAt: { [Op.gt]: new Date() } },
    include: [{ model: User, as: 'author' }],
    order: [['createdAt', 'ASC']],
  });

  const groups = new Map();
  for (const story of stories) {
    if (!groups.has(story.authorId)) {
      groups.set(story.authorId, { author: publicUser(story.author), stories: [] });
    }
    groups.get(story.authorId).stories.push(await serializeStory(story, req.userId));
  }

  const result = Array.from(groups.values());
  result.sort((a, b) => {
    if (a.author.id === req.userId) return -1;
    if (b.author.id === req.userId) return 1;
    const aUnseen = a.stories.some((s) => !s.viewedByMe);
    const bUnseen = b.stories.some((s) => !s.viewedByMe);
    if (aUnseen !== bUnseen) return aUnseen ? -1 : 1;
    return new Date(b.stories.at(-1).createdAt) - new Date(a.stories.at(-1).createdAt);
  });

  return res.json(result);
}

export async function getUserStories(req, res) {
  const { id } = req.params;
  if (!(await canViewStoriesOf(req.userId, id))) {
    return res.status(403).json({ message: 'Not allowed to view these stories' });
  }

  const stories = await Story.findAll({
    where: { authorId: id, expiresAt: { [Op.gt]: new Date() } },
    include: [{ model: User, as: 'author' }],
    order: [['createdAt', 'ASC']],
  });

  return res.json(
    await Promise.all(
      stories.map(async (s) => ({ ...(await serializeStory(s, req.userId)), author: publicUser(s.author) }))
    )
  );
}

export async function viewStory(req, res) {
  const story = await Story.findByPk(req.params.id);
  if (!story) return res.status(404).json({ message: 'Story not found' });

  if (story.authorId !== req.userId) {
    const existing = await StoryView.findOne({ where: { storyId: story.id, viewerId: req.userId } });
    if (!existing) await StoryView.create({ storyId: story.id, viewerId: req.userId });
  }
  return res.status(204).send();
}

export async function getStoryViewers(req, res) {
  const story = await Story.findByPk(req.params.id);
  if (!story) return res.status(404).json({ message: 'Story not found' });
  if (story.authorId !== req.userId) return res.status(403).json({ message: 'Only the author can see viewers' });

  const views = await StoryView.findAll({
    where: { storyId: story.id },
    include: [{ model: User, as: 'viewer' }],
    order: [['createdAt', 'DESC']],
  });
  return res.json(views.map((v) => ({ ...publicUser(v.viewer), viewedAt: v.createdAt })));
}

export async function deleteStory(req, res) {
  const story = await Story.findByPk(req.params.id);
  if (!story) return res.status(404).json({ message: 'Story not found' });
  if (story.authorId !== req.userId) return res.status(403).json({ message: 'Only the author can delete this story' });

  await story.destroy();
  return res.status(204).send();
}
