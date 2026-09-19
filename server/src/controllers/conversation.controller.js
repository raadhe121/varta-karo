import { Op } from 'sequelize';
import {
  Conversation,
  ConversationParticipant,
  User,
  Message,
  MessageStatus,
} from '../models/index.js';

function publicUser(user) {
  const { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt } = user;
  return { id, name, username, email, phone, avatarUrl, avatarColor, bio, status, lastSeenAt };
}

async function serializeConversation(conversation, userId) {
  const lastMessage = await Message.findOne({
    where: { conversationId: conversation.id },
    order: [['createdAt', 'DESC']],
    include: [{ model: User, as: 'sender' }],
  });

  return {
    id: conversation.id,
    type: conversation.type,
    name: conversation.name,
    avatarUrl: conversation.avatarUrl,
    participants: conversation.participants.map(publicUser),
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          content: lastMessage.content,
          type: lastMessage.type,
          senderId: lastMessage.senderId,
          senderName: lastMessage.sender?.name,
          createdAt: lastMessage.createdAt,
        }
      : null,
    updatedAt: conversation.updatedAt,
  };
}

export async function listConversations(req, res) {
  const rows = await ConversationParticipant.findAll({ where: { userId: req.userId } });
  const conversationIds = rows.map((r) => r.conversationId);

  const conversations = await Conversation.findAll({
    where: { id: conversationIds },
    include: [{ model: User, as: 'participants' }],
    order: [['updatedAt', 'DESC']],
  });

  const serialized = await Promise.all(conversations.map((c) => serializeConversation(c, req.userId)));
  return res.json(serialized);
}

export async function createConversation(req, res) {
  const { type, participantIds = [], name } = req.body;
  if (!['direct', 'group'].includes(type)) {
    return res.status(400).json({ message: 'type must be "direct" or "group"' });
  }

  const memberIds = Array.from(new Set([req.userId, ...participantIds.filter(Boolean)]));

  if (type === 'direct') {
    if (memberIds.length !== 2) {
      return res.status(400).json({ message: 'Direct conversations need exactly one other participant' });
    }

    const existingCandidates = await ConversationParticipant.findAll({
      where: { userId: memberIds },
      include: [{ model: Conversation, as: 'conversation', where: { type: 'direct' } }],
    });
    const grouped = new Map();
    for (const row of existingCandidates) {
      const list = grouped.get(row.conversationId) || [];
      list.push(row.userId);
      grouped.set(row.conversationId, list);
    }
    for (const [conversationId, ids] of grouped) {
      if (ids.length === 2 && memberIds.every((id) => ids.includes(id))) {
        const existing = await Conversation.findByPk(conversationId, {
          include: [{ model: User, as: 'participants' }],
        });
        return res.status(200).json(await serializeConversation(existing, req.userId));
      }
    }
  }

  if (type === 'group' && !name) {
    return res.status(400).json({ message: 'Groups require a name' });
  }

  const conversation = await Conversation.create({ type, name: type === 'group' ? name : null, createdBy: req.userId });
  await ConversationParticipant.bulkCreate(
    memberIds.map((userId) => ({
      conversationId: conversation.id,
      userId,
      role: userId === req.userId ? 'admin' : 'member',
    }))
  );

  const full = await Conversation.findByPk(conversation.id, { include: [{ model: User, as: 'participants' }] });
  const io = req.app.get('io');
  await Promise.all(
    memberIds.map(async (memberId) => {
      const payload = await serializeConversation(full, memberId);
      io.in(`user:${memberId}`).socketsJoin(`conversation:${conversation.id}`);
      io.to(`user:${memberId}`).emit('conversation:new', payload);
    })
  );

  return res.status(201).json(await serializeConversation(full, req.userId));
}

export async function updateConversation(req, res) {
  const conversation = await Conversation.findByPk(req.params.id, { include: [{ model: User, as: 'participants' }] });
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  if (conversation.type !== 'group') {
    return res.status(400).json({ message: 'Only groups can be renamed' });
  }

  const isMember = conversation.participants.some((p) => p.id === req.userId);
  if (!isMember) return res.status(403).json({ message: 'Not a member of this conversation' });

  const { name, avatarUrl } = req.body;
  if (name !== undefined) conversation.name = name;
  if (avatarUrl !== undefined) conversation.avatarUrl = avatarUrl;
  await conversation.save();

  return res.json(await serializeConversation(conversation, req.userId));
}

export async function addParticipants(req, res) {
  const conversation = await Conversation.findByPk(req.params.id, { include: [{ model: User, as: 'participants' }] });
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  if (conversation.type !== 'group') {
    return res.status(400).json({ message: 'Can only add participants to groups' });
  }

  const { userIds = [] } = req.body;
  const existingIds = new Set(conversation.participants.map((p) => p.id));
  const toAdd = userIds.filter((id) => !existingIds.has(id));

  await ConversationParticipant.bulkCreate(
    toAdd.map((userId) => ({ conversationId: conversation.id, userId, role: 'member' }))
  );

  const refreshed = await Conversation.findByPk(conversation.id, { include: [{ model: User, as: 'participants' }] });

  const io = req.app.get('io');
  await Promise.all(
    toAdd.map(async (memberId) => {
      const payload = await serializeConversation(refreshed, memberId);
      io.to(`user:${memberId}`).emit('conversation:new', payload);
      io.in(`user:${memberId}`).socketsJoin(`conversation:${conversation.id}`);
    })
  );

  return res.json(await serializeConversation(refreshed, req.userId));
}

export async function getMessages(req, res) {
  const { id } = req.params;
  const { before, limit = 30 } = req.query;

  const participant = await ConversationParticipant.findOne({ where: { conversationId: id, userId: req.userId } });
  if (!participant) return res.status(403).json({ message: 'Not a member of this conversation' });

  const where = { conversationId: id };
  if (before) {
    where.createdAt = { [Op.lt]: new Date(before) };
  }

  const messages = await Message.findAll({
    where,
    include: [{ model: User, as: 'sender' }, { model: MessageStatus, as: 'statuses' }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
  });

  return res.json(
    messages
      .map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.sender?.name,
        type: m.type,
        content: m.content,
        mediaUrl: m.mediaUrl,
        mediaMeta: m.mediaMeta,
        replyToId: m.replyToId,
        statuses: m.statuses.map((s) => ({ userId: s.userId, status: s.status })),
        createdAt: m.createdAt,
      }))
      .reverse()
  );
}
