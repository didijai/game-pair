/* WebAudio sound effects for card actions. No external files, no music. */
(function () {
  'use strict';
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, when) {
    const v = (vol == null ? 0.2 : vol);
    if (v < 0.002) return;
    const c = ac(); if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      const t = c.currentTime + (when || 0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function enabled() {
    try { return window.PairSettings.load().sfx; } catch (e) { return true; }
  }
  window.PairAudio = {
    click()  { if (enabled()) tone(600, 0.08, 'square', 0.10); },
    flip()   { if (enabled()) tone(500, 0.12, 'sine', 0.22); },
    match()  { if (!enabled()) return; tone(660, 0.15, 'sine', 0.28); tone(880, 0.25, 'sine', 0.28, 0.12); },
    miss()   { if (enabled()) tone(220, 0.2, 'sawtooth', 0.10); },
    win()    { if (!enabled()) return; [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.28, i * 0.15)); }
  };
})();
