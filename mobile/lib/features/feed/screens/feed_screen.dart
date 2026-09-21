import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../providers/feed_actions.dart';
import '../providers/feed_provider.dart';
import '../providers/stories_actions.dart';
import '../widgets/post_card.dart';
import '../widgets/stories_row.dart';

/// Ports `src/pages/FeedPage.jsx`: stories row, composer entry point,
/// paginated post list. The desktop-only sidebars (ProfileSummaryCard,
/// ActiveFriends) don't have a mobile equivalent — left out.
class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  bool _loadingMore = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  // Used for both the initial load and pull-to-refresh — refreshing relies
  // on feedProvider's `loaded` flag staying true across the call so
  // RefreshIndicator's own spinner shows instead of blanking the list.
  Future<void> _load() async {
    await Future.wait([
      ref.read(feedActionsProvider).loadFeed(),
      ref.read(storiesActionsProvider).loadFeed(),
    ]);
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !ref.read(feedProvider).hasMore) return;
    setState(() => _loadingMore = true);
    try {
      await ref.read(feedActionsProvider).loadMore();
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final posts = ref.watch(feedProvider.select((s) => s.posts));
    final hasMore = ref.watch(feedProvider.select((s) => s.hasMore));
    final loaded = ref.watch(feedProvider.select((s) => s.loaded));

    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const Text('Feed'),
          actions: [
            IconButton(
              icon: const Icon(Icons.add_box_outlined),
              onPressed: () => context.push('/feed/create-post'),
            ),
          ],
        ),
        body: !loaded
            ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
            : RefreshIndicator(
                onRefresh: _load,
                child: NotificationListener<ScrollNotification>(
                  onNotification: (notification) {
                    final metrics = notification.metrics;
                    if (metrics.axis == Axis.vertical && metrics.pixels >= metrics.maxScrollExtent - 200) {
                      _loadMore();
                    }
                    return false;
                  },
                  child: ListView(
                    padding: const EdgeInsets.only(top: 12, bottom: 24),
                    children: [
                      const StoriesRow(),
                      const SizedBox(height: 12),
                      if (posts.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 48),
                          child: Center(
                            child: Text(
                              'No posts yet. Friend or follow someone, or share your first post.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: AppColors.inkSoft),
                            ),
                          ),
                        )
                      else ...[
                        for (final post in posts) PostCard(key: ValueKey(post.id), post: post),
                        if (hasMore)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            child: Center(
                              child: _loadingMore
                                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                                  : TextButton(onPressed: _loadMore, child: const Text('Load more')),
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
