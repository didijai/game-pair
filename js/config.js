/* Pair game config: limits, charsets, grid table. */
(function () {
  'use strict';
  const PAIRS_MIN = 2, PAIRS_MAX = 18, DEFAULT_PAIRS = 6;

  function az(a, b) {
    const out = [];
    for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++) out.push(String.fromCharCode(c));
    return out;
  }
  function range(n1, n2) {
    const out = [];
    for (let i = n1; i <= n2; i++) out.push(String(i));
    return out;
  }
  const ANIMALS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸'];

  const CHARSETS = {
    'az':      { label: 'a – z', values: () => az('a', 'z') },
    'AZ':      { label: 'A – Z', values: () => az('A', 'Z') },
    '09':      { label: '0 – 9', values: () => az('0', '9') },
    '1-20':    { label: '1 – 20', values: () => range(1, 20) },
    '1-100':   { label: '1 – 100', values: () => range(1, 100) },
    'animals': { label: 'Animals', values: () => ANIMALS.slice() }
  };

  // Simple kid words per letter, for TTS ("c, cat!"). Up to 5 each;
  // hard letters (q, u, x) just get fewer. One word is picked per game
  // so both cards of a pair always say the same thing.
  const WORDS = {
    a: ['apple', 'ant', 'ape', 'airplane', 'avocado'],
    b: ['ball', 'banana', 'bear', 'bird', 'bus'],
    c: ['cat', 'cup', 'car', 'cake', 'cow'],
    d: ['dog', 'duck', 'door', 'drum', 'dinosaur'],
    e: ['egg', 'elephant', 'ear', 'envelope', 'earth'],
    f: ['fish', 'frog', 'flower', 'fox', 'fan'],
    g: ['grape', 'goat', 'gift', 'guitar', 'garden'],
    h: ['hat', 'horse', 'house', 'hand', 'heart'],
    i: ['ice', 'ice-cream', 'insect', 'island', 'ink'],
    j: ['jam', 'jar', 'jacket', 'juice', 'jet', 'jump'],
    k: ['kite', 'key', 'king', 'koala', 'kangaroo'],
    l: ['lion', 'lemon', 'leaf', 'ladder', 'ladybug'],
    m: ['monkey', 'moon', 'mouse', 'milk', 'mango'],
    n: ['nose', 'nest', 'nut', 'net', 'night'],
    o: ['orange', 'owl', 'ox', 'ocean', 'onion'],
    p: ['pig', 'pizza', 'pen', 'panda', 'pear'],
    q: ['queen', 'question', 'quarter'],
    r: ['rabbit', 'rainbow', 'rose', 'robot', 'ring'],
    s: ['sun', 'star', 'snake', 'strawberry', 'sock'],
    t: ['tiger', 'tree', 'turtle', 'tent', 'tomato'],
    u: ['umbrella', 'unicorn', 'up', 'uniform'],
    v: ['van', 'violin', 'vest', 'vase', 'vegetables'],
    w: ['whale', 'watermelon', 'window', 'watch', 'wolf'],
    x: ['xylophone', 'x-ray'],
    y: ['yellow', 'yolk', 'yacht', 'yogurt'],
    z: ['zebra', 'zoo', 'zero', 'zigzag']
  };

  // Near-square grids for card count = pairs*2 (cols x rows).
  const GRIDS = { 2:[2,2],3:[3,2],4:[4,2],5:[5,2],6:[4,3],7:[5,3],8:[4,4],9:[6,3],
    10:[5,4],11:[6,4],12:[6,4],13:[6,5],14:[6,5],15:[6,5],16:[6,6],17:[6,6],18:[6,6] };

  function charsetSize(id) {
    try { return CHARSETS[id].values().length; } catch (e) { return 26; }
  }
  function clampPairs(requested, charsetId) {
    const size = charsetSize(charsetId);
    const effective = Math.max(PAIRS_MIN, Math.min(requested || DEFAULT_PAIRS, size, PAIRS_MAX));
    return { effective, size, clamped: effective !== requested };
  }

  window.PairConfig = { PAIRS_MIN, PAIRS_MAX, DEFAULT_PAIRS, CHARSETS, GRIDS, WORDS, charsetSize, clampPairs };
})();
