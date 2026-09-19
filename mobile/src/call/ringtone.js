import { Vibration } from 'react-native';

// react-native-webrtc has no Web Audio API to synthesize a tone with, so the
// "ringtone" is haptic: a repeating buzz pattern like a phone set to vibrate.
const INCOMING_PATTERN = [0, 700, 400];
const OUTGOING_PATTERN = [0, 300, 2000];

export function startRingtone({ outgoing = false } = {}) {
  Vibration.vibrate(outgoing ? OUTGOING_PATTERN : INCOMING_PATTERN, true);
}

export function stopRingtone() {
  Vibration.cancel();
}
