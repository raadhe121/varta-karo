import { Collection, Save } from '../models/index.js';

export async function listCollections(req, res) {
  const collections = await Collection.findAll({
    where: { ownerId: req.userId },
    order: [['createdAt', 'ASC']],
  });

  const counts = await Promise.all(
    collections.map((c) => Save.count({ where: { userId: req.userId, collectionId: c.id } }))
  );
  const allPostsCount = await Save.count({ where: { userId: req.userId, collectionId: null } });

  return res.json([
    { id: null, name: 'All posts', postCount: allPostsCount },
    ...collections.map((c, i) => ({ id: c.id, name: c.name, postCount: counts[i] })),
  ]);
}

export async function createCollection(req, res) {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'name is required' });

  const collection = await Collection.create({ ownerId: req.userId, name });
  return res.status(201).json({ id: collection.id, name: collection.name, postCount: 0 });
}

export async function deleteCollection(req, res) {
  const collection = await Collection.findByPk(req.params.id);
  if (!collection || collection.ownerId !== req.userId) {
    return res.status(404).json({ message: 'Collection not found' });
  }

  // Posts in it fall back to the "All posts" bucket rather than being unsaved.
  await Save.update({ collectionId: null }, { where: { collectionId: collection.id } });
  await collection.destroy();
  return res.status(204).send();
}
