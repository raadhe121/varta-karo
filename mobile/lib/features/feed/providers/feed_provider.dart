import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/post.dart';

class FeedState {
  final List<Post> posts;
  final bool loaded;
  final bool hasMore;

  const FeedState({this.posts = const [], this.loaded = false, this.hasMore = true});

  FeedState copyWith({List<Post>? posts, bool? loaded, bool? hasMore}) => FeedState(
        posts: posts ?? this.posts,
        loaded: loaded ?? this.loaded,
        hasMore: hasMore ?? this.hasMore,
      );
}

/// Pure feed state — fed by FeedActions (REST). Kept separate from
/// per-request loading flags, which live as local State in FeedScreen, same
/// split as chatProvider/ChatScreen's `_loadingInitial`/`_loadingMore`.
class FeedNotifier extends Notifier<FeedState> {
  @override
  FeedState build() => const FeedState();

  void setPosts(List<Post> posts, {required bool hasMore}) {
    state = state.copyWith(posts: posts, loaded: true, hasMore: hasMore);
  }

  void appendPosts(List<Post> older, {required bool hasMore}) {
    state = state.copyWith(posts: [...state.posts, ...older], hasMore: hasMore);
  }

  void prependPost(Post post) {
    state = state.copyWith(posts: [post, ...state.posts]);
  }

  void updatePost(String postId, Post Function(Post) update) {
    state = state.copyWith(posts: state.posts.map((p) => p.id == postId ? update(p) : p).toList());
  }

  void removePost(String postId) {
    state = state.copyWith(posts: state.posts.where((p) => p.id != postId).toList());
  }
}

final feedProvider = NotifierProvider<FeedNotifier, FeedState>(FeedNotifier.new);
