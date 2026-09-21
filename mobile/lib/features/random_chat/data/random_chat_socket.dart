import 'dart:async';
import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../config/env.dart';

/// Partner identity from `random:matched` — a separate shape from AppUser
/// (models/user.dart) because a guest partner has no id/username/etc., only
/// a display name.
class RandomChatPartner {
  final bool isGuest;
  final String name;
  final String? userId;
  final String? avatarUrl;
  final String? avatarColor;

  const RandomChatPartner({
    required this.isGuest,
    required this.name,
    this.userId,
    this.avatarUrl,
    this.avatarColor,
  });

  factory RandomChatPartner.fromJson(Map<String, dynamic> json) => RandomChatPartner(
        isGuest: json['isGuest'] as bool? ?? false,
        name: json['name'] as String? ?? 'Stranger',
        userId: json['userId'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        avatarColor: json['avatarColor'] as String?,
      );
}

class RandomChatIncomingMessage {
  final String text;
  final String at;

  const RandomChatIncomingMessage({required this.text, required this.at});

  factory RandomChatIncomingMessage.fromJson(Map<String, dynamic> json) =>
      RandomChatIncomingMessage(text: json['text'] as String? ?? '', at: json['at'] as String? ?? '');
}

const _guestIdKey = 'vartakaro.guestId';

String _generateGuestId() {
  // No `uuid` package dependency — a random hex string in UUID-v4 shape is
  // enough here since it's only ever compared for equality, never parsed.
  final rand = Random.secure();
  String hex(int n) => List.generate(n, (_) => rand.nextInt(16).toRadixString(16)).join();
  return '${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + rand.nextInt(4)).toRadixString(16)}${hex(3)}-${hex(12)}';
}

/// Persists the guest identity across app restarts using the same
/// flutter_secure_storage already used by StorageService, kept under its
/// own key so this feature has no dependency on core/storage_service.dart.
Future<String> _readOrCreateGuestId(FlutterSecureStorage storage) async {
  final existing = await storage.read(key: _guestIdKey);
  if (existing != null && existing.isNotEmpty) return existing;
  final generated = _generateGuestId();
  await storage.write(key: _guestIdKey, value: generated);
  return generated;
}

/// Standalone socket connection to the `/random` namespace. Deliberately not
/// built on top of SocketService: that class owns the MAIN namespace, is
/// keyed on a logged-in JWT, and is used app-wide by chat/call/notifications
/// — random chat must work for guests who have no token at all, and must
/// not disturb the main socket's lifecycle.
class RandomChatSocket {
  io.Socket? _socket;

  final _waitingController = StreamController<void>.broadcast();
  final _matchedController = StreamController<RandomChatPartner>.broadcast();
  final _messageController = StreamController<RandomChatIncomingMessage>.broadcast();
  final _partnerLeftController = StreamController<String>.broadcast();
  final _requestSentController = StreamController<bool>.broadcast();
  final _pendingRequestController = StreamController<void>.broadcast();
  final _friendAddedController = StreamController<String?>.broadcast();
  final _errorController = StreamController<String>.broadcast();

  Stream<void> get onWaiting => _waitingController.stream;
  Stream<RandomChatPartner> get onMatched => _matchedController.stream;
  Stream<RandomChatIncomingMessage> get onMessage => _messageController.stream;
  Stream<String> get onPartnerLeft => _partnerLeftController.stream;
  Stream<bool> get onRequestSent => _requestSentController.stream;
  Stream<void> get onPendingRequest => _pendingRequestController.stream;
  Stream<String?> get onFriendAdded => _friendAddedController.stream;
  Stream<String> get onError => _errorController.stream;

  /// Connects using a JWT when logged in, otherwise a persisted guestId +
  /// optional display name — matches the two auth shapes random.js accepts.
  Future<void> connect({String? accessToken, String? guestName}) async {
    dispose();

    final Map<String, dynamic> auth;
    if (accessToken != null) {
      auth = {'token': accessToken};
    } else {
      final guestId = await _readOrCreateGuestId(const FlutterSecureStorage());
      auth = {'guestId': guestId, if (guestName != null && guestName.isNotEmpty) 'guestName': guestName};
    }

    final socket = io.io(
      '${Env.apiOrigin}/random',
      io.OptionBuilder().setTransports(['websocket']).setAuth(auth).disableAutoConnect().build(),
    );

    socket.on('random:waiting', (_) => _waitingController.add(null));
    socket.on('random:matched', (data) {
      final map = Map<String, dynamic>.from(data as Map);
      _matchedController.add(RandomChatPartner.fromJson(Map<String, dynamic>.from(map['partner'] as Map)));
    });
    socket.on('random:message', (data) {
      _messageController.add(RandomChatIncomingMessage.fromJson(Map<String, dynamic>.from(data as Map)));
    });
    socket.on('random:partner-left', (data) {
      final map = data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
      _partnerLeftController.add(map['reason'] as String? ?? 'left');
    });
    socket.on('random:request-sent', (data) {
      final map = Map<String, dynamic>.from(data as Map);
      _requestSentController.add(map['pending'] as bool? ?? false);
    });
    // No payload — random-chat identity is anonymous in both directions, so
    // the server deliberately doesn't say who's asking (it's always your
    // current partner, and there's only one).
    socket.on('random:pending-request', (_) => _pendingRequestController.add(null));
    socket.on('random:friend-added', (data) {
      final map = data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
      _friendAddedController.add(map['conversationId'] as String?);
    });
    socket.on('random:error', (data) {
      final map = data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
      _errorController.add(map['message'] as String? ?? 'Something went wrong');
    });

    socket.connect();
    _socket = socket;
  }

  void join() => _socket?.emit('random:join');

  void sendMessage(String text) => _socket?.emit('random:message', {'text': text});

  void next() => _socket?.emit('random:next');

  void leave() => _socket?.emit('random:leave');

  void sendFriendRequest() => _socket?.emit('random:send-request');

  void authenticate(String token) => _socket?.emit('random:authenticate', {'token': token});

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }

  void disposeStreams() {
    dispose();
    _waitingController.close();
    _matchedController.close();
    _messageController.close();
    _partnerLeftController.close();
    _requestSentController.close();
    _pendingRequestController.close();
    _friendAddedController.close();
    _errorController.close();
  }
}

final randomChatSocketProvider = Provider<RandomChatSocket>((ref) {
  final socket = RandomChatSocket();
  ref.onDispose(socket.disposeStreams);
  return socket;
});
