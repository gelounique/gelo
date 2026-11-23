/* gelo.uniquebaby.de v3 – one scroll = one chapter, with the animated details */
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
  document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('video,img,.player,.yt,.nle,.vf-card')) e.preventDefault(); });
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
    chs.forEach((c, i) => c._rail.classList.toggle('act', i === n));
    history.replaceState(null, '', n ? '#' + ch.id : location.pathname);
    media(n);
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
  function ytMount(box) {
    if (box._if || RM) return;
    const id = box.dataset.yt, st = box.dataset.start || 0;
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&start=${st}&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    f.title = 'Hintergrundvideo'; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true'); f.allow = 'autoplay; encrypted-media';
    f.addEventListener('load', () => {
      const ping = () => { try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id, channel: 'widget' }), '*'); } catch (e) {} };
      ping(); box._ping = setInterval(ping, 600); setTimeout(() => clearInterval(box._ping), 9000);
    });
    box.appendChild(f); box._if = f;
  }
  addEventListener('message', e => {
    if (!/youtube/.test(e.origin)) return;
    let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
    if (!d || !d.info || d.info.playerState !== 1) return;
    $$('.yt').forEach(b => { if (b._if && b._if.contentWindow === e.source) { clearInterval(b._ping); setTimeout(() => b.classList.add('live'), 250); } });
  });
  const HOOKS = {};
  function media(n) {
    chs.forEach((c, i) => {
      const on = i === n;
      $$('video[data-lazy]', c).forEach(v => {
        if (on) { v.preload = 'auto'; try { v.currentTime = 0; } catch (e) {} if (!RM) v.play().catch(() => {}); }
        else setTimeout(() => { if (idx !== i) v.pause(); }, DUR);
      });
      if (on || Math.abs(i - n) === 1) $$('.yt', c).forEach(ytMount);
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

  /* branding wall */
  (() => {
    const pick = {
      p: ['i/post-brand_nicht-wie-ihr.webp', 'i/post-musik_omah-lay.webp', 'i/post-universum.webp', 'i/post-studios.webp', 'i/post-ub-lab.webp', 'i/post-merch.webp'],
      s: ['sp/antisocial.webp', 'sp/keinplan.webp', 'sp/blickkontakt.webp', 'sp/ami-paris.webp', 'sp/normal-hoodtrap.webp', 'sp/auf-street.webp', 'sp/16.webp', 'sp/nml.webp', 'sp/2many.webp', 'sp/lostvalentine.webp', 'sp/omah-lay.webp', 'sp/unreal.webp'],
      y: ['yt/-P8gzIYTQVg.webp', 'yt/Fqftex3O-Eg.webp', 'yt/a3qt13N1za4.webp', 'yt/FyR6i-aJ7Rs.webp', 'yt/LmmWumcNIWA.webp', 'yt/XgBeY5RNKBE.webp', 'yt/4LotSmYx3uM.webp', 'yt/mo-Xa15N2Oo.webp', 'yt/zD-hqN62FNs.webp', 'yt/qI-qVAYC6Xk.webp', 'yt/PrNs7qBuZ5w.webp'],
      b: ['p/br-lemonjuice.webp', 'p/br-07tv.webp', 'p/br-zelavi.webp', 'p/3d-kopfschmerzen.webp', 'p/3d-faberge.webp', 'p/3d-bonustrack.webp', 'i/kv-lab-ringe.webp', 'i/ub3d-glitch.webp']
    };
    const cols = [['p', 'y', 's', 'b', 'y', 's'], ['s', 'b', 'y', 'p', 's', 'y'], ['y', 's', 'p', 'y', 'b', 's'], ['b', 'y', 's', 'p', 'y', 'b'], ['s', 'p', 'y', 's', 'b', 'y']];
    const cnt = { p: 0, s: 3, y: 0, b: 0 };
    const wall = $('#wall'), inner = document.createElement('div'); inner.className = 'wall-in';
    cols.forEach((list, ci) => {
      const col = document.createElement('div'); col.className = 'col' + (ci % 2 ? ' rev' : ''); col.style.setProperty('--t', (34 + ci * 7) + 's');
      const html = list.map(key => { const a = pick[key][cnt[key]++ % pick[key].length]; return `<div class="tile"><img src="assets/${a}" alt="" loading="lazy" decoding="async" draggable="false"></div>`; }).join('');
      col.innerHTML = html + html; inner.appendChild(col);
    });
    wall.appendChild(inner);
  })();

  /* pixelview viewfinder */
  (() => {
    const tc = $('#vfTc'), meters = $$('.vf-meter i'); let t0 = 0;
    const h = loop(t => {
      if (!t0) t0 = t; const s = (t - t0) / 1000, f = Math.floor((s % 1) * 24);
      tc.textContent = ['00', String(Math.floor(s / 60) % 60).padStart(2, '0'), String(Math.floor(s) % 60).padStart(2, '0'), String(f).padStart(2, '0')].join(':');
      meters.forEach((m, k) => m.style.setProperty('--lv', (35 + Math.random() * 45 + Math.sin(t / 220 + k) * 10) + '%'));
    });
    HOOKS.c7 = { start() { t0 = 0; h.start(); }, stop: h.stop };
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
    $$('.btn, .hud-cta').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .25}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) Object.values(HOOKS).forEach(h => h.stop()); else media(idx); });

  /* ---------- loader ---------- */
  const ld = $('#ld'), t0 = performance.now(), MIN = RM ? 200 : 1600;
  let ready = false;
  Promise.all([document.fonts ? document.fonts.ready : 0, new Promise(r => { const im = $('#c0 .poster'); if (im.complete) r(); else im.onload = im.onerror = r; })]).then(() => ready = true);
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
