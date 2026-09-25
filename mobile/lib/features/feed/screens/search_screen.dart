import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/avatar.dart';
import '../../../config/env.dart';
import '../../../config/theme.dart';
import '../../../models/post.dart';
import '../../../models/user.dart';
import '../../profile/data/social_api.dart';
import '../data/posts_api.dart';

/// Ports the explore-grid-then-search-results screen: an empty query shows a
/// discovery grid of recent public posts (closest thing this backend has to
/// an "explore" feed); typing switches to a live user search.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;

  List<Post>? _explore;
  List<AppUser>? _results;
  bool _searching = false;

  @override
  void initState() {
    super.initState();
    ref.read(postsApiProvider).fetchFeed().then((posts) {
      if (mounted) setState(() => _explore = posts);
    });
    _controller.addListener(_onChanged);
  }

  @override
  void dispose() {
    _controller.removeListener(_onChanged);
    _controller.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged() {
    final query = _controller.text.trim();
    _debounce?.cancel();
    if (query.isEmpty) {
      setState(() {
        _results = null;
        _searching = false;
      });
      return;
    }
    setState(() => _searching = true);
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      final results = await ref.read(socialApiProvider).searchUsers(query);
      if (mounted && _controller.text.trim() == query) {
        setState(() {
          _results = results;
          _searching = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isSearching = _controller.text.trim().isNotEmpty;

    return SafeArea(
      child: Scaffold(
        backgroundColor: AppColors.page,
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => context.pop(),
                  ),
                  Expanded(
                    child: Container(
                      height: 40,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppColors.paperSoft,
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.search,
                            size: 18,
                            color: AppColors.inkSoft,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _controller,
                              autofocus: true,
                              decoration: const InputDecoration(
                                hintText: 'Search',
                                border: InputBorder.none,
                                isDense: true,
                              ),
                            ),
                          ),
                          if (_controller.text.isNotEmpty)
                            GestureDetector(
                              onTap: () => _controller.clear(),
                              child: const Icon(
                                Icons.close,
                                size: 18,
                                color: AppColors.inkSoft,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: isSearching ? _buildResults() : _buildExplore()),
          ],
        ),
      ),
    );
  }

  Widget _buildResults() {
    if (_searching && _results == null) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.accent),
      );
    }
    final results = _results ?? [];
    if (results.isEmpty) {
      return const Center(
        child: Text(
          'No people found.',
          style: TextStyle(color: AppColors.inkSoft),
        ),
      );
    }
    return ListView.builder(
      itemCount: results.length,
      itemBuilder: (context, index) {
        final user = results[index];
        return ListTile(
          leading: Avatar(user: user, size: AvatarSize.md),
          title: Text(
            user.username,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          subtitle: Text(user.name),
          onTap: () => context.push('/profile/${user.id}'),
        );
      },
    );
  }

  Widget _buildExplore() {
    if (_explore == null) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.accent),
      );
    }
    final posts = _explore!.where((p) => p.imageUrl != null).toList();
    if (posts.isEmpty) {
      return const Center(
        child: Text(
          'Nothing to explore yet.',
          style: TextStyle(color: AppColors.inkSoft),
        ),
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: posts.length,
      itemBuilder: (context, index) {
        final post = posts[index];
        return GestureDetector(
          onTap: () => context.push('/feed/post/${post.id}/comments'),
          child: Stack(
            fit: StackFit.expand,
            children: [
              post.mediaType == 'video'
                  ? Container(color: AppColors.ink)
                  : CachedNetworkImage(
                      imageUrl: Env.resolveMediaUrl(post.imageUrl),
                      fit: BoxFit.cover,
                    ),
              if (post.mediaType == 'video')
                const Center(
                  child: Icon(
                    Icons.play_circle_fill,
                    color: Colors.white70,
                    size: 28,
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
