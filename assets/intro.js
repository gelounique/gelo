/* 2016 gaming intro – recreated in canvas. 10 s loop: streaks → flash → 3D text + flare → glitch → subscribe meme */
(() => {
  const cv = document.getElementById('introCv'); if (!cv) return;
  const x = cv.getContext('2d');
  const W = cv.width, H = cv.height, D = 10;
  const prog = document.getElementById('plProg'), time = document.getElementById('plTime');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, t0 = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const map = (v, a, b) => clamp((v - a) / (b - a));
  const eo = t => 1 - Math.pow(1 - t, 3);
  const streaks = Array.from({ length: 46 }, () => ({ a: rnd(0, Math.PI * 2), d: rnd(.6, 1), w: rnd(1, 3), s: rnd(.75, 1.1), h: Math.random() < .25 }));
  const embers = Array.from({ length: 70 }, () => ({ x: rnd(0, W), y: rnd(0, H), v: rnd(10, 40), r: rnd(.6, 2.2), p: rnd(0, 6) }));
  const shards = Array.from({ length: 26 }, () => ({ a: rnd(0, Math.PI * 2), v: rnd(120, 420), r: rnd(0, Math.PI), s: rnd(4, 14) }));
  const WORD = 'GELO';

  function text3D(t, sc, rot, alpha) {
    x.save();
    x.translate(W / 2, H / 2 - 10); x.rotate(rot); x.scale(sc, sc);
    x.font = '700 150px "Instrument Sans", Impact, sans-serif';
    try { x.fontStretch = 'condensed'; } catch (e) {}
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.globalAlpha = alpha;
    const depth = 16;
    for (let i = depth; i > 0; i--) { // extrusion
      const k = i / depth;
      x.fillStyle = `rgb(${30 + 60 * (1 - k)},${16 + 30 * (1 - k)},${28 + 40 * (1 - k)})`;
      x.fillText(WORD, i * 1.2, i * 1.6);
    }
    const g = x.createLinearGradient(0, -70, 0, 70);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.45, '#d9d9e3'); g.addColorStop(.5, '#7a7a88'); g.addColorStop(.62, '#f2f2f7'); g.addColorStop(1, '#ffb7d5');
    x.fillStyle = g; x.fillText(WORD, 0, 0);
    // moving shine
    x.globalCompositeOperation = 'source-atop';
    const sx = -400 + ((t * 260) % 900);
    const sg = x.createLinearGradient(sx - 60, 0, sx + 60, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = sg; x.fillRect(-500, -120, 1000, 240);
    x.globalCompositeOperation = 'source-over';
    x.lineWidth = 2; x.strokeStyle = 'rgba(255,183,213,.8)'; x.strokeText(WORD, 0, 0);
    x.restore();
  }

  function flare(cx, cy, k) {
    x.save(); x.globalCompositeOperation = 'lighter';
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, 160 * k);
    g.addColorStop(0, `rgba(255,255,255,${.9 * k})`); g.addColorStop(.2, `rgba(255,190,220,${.4 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(cx - 200, cy - 200, 400, 400);
    const hg = x.createLinearGradient(0, cy, W, cy);
    hg.addColorStop(0, 'rgba(120,170,255,0)'); hg.addColorStop(cx / W, `rgba(170,200,255,${.75 * k})`); hg.addColorStop(1, 'rgba(120,170,255,0)');
    x.fillStyle = hg; x.fillRect(0, cy - 2, W, 4);
    const dx = W / 2 - cx, dy = H / 2 - cy;
    [[.4, 18, '255,120,200'], [.8, 34, '120,200,255'], [1.3, 12, '255,255,255'], [1.7, 52, '255,183,213']].forEach(([f, r, c]) => {
      x.fillStyle = `rgba(${c},${.18 * k})`; x.beginPath(); x.arc(cx + dx * f * 2, cy + dy * f * 2, r, 0, Math.PI * 2); x.fill();
    });
    x.restore();
  }

  function glitch(strength) {
    if (strength <= 0) return;
    const n = 6 + Math.floor(strength * 10);
    for (let i = 0; i < n; i++) {
      const y = rnd(0, H), h = rnd(4, 30), dx = rnd(-40, 40) * strength;
      x.drawImage(cv, 0, y, W, h, dx, y, W, h);
    }
    x.save(); x.globalCompositeOperation = 'lighter';
    x.fillStyle = `rgba(255,0,80,${.12 * strength})`; x.fillRect(rnd(-6, 6), 0, W, H);
    x.restore();
  }

  function subscribe(t) {
    const k = eo(map(t, 7.6, 8.0)), out = map(t, 9.3, 9.8);
    const bx = W / 2, by = H / 2 + 120;
    const clicked = t > 8.75;
    x.save(); x.globalAlpha = k * (1 - out);
    x.translate(bx, by + (1 - k) * 40);
    const pop = clicked ? 1 + Math.max(0, .12 - (t - 8.75) * .4) : 1;
    x.scale(pop, pop);
    x.fillStyle = clicked ? '#3a3a3f' : '#ff0033';
    const w = 250, h = 58;
    x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 6); x.fill();
    x.fillStyle = '#fff'; x.font = '700 24px "Instrument Sans", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(clicked ? 'ABONNIERT ✓' : 'ABONNIEREN', -14, 1);
    // bell
    const shake = clicked && t < 9.4 ? Math.sin(t * 60) * .35 : 0;
    x.save(); x.translate(w / 2 + 40, 0); x.rotate(shake);
    x.fillStyle = clicked ? '#ffb7d5' : '#fff';
    x.beginPath(); x.moveTo(-14, 10); x.quadraticCurveTo(-14, -16, 0, -16); x.quadraticCurveTo(14, -16, 14, 10); x.lineTo(18, 14); x.lineTo(-18, 14); x.closePath(); x.fill();
    x.beginPath(); x.arc(0, 18, 4, 0, Math.PI * 2); x.fill();
    x.restore();
    x.restore();
    // cursor
    const ct = map(t, 8.0, 8.7);
    if (t > 7.9 && out < 1) {
      const cx = W * .85 + (bx - 10 - W * .85) * eo(ct), cy = H * .95 + (by + 10 - H * .95) * eo(ct);
      x.save(); x.globalAlpha = 1 - out; x.translate(cx, cy);
      const press = t > 8.7 && t < 8.85 ? .85 : 1; x.scale(press, press);
      x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 26); x.lineTo(7, 20); x.lineTo(12, 31); x.lineTo(17, 29); x.lineTo(12, 18); x.lineTo(21, 18); x.closePath(); x.fill(); x.stroke();
      x.restore();
    }
  }

  function draw(t) {
    // bg
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    const bg = x.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * .7);
    bg.addColorStop(0, '#1a0f18'); bg.addColorStop(1, '#000');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);

    // embers
    x.save(); x.globalCompositeOperation = 'lighter';
    embers.forEach(e => {
      const y = (e.y - t * e.v + H * 10) % H, a = .35 + .35 * Math.sin(t * 3 + e.p);
      x.fillStyle = `rgba(255,${150 + 60 * Math.sin(e.p)},200,${a * map(t, .2, 1.4)})`;
      x.beginPath(); x.arc(e.x + Math.sin(t + e.p) * 8, y, e.r, 0, Math.PI * 2); x.fill();
    });
    x.restore();

    // 0–1.25 streaks converge
    if (t < 1.5) {
      const k = map(t, 0, 1.25);
      x.save(); x.globalCompositeOperation = 'lighter';
      streaks.forEach(s => {
        const R = W * .8 * s.d * (1 - Math.pow(k, 1.6 * s.s));
        const len = 80 + 220 * k;
        const ax = W / 2 + Math.cos(s.a) * R, ay = H / 2 + Math.sin(s.a) * R * .6;
        const bx = W / 2 + Math.cos(s.a) * (R + len), by = H / 2 + Math.sin(s.a) * (R + len) * .6;
        const g = x.createLinearGradient(ax, ay, bx, by);
        g.addColorStop(0, s.h ? 'rgba(255,183,213,.95)' : 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.strokeStyle = g; x.lineWidth = s.w; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
      });
      x.restore();
    }
    // flash + shockwave
    const fl = t > 1.25 ? Math.max(0, 1 - (t - 1.25) * 3.2) : 0;
    if (t > 1.25 && t < 2.6) {
      const k = eo(map(t, 1.25, 2.4));
      x.save(); x.strokeStyle = `rgba(255,183,213,${1 - k})`; x.lineWidth = 10 * (1 - k) + 1;
      x.beginPath(); x.ellipse(W / 2, H / 2, 30 + k * W * .7, 20 + k * H * .7, 0, 0, Math.PI * 2); x.stroke();
      x.globalCompositeOperation = 'lighter';
      shards.forEach(s => { const r = s.v * (t - 1.25); x.fillStyle = `rgba(255,255,255,${1 - k})`; x.save(); x.translate(W / 2 + Math.cos(s.a) * r, H / 2 + Math.sin(s.a) * r * .7); x.rotate(s.r + t * 4); x.fillRect(-s.s / 2, -1, s.s, 2); x.restore(); });
      x.restore();
    }
    // text
    if (t > 1.25 && t < 7.9) {
      const inK = eo(map(t, 1.25, 1.9));
      const outK = map(t, 6.6, 7.5);
      const sc = (.4 + .6 * inK) * (1 + .03 * Math.sin(t * 2)) * (1 + outK * 1.6);
      const shake = t < 1.8 ? (1.8 - t) * 14 : 0;
      x.save(); x.translate(rnd(-shake, shake), rnd(-shake, shake));
      text3D(t, sc, Math.sin(t * .8) * .03, (1 - outK));
      x.restore();
      // subtitle typewriter
      const sub = 'INTRO · 2016 · FULL HD';
      const n = Math.floor(map(t, 2.2, 3.4) * sub.length);
      x.save(); x.globalAlpha = 1 - outK; x.fillStyle = '#ffb7d5'; x.font = '600 18px "JetBrains Mono", monospace'; x.textAlign = 'center';
      x.fillText(sub.slice(0, n) + (n < sub.length && Math.floor(t * 6) % 2 ? '_' : ''), W / 2, H / 2 + 108); x.restore();
    }
    // lens flare sweep
    if (t > 1.6 && t < 6.8) {
      const k = map(t, 1.6, 6.8);
      flare(W * (.1 + .8 * k), H * (.32 + .1 * Math.sin(k * 3)), Math.sin(k * Math.PI) * .9 + .1);
    }
    // glitch moments
    const gl = (t > 3.05 && t < 3.3 ? 1 : 0) + (t > 4.8 && t < 4.95 ? .7 : 0) + (t > 6.6 && t < 7.4 ? map(t, 6.6, 7.4) : 0);
    glitch(gl);
    // white flash overlay
    if (fl > 0) { x.fillStyle = `rgba(255,255,255,${fl})`; x.fillRect(0, 0, W, H); }
    // subscribe meme
    if (t > 7.5) subscribe(t);
    // vignette + letterbox flicker
    const vg = x.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .7);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.65)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
    // fade out
    const fo = map(t, 9.5, 10);
    if (fo > 0) { x.fillStyle = `rgba(0,0,0,${fo})`; x.fillRect(0, 0, W, H); }
    // watermark (2016 classic)
    x.fillStyle = 'rgba(255,255,255,.35)'; x.font = '600 12px "JetBrains Mono", monospace'; x.textAlign = 'right';
    x.fillText('made with ♥ & zu wenig RAM', W - 16, H - 14);

    if (prog) prog.style.width = (t / D * 100).toFixed(2) + '%';
    if (time) time.textContent = `0:${String(Math.floor(t)).padStart(2, '0')} / 0:10`;
  }

  function loop(now) {
    const t = ((now - t0) / 1000) % D;
    draw(t);
    raf = requestAnimationFrame(loop);
  }
  window.IntroAnim = {
    start() { if (RM) { draw(4.2); return; } if (raf) return; t0 = performance.now(); raf = requestAnimationFrame(loop); },
    stop() { cancelAnimationFrame(raf); raf = 0; }
  };
  draw(4.2);
})();
