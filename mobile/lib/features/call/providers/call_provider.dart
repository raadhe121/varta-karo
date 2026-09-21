import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/user.dart';

/// Mirrors the web app's `callStore.js` phases, plus an explicit
/// `connecting` step (the brief window between "answer/offer sent" and the
/// server's ack arriving) that callStore.js doesn't need since it flips
/// straight to `connected` optimistically.
enum CallPhase { idle, ringingOutgoing, ringingIncoming, connecting, active }

class CallState {
  final CallPhase phase;
  final String? role; // 'caller' | 'callee'
  final String callType; // 'audio' | 'video'
  final String? conversationId;
  final String? remoteUserId;
  final AppUser? remoteUser;
  final DateTime? startedAt;
  final bool muted;
  final bool cameraOff;
  final bool speakerOn;
  final String? error;

  const CallState({
    this.phase = CallPhase.idle,
    this.role,
    this.callType = 'audio',
    this.conversationId,
    this.remoteUserId,
    this.remoteUser,
    this.startedAt,
    this.muted = false,
    this.cameraOff = false,
    this.speakerOn = false,
    this.error,
  });

  bool get isIdle => phase == CallPhase.idle;
  bool get isVideo => callType == 'video';

  // Note: `error` is preserved by default (like every other field) — call
  // sites that need to clear it use CallState.clearError(), not copyWith().
  CallState copyWith({
    CallPhase? phase,
    DateTime? startedAt,
    bool? muted,
    bool? cameraOff,
    bool? speakerOn,
    String? error,
  }) =>
      CallState(
        phase: phase ?? this.phase,
        role: role,
        callType: callType,
        conversationId: conversationId,
        remoteUserId: remoteUserId,
        remoteUser: remoteUser,
        startedAt: startedAt ?? this.startedAt,
        muted: muted ?? this.muted,
        cameraOff: cameraOff ?? this.cameraOff,
        speakerOn: speakerOn ?? this.speakerOn,
        error: error ?? this.error,
      );

  CallState clearError() => CallState(
        phase: phase,
        role: role,
        callType: callType,
        conversationId: conversationId,
        remoteUserId: remoteUserId,
        remoteUser: remoteUser,
        startedAt: startedAt,
        muted: muted,
        cameraOff: cameraOff,
        speakerOn: speakerOn,
      );
}

/// Pure state for the in-progress call, if any — one call at a time, same
/// as the web app. CallActions (call_actions.dart) owns every side effect
/// (WebRTC, sockets, navigation); this notifier just records the resulting
/// phase transitions.
class CallNotifier extends Notifier<CallState> {
  @override
  CallState build() => const CallState();

  void startOutgoing({
    required String conversationId,
    required String userId,
    required AppUser remoteUser,
    required String callType,
  }) {
    state = CallState(
      phase: CallPhase.ringingOutgoing,
      role: 'caller',
      callType: callType,
      conversationId: conversationId,
      remoteUserId: userId,
      remoteUser: remoteUser,
    );
  }

  void startIncoming({
    required String conversationId,
    required String fromUserId,
    required AppUser fromUser,
    required String callType,
  }) {
    state = CallState(
      phase: CallPhase.ringingIncoming,
      role: 'callee',
      callType: callType,
      conversationId: conversationId,
      remoteUserId: fromUserId,
      remoteUser: fromUser,
    );
  }

  void setConnecting() => state = state.copyWith(phase: CallPhase.connecting);

  void setActive() => state = state.copyWith(phase: CallPhase.active, startedAt: DateTime.now());

  void setError(String message) => state = state.copyWith(error: message);

  void setMuted(bool value) => state = state.copyWith(muted: value);

  void setCameraOff(bool value) => state = state.copyWith(cameraOff: value);

  void setSpeakerOn(bool value) => state = state.copyWith(speakerOn: value);

  /// Back to idle — but keeps `error` (a call ending *because of* an error,
  /// e.g. "User is unavailable"/a permission denial, needs to survive this
  /// so a listener elsewhere can still show it after the call screen pops;
  /// the next real call starts fresh via startOutgoing/startIncoming, which
  /// don't carry an error over).
  void reset() => state = CallState(error: state.error);

  void clearError() => state = state.clearError();
}

final callProvider = NotifierProvider<CallNotifier, CallState>(CallNotifier.new);
