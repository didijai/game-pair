/* PairTTS — adapted from E:\workspace\clock\tts.js (LearnTTS).
   Same proven approach: preload voices, cache female voice, one-time probe,
   Google translate_tts fallback with no-referrer. Exposes window.PairTTS. */
(function () {
  'use strict';
  const GOOGLE_TTS_BASE = 'https://translate.google.com/translate_tts';
  let audioEl = null, mode = 'detecting', preferredEngine = 'auto';
  let probed = false, probePromise = null, voices = [], femaleVoice = null, resolvedCount = -1;

  function refreshVoices() {
    try { voices = ('speechSynthesis' in window) ? window.speechSynthesis.getVoices() : []; }
    catch (e) { voices = []; }
  }
  function getPreferredVoice() {
    if (femaleVoice && voices.length === resolvedCount) return femaleVoice;
    if (!voices.length) return null;
    femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English')
      || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Aria')
      || v.name.includes('Jenny') || v.name.includes('Karen'))
      || voices.find(v => /en(-|_)/i.test(v.lang)) || null;
    resolvedCount = voices.length;
    return femaleVoice;
  }
  function hasLocal() {
    try {
      return ('speechSynthesis' in window) && typeof window.SpeechSynthesisUtterance === 'function'
        && !!window.speechSynthesis && typeof window.speechSynthesis.speak === 'function';
    } catch (e) { return false; }
  }
  function probe() {
    if (!hasLocal()) { mode = 'google'; probed = true; return Promise.resolve('google'); }
    if (probed) return probePromise || Promise.resolve(mode);
    refreshVoices();
    if (!voices.length) { mode = 'google'; probed = true; return Promise.resolve('google'); }
    probed = true;
    probePromise = new Promise((resolve) => {
      let settled = false;
      const settle = (n) => { if (settled) return; settled = true; mode = n; probePromise = null; resolve(n); };
      try {
        const u = new SpeechSynthesisUtterance('');
        u.lang = 'en-US'; u.volume = 0.03; u.rate = 2;
        const v = getPreferredVoice(); if (v) u.voice = v;
        u.onstart = () => settle('local'); u.onerror = () => settle('google');
        window.speechSynthesis.speak(u);
        setTimeout(() => { try { window.speechSynthesis.cancel(); } catch (e) {} settle('google'); }, 350);
      } catch (e) { settle('google'); }
    });
    return probePromise;
  }
  function speakLocal(text, allowFallback) {
    try {
      if (typeof window.SpeechSynthesisUtterance !== 'function') return false;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = 0.85; // kid-friendly, slightly slow
      const v = getPreferredVoice(); if (v) u.voice = v;
      u.onerror = () => { if (allowFallback) { mode = 'google'; speakGoogle(text); } };
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  let queue = [];
  function ensureAudio() {
    if (audioEl) return audioEl;
    if (typeof window.Audio !== 'function') return null;
    try {
      audioEl = new Audio();
      try { audioEl.referrerPolicy = 'no-referrer'; audioEl.setAttribute('referrerpolicy', 'no-referrer'); } catch (e) {}
      audioEl.addEventListener('ended', playNext);
      audioEl.addEventListener('error', playNext);
    } catch (e) { return null; }
    return audioEl;
  }
  function playNext() {
    if (!audioEl) return;
    const next = queue.shift();
    if (!next) return;
    try {
      audioEl.src = next;
      const p = audioEl.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) { playNext(); }
  }
  function speakGoogle(text) {
    try {
      const s = String(text || '').trim().slice(0, 200);
      if (!s) return false;
      const el = ensureAudio(); if (!el) return false;
      try { el.pause(); } catch (e) {}
      queue = [GOOGLE_TTS_BASE + '?ie=UTF-8&tl=en&client=tw-ob&q=' + encodeURIComponent(s)];
      playNext();
      return true;
    } catch (e) { return false; }
  }
  function stopAll() {
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
    try { queue = []; if (audioEl) audioEl.pause(); } catch (e) {}
  }
  // Safety net: UI strings love emoji, but voices read them aloud as
  // nonsense ("balloon"). Strip pictographs so speech is always plain
  // English, no matter what text is passed in.
  function cleanForSpeech(text) {
    try {
      return String(text)
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, ' ')
        .replace(/\s+/g, ' ').trim();
    } catch (e) { return String(text); }
  }
  function speak(text) {
    text = cleanForSpeech(text);
    if (!text) return;
    const s = window.PairSettings ? window.PairSettings.load() : null;
    try {
      if (preferredEngine === 'google') { speakGoogle(text); return; }
      const browserOnly = preferredEngine === 'browser';
      if (!hasLocal()) {
        mode = 'google'; probed = true;
        if (!browserOnly) speakGoogle(text);
        return;
      }
      refreshVoices();
      if (mode === 'detecting') {
        probe().then(() => {
          if (mode === 'local') { if (!speakLocal(text, !browserOnly) && !browserOnly) speakGoogle(text); }
          else if (!browserOnly) speakGoogle(text);
        });
        return;
      }
      if (mode === 'local') { if (!speakLocal(text, !browserOnly) && !browserOnly) speakGoogle(text); }
      else if (!browserOnly) speakGoogle(text);
    } catch (e) { try { speakGoogle(text); } catch (e2) {} }
  }
  window.PairTTS = { speak, stop: stopAll, init: probe,
    setEngine(e) { preferredEngine = e; return preferredEngine; },
    get mode() { return mode; } };
  if ('speechSynthesis' in window) {
    try {
      refreshVoices();
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
      setTimeout(refreshVoices, 500); setTimeout(refreshVoices, 1500);
    } catch (e) {}
  }
})();
