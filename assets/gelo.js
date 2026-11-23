/* gelo.uniquebaby.de – sticky chapter engine */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const map = (v, a, b) => clamp((v - a) / (b - a));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;

  const chs = $$('.ch');
  let vh = innerHeight, vw = innerWidth;

  /* ---------- setup ---------- */
  chs.forEach((ch, i) => {
    ch.style.setProperty('--len', ch.dataset.len || 1);
    ch.style.zIndex = i + 1;
    $$('.rv', ch).forEach((el, k) => el.style.setProperty('--i', k));
    ch._st = $('.st', ch);
    ch._vals = {};
  });
  // hero name → animated words/letters
  $$('.hn').forEach(h => {
    let k = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach(ch => {
            if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = ch; s.style.setProperty('--k', k++); frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.classList && n.classList.contains('bl')) {
          n.classList.add('w'); n.style.setProperty('--k', k++);
        }
      });
    };
    walk(h);
  });
  $$('.since > a, .since > .soon').forEach((a, k) => a.style.setProperty('--k', k));

  // rail
  const rail = $('#rail');
  chs.forEach((ch, i) => {
    const a = document.createElement('a');
    a.href = '#' + ch.id;
    a.innerHTML = `<i></i><span>${ch.dataset.n} · ${ch.dataset.t}</span>`;
    a.addEventListener('click', e => { e.preventDefault(); goTo(i); });
    rail.appendChild(a);
    ch._rail = a;
  });
  $('.hud-brand').addEventListener('click', e => { e.preventDefault(); goTo(0); });

  // year ticker
  const yr = $('#yr');
  const digs = [];
  for (let d = 0; d < 4; d++) {
    const col = document.createElement('span'); col.className = 'dg';
    col.innerHTML = [...'0123456789'].map(n => `<span>${n}</span>`).join('');
    yr.appendChild(col); digs.push(col);
  }
  let curYear = '';
  function setYear(y) {
    if (y === curYear) return; curYear = y;
    [...y].forEach((n, d) => digs[d].style.transform = `translateY(${-n}em)`);
  }

  /* ---------- smooth scroll (desktop wheel only) ---------- */
  let target = scrollY, cur = scrollY, smoothing = false;
  const maxScroll = () => document.documentElement.scrollHeight - vh;
  function smoothLoop() {
    cur += (target - cur) * 0.085;
    if (Math.abs(target - cur) < 0.4) { cur = target; smoothing = false; }
    window.scrollTo(0, cur);
    if (smoothing) requestAnimationFrame(smoothLoop);
  }
  function startSmooth() { if (!smoothing) { smoothing = true; requestAnimationFrame(smoothLoop); } }
  if (FINE && !RM) {
    addEventListener('wheel', e => {
      if (e.ctrlKey || document.body.classList.contains('loading')) return;
      if (e.target.closest && e.target.closest('.since')) return;
      e.preventDefault();
      if (!smoothing) cur = target = scrollY;
      const d = e.deltaMode === 1 ? e.deltaY * 36 : e.deltaMode === 2 ? e.deltaY * vh : e.deltaY;
      target = clamp(target + d, 0, maxScroll());
      startSmooth();
    }, { passive: false });
    addEventListener('scroll', () => { if (!smoothing) cur = target = scrollY; }, { passive: true });
  }
  function chTop(i) { // document scroll position where chapter i is fully in
    let y = 0;
    for (let k = 0; k < i; k++) y += (+chs[k].dataset.len + 1) * vh;
    return y;
  }
  function goTo(i) {
    const y = clamp(chTop(i) + (i ? 2 : 0), 0, maxScroll());
    if (FINE && !RM) { cur = scrollY; target = y; startSmooth(); }
    else window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
  }

  /* ---------- YouTube backgrounds ---------- */
  function ytMount(box) {
    if (box._if || RM) return;
    clearTimeout(box._kill);
    const id = box.dataset.yt, st = box.dataset.start || 0;
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&start=${st}`;
    f.title = 'Hintergrundvideo (stumm)';
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
    f.src += '&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
    f.addEventListener('load', () => {
      const ping = () => { try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: id, channel: 'widget' }), '*'); } catch (e) {} };
      ping(); clearInterval(box._ping); box._ping = setInterval(ping, 600);
      setTimeout(() => clearInterval(box._ping), 9000);
    });
    box.appendChild(f); box._if = f;
  }
  addEventListener('message', e => {
    if (!/youtube/.test(e.origin)) return;
    let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
    const st = d && d.info && d.info.playerState;
    if (st === undefined) return;
    $$('.yt').forEach(b => {
      if (b._if && b._if.contentWindow === e.source) {
        if (st === 1) { clearInterval(b._ping); setTimeout(() => b._if && b.classList.add('live'), 250); }
      }
    });
  });
  function ytUnmount(box) {
    if (!box._if || box._kill) return;
    box._kill = setTimeout(() => { box.classList.remove('live'); box._if && box._if.remove(); box._if = null; box._kill = null; }, 5000);
  }
  function ytKeep(box) { if (box._kill) { clearTimeout(box._kill); box._kill = null; } }

  /* ---------- per-chapter state ---------- */
  function setVar(ch, k, v) {
    const r = Math.round(v * 1000) / 1000;
    if (ch._vals[k] !== r) { ch._vals[k] = r; ch.style.setProperty(k, r); }
  }
  let active = -1;
  const hudN = $('#hudN'), hudT = $('#hudT'), hudCh = $('.hud-ch');

  function frame() {
    for (let i = 0; i < chs.length; i++) {
      const ch = chs[i];
      const r = ch.getBoundingClientRect();
      const len = +ch.dataset.len * vh;
      const e = clamp(1 - r.top / vh);              // entering (0 → 1)
      const p = clamp(-r.top / len);                  // pinned progress
      const c = i === chs.length - 1 ? 0 : clamp((-r.top - len) / vh); // being covered
      const near = r.top < vh * 1.05 && c < 1;
      ch._p = p; ch._e = e; ch._c = c; ch._near = near;
      if (!near && !ch._wasNear) continue;
      ch._wasNear = near;
      setVar(ch, '--e', i === 0 ? 1 : ease(e));
      setVar(ch, '--p', p);
      setVar(ch, '--c', c);
      ch.classList.toggle('gone', c >= 1);
      const on = e > 0.55 && c < 0.95;
      if (on !== ch._on) { ch._on = on; ch.classList.toggle('on', on); onToggle(ch, i, on); }
      // media
      $$('.yt', ch).forEach(b => { if (near) { ytMount(b); ytKeep(b); } else ytUnmount(b); });
      if (near && FX[i]) FX[i](p, e, c, ch);
    }
    // active chapter = last whose top passed the middle
    let a = 0;
    for (let i = 0; i < chs.length; i++) if (chs[i].getBoundingClientRect().top <= vh * 0.5) a = i;
    if (a !== active) {
      active = a;
      const ch = chs[a];
      hudN.textContent = ch.dataset.n; hudT.textContent = ch.dataset.t;
      hudCh.classList.remove('flip'); void hudCh.offsetWidth; hudCh.classList.add('flip');
      setYear(ch.dataset.year);
      chs.forEach((c, k) => c._rail.classList.toggle('act', k === a));
    }
    chs.forEach((c, k) => {
      const f = k === chs.length - 1 ? c._e : c._p;
      c._rail.style.setProperty('--f', (f || 0).toFixed(3));
      c._rail.style.setProperty('--o', k === active ? 1 : 0);
    });
  }

  function onToggle(ch, i, on) {
    $$('video[data-lazy]', ch).forEach(v => {
      if (on) {
        if (v.preload !== 'auto') { v.preload = 'auto'; }
        if (!RM) v.play().catch(() => {});
      } else v.pause();
    });
    if (on && !ch._counted) { ch._counted = true; $$('[data-count]', ch).forEach(countUp); }
    if (i === 1) on ? window.IntroAnim && IntroAnim.start() : window.IntroAnim && IntroAnim.stop();
    if (i === 4) on ? specStart() : specStop();
    if (i === 7) on ? vfStart() : vfStop();
  }

  function countUp(el) {
    const to = +el.dataset.count, suf = el.dataset.suf || '';
    if (RM) { el.textContent = to + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const step = t => { const k = ease(clamp((t - t0) / dur)); el.textContent = Math.round(to * k) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------- FX per chapter ---------- */
  const FX = {};

  // 00 hero – role cycler
  (() => {
    const spans = $$('#roles span'); let k = 0;
    spans[0].classList.add('in');
    setInterval(() => {
      if (document.hidden) return;
      const a = spans[k]; k = (k + 1) % spans.length; const b = spans[k];
      a.classList.remove('in'); a.classList.add('out');
      b.classList.remove('out'); b.classList.add('in');
      setTimeout(() => a.classList.remove('out'), 650);
    }, 1700);
  })();

  // 02 design wall
  (() => {
    const T = n => `assets/${n}`;
    const set = {
      p: ['i/post-brand_nicht-wie-ihr.webp', 'i/post-musik_omah-lay.webp', 'i/post-universum.webp', 'i/post-studios.webp', 'i/post-ub-lab.webp', 'i/post-merch.webp'],
      h: ['i/hoch-universum.webp', 'i/hoch-brand_nicht-wie-ihr.webp', 'i/hoch-musik_omah-lay.webp', 'i/hoch-studios.webp', 'i/hoch-ub-lab.webp', 'i/hoch-merch.webp'],
      c: ['i/cover-nml.webp', 'i/cover-like-me.webp', 'i/cover-2many.webp', 'i/cover-cop-some.webp', 'i/cover-omah-lay.webp'],
      y: ['yt/-P8gzIYTQVg.webp', 'yt/Fqftex3O-Eg.webp', 'yt/a3qt13N1za4.webp', 'yt/FyR6i-aJ7Rs.webp', 'yt/LmmWumcNIWA.webp', 'yt/XgBeY5RNKBE.webp', 'yt/4LotSmYx3uM.webp', 'yt/mo-Xa15N2Oo.webp', 'yt/zD-hqN62FNs.webp', 'yt/qI-qVAYC6Xk.webp', 'yt/eHY_uJKNNXE.webp', 'yt/PrNs7qBuZ5w.webp'],
      k: ['i/kv-nwi.webp', 'i/kv-lab-ringe.webp', 'i/ub3d-glitch.webp', 'i/kv-studios-3d-objekte.webp', 'i/mares-selfload.webp']
    };
    const cols = [
      ['p0', 'y0', 'c0', 'h0', 'y1', 'p1', 'k0', 'c1'],
      ['h1', 'y2', 'p2', 'V', 'y3', 'c2', 'h2'],
      ['y4', 'c3', 'k1', 'p3', 'y5', 'h3', 'y6', 'c4'],
      ['p4', 'k2', 'y7', 'h4', 'c0', 'y8', 'p5'],
      ['y9', 'h5', 'k3', 'y10', 'p0', 'k4', 'y11', 'c2']
    ];
    const sp = [1, -0.55, 1.25, -0.8, 0.95], off = ['-28svh', '-90svh', '-38svh', '-80svh', '-20svh'];
    const wall = $('#wall');
    const inner = document.createElement('div'); inner.className = 'wall-in';
    cols.forEach((list, ci) => {
      const col = document.createElement('div'); col.className = 'col';
      col.style.setProperty('--s', sp[ci]); col.style.setProperty('--o', off[ci]);
      list.forEach(code => {
        const t = document.createElement('div'); t.className = 'tile';
        if (code === 'V') {
          t.innerHTML = `<video src="assets/v/turntable.mp4" muted loop playsinline preload="none" data-lazy></video>`;
        } else {
          const key = code[0], n = +code.slice(1);
          if (key === 'y') t.classList.add('r169');
          t.innerHTML = `<img src="${T(set[key][n % set[key].length])}" alt="" loading="lazy" decoding="async">`;
        }
        col.appendChild(t);
      });
      inner.appendChild(col);
    });
    wall.appendChild(inner);
  })();

  // 03 cut – NLE timeline
  const cutCuts = [];
  (() => {
    const ruler = $('#nleRuler');
    for (let s = 0; s <= 40; s += 5) { const sp = document.createElement('span'); sp.style.left = (s / 40 * 100) + '%'; sp.textContent = `00:${String(s).padStart(2, '0')}`; ruler.appendChild(sp); }
    const add = (lane, cls, a, b, label, wave) => {
      const d = document.createElement('div'); d.className = 'clip ' + cls;
      d.style.left = (a * 100) + '%'; d.style.width = ((b - a) * 100 - .4) + '%';
      d.dataset.a = a; d.dataset.b = b;
      if (wave) {
        let path = 'M0 50'; const n = 120;
        for (let k = 0; k <= n; k++) { const x = k / n * 100; const y = 50 + Math.sin(k * 1.7) * Math.abs(Math.sin(k * .21)) * 40 * (k % 8 === 0 ? 1 : .55); path += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
        d.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="#8ef0c0" stroke-width="1.2" vector-effect="non-scaling-stroke"/></svg>`;
      } else d.textContent = label;
      $('#' + lane).appendChild(d); return d;
    };
    const v1 = [[0, .11, 'A-Cam Wide'], [.11, .19, 'CU'], [.19, .3, 'Dolly'], [.3, .36, 'Insert'], [.36, .5, 'Gimbal'], [.5, .57, 'CU'], [.57, .7, 'Drop'], [.7, .78, 'Slowmo'], [.78, .9, 'Wide'], [.9, 1, 'Outro']];
    v1.forEach(([a, b, l]) => { add('laneV1', 'v', a, b, l); cutCuts.push(a); });
    [[.15, .24, 'Text'], [.44, .52, 'Flash'], [.62, .74, 'Overlay'], [.86, .95, 'Logo']].forEach(([a, b, l]) => add('laneV2', 'v2', a, b, l));
    add('laneA1', 'a', 0, 1, '', true);
    add('laneA2', 'a', .19, .57, '', true); add('laneA2', 'a', .62, .92, '', true);
  })();
  let lastPh = 0;
  FX[3] = (p) => {
    const ph = clamp(p * 1.04);
    setVar(chs[3], '--ph', ph);
    const secs = ph * 40, f = Math.floor((secs % 1) * 25);
    $('#tc').textContent = `00:00:${String(Math.floor(secs)).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
    if (!RM) cutCuts.forEach(c => {
      if ((lastPh < c && ph >= c) || (lastPh > c && ph <= c)) { const fl = $('#cutFlash'); fl.animate([{ opacity: .55 }, { opacity: 0 }], { duration: 260, easing: 'ease-out' }); }
    });
    $$('#laneV1 .clip').forEach(cl => cl.classList.toggle('hot', ph >= +cl.dataset.a && ph < +cl.dataset.b));
    lastPh = ph;
  };

  // 04 music – spectrum + cover fan
  const spec = $('#spec'); const sx = spec.getContext('2d'); let specRaf = 0;
  function specDraw(t) {
    const w = spec.width = spec.clientWidth * Math.min(devicePixelRatio, 1.5);
    const h = spec.height = spec.clientHeight * Math.min(devicePixelRatio, 1.5);
    const n = Math.max(48, Math.floor(w / 14)), bw = w / n;
    const beat = (t / 1000) * (142 / 60), kick = Math.pow(1 - (beat % 1), 4);
    const g = sx.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(255,183,213,.9)'); g.addColorStop(1, 'rgba(255,183,213,0)');
    sx.fillStyle = g;
    for (let k = 0; k < n; k++) {
      const x = k / n;
      const low = Math.exp(-x * 5) * (0.35 + kick * 0.65);
      const mid = 0.25 * (0.5 + 0.5 * Math.sin(t / 260 + k * 0.45)) * (0.6 + 0.4 * Math.sin(t / 900 + k));
      const hi = 0.12 * Math.abs(Math.sin(t / 90 + k * 2.3)) * (1 - x * 0.4);
      const v = clamp(low + mid * (1 - x * .5) + hi) * h * 0.92;
      sx.fillRect(k * bw + 1, h - v, bw - 3, v);
    }
  }
  function specLoop(t) { specDraw(t); specRaf = requestAnimationFrame(specLoop); }
  function specStart() { if (RM) { specDraw(1200); return; } if (!specRaf) specRaf = requestAnimationFrame(specLoop); }
  function specStop() { cancelAnimationFrame(specRaf); specRaf = 0; }
  const covers = $$('#covers figure');
  FX[4] = (p, e) => {
    const s = ease(map(p, 0.02, 0.55)) * (vw < 640 ? .7 : 1);
    const hot = Math.min(covers.length - 1, Math.floor(map(p, 0.3, 0.98) * covers.length));
    covers.forEach((f, k) => {
      const o = k - (covers.length - 1) / 2;
      const lift = k === hot && p > .3 ? -6 : 0;
      f.style.transform = `translate(${o * 26 * s}%, ${Math.abs(o) * 6 * s + lift}%) rotate(${o * 9 * s}deg) scale(${(1 - Math.abs(o) * .05 * s) * (0.9 + 0.1 * ease(e))})`;
      f.style.zIndex = k === hot && p > .3 ? 10 : k;
      f.style.setProperty('--lab', k === hot && p > .3 ? 1 : 0);
    });
    const rel = $('#relNow'), f = covers[p > .3 ? hot : covers.length - 1];
    const label = (p > .3 ? 'Release' : 'Neuester Release');
    if (rel._k !== f.dataset.t) { rel._k = f.dataset.t; rel.innerHTML = `<span>${label}</span><b>${f.dataset.t}</b><em>${f.dataset.d}</em>`; }
  };

  // 05 brand – step machine
  (() => {
    // inject path from defs into the draw svg
    const svg = $('#ubDraw'); const src = $('#ubPath');
    if (src && svg) {
      const s = src.cloneNode(); s.removeAttribute('id'); s.setAttribute('class', 'ub-s'); s.setAttribute('pathLength', '1');
      const f = src.cloneNode(); f.removeAttribute('id'); f.setAttribute('class', 'ub-f');
      svg.innerHTML = ''; svg.appendChild(f); svg.appendChild(s);
    }
    $$('#icons img').forEach((im, k) => im.style.setProperty('--k', 1 + k * .35));
  })();
  const steps = $$('#brandSteps li');
  FX[5] = (p) => {
    const ch = chs[5];
    const draw = ease(map(p, 0.0, 0.2));
    const fill = map(p, 0.16, 0.26);
    const turn = map(p, 0.28, 0.38);
    const out = map(p, 0.5, 0.58);
    setVar(ch, '--dash', 1 - draw);
    setVar(ch, '--fill', fill * (1 - turn));
    $('#ubDraw').style.opacity = (1 - turn * .9) * (1 - out);
    setVar(ch, '--to', turn * (1 - out));
    setVar(ch, '--ts', .82 + .18 * ease(turn) - out * .15);
    setVar(ch, '--mo', map(p, 0.12, 0.24) * (1 - map(p, 0.34, 0.42)));
    setVar(ch, '--ko', map(p, 0.34, 0.46) * (1 - map(p, 0.56, 0.62)));
    setVar(ch, '--so', map(p, 0.58, 0.68));
    setVar(ch, '--sx', ease(map(p, 0.66, 0.84)));
    setVar(ch, '--io', ease(map(p, 0.78, 0.92)));
    const st = p < .26 ? 0 : p < .4 ? 1 : p < .56 ? 2 : 3;
    steps.forEach((li, k) => li.classList.toggle('act', k === st));
  };

  // 06 mares – SELFLOAD drives in
  FX[6] = (p, e) => {
    const t = map(p, 0.0, 0.42);
    const bounce = t < 1 ? ease(t) + Math.sin(t * Math.PI) * 0.04 : 1;
    setVar(chs[6], '--sl', Math.max(bounce, ease(map(e, .7, 1)) * .15));
  };

  // 07 pixelview – viewfinder
  let vfT = 0, vfStartT = 0;
  const meters = $$('.vf-meter i');
  function vfLoop(t) {
    const s = (t - vfStartT) / 1000, f = Math.floor((s % 1) * 24);
    const hh = Math.floor(s / 3600), mm = Math.floor(s / 60) % 60, ss = Math.floor(s) % 60;
    $('#vfTc').textContent = [hh, mm, ss, f].map(n => String(n).padStart(2, '0')).join(':');
    meters.forEach((m, k) => m.style.setProperty('--lv', (35 + Math.random() * 45 + (Math.sin(t / 220 + k) * 10)) + '%'));
    vfT = requestAnimationFrame(vfLoop);
  }
  function vfStart() { if (RM || vfT) return; vfStartT = performance.now(); vfT = requestAnimationFrame(vfLoop); }
  function vfStop() { cancelAnimationFrame(vfT); vfT = 0; }

  // 08 video wall
  const VIDS = [
    ['eHY_uJKNNXE', 'OMAH LAY', 'unique · Official Video'],
    ['4LotSmYx3uM', 'COP SOME!', 'DOAN'],
    ['a3qt13N1za4', '2MANY', 'unique & luann'],
    ['peq5_YTQaGE', 'LIKE ME', 'Mbezza'],
    ['FyR6i-aJ7Rs', 'NML', 'unique'],
    ['PrNs7qBuZ5w', 'TRANQUILLE', 'luann & DOAN · Sessions'],
    ['Fqftex3O-Eg', 'TEN RACKZ BANDZ', 'DOAN · Sessions EP4'],
    ['XgBeY5RNKBE', 'NICHT FOREVER', 'luann · Sessions EP3'],
    ['zD-hqN62FNs', '16', 'unique · Sessions EP2'],
    ['-P8gzIYTQVg', 'AUF STREET', 'unique'],
    ['qI-qVAYC6Xk', 'NORMAL HOODTRAP', 'unique'],
    ['mo-Xa15N2Oo', 'Blickkontakt', 'unique & patron'],
    ['LmmWumcNIWA', 'ARMANI', 'unique'],
    ['vTfcwVLRL_s', 'VERBRECHER IN CRIME', 'unique'],
    ['tkxeg67MWFE', 'BEEF', 'unique'],
    ['YpAhEHclb1k', 'GIVENCHY', 'unique'],
    ['h6EmUWWwse0', 'WAHN', 'unique with DOAN'],
    ['ATbWs9O6wjM', 'LANGSAM', 'unique with patron75 & Matteozz'],
    ['Mm0VcFryDaI', 'GEIZIG', 'unique feat. Lixight'],
    ['G0Pv6UnfvSU', 'B24TCH', 'unique'],
    ['3mA-EN2LFu0', 'KEINPLAN', 'unique'],
    ['O5HbxvvWQnY', 'STORY', 'unique'],
    ['Pv-R7REFGUo', 'UNREAL', 'unique']
  ];
  const track = $('#track'); const cards = [];
  VIDS.forEach(([id, t, a], k) => {
    const c = document.createElement('a'); c.className = 'card'; c.href = `https://www.youtube.com/watch?v=${id}`; c.target = '_blank'; c.rel = 'noopener';
    c.dataset.cur = 'Ansehen ↗';
    c.innerHTML = `<div class="im"><img src="assets/yt/${id}.webp" alt="Thumbnail ${t}" loading="lazy" decoding="async"><span class="ix">${String(k + 1).padStart(2, '0')}</span></div><div class="meta"><b>${t}</b><span>${a}</span></div>`;
    track.appendChild(c); cards.push(c);
  });
  $('#wallT').textContent = VIDS.length;
  let trackW = 0, wallIdx = -1;
  const measure = () => { trackW = track.scrollWidth; };
  FX[8] = (p) => {
    if (!trackW) measure();
    const dist = Math.max(0, trackW - vw);
    const tx = ease(map(p, 0.02, 0.98)) * dist;
    track.style.setProperty('--tx', tx.toFixed(1));
    const mid = vw / 2; let best = 0, bd = 1e9;
    cards.forEach((c, k) => {
      const x = c.offsetLeft - tx + c.offsetWidth / 2 + parseFloat(getComputedStyle(track).paddingLeft) * 0;
      const d = (x - mid) / vw;
      c.style.setProperty('--wy', (Math.sin(d * 3.2) * 28).toFixed(1));
      c.style.setProperty('--wr', (d * 3).toFixed(2));
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = k; }
    });
    if (best !== wallIdx) {
      wallIdx = best;
      $('#wallN').textContent = String(best + 1).padStart(2, '0');
      const img = $('#wbImg'); img.style.opacity = 0;
      clearTimeout(img._t); img._t = setTimeout(() => { img.src = `assets/yt/${VIDS[best][0]}.webp`; img.style.opacity = .45; }, 220);
    }
  };

  // 09 timeline
  const tlNodes = $$('.tl-n');
  tlNodes.forEach(n => n.style.setProperty('--at', n.dataset.at));
  FX[9] = (p) => {
    const t = ease(map(p, 0.0, 0.75));
    setVar(chs[9], '--tl', t);
    tlNodes.forEach(n => n.classList.toggle('act', t >= +n.dataset.at - 0.02 || vw < 981 && t >= +n.dataset.at * .9));
  };

  /* ---------- cursor ---------- */
  if (FINE && !RM) {
    document.body.classList.add('has-cur');
    const c = $('#cur'), lab = $('#curL');
    let mx = vw / 2, my = vh / 2, rx = mx, ry = my;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const dot = $('.cur-dot'), ring = $('.cur-ring');
    (function loop() {
      rx += (mx - rx) * .2; ry += (my - ry) * .2;
      dot.style.transform = `translate(${mx}px,${my}px)`;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cur]');
      if (t) { lab.textContent = t.dataset.cur; c.classList.add('big'); }
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('[data-cur]');
      if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) c.classList.remove('big');
    });
    // magnetic buttons
    $$('.btn, .hud-cta').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .25}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- loop ---------- */
  let ticking = false;
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; frame(); }); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { vh = innerHeight; vw = innerWidth; trackW = 0; req(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { specStop(); vfStop(); window.IntroAnim && IntroAnim.stop(); } else { chs.forEach((c, i) => { if (c._on) onToggle(c, i, true); }); } });

  /* ---------- loader ---------- */
  const ld = $('#ld'), ldYear = $('#ldYear');
  const t0 = performance.now(), MIN = RM ? 300 : 1700;
  let ready = false;
  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(r => { const im = $('.ch-hero .poster'); if (im.complete) r(); else { im.onload = im.onerror = r; } })
  ]).then(() => { ready = true; });
  setTimeout(() => { ready = true; }, 5000);
  (function lload(t) {
    const k = ease(clamp((t - t0) / MIN));
    const shown = ready ? k : Math.min(k, .86);
    root.style.setProperty('--lp', (shown * 100).toFixed(1) + '%');
    ldYear.textContent = 2016 + Math.round(shown * 10);
    if (shown >= 1) {
      ld.classList.add('out');
      document.body.classList.remove('loading');
      if (location.hash) { const i = chs.findIndex(c => '#' + c.id === location.hash); if (i > 0) window.scrollTo(0, chTop(i) + 2); }
      frame();
      setTimeout(() => ld.remove(), 1300);
      return;
    }
    requestAnimationFrame(lload);
  })(t0);
  frame();
})();
