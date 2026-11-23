/* gelo.uniquebaby.de v4 – one scroll = one chapter, with the animated details */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;
  const DUR = RM ? 50 : 1050;
  const chs = $$('.ch');
  let idx = -1, busy = false;

  // view-only media
  document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('video,img,.player,.nle,.vf-card,.mosaic,.deck')) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (e.target.closest && e.target.closest('img,video')) e.preventDefault(); });

  chs.forEach((ch, i) => {
    ch.style.zIndex = i + 1;
    $$('.rv', ch).forEach((el, k) => el.style.setProperty('--i', k));
    $$('.rel li, .vids li', ch).forEach((el, k) => el.style.setProperty('--k', k));
  });
  $('#hudT').textContent = String(chs.length).padStart(2, '0');

  // hero name: letters
  $$('.split-l').forEach(h => {
    let k = 0; const txt = h.textContent; h.textContent = '';
    txt.split(' ').forEach((word, wi) => {
      const w = document.createElement('span'); w.style.whiteSpace = 'nowrap'; w.style.display = 'inline-block';
      [...word].forEach(ch => { const s = document.createElement('span'); s.className = 'w'; s.textContent = ch; s.style.setProperty('--k', k++); w.appendChild(s); });
      h.appendChild(w); if (wi < txt.split(' ').length - 1) h.appendChild(document.createTextNode(' '));
    });
  });
  // roles
  (() => {
    const sp = $$('#roles span'); if (!sp.length) return; let k = 0; sp[0].classList.add('in');
    setInterval(() => {
      if (document.hidden || idx !== 0) return;
      const a = sp[k]; k = (k + 1) % sp.length; const b = sp[k];
      a.classList.remove('in'); a.classList.add('out'); b.classList.remove('out'); b.classList.add('in');
      setTimeout(() => a.classList.remove('out'), 650);
    }, 1600);
  })();

  // rail
  const rail = $('#rail');
  chs.forEach((ch, i) => {
    const a = document.createElement('a'); a.href = '#' + ch.id;
    a.innerHTML = `<span>${String(i + 1).padStart(2, '0')} · ${ch.dataset.t}</span>`;
    a.addEventListener('click', e => { e.preventDefault(); go(i); });
    rail.appendChild(a); ch._rail = a;
  });
  $('.hud-brand').addEventListener('click', e => { e.preventDefault(); go(0); });

  // year ticker
  const yr = $('#yr'), digs = [];
  for (let d = 0; d < 4; d++) { const c = document.createElement('span'); c.className = 'dg'; c.innerHTML = [...'0123456789'].map(n => `<span>${n}</span>`).join(''); yr.appendChild(c); digs.push(c); }
  const setYear = y => [...y].forEach((n, d) => digs[d].style.transform = `translateY(${-n}em)`);

  /* ---------- navigation ---------- */
  function go(n, instant) {
    n = clamp(n, 0, chs.length - 1);
    if (n === idx || (busy && !instant)) return;
    busy = true;
    const prev = idx; idx = n;
    chs.forEach((c, i) => {
      if (i === n || i === prev) c.classList.add('vis');
      c.classList.toggle('now', i === n);
      c.classList.toggle('past', i < n);
    });
    setTimeout(() => { chs.forEach((c, i) => { if (i !== idx) { c.classList.remove('vis'); c.classList.remove('on'); } }); busy = false; }, instant ? 0 : DUR);
    const ch = chs[n];
    setTimeout(() => { if (idx === n) ch.classList.add('on'); }, instant ? 0 : 150);
    const hn = $('.hud-n');
    $('#hudN').textContent = String(n + 1).padStart(2, '0'); $('#hudL').textContent = ch.dataset.t;
    hn.classList.remove('flip'); void hn.offsetWidth; hn.classList.add('flip');
    setYear(ch.dataset.year);
    document.documentElement.style.setProperty('--pg', ((n + 1) / chs.length * 100).toFixed(1) + '%');
    const eb = $('.eyebrow', ch); if (eb && !RM) setTimeout(() => scramble(eb), instant ? 0 : 250);
    chs.forEach((c, i) => c._rail.classList.toggle('act', i === n));
    history.replaceState(null, '', n ? '#' + ch.id : location.pathname);
    media(n);
  }

  // eyebrow text scramble
  const GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·×/';
  function scramble(el) {
    const orig = el._orig || (el._orig = el.textContent); const t0 = performance.now(), D = 700;
    cancelAnimationFrame(el._raf);
    const step = t => {
      const k = Math.min(1, (t - t0) / D), n = Math.floor(orig.length * k);
      el.textContent = orig.slice(0, n) + [...orig.slice(n)].map(c => c === ' ' ? ' ' : GL[Math.random() * GL.length | 0]).join('');
      if (k < 1) el._raf = requestAnimationFrame(step); else el.textContent = orig;
    };
    el._raf = requestAnimationFrame(step);
  }

  let lastWheel = 0, acc = 0, quiet = false;
  addEventListener('wheel', e => {
    if (e.ctrlKey) return;
    if (e.target.closest && e.target.closest('.insta')) return;
    e.preventDefault();
    const now = performance.now(), gap = now - lastWheel; lastWheel = now;
    if (quiet) { if (gap > 220) quiet = false; else return; }
    if (busy) return;
    if (gap > 220) acc = 0;
    acc += e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
    if (Math.abs(acc) > 24) { const d = Math.sign(acc); acc = 0; quiet = true; go(idx + d); }
  }, { passive: false });
  let ty = null, tx = null;
  addEventListener('touchstart', e => { if (e.target.closest && e.target.closest('.insta')) { ty = null; return; } ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchmove', e => { if (ty !== null) e.preventDefault(); }, { passive: false });
  addEventListener('touchend', e => {
    if (ty === null) return;
    const dy = ty - e.changedTouches[0].clientY, dx = tx - e.changedTouches[0].clientX; ty = null;
    if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx)) go(idx + Math.sign(dy));
  }, { passive: true });
  addEventListener('keydown', e => {
    if (e.target && e.target.closest && e.target.closest('input,textarea')) return;
    const k = e.key;
    if (['ArrowDown', 'PageDown', ' '].includes(k)) { e.preventDefault(); go(idx + 1); }
    else if (['ArrowUp', 'PageUp'].includes(k)) { e.preventDefault(); go(idx - 1); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(chs.length - 1); }
  });
  addEventListener('hashchange', () => { const i = chs.findIndex(c => '#' + c.id === location.hash); if (i >= 0) go(i); });

  /* ---------- media ---------- */
  const HOOKS = {};
  function media(n) {
    chs.forEach((c, i) => {
      const on = i === n;
      $$('video[data-lazy]', c).forEach(v => {
        if (on) { v.preload = 'auto'; try { v.currentTime = 0; } catch (e) {} if (!RM) v.play().catch(() => {}); }
        else setTimeout(() => { if (idx !== i) v.pause(); }, DUR);
      });
      $$('iframe[data-src]', c).forEach(f => { if (Math.abs(i - n) <= 1) { f.src = f.dataset.src; f.removeAttribute('data-src'); } });
      if (on && !c._counted) { c._counted = true; $$('[data-count]', c).forEach(countUp); }
      const h = HOOKS[c.id]; if (h) on ? h.start() : setTimeout(() => { if (idx !== i) h.stop(); }, DUR);
    });
  }
  function countUp(el) {
    const to = +el.dataset.count; if (RM) { el.textContent = to; return; }
    const t0 = performance.now() + 400;
    const step = t => { const k = 1 - Math.pow(1 - clamp((t - t0) / 1400, 0, 1), 3); el.textContent = Math.round(to * k); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const loop = fn => { let r = 0; const run = t => { fn(t); r = requestAnimationFrame(run); }; return { start() { if (!r && !RM) r = requestAnimationFrame(run); }, stop() { cancelAnimationFrame(r); r = 0; } }; };

  /* 2016: player progress */
  (() => {
    const v = $('#introV'), pr = $('#plProg'), tm = $('#plTime');
    const f = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    HOOKS.c1 = loop(() => { if (!v.duration) return; pr.style.width = (v.currentTime / v.duration * 100).toFixed(2) + '%'; tm.textContent = `${f(v.currentTime)} / ${f(v.duration)}`; });
  })();

  /* 2017: timeline of a normal YouTube video */
  (() => {
    const SHOTS = ['GaSKqVchQQI', 'KAEcJGP5n-k', 'u2mRy3C74-U', 'aFD6LNC98H8', 'hLyWZzblllo', 'mGmyw96FFR4'];
    const V1 = [[0, .1, 'Intro'], [.1, .22, 'Hook'], [.22, .44, 'Inhalt'], [.44, .56, 'B-Roll'], [.56, .78, 'Inhalt'], [.78, .9, 'Outro'], [.9, 1, 'Endcard']];
    const clip = (l, a, b, txt, cls, wave) => {
      const d = document.createElement('div'); d.className = 'clip ' + (cls || '');
      d.style.left = a * 100 + '%'; d.style.width = (b - a) * 100 - .4 + '%'; d.dataset.a = a; d.dataset.b = b;
      if (wave) {
        let p = 'M0 50'; for (let k = 0; k <= 100; k++) p += ` L${k} ${(50 + Math.sin(k * 1.9) * Math.abs(Math.sin(k * .23)) * (wave === 2 ? 18 : 38)).toFixed(1)}`;
        d.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${p}" fill="none" stroke="currentColor" stroke-width="1.2" vector-effect="non-scaling-stroke"/></svg>`;
      } else d.textContent = txt;
      $('#' + l).appendChild(d); return d;
    };
    V1.forEach(([a, b, t], k) => clip('lV1', a, b, t, k % 2 ? 'alt' : ''));
    [[.02, .09, 'Logo'], [.12, .2, 'Titel'], [.3, .37, 'Bauchbinde'], [.62, .7, 'Text'], [.8, .89, 'Abo-Button']].forEach(([a, b, t]) => clip('lV2', a, b, t, 'alt'));
    clip('lA1', .1, .9, '', 'au', 1); clip('lA2', 0, 1, '', 'au', 2);
    const ruler = $('#ruler');
    for (let s = 0; s <= 8; s++) { const sp = document.createElement('span'); sp.style.left = (s / 8 * 100) + '%'; sp.textContent = `0${Math.floor(s * 17.5 / 60)}:${String(Math.floor((s * 17.5) % 60)).padStart(2, '0')}`; ruler.appendChild(sp); }
    const v1 = $$('#lV1 .clip'), im = $('#monImg'), tc = $('#tc'), tr = $('#tracks'), fl = $('#cutFlash');
    let t0 = 0, last = -1;
    const h = loop(t => {
      if (!t0) t0 = t;
      const p = ((t - t0) % 14000) / 14000;
      tr.style.setProperty('--ph', p.toFixed(4));
      const secs = p * 140, s = Math.floor(secs), f = Math.floor((secs % 1) * 25);
      tc.textContent = `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
      let cur = 0; v1.forEach((c, k) => { const on = p >= +c.dataset.a && p < +c.dataset.b; c.classList.toggle('hot', on); if (on) cur = k; });
      if (cur !== last) {
        last = cur; im.src = `assets/y17/${SHOTS[cur % SHOTS.length]}.webp`;
        im.classList.remove('flip'); void im.offsetWidth; im.classList.add('flip');
        fl.animate([{ opacity: .5 }, { opacity: 0 }], { duration: 260, easing: 'ease-out' });
      }
    });
    HOOKS.c2 = { start() { t0 = 0; h.start(); }, stop: h.stop };
  })();

  /* 2019: spectrum + release spotlight */
  (() => {
    const cv = $('#spec'), x = cv.getContext('2d'), lis = $$('#rel li'), relEl = $('#rel'), spot = $('#spot');
    let k = 0, timer = 0;
    const show = i => {
      lis.forEach((l, j) => l.classList.toggle('hot', j === i));
      spot.innerHTML = `<span>Release</span><b>${lis[i].querySelector('b').textContent}</b><em>${lis[i].dataset.d}</em>`;
      spot.classList.remove('flip'); void spot.offsetWidth; spot.classList.add('flip');
    };
    const step = () => { show(k); const end = k === lis.length - 1; k = end ? 0 : k + 1; timer = setTimeout(step, end ? 3500 : 900); };
    const spec = loop(t => {
      const dpr = Math.min(devicePixelRatio, 1.5), w = cv.width = cv.clientWidth * dpr, h = cv.height = cv.clientHeight * dpr;
      const n = Math.max(48, Math.floor(w / 14)), bw = w / n, beat = (t / 1000) * (142 / 60), kick = Math.pow(1 - (beat % 1), 4);
      x.fillStyle = '#000';
      for (let j = 0; j < n; j++) {
        const q = j / n, low = Math.exp(-q * 5) * (0.35 + kick * 0.65), mid = 0.25 * (0.5 + 0.5 * Math.sin(t / 260 + j * 0.45)), hi = 0.12 * Math.abs(Math.sin(t / 90 + j * 2.3));
        const v = clamp(low + mid * (1 - q * .5) + hi, 0, 1) * h * .92; x.fillRect(j * bw + 1, h - v, bw - 3, v);
      }
    });
    HOOKS.c3 = {
      start() { spec.start(); clearTimeout(timer); k = 0; relEl.classList.add('cycling'); timer = setTimeout(step, 1300); },
      stop() { spec.stop(); clearTimeout(timer); relEl.classList.remove('cycling'); lis.forEach(l => l.classList.remove('hot')); }
    };
  })();

  /* 2022: UNIQUEBABY show */
  (() => {
    const svg = $('#ubDraw'), src = $('#ubPath');
    if (svg && src) {
      const f = src.cloneNode(); f.removeAttribute('id'); f.setAttribute('class', 'ub-f');
      const s = src.cloneNode(); s.removeAttribute('id'); s.setAttribute('class', 'ub-s'); s.setAttribute('pathLength', '1');
      svg.appendChild(f); svg.appendChild(s);
    }
    const st = $$('#steps li'); let tm = [];
    const set = i => st.forEach((l, j) => l.classList.toggle('act', j === i));
    HOOKS.c4 = { start() { tm.forEach(clearTimeout); set(0); tm = [[2600, 1], [4600, 2], [5200, 3]].map(([d, i]) => setTimeout(() => set(i), RM ? 0 : d)); }, stop() { tm.forEach(clearTimeout); } };
  })();

  /* 06: musikvideos – reel mit auto-spotlight */
  (() => {
    const reel = $('#reel'); if (!reel) return;
    const figs = $$('figure', reel), cr = $$('#credits li'), bar = $('.reel-bar', reel), CYC = 4200;
    let act = 0, tm = 0;
    reel.style.setProperty('--cyc', CYC + 'ms');
    figs.forEach((f, k) => f.style.setProperty('--k', k));
    const lay = () => {
      figs.forEach((f, k) => {
        const p = (k - act + figs.length) % figs.length; f.dataset.p = p;
        const v = $('video', f);
        if (v) { if (p === 0 && idx === 6 && !RM) { v.preload = 'auto'; v.play().catch(() => {}); } else if (p !== 0) v.pause(); }
      });
      cr.forEach((l, k) => l.classList.toggle('hot', k === act));
      bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run');
    };
    lay();
    const step = () => { act = (act + 1) % figs.length; lay(); tm = setTimeout(step, CYC); };
    HOOKS.c6 = { start() { clearTimeout(tm); act = 0; lay(); tm = setTimeout(step, CYC); }, stop() { clearTimeout(tm); bar.classList.remove('run'); } };
  })();

  /* 07: branding – kartendeck */
  (() => {
    const deck = $('#deck'); if (!deck) return;
    const cards = $$('figure', deck), li = $$('#blist li'), n = cards.length;
    const num = document.createElement('span'); num.className = 'deck-n'; deck.appendChild(num);
    let order = cards.map((_, k) => k), tm = 0, lock = false;
    const lay = () => {
      order.forEach((c, p) => { const el = cards[c]; el.style.setProperty('--p', p); el.style.zIndex = n - p; el.classList.toggle('front', p === 0); });
      li.forEach((l, k) => l.classList.toggle('hot', k === order[0]));
      num.textContent = `${String(order[0] + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    };
    const next = () => {
      if (lock) return; lock = true;
      const top = cards[order[0]]; top.classList.add('throw');
      setTimeout(() => {
        order.push(order.shift()); top.style.transition = 'none'; top.classList.remove('throw'); lay();
        void top.offsetWidth; top.style.transition = ''; lock = false;
      }, RM ? 0 : 560);
    };
    lay();
    const auto = () => { tm = setTimeout(() => { next(); auto(); }, 3400); };
    deck.addEventListener('click', () => { clearTimeout(tm); next(); auto(); });
    HOOKS.c7 = { start() { clearTimeout(tm); order = cards.map((_, k) => k); lay(); auto(); }, stop() { clearTimeout(tm); } };
  })();

  /* 08: cover – mosaik setzt sich zusammen + lupe */
  (() => {
    const mo = $('#mosaic'); if (!mo) return;
    const lens = $('#lens'), CX = 8, CY = 5, Z = 2.6;
    mo.style.setProperty('--cx', CX); mo.style.setProperty('--cy', CY);
    const frag = document.createDocumentFragment();
    for (let y = 0; y < CY; y++) for (let x = 0; x < CX; x++) {
      const t = document.createElement('i'); t.className = 't';
      t.style.backgroundPosition = `${x / (CX - 1) * 100}% ${y / (CY - 1) * 100}%`;
      const dist = Math.hypot(x - CX / 2, y - CY / 2);
      t.style.setProperty('--d', (dist * 70 + Math.random() * 160) + 'ms');
      t.style.setProperty('--dx', ((x - CX / 2) * 22 + (Math.random() - .5) * 60) + 'px');
      t.style.setProperty('--dy', ((y - CY / 2) * 22 + (Math.random() - .5) * 60) + 'px');
      t.style.setProperty('--r', ((Math.random() - .5) * 24) + 'deg');
      frag.appendChild(t);
    }
    mo.insertBefore(frag, lens);
    let hover = false, raf = 0, t0 = 0, px = 0, py = 0;
    const place = (x, y) => {
      const r = mo.getBoundingClientRect(), L = lens.offsetWidth;
      x = clamp(x, 0, r.width); y = clamp(y, 0, r.height);
      lens.style.transform = `translate(${x - L / 2}px,${y - L / 2}px)`;
      lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      lens.style.backgroundPosition = `${-(x * Z - L / 2)}px ${-(y * Z - L / 2)}px`;
    };
    const wander = t => {
      if (!t0) t0 = t; const s = (t - t0) / 1000, r = mo.getBoundingClientRect();
      if (!hover) place(r.width * (.5 + .36 * Math.sin(s * .45)), r.height * (.5 + .32 * Math.sin(s * .71 + 1)));
      raf = requestAnimationFrame(wander);
    };
    mo.addEventListener('pointermove', e => { const r = mo.getBoundingClientRect(); hover = true; px = e.clientX - r.left; py = e.clientY - r.top; place(px, py); });
    mo.addEventListener('pointerleave', () => { hover = false; });
    let tm = 0;
    HOOKS.c8 = {
      start() { clearTimeout(tm); tm = setTimeout(() => { lens.classList.add('show'); t0 = 0; if (!RM) raf = requestAnimationFrame(wander); else place(mo.clientWidth / 2, mo.clientHeight / 2); }, RM ? 0 : 2600); },
      stop() { clearTimeout(tm); cancelAnimationFrame(raf); lens.classList.remove('show'); }
    };
  })();

  /* 09: 3D – coverflow */
  (() => {
    const ring = $('#ring'); if (!ring) return;
    const figs = $$('figure', ring), n = figs.length;
    let k = 0, tm = 0;
    const show = () => figs.forEach((f, i) => {
      let p = ((i - k) % n + n) % n; if (p > n / 2) p -= n;
      f.style.setProperty('--p', p); f.style.zIndex = 10 - Math.abs(p) * 2; f.classList.toggle('front', p === 0);
    });
    show();
    const step = () => { k++; show(); tm = setTimeout(step, 3600); };
    HOOKS.c9 = { start() { clearTimeout(tm); k = 0; show(); tm = setTimeout(step, 3000); }, stop() { clearTimeout(tm); } };
  })();

  /* pixelview viewfinder */
  (() => {
    const tc = $('#vfTc'), meters = $$('.vf-meter i'); let t0 = 0;
    const h = loop(t => {
      if (!t0) t0 = t; const s = (t - t0) / 1000, f = Math.floor((s % 1) * 24);
      tc.textContent = ['00', String(Math.floor(s / 60) % 60).padStart(2, '0'), String(Math.floor(s) % 60).padStart(2, '0'), String(f).padStart(2, '0')].join(':');
      meters.forEach((m, k) => m.style.setProperty('--lv', (35 + Math.random() * 45 + Math.sin(t / 220 + k) * 10) + '%'));
    });
    HOOKS.c5 = { start() { t0 = 0; h.start(); }, stop: h.stop };
  })();

  /* ---------- cursor + magnetic buttons ---------- */
  if (FINE && !RM) {
    document.body.classList.add('has-cur');
    const c = $('#cur'), lab = $('#curL'), dot = $('.cur-dot'), ring = $('.cur-ring');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function l() { rx += (mx - rx) * .2; ry += (my - ry) * .2; dot.style.transform = `translate(${mx}px,${my}px)`; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(l); })();
    document.addEventListener('pointerover', e => { const t = e.target.closest && e.target.closest('[data-cur]'); if (t) { lab.textContent = t.dataset.cur; c.classList.add('big'); } });
    document.addEventListener('pointerout', e => { const t = e.target.closest && e.target.closest('[data-cur]'); if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) c.classList.remove('big'); });
    $$('.three figure, .vids li, .player, .vf-card, .insta').forEach(el => {
      el.classList.add('tilt');
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('.btn, .hud-cta').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .25}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) Object.values(HOOKS).forEach(h => h.stop()); else media(idx); });

  /* ---------- loader ---------- */
  const ld = $('#ld'), t0 = performance.now(), MIN = RM ? 200 : 1600;
  let ready = false;
  Promise.all([document.fonts ? document.fonts.ready : 0, new Promise(r => { const v = $('#c0 video'); if (!v || v.readyState >= 2) r(); else { v.addEventListener('loadeddata', r, { once: true }); v.addEventListener('error', r, { once: true }); } })]).then(() => ready = true);
  setTimeout(() => ready = true, 4500);
  const startAt = chs.findIndex(c => '#' + c.id === location.hash);
  (function lload(t) {
    const k = Math.min(1, (t - t0) / MIN), s = ready ? k : Math.min(k, .85);
    document.documentElement.style.setProperty('--lp', (s * 100).toFixed(1) + '%');
    $('#ldYear').textContent = 2016 + Math.round(s * 10);
    if (s >= 1) { ld.classList.add('out'); document.body.classList.remove('loading'); go(Math.max(0, startAt), true); setTimeout(() => ld.remove(), 1000); return; }
    requestAnimationFrame(lload);
  })(t0);
})();
