import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:vibration/vibration.dart';

import '../../../core/socket_events.dart';
import '../../../core/socket_service.dart';
import '../../../models/user.dart';
import '../../../routing/app_router.dart';
import '../data/calls_api.dart';
import '../services/webrtc_service.dart';
import 'call_provider.dart';

final webrtcServiceProvider = Provider<WebrtcService>((ref) {
  final service = WebrtcService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Ringing pattern for an incoming call: no initial delay, 800ms vibrate,
/// 800ms pause, looped (the `repeat` index points back at position 0).
const _ringPattern = [0, 800, 800];

/// The "actions" layer on top of callProvider — equivalent of webrtc.js's
/// exported functions (startCall/handleIncoming/acceptCall/declineCall/
/// endCall/handleAnswered/handleIceCandidate/...), plus what MainTabs.js +
/// IncomingCallModal/ActiveCallOverlay's mount-on-phase-change get for free
/// on web from always being rendered: here that's done by pushing/popping
/// go_router's `/call` route (see features/call/screens/active_call_screen.dart).
class CallActions {
  final Ref _ref;

  /// Stashed between `call:incoming` and answerCall() — webrtc.js's
  /// module-level `pendingOffer`.
  Map<String, dynamic>? _pendingOffer;

  bool _callScreenOpen = false;

  CallActions(this._ref);

  WebrtcService get _webrtc => _ref.read(webrtcServiceProvider);
  SocketService get _socket => _ref.read(socketServiceProvider);
  CallNotifier get _notifier => _ref.read(callProvider.notifier);
  CallState get _state => _ref.read(callProvider);

  Future<bool> _ensurePermissions(bool video) async {
    final permissions = [Permission.microphone, if (video) Permission.camera];
    final statuses = await permissions.request();
    return statuses.values.every((status) => status.isGranted);
  }

  String _mediaErrorMessage(Object err) => 'Could not access camera/microphone: $err';

  void _openCallScreen() {
    if (_callScreenOpen) return;
    _callScreenOpen = true;
    _ref.read(goRouterProvider).push('/call');
  }

  void _closeCallScreenIfOpen() {
    if (!_callScreenOpen) return;
    _callScreenOpen = false;
    final router = _ref.read(goRouterProvider);
    if (router.canPop()) router.pop();
  }

  Future<void> _startRingVibration() async {
    try {
      if (await Vibration.hasVibrator()) {
        Vibration.vibrate(pattern: _ringPattern, repeat: 0);
      }
    } catch (_) {
      // No vibrator, or platform doesn't support it — ringing UI still shows.
    }
  }

  void _stopRingVibration() {
    Vibration.cancel();
  }

  /// Caller side. Matches webrtc.js's startCall().
  Future<void> startCall({
    required String conversationId,
    required AppUser remoteUser,
    required bool video,
  }) async {
    if (!_state.isIdle) return;

    final granted = await _ensurePermissions(video);
    if (!granted) {
      _notifier.setError('Camera/microphone permission is required to make a call.');
      return;
    }

    _notifier.startOutgoing(
      conversationId: conversationId,
      userId: remoteUser.id,
      remoteUser: remoteUser,
      callType: video ? 'video' : 'audio',
    );
    _openCallScreen();

    try {
      final offer = await _webrtc.startAsCaller(video: video);
      _socket.emitCallInvite(
        toUserId: remoteUser.id,
        conversationId: conversationId,
        callType: video ? 'video' : 'audio',
        offer: offer,
      );
    } catch (err) {
      _notifier.setError(_mediaErrorMessage(err));
      await _finishLocalCall();
    }
  }

  /// Callee side, on `call:incoming`. Matches webrtc.js's handleIncoming() —
  /// auto-declines if we're already on another call, same as the web app.
  void handleIncomingInvite(CallIncomingEvent event) {
    if (!_state.isIdle) {
      _socket.emitCallDecline(event.fromUserId);
      return;
    }
    _pendingOffer = event.offer;
    _notifier.startIncoming(
      conversationId: event.conversationId,
      fromUserId: event.fromUserId,
      fromUser: event.fromUser,
      callType: event.callType,
    );
    _openCallScreen();
    _startRingVibration();
  }

  /// Callee side. Matches webrtc.js's acceptCall().
  Future<void> answerCall() async {
    final state = _state;
    final offer = _pendingOffer;
    if (state.phase != CallPhase.ringingIncoming || offer == null || state.remoteUserId == null) return;

    _stopRingVibration();

    final granted = await _ensurePermissions(state.isVideo);
    if (!granted) {
      _notifier.setError('Camera/microphone permission is required to answer.');
      await declineCall();
      return;
    }

    _notifier.setConnecting();

    try {
      final answer = await _webrtc.startAsCallee(video: state.isVideo, offer: offer);
      _pendingOffer = null;
      _socket.emitCallAnswer(toUserId: state.remoteUserId!, answer: answer);
      _notifier.setActive();
    } catch (err) {
      _notifier.setError(_mediaErrorMessage(err));
      await declineCall();
    }
  }

  /// Callee side (explicit decline) or auto-decline of a stale invite.
  /// Matches webrtc.js's declineCall().
  Future<void> declineCall() async {
    final remoteId = _state.remoteUserId;
    _stopRingVibration();
    _pendingOffer = null;
    if (remoteId != null) _socket.emitCallDecline(remoteId);
    await _finishLocalCall();
  }

  /// Either side, user-initiated hangup. Matches webrtc.js's endCall().
  Future<void> endCall() async {
    final state = _state;
    final remoteId = state.remoteUserId;
    _stopRingVibration();
    if (remoteId != null) _socket.emitCallEnd(remoteId);
    await _logCallIfCaller(state.phase == CallPhase.active ? 'answered' : 'no_answer');
    await _finishLocalCall();
  }

  /// Caller side, on `call:answered`. Matches webrtc.js's handleAnswered().
  Future<void> handleAnswered(CallAnsweredEvent event) async {
    if (_state.phase != CallPhase.ringingOutgoing) return;
    await _webrtc.applyAnswer(event.answer);
    _notifier.setActive();
  }

  /// Either side, on `call:ice-candidate`. Matches webrtc.js's
  /// handleIceCandidate().
  Future<void> handleRemoteIceCandidate(CallIceCandidateEvent event) {
    return _webrtc.addRemoteIceCandidate(event.candidate);
  }

  /// Caller side, on `call:declined`. Matches webrtc.js's handleDeclined().
  Future<void> handleRemoteDeclined() async {
    _stopRingVibration();
    await _logCallIfCaller('declined');
    await _finishLocalCall();
  }

  /// Either side, on `call:ended`. Matches webrtc.js's handleEnded().
  Future<void> handleRemoteEnded() async {
    _stopRingVibration();
    await _logCallIfCaller(_state.phase == CallPhase.active ? 'answered' : 'no_answer');
    await _finishLocalCall();
  }

  /// Caller side, on `call:unavailable`. Matches webrtc.js's
  /// handleUnavailable().
  Future<void> handleUnavailable() async {
    _stopRingVibration();
    await _logCallIfCaller('no_answer');
    _notifier.setError('User is unavailable');
    await _finishLocalCall();
  }

  /// Either side, on `call:cancel-ring` — another of my own devices already
  /// answered/declined this call. Matches webrtc.js's handleCancelRing().
  Future<void> handleCancelRing() async {
    _stopRingVibration();
    _pendingOffer = null;
    await _finishLocalCall();
  }

  /// The peer connection dropped unexpectedly mid-call (see
  /// WebrtcService.onConnectionFailed). The remote side doesn't know yet —
  /// unlike handleRemoteEnded (triggered by their `call:end`), this must
  /// still notify them, so it's a local hangup (endCall()), not a remote one.
  Future<void> handleConnectionFailed() async {
    if (_state.phase != CallPhase.active) return;
    await endCall();
  }

  Future<void> _finishLocalCall() async {
    await _webrtc.endCall();
    _notifier.reset();
    _closeCallScreenIfOpen();
  }

  /// Only the caller logs history, matching webrtc.js's finalizeAndLog() —
  /// the callee's copy of the same call is implied server-side by
  /// `direction`.
  Future<void> _logCallIfCaller(String status) async {
    final state = _state;
    if (state.role != 'caller' || state.conversationId == null || state.remoteUserId == null) return;
    final durationSec = state.startedAt != null ? DateTime.now().difference(state.startedAt!).inSeconds : 0;
    try {
      await _ref.read(callsApiProvider).logCall(
            conversationId: state.conversationId!,
            calleeId: state.remoteUserId!,
            type: state.callType,
            status: status,
            durationSec: durationSec,
          );
    } catch (_) {
      // Best-effort, same as webrtc.js's `.catch(() => {})`.
    }
  }

  void toggleMute() => _notifier.setMuted(_webrtc.toggleMute());

  void toggleCamera() => _notifier.setCameraOff(_webrtc.toggleCamera());

  Future<void> toggleSpeaker() async => _notifier.setSpeakerOn(await _webrtc.toggleSpeaker());

  Future<void> switchCamera() => _webrtc.switchCamera();

  /// WebrtcService.onIceCandidate — sent to whichever peer we're currently
  /// signaling with, matching webrtc.js's `connection.onicecandidate`.
  void _emitLocalIceCandidate(Map<String, dynamic> candidate) {
    final remoteId = _state.remoteUserId;
    if (remoteId == null) return;
    _socket.emitCallIceCandidate(toUserId: remoteId, candidate: candidate);
  }
}

final callActionsProvider = Provider<CallActions>((ref) {
  final actions = CallActions(ref);
  final webrtc = ref.read(webrtcServiceProvider);
  webrtc.onConnectionFailed = () => actions.handleConnectionFailed();
  webrtc.onIceCandidate = actions._emitLocalIceCandidate;
  return actions;
});
