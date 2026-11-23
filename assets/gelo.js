/* gelo.uniquebaby.de v2 – one scroll = one chapter */
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

  // no context menu / dragging on media: videos are view-only
  document.addEventListener('contextmenu', e => { if (e.target.closest('video,img,.frame,.yt,.nle')) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (e.target.closest('img,video')) e.preventDefault(); });

  chs.forEach((ch, i) => {
    ch.style.zIndex = i + 1;
    $$('.rv', ch).forEach((el, k) => el.style.setProperty('--i', k));
    $$('.rel li, .vids li', ch).forEach((el, k) => el.style.setProperty('--k', k));
  });
  $('#hudT').textContent = String(chs.length).padStart(2, '0');

  // rail
  const rail = $('#rail');
  chs.forEach((ch, i) => {
    const a = document.createElement('a'); a.href = '#' + ch.id;
    a.innerHTML = `<span>${ch.dataset.t}</span>`;
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
    // chapters between prev and n (rail jumps) stay hidden
    setTimeout(() => {
      chs.forEach((c, i) => { if (i !== idx) c.classList.remove('vis'); });
      busy = false;
    }, instant ? 0 : DUR);
    const ch = chs[n];
    setTimeout(() => ch.classList.add('on'), instant ? 0 : 120);
    if (prev >= 0) setTimeout(() => chs[prev] && prev !== idx && chs[prev].classList.remove('on'), DUR);
    $('#hudN').textContent = String(n + 1).padStart(2, '0');
    setYear(ch.dataset.year);
    chs.forEach((c, i) => c._rail.classList.toggle('act', i === n));
    history.replaceState(null, '', n ? '#' + ch.id : location.pathname);
    media(n);
  }

  // wheel: one gesture = one chapter (trackpad inertia is swallowed)
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

  // touch: swipe
  let ty = null, tx = null;
  addEventListener('touchstart', e => { if (e.target.closest('.insta')) { ty = null; return; } ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchmove', e => { if (ty !== null) e.preventDefault(); }, { passive: false });
  addEventListener('touchend', e => {
    if (ty === null) return;
    const dy = ty - e.changedTouches[0].clientY, dx = tx - e.changedTouches[0].clientX; ty = null;
    if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx)) go(idx + Math.sign(dy));
  }, { passive: true });

  // keyboard
  addEventListener('keydown', e => {
    if (e.target.closest('input,textarea')) return;
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
    f.title = 'Hintergrundvideo'; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
    f.allow = 'autoplay; encrypted-media';
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
  function media(n) {
    chs.forEach((c, i) => {
      const on = i === n;
      $$('video[data-lazy]', c).forEach(v => {
        if (on) { v.preload = 'auto'; if (!RM) v.play().catch(() => {}); }
        else setTimeout(() => { if (idx !== i) v.pause(); }, DUR);
      });
      $$('.yt', c).forEach(b => { if (on) ytMount(b); });
      $$('iframe[data-src]', c).forEach(f => { if (Math.abs(i - n) <= 1) { f.src = f.dataset.src; f.removeAttribute('data-src'); } });
      if (on && !c._counted) { c._counted = true; $$('[data-count]', c).forEach(countUp); }
    });
    n === 2 ? nleStart() : nleStop();
  }
  function countUp(el) {
    const to = +el.dataset.count; if (RM) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = t => { const k = 1 - Math.pow(1 - Math.min(1, (t - t0) / 1400), 3); el.textContent = Math.round(to * k); if (k < 1) requestAnimationFrame(step); };
    setTimeout(() => requestAnimationFrame(step), 400);
  }

  /* ---------- 2017: timeline of a normal YouTube video ---------- */
  const SHOTS = ['GaSKqVchQQI', 'KAEcJGP5n-k', 'u2mRy3C74-U', 'aFD6LNC98H8', 'hLyWZzblllo', 'mGmyw96FFR4'];
  const V1 = [[0, .1, 'Intro'], [.1, .22, 'Hook'], [.22, .44, 'Inhalt'], [.44, .56, 'B-Roll'], [.56, .78, 'Inhalt'], [.78, .9, 'Outro'], [.9, 1, 'Endcard']];
  const lane = id => $('#' + id);
  const clip = (l, a, b, txt, cls, wave) => {
    const d = document.createElement('div'); d.className = 'clip ' + (cls || '');
    d.style.left = a * 100 + '%'; d.style.width = (b - a) * 100 - .4 + '%'; d.dataset.a = a; d.dataset.b = b;
    if (wave) {
      let p = 'M0 50'; for (let k = 0; k <= 100; k++) p += ` L${k} ${(50 + Math.sin(k * 1.9) * Math.abs(Math.sin(k * .23)) * (wave === 2 ? 18 : 38)).toFixed(1)}`;
      d.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${p}" fill="none" stroke="currentColor" stroke-width="1.2" vector-effect="non-scaling-stroke"/></svg>`;
    } else d.textContent = txt;
    l.appendChild(d); return d;
  };
  V1.forEach(([a, b, t], k) => clip(lane('lV1'), a, b, t, k % 2 ? 'alt' : ''));
  [[.02, .09, 'Logo'], [.12, .2, 'Titel'], [.3, .37, 'Bauchbinde'], [.62, .7, 'Text'], [.8, .89, 'Abo-Button']].forEach(([a, b, t]) => clip(lane('lV2'), a, b, t, 'alt'));
  clip(lane('lA1'), .1, .9, '', 'au', 1);
  clip(lane('lA2'), 0, 1, '', 'au', 2);
  const v1clips = $$('#lV1 .clip');
  let nleT = 0, nle0 = 0, lastShot = -1;
  const LOOP = 14000;
  function nleLoop(t) {
    const p = ((t - nle0) % LOOP) / LOOP;
    $('#tracks').style.setProperty('--ph', p.toFixed(4));
    const secs = p * 14 * 60 / 6.0; // ~2:20 min video
    const s = Math.floor(secs), f = Math.floor((secs % 1) * 25);
    $('#tc').textContent = `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
    let cur = 0;
    v1clips.forEach((c, k) => { const on = p >= +c.dataset.a && p < +c.dataset.b; c.classList.toggle('hot', on); if (on) cur = k; });
    if (cur !== lastShot) { lastShot = cur; const im = $('#monImg'); im.src = `assets/y17/${SHOTS[cur % SHOTS.length]}.webp`; im.classList.remove('flip'); void im.offsetWidth; im.classList.add('flip'); }
    nleT = requestAnimationFrame(nleLoop);
  }
  function nleStart() { if (nleT || RM) return; nle0 = performance.now(); nleT = requestAnimationFrame(nleLoop); }
  function nleStop() { cancelAnimationFrame(nleT); nleT = 0; }

  /* ---------- cursor ---------- */
  if (FINE && !RM) {
    document.body.classList.add('has-cur');
    const c = $('#cur'), ring = $('#cur i');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() { rx += (mx - rx) * .22; ry += (my - ry) * .22; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
    document.addEventListener('pointerover', e => c.classList.toggle('big', !!e.target.closest('a,button')));
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) nleStop(); else media(idx); });

  /* ---------- loader ---------- */
  const ld = $('#ld'), t0 = performance.now(), MIN = RM ? 200 : 1500;
  let ready = false;
  Promise.all([document.fonts ? document.fonts.ready : 0, new Promise(r => { const im = $('#c0 .poster'); if (im.complete) r(); else im.onload = im.onerror = r; })]).then(() => ready = true);
  setTimeout(() => ready = true, 4500);
  const start = chs.findIndex(c => '#' + c.id === location.hash);
  (function lload(t) {
    const k = Math.min(1, (t - t0) / MIN), s = ready ? k : Math.min(k, .85);
    document.documentElement.style.setProperty('--lp', (s * 100).toFixed(1) + '%');
    $('#ldYear').textContent = 2016 + Math.round(s * 10);
    if (s >= 1) { ld.classList.add('out'); document.body.classList.remove('loading'); go(Math.max(0, start), true); setTimeout(() => ld.remove(), 1000); return; }
    requestAnimationFrame(lload);
  })(t0);
})();
