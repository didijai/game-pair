/* Main game controller: screens, board, turns/marks, settings wiring. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let S = window.PairSettings.load();
  let deck = null, first = null, lock = false, turns = 0, marks = 0;

  // Display text may have emoji (UI), but SPOKEN lines must be plain real
  // English — the voice reads emoji names aloud ("balloon"), which is
  // nonsense to kids. Keep both arrays in the same order/mood.
  const PRAISE = ['Great! 🎉', 'Awesome! ⭐', 'Super! 🌈', 'Wow! 🎈', 'Bravo! 👏',
    'Fantastic! 🌟', 'Cool! 😎', 'Yay! 🎊', 'Nice! 🍎', 'Perfect! 💯'];
  const PRAISE_SPOKEN = ['Great job!', 'Awesome! You found a pair!', 'Super! Well done!',
    'Wow! Amazing!', 'Bravo!', 'Fantastic!', 'Cool! You did it!', 'Yay! You found a match!',
    'Nice work!', 'Perfect!'];
  const TRY_AGAIN = ['Oops! Try again! 🙈', 'Almost! Remember them! 🐘', 'Good try! 👀',
    'Not a match! 🦊', 'So close! 🌈', "You'll get it! 💪", 'Keep going! 🚀', 'Think hard! 🧠',
    'No match! 🐵', 'Never mind! 🌟'];
  const TRY_AGAIN_SPOKEN = ['Oops! Try again!', 'Almost! Try to remember them!', 'Good try!',
    'Not a match! Keep looking!', 'So close!', "You'll get it next time!", 'Keep going!',
    'Think hard! Where was it?', 'No match! Try again!', 'Never mind! You can do it!'];

  function say(text) { if (S.tts) window.PairTTS.speak(text); }
  function refreshStartUI() {
    $('startCharset').value = S.charset;
    $('setCharset').value = S.charset;
    $('pairsLabel').textContent = S.pairs;
    $('setPairs').value = S.pairs;
    $('setTts').checked = S.tts; $('setSfx').checked = S.sfx;
    $('setPeek').checked = S.peek;
    document.querySelectorAll('.chip').forEach(c =>
      c.classList.toggle('chip-active', Number(c.dataset.quick) === S.pairs));
    const { effective, clamped } = window.PairConfig.clampPairs(S.pairs, S.charset);
    const hint = $('clampHint');
    if (clamped) {
      hint.hidden = false;
      hint.textContent = `Note: "${S.charset}" only has ${window.PairConfig.charsetSize(S.charset)} pictures — will play ${effective} pairs.`;
    } else hint.hidden = true;
    const best = window.PairSettings.getBest(S.charset, effective);
    $('bestLine').textContent = best == null
      ? 'No best score yet — be the first! 🏆'
      : `🏆 Best for ${S.charset} × ${effective}: ${best} turns`;
  }
  function persist() { window.PairSettings.save(S); refreshStartUI(); }

  function show(screen) {
    $('startScreen').hidden = screen !== 'start';
    $('gameScreen').hidden = screen !== 'game';
  }

  function newGame() {
    window.PairTTS.init();
    window.PairAudio.click();
    deck = window.PairDeck.buildDeck(S.charset, S.pairs);
    turns = 0; marks = 0; first = null; lock = false;
    show('game');
    autoGrid(); // pick cols x rows that fit this screen (positions set once here)
    renderBoard();
    fitBoard(); // pixel-size cards so none hang off-screen
    updateHUD();
    window.PairAnim.mascot('idle', 'Pick any card!');
    say('Find the matching cards!');
    if (S.peek) peekAll();
  }

  // Measure the space the board may use (viewport minus HUD + mascot).
  function availSpace() {
    const wrap = $('boardWrap');
    const hud = document.querySelector('.hud');
    const bar = $('mascotBar');
    const w = (wrap && wrap.clientWidth ? wrap.clientWidth : window.innerWidth - 32) - 8;
    const h = window.innerHeight
      - (hud ? hud.offsetHeight : 60) - (bar ? bar.offsetHeight : 40) - 90;
    return { w: Math.max(200, w), h: Math.max(220, h) };
  }

  // At game start only: choose the cols x rows (for N cards) giving the
  // biggest cards that fit. Never called on resize, so positions stay put.
  function autoGrid() {
    const n = deck.cards.length, GAP = 10, R = 3 / 4; // card w/h ratio
    const { w, h } = availSpace();
    let best = { cols: deck.cols, rows: deck.rows, size: -1 };
    for (let c = 1; c <= n; c++) {
      const r = Math.ceil(n / c);
      const size = Math.min((w - GAP * (c - 1)) / c, (h - GAP * (r - 1)) / r * R);
      if (size > best.size) best = { cols: c, rows: r, size };
    }
    deck.cols = best.cols; deck.rows = best.rows;
  }

  // Size cards (only) to fit the current viewport. Safe to call on resize:
  // DOM order is untouched, so card positions never change.
  function fitBoard() {
    if (!deck) return;
    const GAP = 10;
    const { w, h } = availSpace();
    const cw = Math.max(44, Math.min(240,
      (w - GAP * (deck.cols - 1)) / deck.cols,
      (h - GAP * (deck.rows - 1)) / deck.rows * 0.75));
    const b = $('board');
    b.style.columnGap = GAP + 'px'; b.style.rowGap = GAP + 'px';
    b.style.gridTemplateColumns = `repeat(${deck.cols}, ${cw}px)`;
    b.style.width = (cw * deck.cols + GAP * (deck.cols - 1)) + 'px';
  }

  function renderBoard() {
    const b = $('board');
    b.innerHTML = '';
    deck.cards.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = 'card deal-in';
      el.style.animationDelay = (idx * 45) + 'ms';
      el.setAttribute('role', 'gridcell');
      el.tabIndex = 0;
      el.dataset.uid = card.uid;
      el.dataset.speak = card.speak; // 🔊 button reads this (front text now mixes char + word)
      const long = card.label.length >= 3;
      // Char on top, word below — kids see AND learn the word (e.g. w / windows).
      const wordHtml = card.word ? `<div class="card-word">${escapeHtml(card.word)}</div>` : '';
      el.innerHTML = `<div class="card-inner">
        <div class="card-face card-back-t"></div>
        <div class="card-face card-front${long ? ' small' : ''}"><div class="card-char">${escapeHtml(card.label)}</div>${wordHtml}</div>
      </div>`;
      el.addEventListener('click', () => flip(el, card));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(el, card); } });
      b.appendChild(el);
      setTimeout(() => el.classList.remove('deal-in'), idx * 45 + 600);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function flip(el, card) {
    if (lock || el.classList.contains('flipped') || el.classList.contains('matched')) return;
    window.PairTTS.init();
    el.classList.add('flipped');
    window.PairAudio.flip();
    say(card.speak);
    if (!first) { first = { el, card }; return; }
    // second card
    turns++;
    updateHUD();
    const a = first; first = null;
    if (a.card.value === card.value) {
      lock = true;
      setTimeout(() => {
        a.el.classList.add('matched'); el.classList.add('matched');
        marks++; updateHUD();
        window.PairAudio.match();
        const pi = Math.floor(Math.random() * PRAISE.length);
        window.PairAnim.mascot('happy', PRAISE[pi]); // emoji OK on screen
        say(PRAISE_SPOKEN[pi] + ' ' + card.speak); // plain English for the ear
        lock = false;
        if (marks >= deck.effective) win();
      }, 350);
    } else {
      lock = true;
      const ti = Math.floor(Math.random() * TRY_AGAIN.length);
      window.PairAnim.mascot('sad', TRY_AGAIN[ti]); // emoji OK on screen
      window.PairAudio.miss();
      say(TRY_AGAIN_SPOKEN[ti]); // voice encourages too (plain English)
      const e1 = a.el, e2 = el;
      e1.classList.add('miss'); e2.classList.add('miss');
      setTimeout(() => {
        e1.classList.remove('flipped', 'miss'); e2.classList.remove('flipped', 'miss');
        lock = false;
      }, 850);
    }
  }

  function peekAll() {
    lock = true;
    document.querySelectorAll('.card').forEach(c => c.classList.add('flipped'));
    window.PairAnim.mascot('idle', 'Remember... 👀');
    setTimeout(() => {
      document.querySelectorAll('.card:not(.matched)').forEach(c => c.classList.remove('flipped'));
      lock = false;
    }, 2000);
  }

  function updateHUD() {
    $('turnsVal').textContent = turns;
    $('marksVal').textContent = marks + ' / ' + (deck ? deck.effective : S.pairs);
    const best = deck ? window.PairSettings.getBest(deck.charsetId, deck.effective) : null;
    $('bestVal').textContent = best == null ? '–' : best + ' turns';
  }

  function stars() {
    const ratio = turns / Math.max(1, deck.effective);
    if (ratio <= 1.6) return '⭐⭐⭐';
    if (ratio <= 2.4) return '⭐⭐';
    return '⭐';
  }

  function win() {
    window.PairAudio.win();
    window.PairAnim.confetti(2800);
    window.PairAnim.mascot('win', 'You did it!');
    const isRecord = window.PairSettings.setBest(deck.charsetId, deck.effective, turns);
    say(`You did it in ${turns} turns!`);
    $('winTitle').textContent = isRecord ? '🏆 New Record!' : 'You did it!';
    $('winStars').textContent = stars();
    $('winText').textContent = `Finished ${deck.effective} pairs in ${turns} turns!`;
    const best = window.PairSettings.getBest(deck.charsetId, deck.effective);
    $('winBest').textContent = `🏆 Best: ${best} turns`;
    updateHUD();
    setTimeout(() => { $('winModal').hidden = false; }, 600);
  }

  function wire() {
    // start screen
    $('startCharset').addEventListener('change', (e) => { S.charset = e.target.value; persist(); });
    $('pairsMinus').addEventListener('click', () => { S.pairs = Math.max(2, S.pairs - 1); persist(); window.PairAudio.click(); });
    $('pairsPlus').addEventListener('click', () => { S.pairs = Math.min(18, S.pairs + 1); persist(); window.PairAudio.click(); });
    document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
      S.pairs = Number(c.dataset.quick); persist(); window.PairAudio.click();
    }));
    $('newGameBtn').addEventListener('click', newGame);
    $('openSettingsBtn').addEventListener('click', () => { $('settingsModal').hidden = false; window.PairAudio.click(); });
    $('gameSettingsBtn').addEventListener('click', () => { $('settingsModal').hidden = false; });
    $('howBtn').addEventListener('click', () => { $('howModal').hidden = false; });
    $('closeHowBtn').addEventListener('click', () => { $('howModal').hidden = true; });
    // settings modal
    $('closeSettingsBtn').addEventListener('click', () => {
      $('settingsModal').hidden = true;
      window.PairSettings.saveNow(S);
      refreshStartUI();
    });
    $('resetSettingsBtn').addEventListener('click', () => {
      S = Object.assign({}, window.PairSettings.DEFAULTS);
      persist();
    });
    $('setCharset').addEventListener('change', (e) => { S.charset = e.target.value; persist(); });
    $('setPairs').addEventListener('change', (e) => {
      let v = Math.round(Number(e.target.value) || 6);
      S.pairs = Math.max(2, Math.min(18, v)); persist();
    });
    $('setTts').addEventListener('change', (e) => { S.tts = e.target.checked; persist(); if (S.tts) say('Talking voice on!'); });
    $('setSfx').addEventListener('change', (e) => { S.sfx = e.target.checked; persist(); });
    $('setPeek').addEventListener('change', (e) => { S.peek = e.target.checked; persist(); });
    // game screen
    $('homeBtn').addEventListener('click', () => {
      window.PairTTS.stop();
      show('start'); refreshStartUI();
    });
    $('restartBtn').addEventListener('click', newGame);
    $('sayAgainBtn').addEventListener('click', () => {
      window.PairTTS.init(); // unlock voice inside this user gesture
      window.PairAudio.click(); // instant feedback even if voice is off
      const btn = $('sayAgainBtn');
      btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse');
      // Read the face-up cards aloud — helps kids remember them.
      const open = [...document.querySelectorAll('#board .card.flipped:not(.matched)')]
        .map((el) => (el.dataset.speak || '').trim())
        .filter(Boolean);
      if (open.length >= 2) {
        const names = open.slice(0, 2).join(', ');
        window.PairAnim.mascot('idle', open.slice(0, 2).join(' and ') + ' — remember!');
        say(names);
      } else if (open.length === 1) {
        say(open[0]);
      } else {
        window.PairAnim.mascot('idle', 'Pick any card!');
        say('Pick any card!');
      }
    });
    $('winAgainBtn').addEventListener('click', () => { $('winModal').hidden = true; newGame(); });
    $('winHomeBtn').addEventListener('click', () => {
      $('winModal').hidden = true;
      show('start'); refreshStartUI();
    });
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    // Resize cards to the new viewport, but never reshuffle or move them.
    if ($('gameScreen').hidden || !deck) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitBoard, 120);
  });

  document.addEventListener('DOMContentLoaded', () => {
    wire(); refreshStartUI(); show('start');
  });
})();
