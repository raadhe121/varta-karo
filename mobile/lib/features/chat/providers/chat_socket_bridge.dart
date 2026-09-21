import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/socket_service.dart';
import 'chat_provider.dart';
import 'presence_provider.dart';

/// Bridges SocketService's broadcast streams into chatProvider and
/// presenceProvider — the Flutter equivalent of the web app's
/// `useSocket.js` chat wiring. Meant to be watched exactly once from a
/// long-lived widget that's mounted for as long as the user is
/// authenticated (the tab shell in app_router.dart's `_MainShell`), so
/// messages/typing/presence keep updating no matter which tab is active —
/// also doubles as the "reconnect after a restored session" hook, since
/// authActionsProvider only calls SocketService.connect() on a fresh
/// login/register/OTP flow, not on hydration from storage.
final chatSocketBridgeProvider = Provider<void>((ref) {
  final socketService = ref.read(socketServiceProvider);
  socketService.connect();

  final chatNotifier = ref.read(chatProvider.notifier);
  final presenceNotifier = ref.read(presenceProvider.notifier);

  final subscriptions = <StreamSubscription>[
    socketService.onMessageNew.listen((message) => chatNotifier.addMessage(message.conversationId, message)),
    socketService.onMessageStatus.listen(
      (e) => chatNotifier.setMessageStatus(e.conversationId, e.messageId, e.userId, e.status),
    ),
    socketService.onTypingUpdate.listen((e) => chatNotifier.setTyping(e.conversationId, e.userId, e.isTyping)),
    socketService.onPresenceUpdate.listen((e) => presenceNotifier.setPresence(e.userId, e.status, e.lastSeenAt)),
    socketService.onConversationNew.listen(chatNotifier.upsertConversation),
  ];

  ref.onDispose(() {
    for (final subscription in subscriptions) {
      subscription.cancel();
    }
  });
});
