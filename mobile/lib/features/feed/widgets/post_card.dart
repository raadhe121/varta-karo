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

/// Ports `src/components/social/PostCard.jsx`'s card body.
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

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.paper,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
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
                            Text(post.author.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
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
                  icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.inkSoft),
                  visualDensity: VisualDensity.compact,
                  tooltip: 'Delete',
                  onPressed: () => _confirmDelete(context, ref),
                ),
            ],
          ),
          if (post.content != null && post.content!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(post.content!, style: const TextStyle(fontSize: 14)),
          ],
          if (post.imageUrl != null) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.md),
              child: post.mediaType == 'video'
                  ? PostVideoPlayer(url: Env.resolveMediaUrl(post.imageUrl))
                  : CachedNetworkImage(
                      imageUrl: Env.resolveMediaUrl(post.imageUrl),
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: 260,
                    ),
            ),
          ],
          const SizedBox(height: 10),
          const Divider(height: 1, color: AppColors.line),
          const SizedBox(height: 8),
          Row(
            children: [
              _ActionButton(
                icon: post.likedByMe ? Icons.favorite : Icons.favorite_border,
                color: post.likedByMe ? AppColors.accent : AppColors.inkSoft,
                label: post.likeCount > 0 ? '${post.likeCount}' : null,
                onTap: () => ref.read(feedActionsProvider).toggleLike(post),
              ),
              const SizedBox(width: 20),
              _ActionButton(
                icon: Icons.mode_comment_outlined,
                color: AppColors.inkSoft,
                label: post.commentCount > 0 ? '${post.commentCount}' : null,
                onTap: () => context.push('/feed/post/${post.id}/comments'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String? label;
  final VoidCallback onTap;

  const _ActionButton({required this.icon, required this.color, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.sm),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: color),
            if (label != null) ...[
              const SizedBox(width: 6),
              Text(label!, style: TextStyle(fontSize: 13, color: color, fontWeight: FontWeight.w600)),
            ],
          ],
        ),
      ),
    );
  }
}
