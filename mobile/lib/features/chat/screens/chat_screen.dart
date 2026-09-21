import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../../../core/auth_session.dart';
import '../../../core/media_api.dart';
import '../../../features/call/providers/call_actions.dart';
import '../../../models/conversation.dart';
import '../../../models/message.dart';
import '../../../models/user.dart';
import '../providers/chat_actions.dart';
import '../providers/chat_provider.dart';
import '../providers/presence_provider.dart';
import '../widgets/message_bubble.dart';

const _typingStopDelay = Duration(seconds: 2);

String _errorMessage(Object err) {
  if (err is DioException) {
    final data = err.response?.data;
    if (data is Map && data['message'] is String) return data['message'] as String;
  }
  return 'Something went wrong. Please try again.';
}

/// Ports `src/pages/ChatPage.jsx`'s thread pane (MessageList + TypingIndicator
/// + MessageInput) as its own screen. ContactDossier/call actions are left
/// for a later phase — this focuses on core messaging.
class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;

  const ChatScreen({super.key, required this.conversationId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  Timer? _typingTimer;
  bool _loadingInitial = true;
  bool _loadingMore = false;
  bool _uploading = false;
  bool _sending = false;
  bool _isTyping = false;
  String? _lastReadMessageId;
  ChatMessage? _replyingTo;

  String get _conversationId => widget.conversationId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      await ref.read(chatActionsProvider).loadMessages(_conversationId);
    } finally {
      if (mounted) setState(() => _loadingInitial = false);
    }
    _maybeMarkRead();
    _scrollToBottom();
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !ref.read(chatProvider).hasMore(_conversationId)) return;
    setState(() => _loadingMore = true);
    try {
      await ref.read(chatActionsProvider).loadMoreMessages(_conversationId);
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  void _maybeMarkRead() {
    final myId = ref.read(authSessionProvider).userId;
    final messages = ref.read(chatProvider).messagesFor(_conversationId);
    if (messages.isEmpty || myId == null) return;
    final last = messages.last;
    if (last.senderId == myId || last.id == _lastReadMessageId) return;
    _lastReadMessageId = last.id;
    ref.read(chatActionsProvider).markRead(_conversationId, last.id);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scrollController.hasClients) return;
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
    });
  }

  void _onTextChanged(String value) {
    if (!_isTyping) {
      _isTyping = true;
      ref.read(chatActionsProvider).setTyping(_conversationId, true);
    }
    _typingTimer?.cancel();
    _typingTimer = Timer(_typingStopDelay, () {
      _isTyping = false;
      ref.read(chatActionsProvider).setTyping(_conversationId, false);
    });
  }

  Future<void> _sendText() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _sending) return;
    final replyToId = _replyingTo?.id;
    _textController.clear();
    setState(() => _replyingTo = null);
    _typingTimer?.cancel();
    if (_isTyping) {
      _isTyping = false;
      ref.read(chatActionsProvider).setTyping(_conversationId, false);
    }
    setState(() => _sending = true);
    try {
      await ref.read(chatActionsProvider).sendMessage(
            conversationId: _conversationId,
            type: 'text',
            content: text,
            replyToId: replyToId,
          );
      _scrollToBottom();
    } catch (err) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_errorMessage(err))));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _attachImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked == null) return;

    setState(() => _uploading = true);
    try {
      final uploaded = await ref.read(mediaApiProvider).upload(
            path: picked.path,
            filename: picked.name,
            mimeType: picked.mimeType,
          );
      final isImage = (picked.mimeType ?? '').startsWith('image/');
      await ref.read(chatActionsProvider).sendMessage(
            conversationId: _conversationId,
            type: isImage ? 'image' : 'file',
            mediaUrl: uploaded['url'] as String?,
            mediaMeta: {'originalName': uploaded['originalName'] ?? picked.name},
          );
      _scrollToBottom();
    } catch (err) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_errorMessage(err))));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final myId = ref.watch(authSessionProvider).userId ?? '';
    final conversation = ref.watch(chatProvider.select(
      (s) => s.conversations.where((c) => c.id == _conversationId).firstOrNull,
    ));
    final messages = ref.watch(chatProvider.select((s) => s.messagesFor(_conversationId)));
    final hasMore = ref.watch(chatProvider.select((s) => s.hasMore(_conversationId)));
    final typingUserIds = ref.watch(chatProvider.select((s) => s.typingIn(_conversationId)));
    final otherTyping = typingUserIds.where((id) => id != myId).toSet();
    final isGroup = conversation?.isGroup ?? false;
    final other = conversation?.otherParticipant(myId);
    final isOnline = ref.watch(presenceProvider.select((p) => p[other?.id]?.isOnline ?? other?.isOnline ?? false));

    // Loading older history also changes the list length, but must not jump
    // the view back to the bottom — only scroll when the *last* message
    // changed (a new message arrived/was sent), not when older ones were
    // prepended by "load earlier messages".
    ref.listen<List<ChatMessage>>(
      chatProvider.select((s) => s.messagesFor(_conversationId)),
      (previous, next) {
        if (next.isEmpty) return;
        _maybeMarkRead();
        final appended = previous == null || previous.isEmpty || previous.last.id != next.last.id;
        if (appended) _scrollToBottom();
      },
    );

    final messagesById = {for (final m in messages) m.id: m};

    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          titleSpacing: 0,
          title: Row(
            children: [
              Avatar(user: isGroup ? _groupAvatarUser(conversation) : other, size: AvatarSize.sm, showStatus: !isGroup, isOnline: isOnline),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      conversation?.displayTitle(myId) ?? '...',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      otherTyping.isNotEmpty ? 'typing...' : (isGroup ? '${conversation?.participants.length ?? 0} members' : (isOnline ? 'Online' : '')),
                      style: TextStyle(fontSize: 11, color: otherTyping.isNotEmpty ? AppColors.accent : AppColors.inkSoft),
                    ),
                  ],
                ),
              ),
            ],
          ),
          // Calling is 1:1 only — the signaling protocol (call:invite etc.,
          // see server/src/socket/handlers/call.handler.js) targets a single
          // toUserId, so there's no group-call target to dial.
          actions: !isGroup && other != null
              ? [
                  IconButton(
                    icon: const Icon(Icons.call_outlined),
                    tooltip: 'Voice call',
                    onPressed: () => ref.read(callActionsProvider).startCall(
                          conversationId: _conversationId,
                          remoteUser: other,
                          video: false,
                        ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.videocam_outlined),
                    tooltip: 'Video call',
                    onPressed: () => ref.read(callActionsProvider).startCall(
                          conversationId: _conversationId,
                          remoteUser: other,
                          video: true,
                        ),
                  ),
                ]
              : null,
        ),
        body: Column(
          children: [
            Expanded(
              child: _loadingInitial
                  ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                  : NotificationListener<ScrollNotification>(
                      onNotification: (notification) {
                        if (notification.metrics.pixels <= 40 && notification.metrics.axis == Axis.vertical) {
                          _loadMore();
                        }
                        return false;
                      },
                      child: ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        itemCount: messages.length + (hasMore ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (hasMore && index == 0) {
                            return Center(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                child: _loadingMore
                                    ? const SizedBox(
                                        width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                                    : TextButton(
                                        onPressed: _loadMore,
                                        child: const Text('Load earlier messages'),
                                      ),
                              ),
                            );
                          }
                          final messageIndex = index - (hasMore ? 1 : 0);
                          final message = messages[messageIndex];
                          final previous = messageIndex > 0 ? messages[messageIndex - 1] : null;
                          final showSender = isGroup && previous?.senderId != message.senderId;
                          return MessageBubble(
                            message: message,
                            isMine: message.senderId == myId,
                            showSender: showSender,
                            replyTo: message.replyToId != null ? messagesById[message.replyToId] : null,
                            onReply: () => setState(() => _replyingTo = message),
                          );
                        },
                      ),
                    ),
            ),
            if (_replyingTo != null) _ReplyBar(message: _replyingTo!, onCancel: () => setState(() => _replyingTo = null)),
            _MessageInputBar(
              controller: _textController,
              sending: _sending,
              uploading: _uploading,
              onChanged: _onTextChanged,
              onSend: _sendText,
              onAttach: _attachImage,
            ),
          ],
        ),
      ),
    );
  }

  AppUser? _groupAvatarUser(Conversation? conversation) {
    if (conversation == null) return null;
    return AppUser(
      id: conversation.id,
      name: conversation.name ?? 'Group',
      username: '',
      avatarUrl: conversation.avatarUrl,
      avatarColor: '#8A7D6C',
    );
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}

