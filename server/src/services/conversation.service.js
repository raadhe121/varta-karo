import { Conversation, ConversationParticipant, User } from '../models/index.js';
import { serializeConversation } from '../controllers/conversation.controller.js';

/** Finds (or creates) the direct conversation between two users, notifying
 * both over the main socket namespace exactly like the REST /conversations
 * endpoint does — used by the random-chat "connect" flow, which creates a
 * conversation server-side rather than through that REST call. */
export async function getOrCreateDirectConversation(io, userIdA, userIdB) {
  const existingCandidates = await ConversationParticipant.findAll({
    where: { userId: [userIdA, userIdB] },
    include: [{ model: Conversation, as: 'conversation', where: { type: 'direct' } }],
  });
  const grouped = new Map();
  for (const row of existingCandidates) {
    const list = grouped.get(row.conversationId) || [];
    list.push(row.userId);
    grouped.set(row.conversationId, list);
  }
  for (const [conversationId, ids] of grouped) {
    if (ids.length === 2 && ids.includes(userIdA) && ids.includes(userIdB)) {
      return Conversation.findByPk(conversationId, { include: [{ model: User, as: 'participants' }] });
    }
  }

  const conversation = await Conversation.create({ type: 'direct', createdBy: userIdA });
  await ConversationParticipant.bulkCreate([
    { conversationId: conversation.id, userId: userIdA, role: 'admin' },
    { conversationId: conversation.id, userId: userIdB, role: 'admin' },
  ]);

  const full = await Conversation.findByPk(conversation.id, { include: [{ model: User, as: 'participants' }] });
  await Promise.all(
    [userIdA, userIdB].map(async (memberId) => {
      const payload = await serializeConversation(full, memberId);
      io.in(`user:${memberId}`).socketsJoin(`conversation:${conversation.id}`);
      io.to(`user:${memberId}`).emit('conversation:new', payload);
    })
  );

  return full;
}
