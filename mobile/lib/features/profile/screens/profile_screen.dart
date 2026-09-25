import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../common/widgets/app_button.dart';
import '../../../common/widgets/avatar.dart';
import '../../../common/widgets/screen.dart';
import '../../../config/env.dart';
import '../../../config/theme.dart';
import '../../../core/auth_session.dart';
import '../../../models/post.dart';
import '../../../models/profile.dart';
import '../../auth/providers/auth_provider.dart';
import '../../chat/providers/chat_actions.dart';
import '../../feed/data/posts_api.dart';
import '../data/block_api.dart';
import '../data/social_api.dart';
import '../widgets/activity_log.dart';
import '../widgets/follow_button.dart';
import 'follow_list_screen.dart';

enum _ProfileTab { posts, media, activity }

/// Ports `src/screens/profile/ProfileScreen.js`: posts/media/(activity)
/// tabs, cover+avatar header, About card, friend/follow actions.
///
/// Deviation from the RN app: RN refetches on every screen *focus* via
/// `useFocusEffect` (React Navigation keeps every screen instance around).
/// go_router's StatefulShellRoute also keeps this screen's Navigator alive
/// across tab switches, so refetch-on-focus isn't available the same way —
/// this fetches once on mount instead and offers pull-to-refresh.
class ProfileScreen extends ConsumerStatefulWidget {
  final String? userId;

  const ProfileScreen({super.key, this.userId});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  UserProfile? _profile;
  List<Post>? _posts;
  _ProfileTab _tab = _ProfileTab.posts;
  bool _loadingPosts = false;

  String get _targetId =>
      widget.userId ?? ref.read(authSessionProvider).userId!;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final profile = await ref.read(socialApiProvider).fetchProfile(_targetId);
    if (!mounted) return;
    setState(() => _profile = profile);
    await _loadPosts();
  }

  Future<void> _loadPosts() async {
    setState(() => _loadingPosts = true);
    try {
      final posts = await ref.read(postsApiProvider).fetchUserPosts(_targetId);
      if (mounted) setState(() => _posts = posts);
    } finally {
      if (mounted) setState(() => _loadingPosts = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = _profile;

    return Screen(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('Profile')),
        body: profile == null
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.accent),
              )
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    _Header(profile: profile, onChange: _load),
                    _StatsRow(profile: profile, userId: _targetId),
                    _AboutCard(about: profile.about),
                    _TabBarRow(
                      tab: _tab,
                      showActivity: profile.isSelf,
                      onSelect: (t) => setState(() => _tab = t),
                    ),
                    const SizedBox(height: 8),
                    _TabContent(
                      tab: _tab,
                      posts: _posts,
                      loading: _loadingPosts,
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
      ),
    );
  }
}

class _Header extends ConsumerStatefulWidget {
  final UserProfile profile;
  final VoidCallback onChange;

  const _Header({required this.profile, required this.onChange});

  @override
  ConsumerState<_Header> createState() => _HeaderState();
}

class _HeaderState extends ConsumerState<_Header> {
  bool _startingChat = false;

  Future<void> _startChat() async {
    setState(() => _startingChat = true);
    try {
      final conversation = await ref
          .read(chatActionsProvider)
          .startDirectConversation(widget.profile.id);
      if (mounted) context.push('/chat/${conversation.id}');
    } finally {
      if (mounted) setState(() => _startingChat = false);
    }
  }

