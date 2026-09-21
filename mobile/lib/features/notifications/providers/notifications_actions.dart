import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/notifications_api.dart';
import 'notifications_provider.dart';

/// The "actions" layer on top of notificationsProvider — equivalent of the
/// web app's notifications.api.js calls plus NotificationsPage.jsx's
/// imperative bits.
class NotificationsActions {
  final Ref _ref;

  NotificationsActions(this._ref);

  Future<void> loadNotifications() async {
    final items = await _ref.read(notificationsApiProvider).fetchNotifications();
    _ref.read(notificationsProvider.notifier).setItems(items);
  }

  Future<void> loadUnreadCount() async {
    final count = await _ref.read(notificationsApiProvider).fetchUnreadCount();
    _ref.read(notificationsProvider.notifier).setUnreadCount(count);
  }

  Future<void> markAllRead() async {
    await _ref.read(notificationsApiProvider).markAllRead();
    _ref.read(notificationsProvider.notifier).markAllRead();
  }

  Future<void> markRead(String id) async {
    await _ref.read(notificationsApiProvider).markRead(id);
    _ref.read(notificationsProvider.notifier).markOneRead(id);
  }
}

final notificationsActionsProvider = Provider<NotificationsActions>((ref) => NotificationsActions(ref));
