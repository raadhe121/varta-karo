import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../common/widgets/avatar.dart';
import '../../../config/theme.dart';
import '../providers/call_actions.dart';
import '../providers/call_provider.dart';

/// Full-screen incoming-call UI — ports IncomingCallModal.jsx. Ringing
/// vibration is started/stopped by CallActions around this screen's
/// lifetime (on `call:incoming` / accept / decline / cancel), not here.
class IncomingCallSheet extends ConsumerWidget {
  const IncomingCallSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(callProvider);
    final remoteUser = state.remoteUser;

    return Scaffold(
      backgroundColor: AppColors.ink,
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(flex: 2),
            Avatar(user: remoteUser, size: AvatarSize.lg),
            const SizedBox(height: 16),
            Text(
              remoteUser?.name ?? '',
              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            Text(
              'Incoming ${state.isVideo ? 'video' : 'voice'} call...',
              style: const TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const Spacer(flex: 3),
            Padding(
              padding: const EdgeInsets.only(bottom: 48),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _CallButton(
                    icon: Icons.call_end,
                    color: AppColors.danger,
                    label: 'Decline',
                    onPressed: () => ref.read(callActionsProvider).declineCall(),
                  ),
                  _CallButton(
                    icon: Icons.call,
                    color: AppColors.success,
                    label: 'Accept',
                    onPressed: () => ref.read(callActionsProvider).answerCall(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CallButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onPressed;

  const _CallButton({required this.icon, required this.color, required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: onPressed,
          customBorder: const CircleBorder(),
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            child: Icon(icon, color: Colors.white, size: 28),
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
      ],
    );
  }
}
