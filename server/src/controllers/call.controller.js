import { Op } from 'sequelize';
import { CallLog, User } from '../models/index.js';

function publicUser(user) {
  if (!user) return null;
  const { id, name, username, avatarUrl, avatarColor } = user;
  return { id, name, username, avatarUrl, avatarColor };
}

function serializeCall(call, viewerId) {
  const isOutgoing = call.callerId === viewerId;
  return {
    id: call.id,
    conversationId: call.conversationId,
    type: call.type,
    status: call.status,
    durationSec: call.durationSec,
    direction: isOutgoing ? 'outgoing' : 'incoming',
    otherUser: publicUser(isOutgoing ? call.callee : call.caller),
    createdAt: call.createdAt,
  };
}

export async function listCalls(req, res) {
  const calls = await CallLog.findAll({
    where: { [Op.or]: [{ callerId: req.userId }, { calleeId: req.userId }] },
    include: [
      { model: User, as: 'caller' },
      { model: User, as: 'callee' },
    ],
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
  return res.json(calls.map((c) => serializeCall(c, req.userId)));
}

export async function logCall(req, res) {
  const { conversationId, calleeId, type = 'audio', status = 'missed', durationSec = 0 } = req.body;
  if (!conversationId || !calleeId) {
    return res.status(400).json({ message: 'conversationId and calleeId are required' });
  }
  if (!['audio', 'video'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
  if (!['answered', 'missed', 'declined', 'no_answer'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const call = await CallLog.create({
    conversationId,
    callerId: req.userId,
    calleeId,
    type,
    status,
    durationSec: Math.max(0, Number(durationSec) || 0),
  });
  const full = await CallLog.findByPk(call.id, {
    include: [
      { model: User, as: 'caller' },
      { model: User, as: 'callee' },
    ],
  });
  return res.status(201).json(serializeCall(full, req.userId));
}
