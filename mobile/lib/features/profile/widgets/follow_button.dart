import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../common/widgets/app_button.dart';
import '../../../models/profile.dart';
import '../data/social_api.dart';

/// Ports `src/components/social/FollowButton.js`.
class FollowButton extends ConsumerStatefulWidget {
  final UserProfile profile;
  final VoidCallback? onChange;

  const FollowButton({super.key, required this.profile, this.onChange});

  @override
  ConsumerState<FollowButton> createState() => _FollowButtonState();
}

class _FollowButtonState extends ConsumerState<FollowButton> {
  bool _loading = false;

  Future<void> _toggle() async {
    setState(() => _loading = true);
    final api = ref.read(socialApiProvider);
    try {
      if (widget.profile.isFollowing) {
        await api.unfollowUser(widget.profile.id);
      } else {
        await api.followUser(widget.profile.id);
      }
      widget.onChange?.call();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final following = widget.profile.isFollowing;
    return AppButton(
      label: following ? 'Following' : 'Follow',
      variant: following ? AppButtonVariant.outline : AppButtonVariant.primary,
      loading: _loading,
      onPressed: _loading ? null : _toggle,
    );
  }
}
