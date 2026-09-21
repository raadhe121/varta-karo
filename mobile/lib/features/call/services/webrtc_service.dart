import 'package:flutter_webrtc/flutter_webrtc.dart';

/// Wraps flutter_webrtc for one call at a time. Mirrors the RN app's
/// `src/call/webrtc.js` peer-connection lifecycle (same ICE servers, same
/// offer/answer/candidate flow) so this interoperates with the same
/// signaling server and any web-side peer — see CallActions for how the
/// socket events drive these methods.
///
/// One instance lives for the app's lifetime (see webrtcServiceProvider);
/// [endCall] tears down per-call state (peer connection, local/remote
/// media) while keeping the video renderers initialized so the next call
/// doesn't pay re-init cost, and [dispose] does the final full teardown.
class WebrtcService {
  static const Map<String, dynamic> _configuration = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
    ],
  };

  RTCPeerConnection? _pc;
  MediaStream? _localStream;
  MediaStream? _remoteStream;

  // Mirrors webrtc.js's module-level `pendingCandidates`: ICE candidates can
  // arrive over the socket before setRemoteDescription has run (e.g. while
  // still ringing), so they're queued here and flushed once a remote
  // description is applied.
  final List<RTCIceCandidate> _pendingCandidates = [];

  final RTCVideoRenderer localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer remoteRenderer = RTCVideoRenderer();
  bool _renderersReady = false;

  bool muted = false;
  bool cameraOff = false;
  bool speakerOn = false;

  /// Fired for each local ICE candidate — the caller wires this to
  /// SocketService.emitCallIceCandidate.
  void Function(Map<String, dynamic> candidate)? onIceCandidate;

  /// Fired when the underlying connection drops unexpectedly (failed/closed)
  /// while a call is active, so CallActions can end the call the same way a
  /// remote `call:end` would.
  void Function()? onConnectionFailed;

  /// Fired whenever the remote stream is (re)attached, in case a widget
  /// needs to rebuild beyond what the renderer repaints on its own (e.g. to
  /// switch from an avatar placeholder to the video view).
  void Function()? onRemoteStreamUpdated;

  Future<void> _ensureRenderers() async {
    if (_renderersReady) return;
    await localRenderer.initialize();
    await remoteRenderer.initialize();
    _renderersReady = true;
  }

  Future<MediaStream> _openLocalMedia(bool video) {
    return navigator.mediaDevices.getUserMedia({
      'audio': true,
      'video': video ? {'facingMode': 'user'} : false,
    });
  }

  Future<RTCPeerConnection> _createPeerConnection() async {
    final pc = await createPeerConnection(_configuration);
    pc.onIceCandidate = (candidate) {
      // A null candidate marks end-of-gathering — nothing to send.
      if (candidate.candidate == null) return;
      onIceCandidate?.call(candidate.toMap() as Map<String, dynamic>);
    };
    pc.onTrack = (event) {
      if (event.streams.isEmpty) return;
      _remoteStream = event.streams[0];
      remoteRenderer.srcObject = _remoteStream;
      onRemoteStreamUpdated?.call();
    };
    pc.onConnectionState = (state) {
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed ||
          state == RTCPeerConnectionState.RTCPeerConnectionStateClosed) {
        onConnectionFailed?.call();
      }
    };
    return pc;
  }

  Future<void> _attachLocalTracks(MediaStream stream) async {
    for (final track in stream.getTracks()) {
      await _pc!.addTrack(track, stream);
    }
  }

  Future<void> _flushPendingCandidates() async {
    final pc = _pc;
    if (pc == null || _pendingCandidates.isEmpty) return;
    for (final candidate in _pendingCandidates) {
      await pc.addCandidate(candidate);
    }
    _pendingCandidates.clear();
  }

  /// Caller side: opens local media, creates the peer connection, and
  /// returns an SDP offer ({sdp, type}) to send via `call:invite`.
  Future<Map<String, dynamic>> startAsCaller({required bool video}) async {
    await _ensureRenderers();
    _localStream = await _openLocalMedia(video);
    localRenderer.srcObject = _localStream;
    _pc = await _createPeerConnection();
    await _attachLocalTracks(_localStream!);
    await _setSpeaker(video);

    final offer = await _pc!.createOffer();
    await _pc!.setLocalDescription(offer);
    return offer.toMap();
  }

  /// Callee side: opens local media, creates the peer connection from the
  /// incoming offer, and returns an SDP answer to send via `call:answer`.
  Future<Map<String, dynamic>> startAsCallee({required bool video, required Map<String, dynamic> offer}) async {
    await _ensureRenderers();
    _localStream = await _openLocalMedia(video);
    localRenderer.srcObject = _localStream;
    _pc = await _createPeerConnection();
    await _attachLocalTracks(_localStream!);
    await _setSpeaker(video);

    await _pc!.setRemoteDescription(RTCSessionDescription(offer['sdp'] as String?, offer['type'] as String?));
    await _flushPendingCandidates();

    final answer = await _pc!.createAnswer();
    await _pc!.setLocalDescription(answer);
    return answer.toMap();
  }

  /// Caller side: applies the callee's answer once `call:answered` arrives.
  Future<void> applyAnswer(Map<String, dynamic> answer) async {
    final pc = _pc;
    if (pc == null) return;
    await pc.setRemoteDescription(RTCSessionDescription(answer['sdp'] as String?, answer['type'] as String?));
    await _flushPendingCandidates();
  }

  /// Adds a candidate received via `call:ice-candidate`, queuing it if the
  /// remote description isn't set yet (see [_pendingCandidates]).
  Future<void> addRemoteIceCandidate(Map<String, dynamic> candidateMap) async {
    final candidate = RTCIceCandidate(
      candidateMap['candidate'] as String?,
      candidateMap['sdpMid'] as String?,
      candidateMap['sdpMLineIndex'] as int?,
    );
    final pc = _pc;
    if (pc != null && await pc.getRemoteDescription() != null) {
      await pc.addCandidate(candidate);
    } else {
      _pendingCandidates.add(candidate);
    }
  }

  Future<void> _setSpeaker(bool on) async {
    speakerOn = on;
    try {
      await Helper.setSpeakerphoneOn(on);
    } catch (_) {
      // Unsupported on this platform (e.g. desktop) — the call still works,
      // just without a speaker toggle.
    }
  }

  /// Returns the new muted state.
  bool toggleMute() {
    muted = !muted;
    for (final track in _localStream?.getAudioTracks() ?? const <MediaStreamTrack>[]) {
      track.enabled = !muted;
    }
    return muted;
  }

  /// Returns the new cameraOff state.
  bool toggleCamera() {
    cameraOff = !cameraOff;
    for (final track in _localStream?.getVideoTracks() ?? const <MediaStreamTrack>[]) {
      track.enabled = !cameraOff;
    }
    return cameraOff;
  }

  /// Returns the new speakerOn state.
  Future<bool> toggleSpeaker() async {
    await _setSpeaker(!speakerOn);
    return speakerOn;
  }

  Future<void> switchCamera() async {
    final tracks = _localStream?.getVideoTracks() ?? const <MediaStreamTrack>[];
    if (tracks.isEmpty) return;
    await Helper.switchCamera(tracks.first);
  }

  /// Tears down the peer connection and local/remote media for one call.
  /// Safe to call even if a call never fully started. Renderers are cleared
  /// but stay initialized for reuse by the next call.
  Future<void> endCall() async {
    final pc = _pc;
    _pc = null;
    if (pc != null) {
      // Clear callbacks before closing so a late platform event can't fire
      // into a peer connection we're discarding.
      pc.onIceCandidate = null;
      pc.onTrack = null;
      pc.onConnectionState = null;
      // Best-effort: a connection already failing/closing (e.g. this same
      // teardown was triggered by onConnectionState itself) can throw here —
      // that must not skip releasing the local media below.
      try {
        await pc.close();
        await pc.dispose();
      } catch (_) {}
    }
    _pendingCandidates.clear();

    final local = _localStream;
    _localStream = null;
    if (local != null) {
      for (final track in local.getTracks()) {
        try {
          await track.stop();
        } catch (_) {}
      }
      try {
        await local.dispose();
      } catch (_) {}
    }
    _remoteStream = null;

    localRenderer.srcObject = null;
    remoteRenderer.srcObject = null;
    muted = false;
    cameraOff = false;
    speakerOn = false;
  }

  /// Full teardown — call once when the owning provider is disposed (app
  /// shutdown), not between calls; use [endCall] for that.
  Future<void> dispose() async {
    await endCall();
    if (_renderersReady) {
      await localRenderer.dispose();
      await remoteRenderer.dispose();
      _renderersReady = false;
    }
  }
}
