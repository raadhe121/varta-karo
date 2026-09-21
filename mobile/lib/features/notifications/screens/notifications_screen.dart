import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../../../models/notification.dart';
import '../providers/notifications_actions.dart';
import '../providers/notifications_provider.dart';

/// Mirrors NotificationsPage.jsx's TYPE_TEXT.
const _typeText = {
  'friend_request': 'sent you a friend request',
  'friend_accepted': 'accepted your friend request',
  'follow': 'started following you',
  'contact_request': 'wants to add you as a contact',
  'contact_accepted': 'accepted your contact request',
  'like': 'liked your post',
  'comment': 'commented on your post',
};

const _typeIcons = {
  'friend_request': Icons.person_add_alt,
  'friend_accepted': Icons.how_to_reg,
  'follow': Icons.person_add,
  'contact_request': Icons.contact_page_outlined,
  'contact_accepted': Icons.check_circle_outline,
  'like': Icons.favorite,
  'comment': Icons.chat_bubble_outline,
};

/// Ports `src/pages/NotificationsPage.jsx`: a flat, most-recent-first list
/// with an icon overlay per notification type, tap-to-navigate, and an
/// explicit mark-all-read action — fed by notificationsProvider (REST load
/// here, `notification:new` pushes arrive via notificationsSocketBridgeProvider
/// in `_MainShell`). Unlike the web page, this does NOT auto-mark everything
/// read on open — the mark-all-read app bar action is the only way to do
/// that, since a silent auto-mark-on-view reads worse on mobile.
class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      await ref.read(notificationsActionsProvider).loadNotifications();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _open(AppNotification n) {
    if (!n.read) ref.read(notificationsActionsProvider).markRead(n.id);

    switch (n.type) {
      case 'friend_request':
      case 'friend_accepted':
      case 'follow':
        context.push('/profile/${n.actor.id}');
      case 'contact_request':
      case 'contact_accepted':
        // Web links both to '/chat' (contacts lives inline in its sidebar);
        // mobile has a dedicated contacts screen, which is the more direct
        // "relevant content" here.
        context.push('/chat/contacts');
      case 'like':
      case 'comment':
        if (n.postId != null) {
          context.push('/feed/post/${n.postId}/comments');
        } else {
          context.push('/profile/${n.actor.id}');
        }
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = ref.watch(notificationsProvider.select((s) => s.items));
    final unreadCount = ref.watch(notificationsProvider.select((s) => s.unreadCount));

    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const Text('Notifications'),
          actions: [
            if (unreadCount > 0)
              TextButton(
                onPressed: () => ref.read(notificationsActionsProvider).markAllRead(),
                child: const Text('Mark all read'),
              ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
            : RefreshIndicator(
                onRefresh: _load,
                color: AppColors.accent,
                child: items.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 120),
                          Center(
                            child: Padding(
                              padding: EdgeInsets.symmetric(horizontal: 32),
                              child: Text(
                                'Nothing here yet. Likes, comments, and requests will show up here.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: AppColors.inkSoft),
                              ),
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        itemCount: items.length,
                        separatorBuilder: (context, index) =>
                            const Divider(height: 1, color: AppColors.line, indent: 76),
                        itemBuilder: (context, index) =>
                            _NotificationTile(notification: items[index], onTap: () => _open(items[index])),
                      ),
              ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;

  const _NotificationTile({required this.notification, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final n = notification;
    return Container(
      color: n.read ? Colors.transparent : AppColors.accentSoft.withValues(alpha: 0.4),
      child: ListTile(
        onTap: onTap,
        leading: Stack(
          clipBehavior: Clip.none,
          children: [
            Avatar(user: n.actor, size: AvatarSize.sm),
            Positioned(
              bottom: -2,
              right: -2,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(color: AppColors.paper, shape: BoxShape.circle),
                child: Icon(_typeIcons[n.type] ?? Icons.notifications_outlined, size: 12, color: AppColors.accent),
              ),
            ),
          ],
        ),
        title: RichText(
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          text: TextSpan(
            style: const TextStyle(fontSize: 14, color: AppColors.ink),
            children: [
              TextSpan(text: n.actor.name, style: const TextStyle(fontWeight: FontWeight.w700)),
              TextSpan(text: ' ${_typeText[n.type] ?? 'sent you a notification'}'),
              if (n.postSummary != null)
                TextSpan(text: ' — "${n.postSummary}"', style: const TextStyle(color: AppColors.inkSoft)),
            ],
          ),
        ),
        subtitle: Text(_timeAgo(n.createdAt), style: const TextStyle(fontSize: 11, color: AppColors.inkSoft)),
        trailing: n.read
            ? null
            : const SizedBox(
                width: 9,
                height: 9,
                child: DecoratedBox(decoration: BoxDecoration(color: AppColors.accent, shape: BoxShape.circle)),
              ),
      ),
    );
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
