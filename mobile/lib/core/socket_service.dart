import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/env.dart';
import '../models/conversation.dart';
import '../models/message.dart';
import '../models/notification.dart';
import 'auth_session.dart';
import 'socket_events.dart';


class SocketService with WidgetsBindingObserver {
  final Ref _ref;
  io.Socket? _socket;
  String? _socketToken;

  // Broadcast streams survive reconnects (they live on this service, not on
  // the underlying io.Socket instance), so anything subscribed via
  // chatSocketBridgeProvider keeps working across a token change or a
  // foreground-triggered reconnect without having to re-subscribe.
  final _messageNewController = StreamController<ChatMessage>.broadcast();
  final _messageStatusController = StreamController<MessageStatusEvent>.broadcast();
  final _typingController = StreamController<TypingEvent>.broadcast();
  final _presenceController = StreamController<PresenceEvent>.broadcast();
  final _conversationNewController = StreamController<Conversation>.broadcast();
  final _notificationNewController = StreamController<AppNotification>.broadcast();
  final _callIncomingController = StreamController<CallIncomingEvent>.broadcast();
  final _callAnsweredController = StreamController<CallAnsweredEvent>.broadcast();
  final _callIceCandidateController = StreamController<CallIceCandidateEvent>.broadcast();
  final _callDeclinedController = StreamController<CallDeclinedEvent>.broadcast();
  final _callEndedController = StreamController<CallEndedEvent>.broadcast();
  final _callUnavailableController = StreamController<CallUnavailableEvent>.broadcast();
  final _callCancelRingController = StreamController<CallCancelRingEvent>.broadcast();

  Stream<ChatMessage> get onMessageNew => _messageNewController.stream;
  Stream<MessageStatusEvent> get onMessageStatus => _messageStatusController.stream;
  Stream<TypingEvent> get onTypingUpdate => _typingController.stream;
  Stream<PresenceEvent> get onPresenceUpdate => _presenceController.stream;
  Stream<Conversation> get onConversationNew => _conversationNewController.stream;
  Stream<AppNotification> get onNotificationNew => _notificationNewController.stream;
  Stream<CallIncomingEvent> get onCallIncoming => _callIncomingController.stream;
  Stream<CallAnsweredEvent> get onCallAnswered => _callAnsweredController.stream;
  Stream<CallIceCandidateEvent> get onCallIceCandidate => _callIceCandidateController.stream;
  Stream<CallDeclinedEvent> get onCallDeclined => _callDeclinedController.stream;
  Stream<CallEndedEvent> get onCallEnded => _callEndedController.stream;
  Stream<CallUnavailableEvent> get onCallUnavailable => _callUnavailableController.stream;
  Stream<CallCancelRingEvent> get onCallCancelRing => _callCancelRingController.stream;

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
    _registerChatListeners(next);
    _registerNotificationListeners(next);
    _registerCallListeners(next);

