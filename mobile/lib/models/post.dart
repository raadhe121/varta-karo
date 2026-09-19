import 'user.dart';

class Post {
  final String id;
  final AppUser author;
  final String? content;
  final String? imageUrl;
  final String? mediaType; // 'image' | 'video' | null
  final String visibility; // 'public' | 'friends' | 'only_me'
  final int likeCount;
  final bool likedByMe;
  final int commentCount;
  final DateTime createdAt;

  const Post({
    required this.id,
    required this.author,
    this.content,
    this.imageUrl,
    this.mediaType,
    this.visibility = 'public',
    this.likeCount = 0,
    this.likedByMe = false,
    this.commentCount = 0,
    required this.createdAt,
  });

  factory Post.fromJson(Map<String, dynamic> json) => Post(
        id: json['id'] as String,
        author: AppUser.fromJson(json['author'] as Map<String, dynamic>),
        content: json['content'] as String?,
        imageUrl: json['imageUrl'] as String?,
        mediaType: json['mediaType'] as String?,
        visibility: json['visibility'] as String? ?? 'public',
        likeCount: json['likeCount'] as int? ?? 0,
        likedByMe: json['likedByMe'] as bool? ?? false,
        commentCount: json['commentCount'] as int? ?? 0,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  Post copyWith({int? likeCount, bool? likedByMe, int? commentCount}) => Post(
        id: id,
        author: author,
        content: content,
        imageUrl: imageUrl,
        mediaType: mediaType,
        visibility: visibility,
        likeCount: likeCount ?? this.likeCount,
        likedByMe: likedByMe ?? this.likedByMe,
        commentCount: commentCount ?? this.commentCount,
        createdAt: createdAt,
      );
}

class PostComment {
  final String id;
  final String content;
  final AppUser author;
  final DateTime createdAt;

  const PostComment({required this.id, required this.content, required this.author, required this.createdAt});

  factory PostComment.fromJson(Map<String, dynamic> json) => PostComment(
        id: json['id'] as String,
        content: json['content'] as String,
        author: AppUser.fromJson(json['author'] as Map<String, dynamic>),
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
