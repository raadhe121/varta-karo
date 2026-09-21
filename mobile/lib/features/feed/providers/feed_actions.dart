import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/post.dart';
import '../data/posts_api.dart';
import 'feed_provider.dart';

/// The "actions" layer on top of feedProvider — equivalent of the web app's
/// posts.api.js calls plus FeedPage.jsx/PostCard.jsx's imperative bits.
class FeedActions {
  final Ref _ref;

  FeedActions(this._ref);

  Future<void> loadFeed() async {
    final posts = await _ref.read(postsApiProvider).fetchFeed();
    _ref.read(feedProvider.notifier).setPosts(posts, hasMore: posts.length >= feedPageSize);
  }

  Future<void> loadMore() async {
    final existing = _ref.read(feedProvider).posts;
    if (existing.isEmpty) return;
    final older = await _ref.read(postsApiProvider).fetchFeed(before: existing.last.createdAt);
    _ref.read(feedProvider.notifier).appendPosts(older, hasMore: older.length >= feedPageSize);
  }

  Future<Post> createPost({String? content, String? imageUrl, String? mediaType, String visibility = 'public'}) async {
    final post = await _ref.read(postsApiProvider).createPost(
          content: content,
          imageUrl: imageUrl,
          mediaType: mediaType,
          visibility: visibility,
        );
    _ref.read(feedProvider.notifier).prependPost(post);
    return post;
  }

  /// Optimistically flips like state/count before the request resolves,
  /// then reconciles with the server's response; reverts on failure.
  Future<void> toggleLike(Post post) async {
    final notifier = _ref.read(feedProvider.notifier);
    final optimisticLiked = !post.likedByMe;
    final optimisticCount = post.likeCount + (optimisticLiked ? 1 : -1);
    notifier.updatePost(post.id, (p) => p.copyWith(likedByMe: optimisticLiked, likeCount: optimisticCount));
    try {
      final result = await _ref.read(postsApiProvider).toggleLike(post.id);
      notifier.updatePost(post.id, (p) => p.copyWith(likedByMe: result.liked, likeCount: result.likeCount));
    } catch (_) {
      notifier.updatePost(post.id, (p) => p.copyWith(likedByMe: post.likedByMe, likeCount: post.likeCount));
      rethrow;
    }
  }

  Future<List<PostComment>> loadComments(String postId) => _ref.read(postsApiProvider).fetchComments(postId);

  Future<PostComment> addComment(String postId, String content) async {
    final comment = await _ref.read(postsApiProvider).addComment(postId, content);
    _ref.read(feedProvider.notifier).updatePost(postId, (p) => p.copyWith(commentCount: p.commentCount + 1));
    return comment;
  }

  Future<void> deletePost(String postId) async {
    await _ref.read(postsApiProvider).deletePost(postId);
    _ref.read(feedProvider.notifier).removePost(postId);
  }
}

final feedActionsProvider = Provider<FeedActions>((ref) => FeedActions(ref));