    next.connect();
    _socket = next;
    return next;
  }

  /// Mirrors the RN app's `useSocket.js` chat wiring (message:new,
  /// message:status, typing:update, presence:update, conversation:new) —
  /// re-emitted as broadcast streams instead of directly touching Riverpod
  /// state here, so this file stays feature-agnostic (features/chat owns
  /// the state it feeds).
  void _registerChatListeners(io.Socket socket) {
    socket.on('message:new', (data) {
      try {
        _messageNewController.add(ChatMessage.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad message:new payload: $err');
      }
    });
    socket.on('message:status', (data) {
      try {
        _messageStatusController.add(MessageStatusEvent.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad message:status payload: $err');
      }
    });
    socket.on('typing:update', (data) {
      try {
        _typingController.add(TypingEvent.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad typing:update payload: $err');
      }
    });
    socket.on('presence:update', (data) {
      try {
        _presenceController.add(PresenceEvent.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad presence:update payload: $err');
      }
    });
    socket.on('conversation:new', (data) {
      try {
        _conversationNewController.add(Conversation.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad conversation:new payload: $err');
      }
    });
  }

  /// Mirrors the web app's `useSocket.js` `notification:new` wiring — the
  /// payload shape (notification.service.js's createNotification) matches
  /// AppNotification exactly, so it's parsed straight into that model rather
  /// than a separate event class (same choice as `_conversationNewController`
  /// above).
  void _registerNotificationListeners(io.Socket socket) {
    socket.on('notification:new', (data) {
      try {
        _notificationNewController.add(AppNotification.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad notification:new payload: $err');
      }
    });
  }

  /// Mirrors the RN app's `src/call/webrtc.js` signaling wiring — re-emitted
  /// as broadcast streams for the same reason as `_registerChatListeners`
  /// (features/call owns the state machine, not this file). Note
  /// `call:ice-candidate` is both an outbound emit name (see
  /// emitCallIceCandidate) and an inbound event name — the server relays it
  /// under the same name with `toUserId` swapped for `fromUserId`.
  void _registerCallListeners(io.Socket socket) {
    socket.on('call:incoming', (data) {
      try {
        _callIncomingController.add(CallIncomingEvent.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad call:incoming payload: $err');
      }
    });
    socket.on('call:answered', (data) {
      try {
        _callAnsweredController.add(CallAnsweredEvent.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad call:answered payload: $err');
      }
    });
    socket.on('call:ice-candidate', (data) {
      try {
        _callIceCandidateController.add(CallIceCandidateEvent.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad call:ice-candidate payload: $err');
      }
    });
    socket.on('call:declined', (data) {
      try {
        _callDeclinedController.add(CallDeclinedEvent.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad call:declined payload: $err');
      }
    });
    socket.on('call:ended', (data) {
      try {
        _callEndedController.add(CallEndedEvent.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad call:ended payload: $err');
      }
    });
    socket.on('call:unavailable', (data) {
      try {
        _callUnavailableController.add(CallUnavailableEvent.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad call:unavailable payload: $err');
      }
    });
    socket.on('call:cancel-ring', (data) {
      try {
        _callCancelRingController.add(CallCancelRingEvent.fromJson(Map<String, dynamic>.from(data as Map)));
      } catch (err) {
        debugPrint('[socket] bad call:cancel-ring payload: $err');
      }
    });
  }

  /// Emits `call:invite` — matches webrtc.js's startCall(). Fire-and-forget:
  /// the callee's response arrives later as one of onCallAnswered /
  /// onCallDeclined / onCallUnavailable.
  void emitCallInvite({
    required String toUserId,
    required String conversationId,
    required String callType,
    required Map<String, dynamic> offer,
  }) {
    _socket?.emit('call:invite', {
      'toUserId': toUserId,
      'conversationId': conversationId,
      'callType': callType,
      'offer': offer,
    });
  }

  /// Emits `call:answer` — matches webrtc.js's acceptCall().
  void emitCallAnswer({required String toUserId, required Map<String, dynamic> answer}) {
    _socket?.emit('call:answer', {'toUserId': toUserId, 'answer': answer});
  }

  /// Emits `call:ice-candidate` for the peer connection's onicecandidate.
  void emitCallIceCandidate({required String toUserId, required Map<String, dynamic> candidate}) {
    _socket?.emit('call:ice-candidate', {'toUserId': toUserId, 'candidate': candidate});
  }

  /// Emits `call:decline`.
  void emitCallDecline(String toUserId) {
    _socket?.emit('call:decline', {'toUserId': toUserId});
  }

  /// Emits `call:end`.
  void emitCallEnd(String toUserId) {
    _socket?.emit('call:end', {'toUserId': toUserId});
  }

  /// Fire-and-forget: emits `typing:start`/`typing:stop`, matching
  /// MessageInput.jsx's emitTyping().
  void emitTyping(String conversationId, bool isTyping) {
    _socket?.emit(isTyping ? 'typing:start' : 'typing:stop', {'conversationId': conversationId});
  }

  /// Fire-and-forget: emits `message:read`, matching MessageList.jsx.
  void emitMessageRead(String conversationId, String messageId) {
    _socket?.emit('message:read', {'conversationId': conversationId, 'messageId': messageId});
  }

  /// Emits `message:send` and waits for the server's ack, matching
  /// MessageInput.jsx's send(). Sending is socket-only server-side — see
  /// server/src/socket/handlers/message.handler.js — there is no REST
  /// equivalent.
  Future<ChatMessage> sendMessage(Map<String, dynamic> payload) async {
    final socket = _socket;
    if (socket == null) {
      throw StateError('Cannot send a message while disconnected');
    }
    final res = await socket.emitWithAckAsync('message:send', payload);
    if (res is Map && res['error'] != null) {
      throw Exception(res['error'].toString());
    }
    if (res is Map && res['message'] is Map) {
      return ChatMessage.fromJson(Map<String, dynamic>.from(res['message'] as Map));
    }
    throw Exception('message:send: unexpected ack response');
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
    _messageNewController.close();
    _messageStatusController.close();
    _typingController.close();
    _presenceController.close();
    _conversationNewController.close();
    _notificationNewController.close();
    _callIncomingController.close();
    _callAnsweredController.close();
    _callIceCandidateController.close();
    _callDeclinedController.close();
    _callEndedController.close();
    _callUnavailableController.close();
    _callCancelRingController.close();
  }
}

final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService(ref);
  ref.onDispose(service.dispose);
  return service;
});
