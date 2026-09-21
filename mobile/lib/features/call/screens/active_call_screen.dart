import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import '../../../common/widgets/avatar.dart';
import '../../../config/theme.dart';
import '../providers/call_actions.dart';
import '../providers/call_provider.dart';
import '../widgets/incoming_call_sheet.dart';

/// The `/call` route target, pushed by CallActions whenever a call starts
/// (outgoing or incoming) and popped once it ends — see
/// CallActions._openCallScreen/_closeCallScreenIfOpen. Dispatches purely on
/// phase: incoming shows the accept/decline sheet, everything else shows
/// the in-call UI. `canPop: false` blocks the system back gesture from
/// dismissing a live call — CallActions still closes this route
/// programmatically (via GoRouter.pop(), which bypasses PopScope) once the
/// call actually ends.
class CallScreen extends ConsumerWidget {
  const CallScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phase = ref.watch(callProvider.select((s) => s.phase));

    return PopScope(
      canPop: false,
      child: switch (phase) {
        CallPhase.ringingIncoming => const IncomingCallSheet(),
        CallPhase.idle => const ColoredBox(color: AppColors.ink),
        _ => const ActiveCallScreen(),
      },
    );
  }
}

/// In-call UI for ringing-outgoing/connecting/active — ports
/// ActiveCallOverlay.jsx. Full-screen remote video with a local PiP for
/// video calls; an avatar + duration timer for voice calls.
class ActiveCallScreen extends ConsumerStatefulWidget {
  const ActiveCallScreen({super.key});

  @override
  ConsumerState<ActiveCallScreen> createState() => _ActiveCallScreenState();
}

class _ActiveCallScreenState extends ConsumerState<ActiveCallScreen> {
  Timer? _ticker;
  Duration _elapsed = Duration.zero;

  void _syncTicker(DateTime? startedAt) {
    if (startedAt == null) {
      _ticker?.cancel();
      _ticker = null;
      return;
    }
    _ticker ??= Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsed = DateTime.now().difference(startedAt));
    });
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(callProvider);
    final actions = ref.read(callActionsProvider);
    final webrtc = ref.read(webrtcServiceProvider);
    _syncTicker(state.startedAt);

    final isVideo = state.isVideo;
    final remoteUser = state.remoteUser;
    final statusText = switch (state.phase) {
      CallPhase.ringingOutgoing => 'Ringing...',
      CallPhase.connecting => 'Connecting...',
      _ => _formatDuration(_elapsed),
    };

    return Scaffold(
      backgroundColor: AppColors.ink,
      body: Stack(
        children: [
          Positioned.fill(
            child: isVideo
                ? RTCVideoView(
                    webrtc.remoteRenderer,
                    objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                    placeholderBuilder: (context) => Center(child: Avatar(user: remoteUser, size: AvatarSize.lg)),
                  )
                : Center(child: Avatar(user: remoteUser, size: AvatarSize.lg)),
          ),
          Positioned(
            top: 24,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Text(
                  remoteUser?.name ?? '',
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(statusText, style: const TextStyle(color: Colors.white70, fontSize: 13)),
              ],
            ),
          ),
          if (isVideo)
            Positioned(
              bottom: 130,
              right: 20,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: Container(
                  width: 100,
                  height: 140,
                  color: Colors.black,
                  child: RTCVideoView(
                    webrtc.localRenderer,
                    mirror: true,
                    objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                  ),
                ),
              ),
            ),
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _ControlButton(
                  icon: state.muted ? Icons.mic_off : Icons.mic,
                  active: state.muted,
                  onPressed: actions.toggleMute,
                ),
                if (isVideo)
                  _ControlButton(
                    icon: state.cameraOff ? Icons.videocam_off : Icons.videocam,
                    active: state.cameraOff,
                    onPressed: actions.toggleCamera,
                  ),
                if (isVideo)
                  _ControlButton(
                    icon: Icons.cameraswitch,
                    onPressed: () => actions.switchCamera(),
                  ),
                _ControlButton(
                  icon: state.speakerOn ? Icons.volume_up : Icons.hearing,
                  active: state.speakerOn,
                  onPressed: () => actions.toggleSpeaker(),
                ),
                _ControlButton(
                  icon: Icons.call_end,
                  color: AppColors.danger,
                  onPressed: () => actions.endCall(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final bool active;
  final Color? color;
  final VoidCallback onPressed;

  const _ControlButton({required this.icon, this.active = false, this.color, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    final background = color ?? (active ? Colors.white : Colors.white24);
    final foreground = color != null ? Colors.white : (active ? AppColors.ink : Colors.white);
    return InkWell(
      onTap: onPressed,
      customBorder: const CircleBorder(),
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(color: background, shape: BoxShape.circle),
        child: Icon(icon, color: foreground, size: 22),
      ),
    );
  }
}
