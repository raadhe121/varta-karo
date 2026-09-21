import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/avatar.dart';
import '../../../config/theme.dart';
import '../../../core/auth_session.dart';
import '../../../models/user.dart';
import '../providers/stories_provider.dart';

/// Ports `src/components/social/StoriesRow.jsx`. Tapping "Your story" opens
/// the viewer if you already have an active story, otherwise goes straight
/// to the composer (matching StoriesRow.jsx's `handleAvatarClick`); the "+"
/// badge always opens the composer.
class StoriesRow extends ConsumerWidget {
  const StoriesRow({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myId = ref.watch(authSessionProvider).userId;
    final groups = ref.watch(storiesProvider.select((s) => s.groups));
    final myGroup = groups.where((g) => g.author.id == myId).firstOrNull;
    final others = groups.where((g) => g.author.id != myId).toList();
    final myUserJson = ref.watch(authSessionProvider).user;
    final myUser = myGroup?.author ?? (myUserJson != null ? AppUser.fromJson(myUserJson) : null);

    return SizedBox(
      height: 92,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          _StoryAvatar(
            label: 'Your story',
            avatarUser: myUser,
            ringed: myGroup != null,
            allSeen: false,
            showAddBadge: true,
            onTap: () => myGroup != null ? context.push('/feed/story/$myId') : context.push('/feed/story/new'),
            onAddTap: () => context.push('/feed/story/new'),
          ),
          for (final g in others)
            _StoryAvatar(
              label: g.author.name.split(' ').first,
              avatarUser: g.author,
              ringed: true,
              allSeen: g.allSeen,
              showAddBadge: false,
              onTap: () => context.push('/feed/story/${g.author.id}'),
            ),
        ],
      ),
    );
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}

class _StoryAvatar extends StatelessWidget {
  final String label;
  final AppUser? avatarUser;
  final bool ringed;
  final bool allSeen;
  final bool showAddBadge;
  final VoidCallback onTap;
  final VoidCallback? onAddTap;

  const _StoryAvatar({
    required this.label,
    required this.avatarUser,
    required this.ringed,
    required this.allSeen,
    required this.showAddBadge,
    required this.onTap,
    this.onAddTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 68,
      child: Column(
        children: [
          GestureDetector(
            onTap: onTap,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: EdgeInsets.all(ringed ? 2.5 : 0),
                  decoration: !ringed
                      ? null
                      : BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: allSeen
                              ? null
                              : const LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [Color(0xFFF6A93B), Color(0xFFC1652F)],
                                ),
                          border: allSeen ? Border.all(color: AppColors.line, width: 2) : null,
                        ),
                  child: !ringed
                      ? Avatar(user: avatarUser, size: AvatarSize.md)
                      : Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.page),
                          child: Avatar(user: avatarUser, size: AvatarSize.md),
                        ),
                ),
                if (showAddBadge)
                  Positioned(
                    bottom: -2,
                    right: -2,
                    child: GestureDetector(
                      onTap: onAddTap,
                      child: Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.accent,
                          border: Border.all(color: AppColors.paper, width: 2),
                        ),
                        child: const Icon(Icons.add, size: 12, color: Colors.white),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 11, color: AppColors.inkSoft),
          ),
        ],
      ),
    );
  }
}
