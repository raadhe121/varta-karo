import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../../../core/auth_session.dart';
import '../../../models/conversation.dart';
import '../../../models/user.dart';
import '../../contacts/data/contacts_api.dart';
import '../providers/chat_actions.dart';
import '../providers/chat_provider.dart';
import '../providers/presence_provider.dart';

/// Ports `src/pages/ChatPage.jsx` + `Sidebar.jsx`'s conversation list for a
/// single-column mobile layout: tapping a row pushes the thread screen
/// instead of swapping an "active conversation" pane in a split view.
class ConversationsScreen extends ConsumerStatefulWidget {
  const ConversationsScreen({super.key});

  @override
  ConsumerState<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends ConsumerState<ConversationsScreen> {
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      await ref.read(chatActionsProvider).loadConversations();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openNewChatSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.paper,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg))),
      builder: (_) => const _NewChatSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final conversations = ref.watch(chatProvider.select((s) => s.conversations));
    final myId = ref.watch(authSessionProvider).userId ?? '';

    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const Text('Chat'),
          actions: [
            IconButton(
              icon: const Icon(Icons.shuffle),
              tooltip: 'Talk to a stranger',
              onPressed: () => context.push('/random-chat'),
            ),
            IconButton(
              icon: const Icon(Icons.call_outlined),
              tooltip: 'Call history',
              onPressed: () => context.push('/chat/calls'),
            ),
            IconButton(
              icon: const Icon(Icons.contacts_outlined),
              tooltip: 'Contacts',
              onPressed: () => context.push('/chat/contacts'),
            ),
            IconButton(
              icon: const Icon(Icons.add_comment_outlined),
              tooltip: 'New chat',
              onPressed: _openNewChatSheet,
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
            : RefreshIndicator(
                onRefresh: _load,
                color: AppColors.accent,
                child: conversations.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 120),
                          Center(
                            child: Text('No chats yet. Start one below.', style: TextStyle(color: AppColors.inkSoft)),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        itemCount: conversations.length,
                        separatorBuilder: (context, index) => const Divider(height: 1, color: AppColors.line, indent: 76),
                        itemBuilder: (context, index) =>
                            _ConversationTile(conversation: conversations[index], myId: myId),
                      ),
              ),
      ),
    );
  }
}

class _ConversationTile extends ConsumerWidget {
  final Conversation conversation;
  final String myId;

  const _ConversationTile({required this.conversation, required this.myId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final other = conversation.otherParticipant(myId);
    final isOnline = ref.watch(presenceProvider.select((p) => p[other?.id]?.isOnline ?? other?.isOnline ?? false));
    final unread = conversation.lastMessage != null && conversation.lastMessage!.senderId != myId;

    final avatarUser = conversation.isGroup
        ? AppUser(
            id: conversation.id,
            name: conversation.name ?? 'Group',
            username: '',
            avatarUrl: conversation.avatarUrl,
            avatarColor: '#8A7D6C',
          )
        : other;

    return ListTile(
      onTap: () => context.push('/chat/${conversation.id}'),
      leading: Avatar(user: avatarUser, showStatus: !conversation.isGroup, isOnline: isOnline),
      title: Text(
        conversation.displayTitle(myId),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      subtitle: Text(
        _preview(conversation),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: AppColors.inkSoft),
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(_timeAgo(conversation.lastMessage?.createdAt), style: const TextStyle(fontSize: 11, color: AppColors.inkSoft)),
          if (unread) ...[
            const SizedBox(height: 6),
            Container(width: 9, height: 9, decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle)),
          ],
        ],
      ),
    );
  }

  String _preview(Conversation conversation) {
    final last = conversation.lastMessage;
    if (last == null) return 'Say hello 👋';
    if (last.type == 'text') return last.content ?? '';
    return '📎 Attachment';
  }

  String _timeAgo(DateTime? date) {
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}

/// A lightweight stand-in for Sidebar.jsx's Contacts tab + "+ Group" button:
/// pick a contact to start a direct chat, or jump to the full group-creation
/// screen. Uses ContactsApi.fetchContacts() — matching NewGroupModal.jsx and
/// Sidebar.jsx, which both source their picker from /contacts, not /friends
/// (a separate system — see contacts/data/contacts_api.dart).
class _NewChatSheet extends ConsumerStatefulWidget {
  const _NewChatSheet();

  @override
  ConsumerState<_NewChatSheet> createState() => _NewChatSheetState();
}

class _NewChatSheetState extends ConsumerState<_NewChatSheet> {
  List<AppUser>? _contacts;

  @override
  void initState() {
    super.initState();
    ref.read(contactsApiProvider).fetchContacts().then((contacts) {
      if (mounted) setState(() => _contacts = contacts);
    });
  }

  Future<void> _startChat(AppUser contact) async {
    final navigator = Navigator.of(context);
    final router = GoRouter.of(context);
    navigator.pop();
    final conversation = await ref.read(chatActionsProvider).startDirectConversation(contact.id);
    router.push('/chat/${conversation.id}');
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Expanded(child: Text('New chat', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
                TextButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    context.push('/chat/new-group');
                  },
                  icon: const Icon(Icons.group_add_outlined, size: 18),
                  label: const Text('Group'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 320,
              child: _contacts == null
                  ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                  : _contacts!.isEmpty
                      ? const Center(child: Text('No contacts yet.', style: TextStyle(color: AppColors.inkSoft)))
                      : ListView.builder(
                          itemCount: _contacts!.length,
                          itemBuilder: (context, index) {
                            final contact = _contacts![index];
                            return ListTile(
                              leading: Avatar(user: contact, size: AvatarSize.sm),
                              title: Text(contact.name),
                              subtitle: Text('@${contact.username}'),
                              onTap: () => _startChat(contact),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
