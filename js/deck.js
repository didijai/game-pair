/* Deck builder: sample N distinct values, duplicate, Fisher-Yates shuffle. */
(function () {
  'use strict';
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function speakText(charsetId, v, word) {
    if (charsetId === 'animals') {
      return { '🐶':'doggy','🐱':'kitty','🐭':'mousy','🐹':'hamster','🐰':'bunny','🦊':'foxy',
        '🐻':'bear','🐼':'panda','🐯':'tiger','🦁':'lion','🐸':'froggy' }[v] || 'animal';
    }
    // Letters pair with a kid word ("c for cat!") so TTS speaks real English.
    // `word` is fixed per value per game, so both cards of a pair match.
    if (/^[A-Za-z]$/.test(v)) {
      const w = word || v;
      return charsetId === 'AZ' ? ('Uppercase ' + v + ' for ' + w) : (v + ' for ' + w);
    }
    if (/^\d+$/.test(v)) return 'Number ' + v;
    return v; // 0-9 fallback: speech engine says the digit name
  }
  function pickWord(v) {
    try {
      const list = window.PairConfig.WORDS[String(v).toLowerCase()];
      if (!list || !list.length) return null;
      return list[Math.floor(Math.random() * list.length)];
    } catch (e) { return null; }
  }
  function buildDeck(charsetId, requestedPairs) {
    const C = window.PairConfig;
    const { effective, size, clamped } = C.clampPairs(requestedPairs, charsetId);
    const pool = shuffle(C.CHARSETS[charsetId].values());
    const picked = pool.slice(0, effective);
    const wordFor = {};
    picked.forEach((v) => { wordFor[v] = pickWord(v); });
    const animalName = (v) => ({
      '🐶': 'doggy', '🐱': 'kitty', '🐭': 'mousy', '🐹': 'hamster', '🐰': 'bunny', '🦊': 'foxy',
      '🐻': 'bear', '🐼': 'panda', '🐨': 'koala', '🐯': 'tiger', '🦁': 'lion', '🐸': 'froggy'
    }[v] || null);
    const cards = shuffle(picked.concat(picked).map((v, i) => ({
      uid: i,
      value: v,
      label: v,
      // Printable word under the char so kids learn it (letters + animals).
      word: charsetId === 'animals' ? animalName(v) : (wordFor[v] || null),
      speak: speakText(charsetId, v, wordFor[v])
    })));
    const [cols, rows] = C.GRIDS[effective] || [6, 6];
    return { cards, effective, size, clamped, cols, rows, charsetId };
  }
  window.PairDeck = { buildDeck };
})();
