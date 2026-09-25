import { Op } from 'sequelize';
import { Message } from '../models/index.js';

const SWEEP_INTERVAL_MS = 30_000;

// Messages get an `expiresAt` at send time when their conversation has
// disappearing messages on (see socket/handlers/message.handler.js). This
// periodically soft-deletes ones past that and tells connected clients so
// they can drop them from view immediately rather than waiting for a refetch.
export function startDisappearingMessagesSweep(io) {
  setInterval(async () => {
    const expired = await Message.findAll({ where: { expiresAt: { [Op.lte]: new Date() } } });
    for (const message of expired) {
      const { id, conversationId } = message;
      await message.destroy();
      io.to(`conversation:${conversationId}`).emit('message:deleted', { conversationId, messageId: id });
    }
  }, SWEEP_INTERVAL_MS);
}