  Future<void> _toggleBlock() async {
    final api = ref.read(blockApiProvider);
    if (widget.profile.isBlocked) {
      await api.unblockUser(widget.profile.id);
    } else {
      await api.blockUser(widget.profile.id);
    }
    widget.onChange();
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.profile;
    final onChange = widget.onChange;
    final myId = ref.watch(authSessionProvider).userId;
    final isSelf = profile.isSelf || profile.id == myId;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 140,
          width: double.infinity,
          color: AppColors.paperSoft,
          child: profile.coverPhotoUrl != null
              ? CachedNetworkImage(
                  imageUrl: Env.resolveMediaUrl(profile.coverPhotoUrl),
                  fit: BoxFit.cover,
                )
              : null,
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Transform.translate(
            offset: const Offset(0, -32),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Avatar(user: profile.asUser(), size: AvatarSize.lg),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          profile.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          '@${profile.username}',
                          style: const TextStyle(
                            color: AppColors.inkSoft,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: isSelf
                      ? AppButton(
                          label: 'Edit profile',
                          variant: AppButtonVariant.outline,
                          onPressed: () => context.push('/profile/edit'),
                        )
                      : profile.blockedByOther
                      ? const SizedBox.shrink()
                      : Row(
                          children: [
                            FollowButton(profile: profile, onChange: onChange),
                            if (profile.isMutual) ...[
                              const SizedBox(width: 8),
                              AppButton(
                                label: 'Chat',
                                loading: _startingChat,
                                onPressed: _startingChat ? null : _startChat,
                              ),
                            ],
                            const SizedBox(width: 4),
                            PopupMenuButton<String>(
                              icon: const Icon(
                                Icons.more_vert,
                                color: AppColors.inkSoft,
                              ),
                              onSelected: (value) {
                                if (value == 'block') _toggleBlock();
                              },
                              itemBuilder: (context) => [
                                PopupMenuItem(
                                  value: 'block',
                                  child: Text(
                                    profile.isBlocked ? 'Unblock' : 'Block',
                                    style: const TextStyle(
                                      color: AppColors.danger,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ),
        if (profile.bio != null && profile.bio!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(profile.bio!, style: const TextStyle(fontSize: 14)),
          ),
        if (isSelf)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: () => ref.read(authActionsProvider).logout(),
                child: const Text(
                  'Log out',
                  style: TextStyle(color: AppColors.danger),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _StatsRow extends StatelessWidget {
  final UserProfile profile;
  final String userId;

  const _StatsRow({required this.profile, required this.userId});

  @override
  Widget build(BuildContext context) {
    // Followers/following are only browsable for your own profile or once
    // you're mutually followed — same gate as the web app's ProfilePage.
    final canSeeLists = profile.isSelf || profile.isMutual;

    Widget stat(String label, int value, FollowListType type) {
      final child = Column(
        children: [
          Text(
            '$value',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppColors.inkSoft),
          ),
        ],
      );
      if (!canSeeLists) return child;
      return InkWell(
        borderRadius: BorderRadius.circular(AppRadius.sm),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => FollowListScreen(userId: userId, type: type),
          ),
        ),
        child: Padding(padding: const EdgeInsets.all(4), child: child),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          stat('Followers', profile.followerCount, FollowListType.followers),
          stat('Following', profile.followingCount, FollowListType.following),
        ],
      ),
    );
  }
}

class _AboutCard extends StatelessWidget {
  final AboutInfo? about;

  const _AboutCard({required this.about});

  @override
  Widget build(BuildContext context) {
    Widget card(Widget child) => Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.paper,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.line),
      ),
      child: child,
    );

    if (about == null) {
      return card(
        const Text(
          "This person's info is private.",
          style: TextStyle(color: AppColors.inkSoft),
        ),
      );
    }
    if (about!.isEmpty) {
      return card(
        const Text(
          'Nothing added yet.',
          style: TextStyle(color: AppColors.inkSoft),
        ),
      );
    }

    return card(
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (about!.work != null) Text('💼 ${about!.work}'),
          if (about!.education != null) Text('🎓 ${about!.education}'),
          if (about!.location != null) Text('📍 ${about!.location}'),
          for (final link in about!.links)
            InkWell(
              onTap: () => launchUrl(
                Uri.parse(link.url),
                mode: LaunchMode.externalApplication,
              ),
              child: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '🔗 ${link.label}',
                  style: const TextStyle(color: AppColors.accent),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _TabBarRow extends StatelessWidget {
  final _ProfileTab tab;
  final bool showActivity;
  final ValueChanged<_ProfileTab> onSelect;

  const _TabBarRow({
    required this.tab,
    required this.showActivity,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    Widget chip(String label, _ProfileTab value) {
      final active = tab == value;
      return Padding(
        padding: const EdgeInsets.only(right: 8),
        child: ChoiceChip(
          label: Text(label),
          selected: active,
          onSelected: (_) => onSelect(value),
          selectedColor: AppColors.accentSoft,
          labelStyle: TextStyle(
            color: active ? AppColors.accent : AppColors.inkSoft,
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          chip('Posts', _ProfileTab.posts),
          chip('Media', _ProfileTab.media),
          if (showActivity) chip('Activity', _ProfileTab.activity),
        ],
      ),
    );
  }
}

class _TabContent extends StatelessWidget {
  final _ProfileTab tab;
  final List<Post>? posts;
  final bool loading;

  const _TabContent({
    required this.tab,
    required this.posts,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    if (tab == _ProfileTab.activity) {
      return const ActivityLog();
    }

    if (loading && posts == null) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    final items = posts ?? [];
    if (tab == _ProfileTab.media) {
      final media = items.where((p) => p.imageUrl != null).toList();
      if (media.isEmpty) {
        return const Padding(
          padding: EdgeInsets.all(24),
          child: Center(
            child: Text(
              'No media yet.',
              style: TextStyle(color: AppColors.inkSoft),
            ),
          ),
        );
      }
      return GridView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 4,
          mainAxisSpacing: 4,
        ),
        itemCount: media.length,
        itemBuilder: (context, i) => ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          child: CachedNetworkImage(
            imageUrl: Env.resolveMediaUrl(media[i].imageUrl),
            fit: BoxFit.cover,
          ),
        ),
      );
    }

    if (items.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(
          child: Text(
            'No posts yet.',
            style: TextStyle(color: AppColors.inkSoft),
          ),
        ),
      );
    }

    return Column(
      children: items
          .map(
            (post) => Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.paper,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.line),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (post.content != null) Text(post.content!),
                  if (post.imageUrl != null) ...[
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                      child: CachedNetworkImage(
                        imageUrl: Env.resolveMediaUrl(post.imageUrl),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}
