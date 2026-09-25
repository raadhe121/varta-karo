import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth_session.dart';
import '../../../features/auth/data/auth_api.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../data/random_chat_socket.dart';
import 'random_chat_provider.dart';

/// The "actions" layer over randomChatProvider — owns the RandomChatSocket
/// subscriptions and turns its events into state changes, mirroring
/// ChatActions' split between socket wiring and provider state.
class RandomChatActions {
  final Ref _ref;
  final List<StreamSubscription> _subs = [];
  bool _wired = false;

  RandomChatActions(this._ref);

  RandomChatSocket get _socket => _ref.read(randomChatSocketProvider);

  Future<void> connect() async {
    final session = _ref.read(authSessionProvider);
    await _socket.connect(
      accessToken: session.isAuthenticated ? session.accessToken : null,
      guestName: session.user?['name'] as String?,
    );
    _wireOnce();
  }

  void _wireOnce() {
    if (_wired) return;
    _wired = true;
    final notifier = _ref.read(randomChatProvider.notifier);

    _subs.add(_socket.onWaiting.listen((_) => notifier.setWaiting()));
    _subs.add(_socket.onMatched.listen(notifier.setMatched));
    _subs.add(
      _socket.onMessage.listen(
        (m) => notifier.addIncomingMessage(m.text, m.at),
      ),
    );
    _subs.add(
      _socket.onPartnerLeft.listen(
        (_) => notifier.chatEnded(RandomChatEndedBy.partner),
      ),
    );
    _subs.add(_socket.onRequestSent.listen(notifier.setRequestState));
    _subs.add(
      _socket.onPendingRequest.listen((_) => notifier.setPendingRequest()),
    );
    _subs.add(_socket.onFriendAdded.listen(notifier.setFriendAdded));
    _subs.add(_socket.onError.listen(notifier.setError));
  }

  void findStranger() => _socket.join();

  void sendMessage(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;
    _socket.sendMessage(trimmed);
    _ref.read(randomChatProvider.notifier).addOwnMessage(trimmed);
  }

  void next() {
    _ref.read(randomChatProvider.notifier).backToWaiting();
    _socket.next();
  }

  /// Ends the current pairing but keeps the socket connected — the screen
  /// shows a shared "chat ended" state (matching what the partner sees) with
  /// the option to start a new chat, rather than closing outright.
  void leave() {
    _socket.leave();
    _ref.read(randomChatProvider.notifier).chatEnded(RandomChatEndedBy.self);
  }

  /// Fully closes the session (e.g. from the "ended" screen, or Cancel while
  /// waiting) back to idle.
  void close() {
    _socket.leave();
    _ref.read(randomChatProvider.notifier).reset();
  }

  void sendFriendRequest() => _socket.sendFriendRequest();

  /// Logs the guest in for real (REST call + the same session/storage/main-
  /// socket wiring AuthActions.login does — they genuinely now have an
  /// account session app-wide, not just within this screen), then upgrades
  /// the still-connected random socket in place via `random:authenticate`
  /// so the chat isn't interrupted.
  Future<void> authenticateAsGuest({
    required String identifier,
    required String password,
  }) async {
    final data = await _ref
        .read(authApiProvider)
        .login(identifier: identifier, password: password);
    await _ref.read(authActionsProvider).applyExternalAuth(data);
    _socket.authenticate(data['accessToken'] as String);
  }

  void dispose() {
    for (final sub in _subs) {
      sub.cancel();
    }
    _subs.clear();
    _wired = false;
    _socket.dispose();
  }
}

final randomChatActionsProvider = Provider<RandomChatActions>((ref) {
  final actions = RandomChatActions(ref);
  ref.onDispose(actions.dispose);
  return actions;
});
