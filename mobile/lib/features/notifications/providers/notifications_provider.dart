import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/notification.dart';

class NotificationsState {
  final List<AppNotification> items;
  final bool loaded;
  final int unreadCount;

  const NotificationsState({this.items = const [], this.loaded = false, this.unreadCount = 0});

  NotificationsState copyWith({List<AppNotification>? items, bool? loaded, int? unreadCount}) => NotificationsState(
        items: items ?? this.items,
        loaded: loaded ?? this.loaded,
        unreadCount: unreadCount ?? this.unreadCount,
      );
}

/// Pure notifications state — fed by NotificationsActions (REST) and
/// notificationsSocketBridgeProvider (`notification:new`). Same split as
/// feedProvider/FeedActions.
class NotificationsNotifier extends Notifier<NotificationsState> {
  @override
  NotificationsState build() => const NotificationsState();

  void setItems(List<AppNotification> items) {
    state = state.copyWith(items: items, loaded: true);
  }

  void setUnreadCount(int count) {
    state = state.copyWith(unreadCount: count);
  }

  /// Applies an incoming `notification:new` push — mirrors
  /// notificationStore.js's addNotification.
  void addNotification(AppNotification notification) {
    state = state.copyWith(items: [notification, ...state.items], unreadCount: state.unreadCount + 1);
  }

  void markAllRead() {
    state = state.copyWith(items: state.items.map((n) => n.markRead()).toList(), unreadCount: 0);
  }

  void markOneRead(String id) {
    final wasUnread = state.items.any((n) => n.id == id && !n.read);
    state = state.copyWith(
      items: state.items.map((n) => n.id == id ? n.markRead() : n).toList(),
      unreadCount: wasUnread && state.unreadCount > 0 ? state.unreadCount - 1 : state.unreadCount,
    );
  }
}

final notificationsProvider = NotifierProvider<NotificationsNotifier, NotificationsState>(NotificationsNotifier.new);
