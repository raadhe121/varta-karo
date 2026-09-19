let audioCtx = null;
let oscillators = [];
let gateInterval = null;

function ensureContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

// Two-tone pulsed ring, gated on/off to mimic a phone ringing cadence.
export function startRingtone({ freq1 = 480, freq2 = 620, onMs = 900, offMs = 700 } = {}) {
  stopRingtone();
  const ctx = ensureContext();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);

  const osc1 = ctx.createOscillator();
  osc1.frequency.value = freq1;
  osc1.connect(gain);
  const osc2 = ctx.createOscillator();
  osc2.frequency.value = freq2;
  osc2.connect(gain);
  osc1.start();
  osc2.start();
  oscillators = [osc1, osc2, gain];

  let toggle = true;
  const loop = () => {
    toggle = !toggle;
    gain.gain.setTargetAtTime(toggle ? 0.05 : 0, ctx.currentTime, 0.02);
    gateInterval = setTimeout(loop, toggle ? onMs : offMs);
  };
  loop();
}

export function stopRingtone() {
  if (gateInterval) {
    clearTimeout(gateInterval);
    gateInterval = null;
  }
  oscillators.forEach((node) => {
    try {
      node.stop?.();
      node.disconnect?.();
    } catch {
      // already stopped
    }
  });
  oscillators = [];
}
