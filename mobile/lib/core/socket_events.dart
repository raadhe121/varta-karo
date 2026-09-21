import '../models/user.dart';

/// Small payload classes for the chat- and call-related socket events
/// SocketService re-broadcasts as streams. Kept separate from the full
/// domain models (lib/models/) since these are transient event shapes, not
/// persisted resources.
class MessageStatusEvent {
  final String conversationId;
  final String messageId;
  final String userId;
  final String status;

  const MessageStatusEvent({
    required this.conversationId,
    required this.messageId,
    required this.userId,
    required this.status,
  });

  factory MessageStatusEvent.fromJson(Map<String, dynamic> json) => MessageStatusEvent(
        conversationId: json['conversationId'] as String,
        messageId: json['messageId'] as String,
        userId: json['userId'] as String,
        status: json['status'] as String,
      );
}

class TypingEvent {
  final String conversationId;
  final String userId;
  final bool isTyping;

  const TypingEvent({required this.conversationId, required this.userId, required this.isTyping});

  factory TypingEvent.fromJson(Map<String, dynamic> json) => TypingEvent(
        conversationId: json['conversationId'] as String,
        userId: json['userId'] as String,
        isTyping: json['isTyping'] as bool? ?? false,
      );
}

class PresenceEvent {
  final String userId;
  final String status;
  final DateTime? lastSeenAt;

  const PresenceEvent({required this.userId, required this.status, this.lastSeenAt});

  factory PresenceEvent.fromJson(Map<String, dynamic> json) => PresenceEvent(
        userId: json['userId'] as String,
        status: json['status'] as String,
        lastSeenAt: json['lastSeenAt'] != null ? DateTime.tryParse(json['lastSeenAt'] as String) : null,
      );
}

/// `call:incoming` — server's push to the callee in response to a peer's
/// `call:invite` (see server/src/socket/handlers/call.handler.js). `offer`
/// is kept as a raw {sdp, type} map rather than an RTCSessionDescription so
/// this file stays free of a flutter_webrtc dependency; callers turn it into
/// one (see features/call/services/webrtc_service.dart).
class CallIncomingEvent {
  final String fromUserId;
  final AppUser fromUser;
  final String conversationId;
  final String callType;
  final Map<String, dynamic> offer;

  const CallIncomingEvent({
    required this.fromUserId,
    required this.fromUser,
    required this.conversationId,
    required this.callType,
    required this.offer,
  });

  factory CallIncomingEvent.fromJson(Map<String, dynamic> json) => CallIncomingEvent(
        fromUserId: json['fromUserId'] as String,
        fromUser: AppUser.fromJson(Map<String, dynamic>.from(json['fromUser'] as Map)),
        conversationId: json['conversationId'] as String,
        callType: json['callType'] as String? ?? 'audio',
        offer: Map<String, dynamic>.from(json['offer'] as Map),
      );
}

/// `call:answered` — the callee's answer, relayed back to the caller.
class CallAnsweredEvent {
  final String fromUserId;
  final Map<String, dynamic> answer;

  const CallAnsweredEvent({required this.fromUserId, required this.answer});

  factory CallAnsweredEvent.fromJson(Map<String, dynamic> json) => CallAnsweredEvent(
        fromUserId: json['fromUserId'] as String,
        answer: Map<String, dynamic>.from(json['answer'] as Map),
      );
}

/// `call:ice-candidate` — same event name both ways (see SocketService):
/// emitted as `{toUserId, candidate}` and received as `{fromUserId,
/// candidate}`.
class CallIceCandidateEvent {
  final String fromUserId;
  final Map<String, dynamic> candidate;

  const CallIceCandidateEvent({required this.fromUserId, required this.candidate});

  factory CallIceCandidateEvent.fromJson(Map<String, dynamic> json) => CallIceCandidateEvent(
        fromUserId: json['fromUserId'] as String,
        candidate: Map<String, dynamic>.from(json['candidate'] as Map),
      );
}

/// `call:declined`.
class CallDeclinedEvent {
  final String fromUserId;

  const CallDeclinedEvent({required this.fromUserId});

  factory CallDeclinedEvent.fromJson(Map<String, dynamic> json) =>
      CallDeclinedEvent(fromUserId: json['fromUserId'] as String);
}

/// `call:ended`.
class CallEndedEvent {
  final String fromUserId;

  const CallEndedEvent({required this.fromUserId});

  factory CallEndedEvent.fromJson(Map<String, dynamic> json) =>
      CallEndedEvent(fromUserId: json['fromUserId'] as String);
}

/// `call:unavailable` — sent back to the caller only, when the callee isn't
/// online at all (see call.handler.js's `isOnline` check).
class CallUnavailableEvent {
  final String toUserId;
  final String conversationId;

  const CallUnavailableEvent({required this.toUserId, required this.conversationId});

  factory CallUnavailableEvent.fromJson(Map<String, dynamic> json) => CallUnavailableEvent(
        toUserId: json['toUserId'] as String,
        conversationId: json['conversationId'] as String,
      );
}

/// `call:cancel-ring` — sent to the *other* sockets of whichever user just
/// answered or declined, so a second signed-in device (e.g. web + mobile)
/// stops ringing too.
class CallCancelRingEvent {
  final String fromUserId;

  const CallCancelRingEvent({required this.fromUserId});

  factory CallCancelRingEvent.fromJson(Map<String, dynamic> json) =>
      CallCancelRingEvent(fromUserId: json['fromUserId'] as String);
}
