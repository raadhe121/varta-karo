import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../common/widgets/app_button.dart';
import '../../../models/profile.dart';
import '../data/social_api.dart';

/// Ports `src/components/social/FriendButton.js`.
class FriendButton extends ConsumerStatefulWidget {
  final UserProfile profile;
  final VoidCallback? onChange;

  const FriendButton({super.key, required this.profile, this.onChange});

  @override
  ConsumerState<FriendButton> createState() => _FriendButtonState();
}

class _FriendButtonState extends ConsumerState<FriendButton> {
  bool _loading = false;

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _loading = true);
    try {
      await action();
      widget.onChange?.call();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.profile;
    final api = ref.read(socialApiProvider);

    if (profile.isFriend) {
      return const AppButton(label: 'Friends ✓', onPressed: null, variant: AppButtonVariant.outline);
    }

    final pending = profile.hasPendingFriendRequest;
    if (pending?.direction == 'outgoing') {
      return const AppButton(label: 'Request sent', onPressed: null, variant: AppButtonVariant.outline);
    }

    if (pending?.direction == 'incoming') {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Expanded(
            child: AppButton(
              label: 'Accept',
              loading: _loading,
              onPressed: _loading ? null : () => _run(() => api.acceptFriendRequest(pending!.id)),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: AppButton(
              label: 'Decline',
              variant: AppButtonVariant.outline,
              onPressed: _loading ? null : () => _run(() => api.declineFriendRequest(pending!.id)),
            ),
          ),
        ],
      );
    }

    return AppButton(
      label: 'Add Friend',
      loading: _loading,
      onPressed: _loading ? null : () => _run(() => api.sendFriendRequest(profile.id)),
    );
  }
}
