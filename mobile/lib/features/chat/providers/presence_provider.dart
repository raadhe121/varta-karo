import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/user.dart';

/// Mirrors the web app's `presenceStore.js`.
class PresenceInfo {
  final String status;
  final DateTime? lastSeenAt;

  const PresenceInfo({required this.status, this.lastSeenAt});

  bool get isOnline => status == 'online';
}

class PresenceNotifier extends Notifier<Map<String, PresenceInfo>> {
  @override
  Map<String, PresenceInfo> build() => {};

  void setPresence(String userId, String status, DateTime? lastSeenAt) {
    state = {...state, userId: PresenceInfo(status: status, lastSeenAt: lastSeenAt)};
  }

  /// Seeds initial presence from each conversation's participants list, so
  /// online dots aren't all "offline" until the first presence:update
  /// arrives for a user who was already online when the list loaded.
  void seedFromUsers(Iterable<AppUser> users) {
    final next = {...state};
    for (final u in users) {
      next[u.id] = PresenceInfo(status: u.status, lastSeenAt: u.lastSeenAt);
    }
    state = next;
  }

  bool isOnline(String? userId) => userId != null && (state[userId]?.isOnline ?? false);
}

final presenceProvider = NotifierProvider<PresenceNotifier, Map<String, PresenceInfo>>(PresenceNotifier.new);
