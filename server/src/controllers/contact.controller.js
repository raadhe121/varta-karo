import { Op } from 'sequelize';
import { ContactRequest, User } from '../models/index.js';
import { createNotification } from '../services/notification.service.js';

function publicUser(user) {
  const { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt } = user;
  return { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt };
}

export async function sendRequest(req, res) {
  const addresseeId = req.params.userId;
  if (addresseeId === req.userId) {
    return res.status(400).json({ message: 'Cannot add yourself' });
  }

  const addressee = await User.findByPk(addresseeId);
  if (!addressee) return res.status(404).json({ message: 'User not found' });

  const existing = await ContactRequest.findOne({
    where: {
      [Op.or]: [
        { requesterId: req.userId, addresseeId },
        { requesterId: addresseeId, addresseeId: req.userId },
      ],
    },
  });
  if (existing) {
    return res.status(409).json({ message: 'A contact request already exists', request: existing });
  }

  const request = await ContactRequest.create({ requesterId: req.userId, addresseeId, status: 'pending' });
  await createNotification(
    { recipientId: addresseeId, actorId: req.userId, type: 'contact_request' },
    req.app.get('io')
  );
  return res.status(201).json(request);
}

export async function acceptRequest(req, res) {
  const request = await ContactRequest.findByPk(req.params.requestId);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.addresseeId !== req.userId) {
    return res.status(403).json({ message: 'Only the addressee can accept this request' });
  }

  request.status = 'accepted';
  await request.save();
  await createNotification(
    { recipientId: request.requesterId, actorId: req.userId, type: 'contact_accepted' },
    req.app.get('io')
  );
  return res.json(request);
}

export async function listIncomingRequests(req, res) {
  const requests = await ContactRequest.findAll({
    where: { addresseeId: req.userId, status: 'pending' },
    include: [{ model: User, as: 'requester' }],
  });
  return res.json(
    requests.map((r) => ({ id: r.id, createdAt: r.createdAt, requester: publicUser(r.requester) }))
  );
}

export async function listContacts(req, res) {
  const requests = await ContactRequest.findAll({
    where: {
      status: 'accepted',
      [Op.or]: [{ requesterId: req.userId }, { addresseeId: req.userId }],
    },
    include: [
      { model: User, as: 'requester' },
      { model: User, as: 'addressee' },
    ],
  });

  const contacts = requests.map((r) =>
    r.requesterId === req.userId ? publicUser(r.addressee) : publicUser(r.requester)
  );
  return res.json(contacts);
}
