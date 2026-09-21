import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../models/post.dart';

/// Backend's default feed/user-posts page size (post.controller.js's
/// `limit = 20` query default) — used to infer `hasMore` client-side.
const feedPageSize = 20;

/// Mirrors the RN app's `src/api/posts.api.js`.
class PostsApi {
  final Dio _dio;

  PostsApi(this._dio);

  Future<List<Post>> fetchUserPosts(String userId, {DateTime? before, int limit = feedPageSize}) async {
    final res = await _dio.get<List<dynamic>>('/users/$userId/posts', queryParameters: {
      if (before != null) 'before': before.toIso8601String(),
      'limit': limit,
    });
    return res.data!.map((e) => Post.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Post>> fetchFeed({DateTime? before, int limit = feedPageSize}) async {
    final res = await _dio.get<List<dynamic>>('/posts/feed', queryParameters: {
      if (before != null) 'before': before.toIso8601String(),
      'limit': limit,
    });
    return res.data!.map((e) => Post.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// `imageUrl`/`mediaType` come from a prior `MediaApi.upload` call — the
  /// backend only stores one media item per post (see Post.js), so there's
  /// no multi-attachment variant.
  Future<Post> createPost({
    String? content,
    String? imageUrl,
    String? mediaType,
    String visibility = 'public',
  }) async {
    final res = await _dio.post<Map<String, dynamic>>('/posts', data: {
      'content': ?content,
      'imageUrl': ?imageUrl,
      'mediaType': ?mediaType,
      'visibility': visibility,
    });
    return Post.fromJson(res.data!);
  }

  /// The backend has one toggle endpoint (not separate like/unlike) —
  /// returns the resulting `{liked, likeCount}` so the caller can reconcile
  /// its optimistic update with the server's actual state.
  Future<({bool liked, int likeCount})> toggleLike(String postId) async {
    final res = await _dio.post<Map<String, dynamic>>('/posts/$postId/like');
    return (liked: res.data!['liked'] as bool, likeCount: res.data!['likeCount'] as int);
  }

  Future<List<PostComment>> fetchComments(String postId) async {
    final res = await _dio.get<List<dynamic>>('/posts/$postId/comments');
    return res.data!.map((e) => PostComment.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<PostComment> addComment(String postId, String content) async {
    final res = await _dio.post<Map<String, dynamic>>('/posts/$postId/comments', data: {'content': content});
    return PostComment.fromJson(res.data!);
  }

  Future<void> deletePost(String postId) => _dio.delete('/posts/$postId');
}

final postsApiProvider = Provider<PostsApi>((ref) => PostsApi(ref.read(dioProvider)));