class _ReplyBar extends StatelessWidget {
  final ChatMessage message;
  final VoidCallback onCancel;

  const _ReplyBar({required this.message, required this.onCancel});

  @override
  Widget build(BuildContext context) {
    final preview = message.type == 'text' ? (message.content ?? '') : '📎 Attachment';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      color: AppColors.accentSoft,
      child: Row(
        children: [
          const Icon(Icons.reply, size: 16, color: AppColors.accent),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Replying to: $preview',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, color: AppColors.ink),
            ),
          ),
          IconButton(icon: const Icon(Icons.close, size: 16), onPressed: onCancel, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
        ],
      ),
    );
  }
}

class _MessageInputBar extends StatelessWidget {
  final TextEditingController controller;
  final bool sending;
  final bool uploading;
  final ValueChanged<String> onChanged;
  final VoidCallback onSend;
  final VoidCallback onAttach;

  const _MessageInputBar({
    required this.controller,
    required this.sending,
    required this.uploading,
    required this.onChanged,
    required this.onSend,
    required this.onAttach,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
        decoration: const BoxDecoration(color: AppColors.paper, border: Border(top: BorderSide(color: AppColors.line))),
        child: Row(
          children: [
            IconButton(
              onPressed: uploading ? null : onAttach,
              icon: uploading
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.attach_file, color: AppColors.inkSoft),
            ),
            Expanded(
              child: TextField(
                controller: controller,
                onChanged: onChanged,
                minLines: 1,
                maxLines: 4,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(hintText: 'Write something...'),
              ),
            ),
            const SizedBox(width: 4),
            IconButton(
              onPressed: sending ? null : onSend,
              icon: sending
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.send, color: AppColors.accent),
            ),
          ],
        ),
      ),
    );
  }
}
