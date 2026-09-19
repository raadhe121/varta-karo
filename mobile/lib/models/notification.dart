import 'user.dart';

/// type is one of: friend_request, friend_accepted, follow, contact_request,
/// contact_accepted, like, comment.
class AppNotification {
  final String id;
  final String type;
  final String? postId;
  final String? postSummary;
  final bool read;
  final DateTime createdAt;
  final AppUser actor;

  const AppNotification({
    required this.id,
    required this.type,
    this.postId,
    this.postSummary,
    this.read = false,
    required this.createdAt,
    required this.actor,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'] as String,
        type: json['type'] as String,
        postId: json['postId'] as String?,
        postSummary: json['postSummary'] as String?,
        read: json['read'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String),
        actor: AppUser.fromJson(json['actor'] as Map<String, dynamic>),
      );

  AppNotification markRead() => AppNotification(
        id: id,
        type: type,
        postId: postId,
        postSummary: postSummary,
        read: true,
        createdAt: createdAt,
        actor: actor,
      );
}
