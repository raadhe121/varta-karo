import 'user.dart';

/// Shared shape for both ContactRequest and FriendRequest rows returned by
/// POST /contacts/request/:userId, POST /friends/request/:userId, and their
/// accept/decline responses: {id, requesterId, addresseeId, status, ...}.
class SocialRequest {
  final String id;
  final String requesterId;
  final String addresseeId;
  final String status;

  const SocialRequest({
    required this.id,
    required this.requesterId,
    required this.addresseeId,
    required this.status,
  });

  factory SocialRequest.fromJson(Map<String, dynamic> json) => SocialRequest(
        id: json['id'] as String,
        requesterId: json['requesterId'] as String,
        addresseeId: json['addresseeId'] as String,
        status: json['status'] as String,
      );
}

/// The {id, createdAt, requester} shape used by the incoming-requests lists
/// for both contacts and friends.
class IncomingRequest {
  final String id;
  final DateTime createdAt;
  final AppUser requester;

  const IncomingRequest({required this.id, required this.createdAt, required this.requester});

  factory IncomingRequest.fromJson(Map<String, dynamic> json) => IncomingRequest(
        id: json['id'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        requester: AppUser.fromJson(json['requester'] as Map<String, dynamic>),
      );
}

/// {id, direction} on UserProfile.hasPendingFriendRequest.
class PendingFriendRequest {
  final String id;
  final String direction; // 'outgoing' | 'incoming'

  const PendingFriendRequest({required this.id, required this.direction});

  factory PendingFriendRequest.fromJson(Map<String, dynamic> json) =>
      PendingFriendRequest(id: json['id'] as String, direction: json['direction'] as String);
}
