import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/socket_service.dart';
import '../../../models/conversation.dart';
import '../../../models/message.dart';
import '../data/chat_api.dart';
import 'chat_provider.dart';
import 'presence_provider.dart';

/// Matches the backend's default page size in
/// conversation.controller.js#getMessages (limit = 30).
const messagePageSize = 30;

/// The "actions" layer on top of chatProvider/presenceProvider — equivalent
/// of the web app's chat.api.js calls plus the imperative bits of
/// useSocket.js/MessageInput.jsx/MessageList.jsx. Holds no state of its
/// own; every method ends by mutating chatProvider or presenceProvider.
class ChatActions {
  final Ref _ref;

  ChatActions(this._ref);

  Future<void> loadConversations() async {
    final conversations = await _ref.read(chatApiProvider).fetchConversations();
    _ref.read(chatProvider.notifier).setConversations(conversations);
    _ref.read(presenceProvider.notifier).seedFromUsers(conversations.expand((c) => c.participants));
  }

  Future<void> loadMessages(String conversationId) async {
    final messages = await _ref.read(chatApiProvider).fetchMessages(conversationId);
    _ref.read(chatProvider.notifier).setMessages(conversationId, messages);
    _ref.read(chatProvider.notifier).setHasMore(conversationId, messages.length >= messagePageSize);
  }

  Future<void> loadMoreMessages(String conversationId) async {
    final existing = _ref.read(chatProvider).messagesFor(conversationId);
    if (existing.isEmpty) return;
    final older = await _ref.read(chatApiProvider).fetchMessages(conversationId, before: existing.first.createdAt);
    _ref.read(chatProvider.notifier).prependMessages(conversationId, older);
    _ref.read(chatProvider.notifier).setHasMore(conversationId, older.length >= messagePageSize);
  }

  Future<Conversation> startDirectConversation(String userId) async {
    final conversation = await _ref.read(chatApiProvider).createDirectConversation(userId);
    _ref.read(chatProvider.notifier).upsertConversation(conversation);
    return conversation;
  }

  Future<Conversation> createGroup({required String name, required List<String> participantIds}) async {
    final conversation =
        await _ref.read(chatApiProvider).createGroupConversation(name: name, participantIds: participantIds);
    _ref.read(chatProvider.notifier).upsertConversation(conversation);
    return conversation;
  }

  /// Sends over the socket (server has no REST endpoint for this — see
  /// SocketService.sendMessage) and applies the server's ack locally so the
  /// sender doesn't have to wait for their own `message:new` echo.
  Future<ChatMessage> sendMessage({
    required String conversationId,
    String type = 'text',
    String? content,
    String? mediaUrl,
    Map<String, dynamic>? mediaMeta,
    String? replyToId,
  }) async {
    final message = await _ref.read(socketServiceProvider).sendMessage({
      'conversationId': conversationId,
      'type': type,
      'content': ?content,
      'mediaUrl': ?mediaUrl,
      'mediaMeta': ?mediaMeta,
      'replyToId': ?replyToId,
    });
    _ref.read(chatProvider.notifier).addMessage(conversationId, message);
    return message;
  }

  void markRead(String conversationId, String messageId) {
    _ref.read(socketServiceProvider).emitMessageRead(conversationId, messageId);
  }

  void setTyping(String conversationId, bool isTyping) {
    _ref.read(socketServiceProvider).emitTyping(conversationId, isTyping);
  }
}

final chatActionsProvider = Provider<ChatActions>((ref) => ChatActions(ref));
