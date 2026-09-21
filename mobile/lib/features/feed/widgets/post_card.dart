import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/avatar.dart';
import '../../../config/env.dart';
import '../../../config/theme.dart';
import '../../../core/auth_session.dart';
import '../../../models/post.dart';
import '../providers/feed_actions.dart';
import 'post_video_player.dart';

const _visibilityLabel = {'public': 'Public', 'friends': 'Friends', 'only_me': 'Only me'};

String _timeAgo(DateTime date) {
  final diffMin = DateTime.now().difference(date).inMinutes;
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return '${diffMin}m ago';
  final hours = diffMin ~/ 60;
  if (hours < 24) return '${hours}h ago';
  return '${hours ~/ 24}d ago';
}

/// Ports `src/components/social/PostCard.jsx`'s card body as an edge-to-edge,
/// Instagram-style post: full-width square media, no card chrome, and a
/// double-tap-to-like heart burst over the image.
class PostCard extends ConsumerWidget {
  final Post post;

  const PostCard({super.key, required this.post});

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete post?'),
        content: const Text('This can\'t be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(feedActionsProvider).deletePost(post.id);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isMine = post.author.id == ref.watch(authSessionProvider).userId;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => context.push('/profile/${post.author.id}'),
                  child: Row(
                    children: [
                      Avatar(user: post.author, size: AvatarSize.sm),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(post.author.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                            Text(
                              '${_timeAgo(post.createdAt)} · ${_visibilityLabel[post.visibility] ?? post.visibility}',
                              style: const TextStyle(fontSize: 12, color: AppColors.inkSoft),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (isMine)
                IconButton(
                  icon: const Icon(Icons.more_vert, color: AppColors.inkSoft),
                  visualDensity: VisualDensity.compact,
                  tooltip: 'More',
                  onPressed: () => _confirmDelete(context, ref),
                ),
            ],
          ),
        ),
        if (post.content != null && post.content!.isNotEmpty && post.imageUrl == null)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
            child: Text(post.content!, style: const TextStyle(fontSize: 14)),
          ),
        if (post.imageUrl != null)
          _DoubleTapLikeMedia(
            post: post,
            onDoubleTapLike: () {
              if (!post.likedByMe) ref.read(feedActionsProvider).toggleLike(post);
            },
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(10, 6, 10, 4),
          child: Row(
            children: [
              _ActionButton(
                icon: post.likedByMe ? Icons.favorite : Icons.favorite_border,
                color: post.likedByMe ? AppColors.accent : AppColors.ink,
                onTap: () => ref.read(feedActionsProvider).toggleLike(post),
              ),
              const SizedBox(width: 6),
              _ActionButton(
                icon: Icons.mode_comment_outlined,
                color: AppColors.ink,
                onTap: () => context.push('/feed/post/${post.id}/comments'),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 4),
          child: Text(
            post.likeCount > 0 ? '${post.likeCount} ${post.likeCount == 1 ? 'like' : 'likes'}' : 'Be the first to like this',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
          ),
        ),
        if (post.content != null && post.content!.isNotEmpty && post.imageUrl != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 2),
            child: RichText(
              text: TextSpan(
                style: const TextStyle(fontSize: 14, color: AppColors.ink),
                children: [
                  TextSpan(text: '${post.author.name} ', style: const TextStyle(fontWeight: FontWeight.w700)),
                  TextSpan(text: post.content!),
                ],
              ),
            ),
          ),
        if (post.commentCount > 0)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 4, 14, 0),
            child: GestureDetector(
              onTap: () => context.push('/feed/post/${post.id}/comments'),
              child: Text(
                'View all ${post.commentCount} comments',
                style: const TextStyle(fontSize: 13, color: AppColors.inkSoft),
              ),
            ),
          ),
        const SizedBox(height: 14),
        const Divider(height: 1, color: AppColors.line),
      ],
    );
  }
}

class _DoubleTapLikeMedia extends StatefulWidget {
  final Post post;
  final VoidCallback onDoubleTapLike;

  const _DoubleTapLikeMedia({required this.post, required this.onDoubleTapLike});

  @override
  State<_DoubleTapLikeMedia> createState() => _DoubleTapLikeMediaState();
}

class _DoubleTapLikeMediaState extends State<_DoubleTapLikeMedia> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 500),
  );
  late final Animation<double> _scale = TweenSequence([
    TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.2).chain(CurveTween(curve: Curves.easeOut)), weight: 40),
    TweenSequenceItem(tween: Tween(begin: 1.2, end: 1.0).chain(CurveTween(curve: Curves.easeIn)), weight: 20),
    TweenSequenceItem(tween: ConstantTween(1.0), weight: 20),
    TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0).chain(CurveTween(curve: Curves.easeIn)), weight: 20),
  ]).animate(_controller);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDoubleTap() {
    widget.onDoubleTapLike();
    _controller.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    return GestureDetector(
      onDoubleTap: _onDoubleTap,
      child: Stack(
        alignment: Alignment.center,
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: post.mediaType == 'video'
                ? PostVideoPlayer(url: Env.resolveMediaUrl(post.imageUrl))
                : CachedNetworkImage(
                    imageUrl: Env.resolveMediaUrl(post.imageUrl),
                    fit: BoxFit.cover,
                    width: double.infinity,
                  ),
          ),
          ScaleTransition(
            scale: _scale,
            child: const Icon(Icons.favorite, color: Colors.white, size: 96, shadows: [Shadow(blurRadius: 12, color: Colors.black38)]),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.full),
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Icon(icon, size: 26, color: color),
      ),
    );
  }
}
