import 'social_request.dart';
import 'user.dart';

class AboutInfo {
  final String? work;
  final String? education;
  final String? location;
  final List<UserLink> links;

  const AboutInfo({this.work, this.education, this.location, this.links = const []});

  bool get isEmpty => work == null && education == null && location == null && links.isEmpty;

  factory AboutInfo.fromJson(Map<String, dynamic> json) => AboutInfo(
        work: json['work'] as String?,
        education: json['education'] as String?,
        location: json['location'] as String?,
        links:
            (json['links'] as List<dynamic>?)?.map((e) => UserLink.fromJson(e as Map<String, dynamic>)).toList() ??
                const [],
      );
}

/// GET /users/:id/profile response — the rich, relationship-aware profile
/// shape, distinct from the plain AppUser returned by most other endpoints.
class UserProfile {
  final String id;
  final String name;
  final String username;
  final String? avatarUrl;
  final String? avatarColor;
  final String? coverPhotoUrl;
  final String? bio;
  final String status;
  final DateTime? lastSeenAt;
  final bool isSelf;
  final bool isFriend;
  final bool isFollowing;
  final PendingFriendRequest? hasPendingFriendRequest;
  final int friendCount;
  final int followerCount;
  final int followingCount;
  final String? profileVisibility;
  final AboutInfo? about;

  const UserProfile({
    required this.id,
    required this.name,
    required this.username,
    this.avatarUrl,
    this.avatarColor,
    this.coverPhotoUrl,
    this.bio,
    this.status = 'offline',
    this.lastSeenAt,
    this.isSelf = false,
    this.isFriend = false,
    this.isFollowing = false,
    this.hasPendingFriendRequest,
    this.friendCount = 0,
    this.followerCount = 0,
    this.followingCount = 0,
    this.profileVisibility,
    this.about,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        username: json['username'] as String? ?? '',
        avatarUrl: json['avatarUrl'] as String?,
        avatarColor: json['avatarColor'] as String?,
        coverPhotoUrl: json['coverPhotoUrl'] as String?,
        bio: json['bio'] as String?,
        status: json['status'] as String? ?? 'offline',
        lastSeenAt: json['lastSeenAt'] != null ? DateTime.tryParse(json['lastSeenAt'] as String) : null,
        isSelf: json['isSelf'] as bool? ?? false,
        isFriend: json['isFriend'] as bool? ?? false,
        isFollowing: json['isFollowing'] as bool? ?? false,
        hasPendingFriendRequest: json['hasPendingFriendRequest'] != null
            ? PendingFriendRequest.fromJson(json['hasPendingFriendRequest'] as Map<String, dynamic>)
            : null,
        friendCount: json['friendCount'] as int? ?? 0,
        followerCount: json['followerCount'] as int? ?? 0,
        followingCount: json['followingCount'] as int? ?? 0,
        profileVisibility: json['profileVisibility'] as String?,
        about: json['about'] != null ? AboutInfo.fromJson(json['about'] as Map<String, dynamic>) : null,
      );

  /// AsUser is handy where a widget (e.g. Avatar) expects a plain AppUser.
  AppUser asUser() => AppUser(
        id: id,
        name: name,
        username: username,
        avatarUrl: avatarUrl,
        avatarColor: avatarColor ?? '#C77D2E',
        bio: bio,
        status: status,
        lastSeenAt: lastSeenAt,
        coverPhotoUrl: coverPhotoUrl,
      );
}

class ActivityItem {
  final String type; // 'post' | 'like' | 'comment'
  final DateTime createdAt;
  final String summary;
  final String? postId;

  const ActivityItem({required this.type, required this.createdAt, required this.summary, this.postId});

  factory ActivityItem.fromJson(Map<String, dynamic> json) => ActivityItem(
        type: json['type'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        summary: json['summary'] as String,
        postId: json['postId'] as String?,
      );
}
