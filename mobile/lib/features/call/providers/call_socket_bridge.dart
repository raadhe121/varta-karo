import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/socket_service.dart';
import 'call_actions.dart';

/// Bridges SocketService's call:* broadcast streams into CallActions — the
/// call-feature equivalent of chat_socket_bridge.dart. Meant to be watched
/// exactly once from `_MainShell` (see routing/app_router.dart) alongside
/// chatSocketBridgeProvider, so an incoming call surfaces (as a pushed
/// `/call` route — see CallActions._openCallScreen) no matter which tab is
/// active when `call:incoming` arrives.
final callSocketBridgeProvider = Provider<void>((ref) {
  final socketService = ref.read(socketServiceProvider);
  final callActions = ref.read(callActionsProvider);

  final subscriptions = <StreamSubscription>[
    socketService.onCallIncoming.listen(callActions.handleIncomingInvite),
    socketService.onCallAnswered.listen(callActions.handleAnswered),
    socketService.onCallIceCandidate.listen(callActions.handleRemoteIceCandidate),
    socketService.onCallDeclined.listen((_) => callActions.handleRemoteDeclined()),
    socketService.onCallEnded.listen((_) => callActions.handleRemoteEnded()),
    socketService.onCallUnavailable.listen((_) => callActions.handleUnavailable()),
    socketService.onCallCancelRing.listen((_) => callActions.handleCancelRing()),
  ];

  ref.onDispose(() {
    for (final subscription in subscriptions) {
      subscription.cancel();
    }
  });
});
