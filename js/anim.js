/* Confetti + mascot helpers. Respects prefers-reduced-motion. */
(function () {
  'use strict';
  const COLORS = ['#f43f5e','#f59e0b','#10b981','#3b82f6','#a855f7','#facc15'];
  function reduced() {
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  function confetti(ms) {
    if (reduced()) return;
    const cv = document.getElementById('confetti');
    const cx = cv.getContext('2d');
    cv.width = innerWidth; cv.height = innerHeight;
    const ps = Array.from({ length: 160 }, () => ({
      x: Math.random() * cv.width, y: -20 - Math.random() * cv.height / 2,
      w: 6 + Math.random() * 8, h: 8 + Math.random() * 10,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      vy: 2 + Math.random() * 3, vx: -1.5 + Math.random() * 3, r: Math.random() * Math.PI
    }));
    const t0 = performance.now();
    (function frame(t) {
      cx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.r += 0.08;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
        cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        cx.restore();
      });
      if (t - t0 < (ms || 2500)) requestAnimationFrame(frame);
      else cx.clearRect(0, 0, cv.width, cv.height);
    })(t0);
  }
  function mascot(mood, text) {
    const m = document.getElementById('mascotGame');
    const c = document.getElementById('cheerText');
    if (!m) return;
    m.classList.remove('happy', 'sad');
    if (mood === 'happy') { m.textContent = '🦊🎉'; m.classList.add('happy'); }
    else if (mood === 'sad') { m.textContent = '🦊💦'; m.classList.add('sad'); }
    else if (mood === 'win') { m.textContent = '🦊🏆'; m.classList.add('happy'); }
    else { m.textContent = '🦊'; }
    if (c && text) c.textContent = text;
  }
  window.PairAnim = { confetti, mascot };
})();
