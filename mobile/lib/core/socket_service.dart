import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/env.dart';
import 'auth_session.dart';

/// Mirrors the RN app's `src/socket/socket.js` + the foreground-reconnect
/// half of `useSocket.js`: an idempotent connect keyed by the current access
/// token, plus forcing a fresh disconnect+connect whenever the app returns
/// to the foreground. On React Native a backgrounded WebSocket can report
/// `connected == true` while the underlying transport is already dead
/// (a "zombie" connection) — the same risk exists here, so resuming from
/// background always forces a real reconnect rather than trusting the
/// reported state or waiting on engine.io's ping-timeout detection.
class SocketService with WidgetsBindingObserver {
  final Ref _ref;
  io.Socket? _socket;
  String? _socketToken;

  SocketService(this._ref) {
    WidgetsBinding.instance.addObserver(this);
  }

  io.Socket? get socket => _socket;

  io.Socket? connect() {
    final accessToken = _ref.read(authSessionProvider).accessToken;
    if (accessToken == null) return null;

    if (_socket != null && _socketToken == accessToken) {
      return _socket;
    }

    _socket?.dispose();

    _socketToken = accessToken;
    final next = io.io(
      Env.apiOrigin,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': accessToken})
          .disableAutoConnect()
          .build(),
    );

    next.onConnect((_) => debugPrint('[socket] connected to ${Env.apiOrigin}'));
    next.onConnectError((err) => debugPrint('[socket] connect_error: $err'));
    next.onDisconnect((reason) => debugPrint('[socket] disconnected: $reason'));

    next.connect();
    _socket = next;
    return next;
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
    _socketToken = null;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;
    final current = _socket;
    if (current == null) return;
    current.disconnect();
    current.connect();
  }

  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    disconnect();
  }
}

final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService(ref);
  ref.onDispose(service.dispose);
  return service;
});
