/* Persistent settings (localStorage), same tolerant pattern as clock/script.js */
(function () {
  'use strict';
  const KEY = 'pairgame.settings.v1';
  const BEST_KEY = 'pairgame.best.v1';
  // peek = preview seconds at game start (0 = no peek, max 30).
  const DEFAULTS = { charset: 'az', pairs: 6, tts: true, sfx: true, peek: 2, engine: 'auto' };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      const p = JSON.parse(raw);
      if (typeof p !== 'object' || !p) return Object.assign({}, DEFAULTS);
      const merged = Object.assign({}, DEFAULTS, p);
      let s = Math.round(Number(merged.peek));
      if (!isFinite(s)) s = DEFAULTS.peek;
      merged.peek = Math.max(0, Math.min(30, s));
      return merged;
    } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  let saveTimer = null;
  function save(s) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode: session only */ }
    }, 150);
  }
  function saveNow(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function bestKey(charset, pairs) { return charset + ':' + pairs; }
  function getBest(charset, pairs) {
    try {
      const all = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
      const v = all[bestKey(charset, pairs)];
      return typeof v === 'number' ? v : null;
    } catch (e) { return null; }
  }
  function setBest(charset, pairs, turns) {
    try {
      const all = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
      const k = bestKey(charset, pairs);
      if (!all[k] || turns < all[k]) {
        all[k] = turns;
        localStorage.setItem(BEST_KEY, JSON.stringify(all));
        return true;
      }
      return false;
    } catch (e) { return false; }
  }
  window.PairSettings = { KEY, DEFAULTS, load, save, saveNow, getBest, setBest };
})();
