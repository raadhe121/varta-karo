import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../common/widgets/avatar.dart';
import '../../../config/theme.dart';
import '../../../models/user.dart';
import '../../profile/data/social_api.dart';

/// Ports `client/src/components/social/SuggestionsSidebar.jsx` as an
/// in-feed card — mobile has no room for a persistent sidebar, so this sits
/// inline near the top of the feed instead.
class SuggestionsCard extends ConsumerStatefulWidget {
  const SuggestionsCard({super.key});

  @override
  ConsumerState<SuggestionsCard> createState() => _SuggestionsCardState();
}

class _SuggestionsCardState extends ConsumerState<SuggestionsCard> {
  List<Suggestion>? _people;
  final Set<String> _following = {};

  @override
  void initState() {
    super.initState();
    ref.read(socialApiProvider).fetchSuggestions().then((people) {
      if (mounted) setState(() => _people = people);
    });
  }

  Future<void> _follow(String userId) async {
    setState(() => _following.add(userId));
    try {
      await ref.read(socialApiProvider).followUser(userId);
    } catch (_) {
      if (mounted) setState(() => _following.remove(userId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final visible = (_people ?? const []).where((p) => !_following.contains(p.user.id)).toList();

    if (_people != null && visible.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.paper,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('People You May Know', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 10),
          if (_people == null)
            const Text('Loading...', style: TextStyle(fontSize: 12, color: AppColors.inkSoft))
          else
            for (final suggestion in visible) _SuggestionTile(suggestion: suggestion, onFollow: () => _follow(suggestion.user.id)),
        ],
      ),
    );
  }
}

class _SuggestionTile extends StatelessWidget {
  final Suggestion suggestion;
  final VoidCallback onFollow;

  const _SuggestionTile({required this.suggestion, required this.onFollow});

  @override
  Widget build(BuildContext context) {
    final user = suggestion.user;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.push('/profile/${user.id}'),
            child: Avatar(user: user, size: AvatarSize.sm),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: () => context.push('/profile/${user.id}'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(user.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                  Text(suggestion.note, style: const TextStyle(fontSize: 11, color: AppColors.inkSoft), overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ),
          TextButton(
            onPressed: onFollow,
            style: TextButton.styleFrom(
              backgroundColor: AppColors.accent,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Follow', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}
