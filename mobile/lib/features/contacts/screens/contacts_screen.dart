import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/app_button.dart';
import '../../../common/widgets/app_input.dart';
import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../../../models/social_request.dart';
import '../../../models/user.dart';
import '../../chat/providers/chat_actions.dart';
import '../providers/contacts_actions.dart';
import '../providers/contacts_provider.dart';

/// Ports the web app's Contacts tab (Sidebar.jsx + ContactSearch.jsx +
/// ContactRequests.jsx + ContactsList.jsx) as its own screen — mobile has no
/// room for a persistent split-view sidebar with an inline tab switch, so
/// this is reached as a pushed screen from ConversationsScreen's app bar
/// instead. A system separate from the friends list (profile/data/social_api.dart)
/// — do not merge them.
class ContactsScreen extends ConsumerStatefulWidget {
  const ContactsScreen({super.key});

  @override
  ConsumerState<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends ConsumerState<ContactsScreen> {
  final _searchController = TextEditingController();
  List<AppUser>? _results;
  final Set<String> _sentTo = {};
  bool _loading = true;
  bool _searching = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      await Future.wait([
        ref.read(contactsActionsProvider).loadContacts(),
        ref.read(contactsActionsProvider).loadIncomingRequests(),
      ]);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _runSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() => _results = null);
      return;
    }
    setState(() => _searching = true);
    try {
      final results = await ref.read(contactsActionsProvider).searchUsers(query);
      if (mounted) setState(() => _results = results);
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  Future<void> _sendRequest(String userId) async {
    try {
      await ref.read(contactsActionsProvider).sendContactRequest(userId);
    } catch (_) {
      // A request may already exist between the two users — same
      // best-effort handling as ContactSearch.jsx's addContact.
    }
    if (mounted) setState(() => _sentTo.add(userId));
  }

  Future<void> _accept(IncomingRequest request) {
    return ref.read(contactsActionsProvider).acceptContactRequest(request.id, request.requester);
  }

  Future<void> _startChat(AppUser contact) async {
    final router = GoRouter.of(context);
    final conversation = await ref.read(chatActionsProvider).startDirectConversation(contact.id);
    router.push('/chat/${conversation.id}');
  }

  @override
  Widget build(BuildContext context) {
    final contacts = ref.watch(contactsProvider.select((s) => s.contacts));
    final incoming = ref.watch(contactsProvider.select((s) => s.incomingRequests));

    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Contacts')),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
            : RefreshIndicator(
                onRefresh: _load,
                color: AppColors.accent,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    AppInput(
                      controller: _searchController,
                      onChanged: _runSearch,
                      hintText: 'Search by name, username, email or phone',
                      prefixIcon: const Icon(Icons.search),
                    ),
                    if (_searching)
                      const Padding(
                        padding: EdgeInsets.only(top: 8),
                        child: Text('Searching...', style: TextStyle(color: AppColors.inkSoft)),
                      ),
                    if (_results != null) ...[
                      const SizedBox(height: 8),
                      if (_results!.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Text('No users found.', style: TextStyle(color: AppColors.inkSoft)),
                        )
                      else
                        for (final user in _results!)
                          _SearchResultTile(user: user, sent: _sentTo.contains(user.id), onAdd: () => _sendRequest(user.id)),
                      const Divider(height: 32, color: AppColors.line),
                    ],
                    if (incoming.isNotEmpty) ...[
                      const _SectionLabel('Requests'),
                      for (final request in incoming)
                        _IncomingRequestTile(request: request, onAccept: () => _accept(request)),
                      const SizedBox(height: 16),
                    ],
                    const _SectionLabel('Contacts'),
                    if (contacts.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Text('No contacts yet. Search above to add someone.', style: TextStyle(color: AppColors.inkSoft)),
                      )
                    else
                      for (final contact in contacts) _ContactTile(contact: contact, onTap: () => _startChat(contact)),
                  ],
                ),
              ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;

  const _SectionLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.inkSoft, letterSpacing: 0.4),
      ),
    );
  }
}

class _SearchResultTile extends StatelessWidget {
  final AppUser user;
  final bool sent;
  final VoidCallback onAdd;

  const _SearchResultTile({required this.user, required this.sent, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Avatar(user: user, size: AvatarSize.sm),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text('@${user.username}', style: const TextStyle(fontSize: 12, color: AppColors.inkSoft)),
              ],
            ),
          ),
          AppButton(label: sent ? 'Sent' : 'Add', variant: AppButtonVariant.outline, onPressed: sent ? null : onAdd),
        ],
      ),
    );
  }
}

class _IncomingRequestTile extends StatefulWidget {
  final IncomingRequest request;
  final Future<void> Function() onAccept;

  const _IncomingRequestTile({required this.request, required this.onAccept});

  @override
  State<_IncomingRequestTile> createState() => _IncomingRequestTileState();
}

class _IncomingRequestTileState extends State<_IncomingRequestTile> {
  bool _accepting = false;

  Future<void> _accept() async {
    setState(() => _accepting = true);
    try {
      await widget.onAccept();
    } finally {
      if (mounted) setState(() => _accepting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final requester = widget.request.requester;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Avatar(user: requester, size: AvatarSize.sm),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(requester.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text('@${requester.username}', style: const TextStyle(fontSize: 12, color: AppColors.inkSoft)),
              ],
            ),
          ),
          AppButton(label: 'Accept', loading: _accepting, onPressed: _accepting ? null : _accept),
        ],
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final AppUser contact;
  final VoidCallback onTap;

  const _ContactTile({required this.contact, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      onTap: onTap,
      leading: Avatar(user: contact, size: AvatarSize.sm),
      title: Text(contact.name, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text('@${contact.username}', style: const TextStyle(color: AppColors.inkSoft)),
    );
  }
}
