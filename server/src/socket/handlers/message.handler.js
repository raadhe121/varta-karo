import { Conversation, ConversationParticipant, Message, MessageStatus, User } from '../../models/index.js';

export function registerMessageHandlers(io, socket) {
  socket.on('message:send', async (payload, ack) => {
    try {
      const { conversationId, type = 'text', content, mediaUrl, mediaMeta, replyToId } = payload || {};

      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: socket.userId },
      });
      if (!participant) {
        return ack?.({ error: 'Not a member of this conversation' });
      }

      const message = await Message.create({
        conversationId,
        senderId: socket.userId,
        type,
        content: content ?? null,
        mediaUrl: mediaUrl ?? null,
        mediaMeta: mediaMeta ?? null,
        replyToId: replyToId ?? null,
      });

      await Conversation.update({ updatedAt: new Date() }, { where: { id: conversationId } });

      const otherParticipants = await ConversationParticipant.findAll({
        where: { conversationId },
      });
      await MessageStatus.bulkCreate(
        otherParticipants
          .filter((p) => p.userId !== socket.userId)
          .map((p) => ({ messageId: message.id, userId: p.userId, status: 'delivered' }))
      );

      const sender = await User.findByPk(socket.userId);
      const payloadOut = {
        id: message.id,
        conversationId,
        senderId: socket.userId,
        senderName: sender?.name,
        type: message.type,
        content: message.content,
        mediaUrl: message.mediaUrl,
        mediaMeta: message.mediaMeta,
        replyToId: message.replyToId,
        createdAt: message.createdAt,
      };

      io.to(`conversation:${conversationId}`).emit('message:new', payloadOut);
      ack?.({ message: payloadOut });
    } catch (err) {
      ack?.({ error: err.message || 'Failed to send message' });
    }
  });

  socket.on('message:read', async ({ conversationId, messageId }) => {
    try {
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId: socket.userId },
      });
      if (!participant) return;

      await MessageStatus.update(
        { status: 'read' },
        { where: { messageId, userId: socket.userId } }
      );
      participant.lastReadMessageId = messageId;
      await participant.save();

      io.to(`conversation:${conversationId}`).emit('message:status', {
        conversationId,
        messageId,
        userId: socket.userId,
        status: 'read',
      });
    } catch {
      // best-effort; read receipts are non-critical
    }
  });
}
