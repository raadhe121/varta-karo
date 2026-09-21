import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/socket_service.dart';
import 'notifications_actions.dart';
import 'notifications_provider.dart';

/// Bridges SocketService's `onNotificationNew` stream into
/// notificationsProvider — the Flutter equivalent of the web app's
/// `useSocket.js` `notification:new` wiring. Watched once from
/// `_MainShell`, alongside chatSocketBridgeProvider/callSocketBridgeProvider.
final notificationsSocketBridgeProvider = Provider<void>((ref) {
  final socketService = ref.read(socketServiceProvider);
  final notifier = ref.read(notificationsProvider.notifier);

  // Seeds the unread badge as soon as the shell mounts, matching
  // AppNav.jsx's initial fetchUnreadCount() call.
  ref.read(notificationsActionsProvider).loadUnreadCount();

  final subscription = socketService.onNotificationNew.listen(notifier.addNotification);
  ref.onDispose(subscription.cancel);
});
