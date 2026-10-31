// Over-the-top reward for a streak of 10: Abby charges up, her head explodes, and the whole screen fills with confetti.
const COLOURS = ['#a88bce', '#ebba58', '#e89971', '#9dbb9b', '#8fb4cd', '#ff5fa2', '#8467f0', '#ffb02e', '#5bc67c', '#ff6b6b', '#ffffff'];
const EMOJI = ['🎉', '✨', '⭐', '🌟', '🪶', '💜', '🎊', '🦉'];
const CHARGE_MS = 1100, REGROW_MS = 3000, END_MS = 4300;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = list => list[Math.floor(Math.random() * list.length)];

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Resolves when the show is over, so the caller can hold back badge dialogs until then.
export function headExplosion(mascot, streak) {
  if (!mascot || prefersReducedMotion()) return Promise.resolve();
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.className = 'boom-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const flash = document.createElement('div');
    flash.className = 'boom-flash';
    const banner = document.createElement('div');
    banner.className = 'boom-banner';
    banner.innerHTML = `<b>BOOM!</b><span>${streak} in a row!</span>`;
    document.body.append(flash, canvas, banner);

    const ctx = canvas.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();

    const rect = mascot.getBoundingClientRect();
    const head = { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.37 };
    const particles = [];
    const spawn = (x, y, vx, vy, extra = {}) => {
      const emoji = Math.random() < 0.12;
      particles.push({
        x, y, vx, vy, rot: rand(0, 360), vr: rand(-18, 18), w: rand(8, 18), h: rand(10, 24),
        colour: pick(COLOURS), round: Math.random() < 0.3, emoji: emoji ? pick(EMOJI) : '',
        size: rand(18, 36), age: 0, life: rand(120, 260), flutter: rand(0, 6.28), ...extra,
      });
    };
    const burst = (n, speed) => {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), s = rand(speed * 0.25, speed);
        spawn(head.x, head.y, Math.cos(a) * s, Math.sin(a) * s - speed * 0.2);
      }
    };
    const cannon = (x, dir, n) => {
      for (let i = 0; i < n; i++) {
        const a = rand(-1.35, -0.55), s = rand(14, 34);
        spawn(x, innerHeight + 10, dir * Math.cos(a) * s * -1, Math.sin(a) * s * 1.15);
      }
    };
    const rain = n => { for (let i = 0; i < n; i++) spawn(rand(0, innerWidth), rand(-80, -10), rand(-2, 2), rand(1, 6), { life: 400 }); };
    const ring = delay => {
      const el = document.createElement('div');
      el.className = 'boom-ring';
      el.style.cssText = `left:${head.x}px;top:${head.y}px;animation-delay:${delay}ms`;
      document.body.append(el);
      setTimeout(() => el.remove(), 1400 + delay);
    };

    // Charge-up: Abby's head shakes, swells and glows.
    mascot.classList.add('boom-charge');
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    at(CHARGE_MS, () => {
      mascot.classList.remove('boom-charge');
      mascot.classList.add('boom-gone');
      document.body.classList.add('boom-shake');
      flash.classList.add('go');
      banner.classList.add('go');
      burst(260, 26);
      ring(0); ring(140); ring(300);
    });
    at(CHARGE_MS + 150, () => burst(180, 18));
    at(CHARGE_MS + 350, () => { cannon(0, 1, 140); cannon(innerWidth, -1, 140); });
    at(CHARGE_MS + 650, () => { burst(160, 30); cannon(0, 1, 90); cannon(innerWidth, -1, 90); });
    at(CHARGE_MS + 600, () => document.body.classList.remove('boom-shake'));
    for (let t = CHARGE_MS + 300; t < END_MS - 800; t += 140) at(t, () => rain(14));
    at(REGROW_MS, () => { mascot.classList.remove('boom-gone'); mascot.classList.add('boom-regrow'); });

    let last = performance.now(), done = false;
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      [flash, canvas, banner, ...document.querySelectorAll('.boom-ring')].forEach(el => el.remove());
      mascot.classList.remove('boom-charge', 'boom-gone', 'boom-regrow');
      document.body.classList.remove('boom-shake');
      removeEventListener('resize', resize);
      resolve();
    };
    const frame = now => {
      if (done) return;
      const step = Math.min((now - last) / 16.67, 3);
      last = now;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += step;
        p.vy += 0.42 * step;
        p.vx *= Math.pow(0.985, step);
        p.vy *= Math.pow(0.992, step);
        p.flutter += 0.12 * step;
        p.x += (p.vx + Math.sin(p.flutter) * 1.2) * step;
        p.y += p.vy * step;
        p.rot += p.vr * step;
        if (p.age > p.life || p.y > innerHeight + 60) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = Math.min(1, (p.life - p.age) / 40);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        if (p.emoji) { ctx.font = `${p.size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.emoji, 0, 0); }
        else {
          // Squashing the width as it flutters fakes a 3D tumble.
          ctx.scale(Math.cos(p.flutter), 1);
          ctx.fillStyle = p.colour;
          if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
          else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (now - start > END_MS && !particles.length) finish();
      else if (now - start > END_MS + 4000) finish();
      else requestAnimationFrame(frame);
    };
    const start = performance.now();
    addEventListener('resize', resize);
    requestAnimationFrame(frame);
    at(END_MS + 600, () => mascot.classList.remove('boom-regrow'));
  });
}
