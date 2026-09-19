import 'user.dart';

class Story {
  final String id;
  final String authorId;
  final String mediaUrl;
  final String mediaType; // 'image' | 'video'
  final String? caption;
  final DateTime createdAt;
  final DateTime expiresAt;
  final bool viewedByMe;
  final AppUser? author;

  const Story({
    required this.id,
    required this.authorId,
    required this.mediaUrl,
    this.mediaType = 'image',
    this.caption,
    required this.createdAt,
    required this.expiresAt,
    this.viewedByMe = false,
    this.author,
  });

  bool get isVideo => mediaType == 'video';

  factory Story.fromJson(Map<String, dynamic> json) => Story(
        id: json['id'] as String,
        authorId: json['authorId'] as String,
        mediaUrl: json['mediaUrl'] as String,
        mediaType: json['mediaType'] as String? ?? 'image',
        caption: json['caption'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        expiresAt: DateTime.parse(json['expiresAt'] as String),
        viewedByMe: json['viewedByMe'] as bool? ?? false,
        author: json['author'] != null ? AppUser.fromJson(json['author'] as Map<String, dynamic>) : null,
      );
}

class StoryGroup {
  final AppUser author;
  final List<Story> stories;

  const StoryGroup({required this.author, required this.stories});

  bool get allSeen => stories.every((s) => s.viewedByMe);

  factory StoryGroup.fromJson(Map<String, dynamic> json) => StoryGroup(
        author: AppUser.fromJson(json['author'] as Map<String, dynamic>),
        stories: (json['stories'] as List<dynamic>? ?? []).map((e) => Story.fromJson(e as Map<String, dynamic>)).toList(),
      );
}

class StoryViewerEntry {
  final AppUser user;
  final DateTime viewedAt;

  const StoryViewerEntry({required this.user, required this.viewedAt});

  factory StoryViewerEntry.fromJson(Map<String, dynamic> json) => StoryViewerEntry(
        user: AppUser.fromJson(json),
        viewedAt: DateTime.parse(json['viewedAt'] as String),
      );
}
