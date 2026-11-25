// Sizzle Station — all sounds are synthesized with WebAudio.
//
// No audio files are shipped: every effect is an oscillator or a short
// burst of filtered noise, built when it is first needed. Audio starts
// only after the player's first gesture, as browsers require.

export function createSoundBank() {
  let ctx = null;
  let master = null;
  let sizzleNodes = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    return true;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, filterFreq, vol, when = 0) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
  }

  return {
    unlock() {
      if (ensure() && ctx.state === 'suspended') ctx.resume();
    },
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (!muted) this.unlock();
      return muted;
    },
    click() {
      tone(660, 0.06, 'sine', 0.15);
    },
    grab() {
      tone(420, 0.07, 'triangle', 0.2, 0, 560);
    },
    place() {
      tone(300, 0.08, 'triangle', 0.2, 0, 220);
    },
    chop() {
      noiseBurst(0.09, 1800, 0.5);
      tone(180, 0.05, 'square', 0.08);
    },
    chopDone() {
      tone(520, 0.08, 'triangle', 0.2);
      tone(780, 0.1, 'triangle', 0.2, 0.08);
    },
    cookDone() {
      tone(880, 0.12, 'sine', 0.22);
      tone(1174, 0.16, 'sine', 0.18, 0.1);
    },
    burnWarn() {
      tone(220, 0.15, 'sawtooth', 0.12, 0, 180);
    },
    serve() {
      tone(1046, 0.1, 'sine', 0.25);
      tone(1318, 0.14, 'sine', 0.25, 0.09);
      tone(1568, 0.2, 'sine', 0.22, 0.18);
    },
    coin() {
      tone(988, 0.07, 'square', 0.1);
      tone(1319, 0.12, 'square', 0.1, 0.06);
    },
    fail() {
      tone(220, 0.25, 'sawtooth', 0.15, 0, 110);
    },
    tick() {
      tone(980, 0.05, 'sine', 0.12);
    },
    start() {
      tone(523, 0.1, 'triangle', 0.22);
      tone(659, 0.1, 'triangle', 0.22, 0.1);
      tone(784, 0.18, 'triangle', 0.24, 0.2);
    },
    over() {
      tone(392, 0.2, 'triangle', 0.2);
      tone(330, 0.2, 'triangle', 0.2, 0.18);
      tone(262, 0.4, 'triangle', 0.22, 0.36);
    },
  };
}

// The wok sizzle is a looping band of filtered noise that runs while
// anything is cooking and stops when the burners go quiet. It lives on
// the bank object returned above, added here so the file takes its final
// shape from more than one write.
export function attachSizzle(bank) {
  let ctx = null;
  let nodes = null;

  bank.sizzleStart = function sizzleStart() {
    if (nodes || bank.muted) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!ctx) {
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') ctx.resume();
    const len = ctx.sampleRate * 1;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5200;
    filter.Q.value = 0.4;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    nodes = { src, gain };
  };

  bank.sizzleStop = function sizzleStop() {
    if (!nodes) return;
    try {
      nodes.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      nodes.src.stop(ctx.currentTime + 0.2);
    } catch (err) {
      // The node may already be gone; silence is silence.
    }
    nodes = null;
  };
}
