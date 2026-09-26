import { Highlight, HighlightItem, Story, Follow } from '../models/index.js';
import { isFriend } from '../services/visibility.service.js';

async function canViewHighlightsOf(viewerId, ownerId) {
  if (viewerId === ownerId) return true;
  const [friend, following] = await Promise.all([
    isFriend(viewerId, ownerId),
    Follow.findOne({ where: { followerId: viewerId, followingId: ownerId } }),
  ]);
  return Boolean(friend || following);
}

function serializeHighlight(highlight) {
  return {
    id: highlight.id,
    name: highlight.name,
    coverUrl: highlight.coverUrl,
    items: (highlight.items || [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ id: i.id, mediaUrl: i.mediaUrl, mediaType: i.mediaType })),
  };
}

export async function listHighlights(req, res) {
  const { userId } = req.params;
  if (!(await canViewHighlightsOf(req.userId, userId))) {
    return res.status(403).json({ message: 'Not allowed to view these highlights' });
  }

  const highlights = await Highlight.findAll({
    where: { ownerId: userId },
    include: [{ model: HighlightItem, as: 'items' }],
    order: [['createdAt', 'ASC']],
  });
  return res.json(highlights.map(serializeHighlight));
}

// Copies the chosen stories' media into permanent HighlightItem rows -- the
// highlight then survives long after the source Story rows expire.
export async function createHighlight(req, res) {
  const name = String(req.body.name || '').trim();
  const storyIds = Array.isArray(req.body.storyIds) ? req.body.storyIds : [];
  if (!name) return res.status(400).json({ message: 'name is required' });
  if (storyIds.length === 0) return res.status(400).json({ message: 'At least one story is required' });

  const stories = await Story.findAll({ where: { id: storyIds, authorId: req.userId } });
  if (stories.length === 0) return res.status(404).json({ message: 'No matching stories found' });

  const orderedStories = storyIds.map((id) => stories.find((s) => s.id === id)).filter(Boolean);

  const highlight = await Highlight.create({ ownerId: req.userId, name, coverUrl: orderedStories[0].mediaUrl });
  await HighlightItem.bulkCreate(
    orderedStories.map((s, i) => ({
      highlightId: highlight.id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      position: i,
    }))
  );

  const full = await Highlight.findByPk(highlight.id, { include: [{ model: HighlightItem, as: 'items' }] });
  return res.status(201).json(serializeHighlight(full));
}

export async function addStoriesToHighlight(req, res) {
  const highlight = await Highlight.findByPk(req.params.id, { include: [{ model: HighlightItem, as: 'items' }] });
  if (!highlight || highlight.ownerId !== req.userId) {
    return res.status(404).json({ message: 'Highlight not found' });
  }

  const storyIds = Array.isArray(req.body.storyIds) ? req.body.storyIds : [];
  const stories = await Story.findAll({ where: { id: storyIds, authorId: req.userId } });
  const startPosition = highlight.items.length;

  await HighlightItem.bulkCreate(
    stories.map((s, i) => ({
      highlightId: highlight.id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      position: startPosition + i,
    }))
  );

  const full = await Highlight.findByPk(highlight.id, { include: [{ model: HighlightItem, as: 'items' }] });
  return res.json(serializeHighlight(full));
}

export async function deleteHighlight(req, res) {
  const highlight = await Highlight.findByPk(req.params.id);
  if (!highlight || highlight.ownerId !== req.userId) {
    return res.status(404).json({ message: 'Highlight not found' });
  }

  await HighlightItem.destroy({ where: { highlightId: highlight.id } });
  await highlight.destroy();
  return res.status(204).send();
}
