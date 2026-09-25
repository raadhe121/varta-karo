import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/conversation.dart';
import '../../../models/message.dart';

class ChatState {
  final List<Conversation> conversations;
  final bool conversationsLoaded;
  final Map<String, List<ChatMessage>> messagesByConversation;
  final Map<String, bool> hasMoreByConversation;
  final Map<String, Set<String>> typingByConversation;

  const ChatState({
    this.conversations = const [],
    this.conversationsLoaded = false,
    this.messagesByConversation = const {},
    this.hasMoreByConversation = const {},
    this.typingByConversation = const {},
  });

  List<ChatMessage> messagesFor(String conversationId) =>
      messagesByConversation[conversationId] ?? const [];

  Set<String> typingIn(String conversationId) =>
      typingByConversation[conversationId] ?? const {};

  bool hasMore(String conversationId) =>
      hasMoreByConversation[conversationId] ?? true;

  ChatState copyWith({
    List<Conversation>? conversations,
    bool? conversationsLoaded,
    Map<String, List<ChatMessage>>? messagesByConversation,
    Map<String, bool>? hasMoreByConversation,
    Map<String, Set<String>>? typingByConversation,
  }) => ChatState(
    conversations: conversations ?? this.conversations,
    conversationsLoaded: conversationsLoaded ?? this.conversationsLoaded,
    messagesByConversation:
        messagesByConversation ?? this.messagesByConversation,
    hasMoreByConversation: hasMoreByConversation ?? this.hasMoreByConversation,
    typingByConversation: typingByConversation ?? this.typingByConversation,
  );
}

/// Mirrors the web app's single `chatStore.js` — conversations, messages
/// and typing indicators all live in one notifier, fed both by REST loads
/// (ChatActions) and by socket events (chatSocketBridgeProvider).
class ChatNotifier extends Notifier<ChatState> {
  @override
  ChatState build() => const ChatState();

  void setConversations(List<Conversation> conversations) {
    state = state.copyWith(
      conversations: conversations,
      conversationsLoaded: true,
    );
  }

  void upsertConversation(Conversation conversation) {
    final others = state.conversations
        .where((c) => c.id != conversation.id)
        .toList();
    state = state.copyWith(conversations: [conversation, ...others]);
  }

  void touchConversationLastMessage(
    String conversationId,
    ChatMessage message,
  ) {
    final updated =
        state.conversations
            .map(
              (c) => c.id == conversationId
                  ? c.copyWith(
                      lastMessage: LastMessage(
                        id: message.id,
                        content: message.content,
                        type: message.type,
                        senderId: message.senderId,
                        senderName: message.senderName,
                        createdAt: message.createdAt,
                      ),
                    )
                  : c,
            )
            .toList()
          ..sort((a, b) {
            if (a.id == conversationId) return -1;
            if (b.id == conversationId) return 1;
            return 0;
          });
    state = state.copyWith(conversations: updated);
  }

  void setMessages(String conversationId, List<ChatMessage> messages) {
    state = state.copyWith(
      messagesByConversation: {
        ...state.messagesByConversation,
        conversationId: messages,
      },
    );
  }

  void prependMessages(String conversationId, List<ChatMessage> older) {
    final existing = state.messagesFor(conversationId);
    state = state.copyWith(
      messagesByConversation: {
        ...state.messagesByConversation,
        conversationId: [...older, ...existing],
      },
    );
  }

  void addMessage(String conversationId, ChatMessage message) {
    final existing = state.messagesFor(conversationId);
    if (existing.any((m) => m.id == message.id)) return;
    state = state.copyWith(
      messagesByConversation: {
        ...state.messagesByConversation,
        conversationId: [...existing, message],
      },
    );
    touchConversationLastMessage(conversationId, message);
  }

  void setMessageStatus(
    String conversationId,
    String messageId,
    String userId,
    String status,
  ) {
    final messages = state.messagesFor(conversationId);
    state = state.copyWith(
      messagesByConversation: {
        ...state.messagesByConversation,
        conversationId: messages
            .map((m) => m.id == messageId ? m.withStatus(userId, status) : m)
            .toList(),
      },
    );
  }

  void setTyping(String conversationId, String userId, bool isTyping) {
    final current = {...state.typingIn(conversationId)};
    if (isTyping) {
      current.add(userId);
    } else {
      current.remove(userId);
    }
    state = state.copyWith(
      typingByConversation: {
        ...state.typingByConversation,
        conversationId: current,
      },
    );
  }

  void setHasMore(String conversationId, bool hasMore) {
    state = state.copyWith(
      hasMoreByConversation: {
        ...state.hasMoreByConversation,
        conversationId: hasMore,
      },
    );
  }

  /// Applies a local transform to one conversation (mute/disappearing/block
  /// toggles) so the UI updates without a full conversations refetch.
  void updateConversation(
    String conversationId,
    Conversation Function(Conversation) transform,
  ) {
    state = state.copyWith(
      conversations: [
        for (final c in state.conversations)
          c.id == conversationId ? transform(c) : c,
      ],
    );
  }
}

final chatProvider = NotifierProvider<ChatNotifier, ChatState>(
  ChatNotifier.new,
);
