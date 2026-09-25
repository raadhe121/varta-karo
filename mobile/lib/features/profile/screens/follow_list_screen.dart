import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/theme.dart';
import '../../../models/user.dart';
import '../data/social_api.dart';

enum FollowListType { followers, following }

/// Ports the web app's FollowListModal.jsx as its own screen.
class FollowListScreen extends ConsumerStatefulWidget {
  final String userId;
  final FollowListType type;

  const FollowListScreen({super.key, required this.userId, required this.type});

  @override
  ConsumerState<FollowListScreen> createState() => _FollowListScreenState();
}

class _FollowListScreenState extends ConsumerState<FollowListScreen> {
  List<AppUser>? _users;

  @override
  void initState() {
    super.initState();
    final api = ref.read(socialApiProvider);
    final future = widget.type == FollowListType.followers
        ? api.fetchFollowers(widget.userId)
        : api.fetchFollowing(widget.userId);
    future.then((users) {
      if (mounted) setState(() => _users = users);
    });
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.type == FollowListType.followers
        ? 'Followers'
        : 'Following';
    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: Text(title)),
        body: _users == null
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.accent),
              )
            : _users!.isEmpty
            ? Center(
                child: Text(
                  widget.type == FollowListType.followers
                      ? 'No followers yet.'
                      : 'Not following anyone yet.',
                  style: const TextStyle(color: AppColors.inkSoft),
                ),
              )
            : ListView.builder(
                itemCount: _users!.length,
                itemBuilder: (context, index) {
                  final user = _users![index];
                  return ListTile(
                    leading: Avatar(user: user, size: AvatarSize.sm),
                    title: Text(
                      user.name,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text('@${user.username}'),
                    onTap: () => context.push('/profile/${user.id}'),
                  );
                },
              ),
      ),
    );
  }
}
