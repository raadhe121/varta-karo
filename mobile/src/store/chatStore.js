import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  typingByConversation: {},

  setConversations: (conversations) => set({ conversations }),

  upsertConversation: (conversation) =>
    set((state) => {
      const others = state.conversations.filter((c) => c.id !== conversation.id);
      return { conversations: [conversation, ...others] };
    }),

  touchConversationLastMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations
        .map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: {
                  id: message.id,
                  content: message.content,
                  type: message.type,
                  senderId: message.senderId,
                  senderName: message.senderName,
                  createdAt: message.createdAt,
                },
              }
            : c
        )
        .sort((a, b) => (a.id === conversationId ? -1 : b.id === conversationId ? 1 : 0)),
    })),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: { ...state.messagesByConversation, [conversationId]: messages },
    })),

  prependMessages: (conversationId, olderMessages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...olderMessages, ...(state.messagesByConversation[conversationId] || [])],
      },
    })),

  addMessage: (conversationId, message) => {
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];
      if (existing.some((m) => m.id === message.id)) return {};
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...existing, message],
        },
      };
    });
    get().touchConversationLastMessage(conversationId, message);
  },

  setMessageStatus: (conversationId, messageId, userId, status) =>
    set((state) => {
      const messages = state.messagesByConversation[conversationId] || [];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages.map((m) =>
            m.id === messageId
              ? { ...m, statuses: [...(m.statuses || []).filter((s) => s.userId !== userId), { userId, status }] }
              : m
          ),
        },
      };
    }),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.typingByConversation[conversationId] || []);
      if (isTyping) current.add(userId);
      else current.delete(userId);
      return { typingByConversation: { ...state.typingByConversation, [conversationId]: Array.from(current) } };
    }),

  reset: () => set({ conversations: [], activeConversationId: null, messagesByConversation: {}, typingByConversation: {} }),
}));
