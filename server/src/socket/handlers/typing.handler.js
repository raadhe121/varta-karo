export function registerTypingHandlers(io, socket) {
  socket.on('typing:start', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:update', {
      conversationId,
      userId: socket.userId,
      isTyping: true,
    });
  });

  socket.on('typing:stop', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:update', {
      conversationId,
      userId: socket.userId,
      isTyping: false,
    });
  });
}
