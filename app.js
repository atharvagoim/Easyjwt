/* Easy JWT: vanilla JS, zero dependencies */
(() => {
'use strict';

/* ---- About page contact links: set them in .env (see README) ---- */
const CONTACT = Object.assign(
  { phone: '', whatsapp: '', instagram: '', email: '' },
  window.EASY_JWT_CONFIG || {}   // generated from .env by `npm start` / `npm run build`
);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const stage = $('#stage');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STOPS = [128, 192, 256, 384, 512];
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SPECIAL = ALNUM + '!@#$%^&*()-_=+[]{};:,.<>?/~|';
const store = {
  get(k, d) { try { const v = localStorage.getItem('ejwt.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ejwt.' + k, JSON.stringify(v)); } catch {} }
};
const enc = new TextEncoder();
const raf = requestAnimationFrame;

/* ================= stage scaling ================= */
const HEIGHTS = { desk: { gen: 1400, dec: 1400, about: 1550 }, mob: { gen: 1900, dec: 1900, about: 1150 } };
let mobile = false;
function fit() {
  const w = innerWidth; mobile = w < 900;
  const base = mobile ? 820 : 1920, s = Math.min(w / base, mobile ? 9 : 1.5);
  root.classList.toggle('mobile', mobile);
  root.style.setProperty('--s', s);
  root.style.setProperty('--ox', Math.max(0, (w - base * s) / 2) + 'px');
  root.style.setProperty('--sh', HEIGHTS[mobile ? 'mob' : 'desk'][stage.dataset.page] + 'px');
}
addEventListener('resize', fit, { passive: true });

/* ================= helpers ================= */
function randStr(len, set) {
  const n = set.length, lim = 256 - (256 % n), buf = new Uint8Array(len + 64);
  let out = '';
  while (out.length < len) {
    crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length && out.length < len; i++) if (buf[i] < lim) out += set[buf[i] % n];
  }
  return out;
}
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove(); return ok;
  }
}
let toastT;
function toast(msg, err) {
  const t = $('#toast'); t.textContent = msg; t.classList.toggle('err', !!err);
  restart(t, 'show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1900);
}

/* ================= particle burst ================= */
const cv = $('#burst'), cx = cv.getContext('2d');
let parts = [], running = false, dpr = 1;
function sizeCanvas() { dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
sizeCanvas(); addEventListener('resize', sizeCanvas, { passive: true });
function burst(el, colors, n = 70) {
  if (reduce) return;
  const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const glyphs = '{}[]01#$%&*<>/=+JWT';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.6, v = 5 + Math.random() * 11;
    parts.push({ x: x + (Math.random() - .5) * r.width * .6, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      g: glyphs[(Math.random() * glyphs.length) | 0], c: colors[(Math.random() * colors.length) | 0],
      s: 12 + Math.random() * 16, r: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 1, d: .012 + Math.random() * .014, sq: Math.random() < .35 });
  }
  if (!running) { running = true; raf(tick); }
}
function tick() {
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) {
    p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= p.d;
    cx.save(); cx.globalAlpha = Math.max(p.life, 0); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
    if (p.sq) { cx.fillRect(-p.s / 4, -p.s / 4, p.s / 2, p.s / 2); }
    else { cx.font = `700 ${p.s}px "JetBrains Mono",monospace`; cx.fillText(p.g, -p.s / 3, p.s / 3); }
    cx.restore();
  }
  if (parts.length) raf(tick); else { running = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
}

/* ================= odometer counters ================= */
function odo(el, value) {
  const str = String(value).padStart(2, '0');
  let cols = $$('.odo-d', el);
  while (cols.length < str.length) {
    const d = document.createElement('span'); d.className = 'odo-d';
    d.innerHTML = '<span class="odo-s">' + [...'0123456789'].map(n => `<span>${n}</span>`).join('') + '</span>';
    el.prepend(d); cols = $$('.odo-d', el);
  }
  while (cols.length > str.length) { cols[0].remove(); cols = $$('.odo-d', el); }
  cols.forEach((c, i) => { c.firstChild.style.transform = `translateY(${-str[i]}em)`; c.firstChild.style.transitionDelay = (str.length - 1 - i) * 80 + 'ms'; });
  el.closest('.counter').setAttribute('aria-label', value);
}
function bumpCounter(kind) {
  const n = store.get(kind, 0) + 1; store.set(kind, n);
  const c = $(`[data-counter="${kind}"]`), o = $('.odo', c);
  odo(o, n); restart(o, 'bump'); restart(c, 'ring');
}

/* ================= generator cards ================= */
let lastKey = '';
function scramble(el, text, set, after = '') {
  const vis = Math.min(text.length, 64), tail = text.slice(vis), dur = reduce ? 0 : 750, t0 = performance.now();
  const thr = Array.from({ length: vis }, (_, i) => (i / vis) * .72 + Math.random() * .26);
  const tok = (el._tok = (el._tok || 0) + 1);
  (function step(now) {
    if (tok !== el._tok) return;
    const t = dur ? Math.min(1, ((now || performance.now()) - t0) / dur) : 1;
    if (t >= 1) { el.innerHTML = esc(text) + after; return; }
    let h = '';
    for (let i = 0; i < vis; i++) h += t >= thr[i] ? esc(text[i]) : `<span class="sc">${esc(set[(Math.random() * set.length) | 0])}</span>`;
    el.innerHTML = h;
    setTimeout(() => raf(step), 24);
  })();
}

$$('.card[data-kind]').forEach(card => {
  const kind = card.dataset.kind, set = kind === 'std' ? ALNUM : SPECIAL;
  const chipsEl = $('.chips', card), slider = $('.slider', card), thumb = $('.thumb', slider);
  const out = $('.out', card), outText = $('.out-text', card), copyBtn = $('.copy', card), gen = $('.gen', card);
  let idx = 2, key = '';
  chipsEl.innerHTML = STOPS.map((v, i) => `<button class="chip" role="radio" style="left:${142 * i}px;--i:${i}" data-i="${i}">${v}</button>`).join('');
  const chips = $$('.chip', chipsEl);
  const tx = i => 35 + 142 * i;
  function select(i, fx) {
    idx = Math.max(0, Math.min(4, i));
    thumb.style.setProperty('--tx', tx(idx) + 'px');
    chips.forEach((c, j) => { c.classList.toggle('on', j === idx); c.setAttribute('aria-checked', j === idx); });
    slider.setAttribute('aria-valuenow', STOPS[idx]); slider.setAttribute('aria-valuetext', STOPS[idx] + ' characters');
    if (fx) { restart(chips[idx], 'pop'); restart(slider, 'zap'); }
  }
  select(idx);
  chipsEl.addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) select(+c.dataset.i, true); });

  // slider drag
  const local = e => { const r = slider.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 673; };
  const nearest = x => Math.round((x - 52.5) / 142);
  slider.addEventListener('pointerdown', e => {
    slider.setPointerCapture(e.pointerId); slider.classList.add('drag');
    const move = ev => {
      const x = Math.max(17.5, Math.min(655.5, local(ev)));
      thumb.style.setProperty('--tx', (x - 17.5) + 'px');
      const n = Math.max(0, Math.min(4, nearest(x)));
      chips.forEach((c, j) => c.classList.toggle('on', j === n));
    };
    move(e);
    const up = ev => {
      slider.classList.remove('drag'); slider.removeEventListener('pointermove', move);
      select(nearest(Math.max(17.5, Math.min(655.5, local(ev)))), true);
    };
    slider.addEventListener('pointermove', move);
    slider.addEventListener('pointerup', up, { once: true });
    slider.addEventListener('pointercancel', up, { once: true });
  });
  slider.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, Home: -9, End: 9 }[e.key];
    if (d) { e.preventDefault(); select(idx + d, true); }
  });

  const eye = $('.eye', card);
  let shown = false;
  const DOT = '\u2022';
  // masked view never puts the key in the DOM, only dots
  function render() {
    outText.classList.toggle('masked', !shown);
    eye.classList.toggle('shown', shown);
    eye.setAttribute('aria-pressed', shown); eye.setAttribute('aria-label', shown ? 'Hide key' : 'Show key');
    if (!key) { outText.textContent = ''; return; }
    if (shown) { scramble(outText, key, set); outText.title = key; }
    else { scramble(outText, DOT.repeat(Math.min(key.length, 22)), set, `<span class="hint">${key.length} chars · hidden</span>`); outText.removeAttribute('title'); }
  }
  eye.addEventListener('click', () => {
    if (!key) { toast('Generate a key first', true); restart(card, 'shake'); return; }
    shown = !shown; restart(eye, 'blink'); render();
  });

  gen.addEventListener('click', () => {
    key = randStr(STOPS[idx], set); lastKey = key; store.set('last', key);
    restart(gen, 'press'); restart(out, 'flash');
    shown = false; render();
    burst(gen, ['#D2FD5F', '#ffffff', '#D2FD5F', '#7E9434']);
    bumpCounter('gen');
  });
  const doCopy = async () => {
    if (!key) { toast('Generate a key first', true); restart(card, 'shake'); return; }
    if (await copyText(key)) {
      copyBtn.classList.remove('done'); void copyBtn.offsetWidth; copyBtn.classList.add('done');
      setTimeout(() => copyBtn.classList.remove('done'), 1600);
      toast(`Copied ${key.length}-character key`); burst(copyBtn, ['#D2FD5F', '#fff'], 24);
    } else toast('Copy failed: select the key manually', true);
  };
  copyBtn.addEventListener('click', doCopy);
  outText.addEventListener('dblclick', doCopy);
});

/* ================= decoder ================= */
const tok = $('#tok'), hl = $('.tok-hl'), secret = $('#secret');
const oHead = $('#o-head'), oPay = $('#o-pay');
const stAlg = $('#st-alg'), stSig = $('#st-sig'), stExp = $('#st-exp');
const HASH = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };

function b64uBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/'); s += '='.repeat((4 - s.length % 4) % 4);
  const bin = atob(s), b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b;
}
const b64uStr = s => new TextDecoder().decode(b64uBytes(s));
const toB64u = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const strB64u = s => toB64u(enc.encode(s));

function highlight() {
  const v = tok.value, parts = v.split('.');
  const cls = ['h-h', 'h-p', 'h-s'];
  hl.innerHTML = parts.map((p, i) => `<span class="${cls[i] || 'h-s'}">${esc(p)}</span>`).join('<span class="h-d">.</span>') + '\n';
  hl.scrollTop = tok.scrollTop;
}
tok.addEventListener('scroll', () => { hl.scrollTop = tok.scrollTop; }, { passive: true });

const fmtDate = s => new Date(s * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
function rel(sec) {
  const a = Math.abs(sec), u = [[86400, 'd'], [3600, 'h'], [60, 'm'], [1, 's']];
  const out = []; let r = a;
  for (const [n, l] of u) { if (r >= n && out.length < 2) { out.push(Math.floor(r / n) + l); r %= n; } }
  return out.join(' ') || '0s';
}
function hlJSON(str) {
  return str.replace(/("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
    (m, s, colon, b, n) => s ? `<span class="${colon ? 'j-k' : 'j-s'}">${esc(s)}</span>${colon || ''}` : b ? `<span class="j-b">${b}</span>` : `<span class="j-n">${n}</span>`);
  // structural JSON chars ({}[],: and whitespace) can't contain markup; all strings are escaped above

}
function jsonHTML(obj, compact) {
  const one = JSON.stringify(obj).replace(/":/g, '": ').replace(/,"/g, ', "');
  const lines = compact && one.length <= 52 ? [one] : JSON.stringify(obj, null, 2).split('\n');
  return lines.map((ln, i) => {
    let h = hlJSON(ln);
    const m = ln.match(/^\s*"(exp|iat|nbf|auth_time)":\s*(\d+)/);
    if (m) h += `<span class="j-x">  // ${esc(fmtDate(+m[2]))}</span>`;
    return `<span class="ln" style="animation-delay:${Math.min(i, 30) * 32}ms">${h || ' '}</span>`;
  }).join('');
}
function setStat(el, text, state) {
  const s = $('span', el); s.textContent = text; s.title = text;
  el.className = 'stat' + (state ? ' ' + state : ''); restart(el, 'pop');
}
function resetOut() {
  oHead.innerHTML = '<span class="empty">Header appears here</span>';
  oPay.innerHTML = '<span class="empty">Payload appears here</span>';
  [stAlg, stSig, stExp].forEach(e => { $('span', e).textContent = '—'; e.className = 'stat'; });
}
resetOut();

let lastSig = '', decodedOnce = '';
async function verify(parts, header) {
  const alg = header.alg;
  if (!alg || alg === 'none') return setStat(stSig, 'Unsigned', 'bad');
  if (!HASH[alg]) return setStat(stSig, `${alg}: not checked`, 'mid');
  if (!secret.value) return setStat(stSig, 'Add secret to verify', 'mid');
  if (!crypto.subtle) return setStat(stSig, 'Needs HTTPS', 'mid');
  try {
    const k = await crypto.subtle.importKey('raw', enc.encode(secret.value), { name: 'HMAC', hash: HASH[alg] }, false, ['verify']);
    const ok = await crypto.subtle.verify('HMAC', k, b64uBytes(parts[2] || ''), enc.encode(parts[0] + '.' + parts[1]));
    setStat(stSig, ok ? 'Verified ✓' : 'Invalid signature', ok ? 'ok' : 'bad');
    if (ok) burst(stSig, ['#D2FD5F', '#fff'], 22);
  } catch { setStat(stSig, 'Invalid signature', 'bad'); }
}
function decode(opts = {}) {
  const v = tok.value.trim().replace(/^Bearer\s+/i, '');
  if (!v) { resetOut(); lastSig = ''; return false; }
  const parts = v.split('.');
  let header, payload;
  try {
    if (parts.length < 2) throw 0;
    header = JSON.parse(b64uStr(parts[0])); payload = JSON.parse(b64uStr(parts[1]));
    if (typeof header !== 'object' || header === null) throw 0;
  } catch {
    if (opts.loud) { toast('That is not a valid JWT', true); restart($('#dec-in'), 'shake'); }
    oHead.innerHTML = '<span class="empty" style="color:#ff5c6c">Invalid token: expected header.payload.signature</span>';
    oPay.innerHTML = '<span class="empty">—</span>';
    setStat(stAlg, '—'); setStat(stSig, 'Invalid', 'bad'); setStat(stExp, '—');
    lastSig = ''; return false;
  }
  const sig = v + '|' + secret.value;
  if (sig === lastSig && !opts.force) return true;
  const sameTok = lastSig.split('|')[0] === v; lastSig = sig;
  if (!sameTok || opts.force) {
    oHead.innerHTML = jsonHTML(header, true); oPay.innerHTML = jsonHTML(payload);
    setStat(stAlg, header.alg || 'none', header.alg && header.alg !== 'none' ? 'ok' : 'bad');
    const now = Date.now() / 1000;
    if (typeof payload.nbf === 'number' && payload.nbf > now) setStat(stExp, 'Active in ' + rel(payload.nbf - now), 'mid');
    else if (typeof payload.exp === 'number') setStat(stExp, payload.exp < now ? 'Expired ' + rel(now - payload.exp) + ' ago' : 'Valid ' + rel(payload.exp - now), payload.exp < now ? 'bad' : 'ok');
    else setStat(stExp, 'No expiry', 'mid');
    if (decodedOnce !== v) { decodedOnce = v; bumpCounter('dec'); }
  }
  verify(parts, header);
  return true;
}
let decT;
tok.addEventListener('input', () => { highlight(); clearTimeout(decT); decT = setTimeout(() => decode(), 180); });
secret.addEventListener('input', () => { clearTimeout(decT); decT = setTimeout(() => decode(), 220); });
$('#dec-btn').addEventListener('click', e => {
  restart(e.currentTarget, 'press');
  if (!tok.value.trim()) { toast('Paste a JWT first', true); restart($('#dec-in'), 'shake'); return; }
  if (decode({ loud: true, force: true })) burst(e.currentTarget, ['#6734E0', '#a98bff', '#fff']);
});
$('#use-key').addEventListener('click', () => {
  const k = lastKey || store.get('last', '');
  if (!k) { toast('Generate a key on the JWT KEY page first', true); return; }
  secret.value = k; decode(); toast('Using your last generated key');
});
$('#dec-sample').addEventListener('click', async () => {
  const sec = lastKey || store.get('last', '') || randStr(256, ALNUM);
  const now = Math.floor(Date.now() / 1000);
  const h = strB64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = strB64u(JSON.stringify({ sub: '1234567890', name: 'Easy JWT', admin: true, iat: now, exp: now + 7200 }));
  let s = 'signature';
  if (crypto.subtle) {
    const k = await crypto.subtle.importKey('raw', enc.encode(sec), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    s = toB64u(await crypto.subtle.sign('HMAC', k, enc.encode(h + '.' + p)));
  }
  const full = h + '.' + p + '.' + s;
  secret.value = sec;
  if (reduce) { tok.value = full; highlight(); decode({ force: true }); return; }
  let i = 0; const stepN = Math.ceil(full.length / 34);
  (function type() {
    i = Math.min(full.length, i + stepN); tok.value = full.slice(0, i); highlight();
    if (i < full.length) raf(type); else { decode({ force: true }); burst($('#dec-btn'), ['#6734E0', '#a98bff', '#fff'], 40); }
  })();
});

/* ================= about ================= */
$$('.about-txt p').forEach(p => {
  let i = 0;
  p.innerHTML = p.innerHTML.split(/(<br>)/).map(seg => seg === '<br>' ? seg :
    seg.split(/(\s+)/).map(w => /^\s+$/.test(w) ? w : `<span class="w" style="--i:${i++}">${w}</span>`).join('')).join('');
});
$$('.so').forEach((a, i) => {
  a.style.setProperty('--i', i);
  const k = a.dataset.so, v = CONTACT[k];
  const clean = {
    phone: x => x.replace(/[^\d+]/g, ''),
    whatsapp: x => x.replace(/\D/g, ''),
    instagram: x => x.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/.*$/, ''),
    email: x => x.trim()
  }[k](String(v || ''));
  if (clean) a.href = { phone: 'tel:' + clean, whatsapp: 'https://wa.me/' + clean, instagram: 'https://instagram.com/' + encodeURIComponent(clean), email: 'mailto:' + clean }[k];
  if (!clean) a.addEventListener('click', e => { e.preventDefault(); restart(a, 'pop'); toast('Contact link coming soon'); });
});

/* ================= router + transitions ================= */
const ROUTES = { '': 'gen', '/': 'gen', '/decoder': 'dec', '/about': 'about' };
const WIPE = { gen: 'var(--lime)', dec: 'var(--purple)', about: 'var(--lime)' };
const wipe = $('#wipe');
let current = null, busy = false, enterT;
function show(page) {
  stage.dataset.page = page;
  $$('.page').forEach(p => { p.hidden = p.dataset.page !== page; p.classList.remove('enter'); });
  const el = $(`.page[data-page="${page}"]`);
  void el.offsetWidth; el.classList.add('enter');
  clearTimeout(enterT); enterT = setTimeout(() => el.classList.remove('enter'), 2400);
  $$('.nl').forEach(a => a.toggleAttribute('aria-current', a.dataset.route === page));
  fit(); scrollTo({ top: 0 });
  document.title = { gen: 'Easy JWT · JWT Key Generator', dec: 'Easy JWT · Decoder', about: 'Easy JWT · About' }[page];
}
function route() {
  const page = ROUTES[location.hash.replace(/^#/, '')] || 'gen';
  if (page === current) return;
  if (current === null || reduce) { current = page; show(page); return; }
  if (busy) return; busy = true; current = page;
  wipe.style.setProperty('--wc', WIPE[page]);
  wipe.className = 'in';
  setTimeout(() => {
    show(page); wipe.className = 'out';
    setTimeout(() => { wipe.className = ''; busy = false; const p = ROUTES[location.hash.replace(/^#/, '')] || 'gen'; if (p !== current) route(); }, 600);
  }, 470);
}
addEventListener('hashchange', route);

/* ================= pointer FX: tilt, glow, cursor, magnet ================= */
const glow = $('#glow'), cur = $('#cur'), cd = $('.cd', cur), cr = $('.cr', cur);
let mx = innerWidth / 2, my = -200, rx = mx, ry = my, curLoop = false;
function curTick() {
  rx += (mx - rx) * .2; ry += (my - ry) * .2;
  cd.style.transform = `translate(${mx}px,${my}px)`; cr.style.transform = `translate(${rx}px,${ry}px)`;
  if (Math.abs(mx - rx) + Math.abs(my - ry) > .3) raf(curTick); else curLoop = false;
}
let gPending = false;
addEventListener('pointermove', e => {
  mx = e.clientX; my = e.clientY;
  if (!gPending) { gPending = true; raf(() => { glow.style.setProperty('--gx', mx + 'px'); glow.style.setProperty('--gy', my + 'px'); gPending = false; }); }
  if (!curLoop && !reduce) { curLoop = true; raf(curTick); }
}, { passive: true });
document.addEventListener('pointerover', e => cur.classList.toggle('hov', !!e.target.closest('a,button,.slider,textarea,input')));
addEventListener('pointerdown', () => cur.classList.add('down'));
addEventListener('pointerup', () => cur.classList.remove('down'));
document.addEventListener('pointerleave', () => { mx = -100; my = -100; if (!curLoop) { curLoop = true; raf(curTick); } });

if (!reduce && matchMedia('(pointer:fine)').matches) {
  $$('.card, .ill').forEach(el => {
    const tgt = el.classList.contains('ill') ? $('img', el) : el;
    let p = false, ev;
    el.addEventListener('pointermove', e => {
      ev = e; if (p) return; p = true;
      raf(() => {
        p = false; const r = el.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
        if (el.classList.contains('slider')) return;
        if (el.classList.contains('ill')) {
          el.style.setProperty('--px', ((.5 - px) * 30).toFixed(1) + 'px'); el.style.setProperty('--py', ((.5 - py) * 18).toFixed(1) + 'px');
          return;
        }
        const amp = 4;
        tgt.style.setProperty('--ry', ((px - .5) * amp).toFixed(2) + 'deg');
        tgt.style.setProperty('--rx', ((.5 - py) * amp).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
    });
    el.addEventListener('pointerleave', () => { tgt.style.setProperty('--rx', '0deg'); tgt.style.setProperty('--ry', '0deg'); el.style.setProperty('--px', '0px'); el.style.setProperty('--py', '0px'); });
  });
  $$('.btn').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${((e.clientX - r.left) / r.width - .5) * 16}px ${((e.clientY - r.top) / r.height - .5) * 12}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });
}

/* ================= grain texture (generated once, 4KB) ================= */
(() => {
  const c = document.createElement('canvas'); c.width = c.height = 140;
  const g = c.getContext('2d'), d = g.createImageData(140, 140);
  for (let i = 0; i < d.data.length; i += 4) { d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = Math.random() < .5 ? 0 : Math.random() * 22; }
  g.putImageData(d, 0, 0);
  $('#grain').style.backgroundImage = `url(${c.toDataURL()})`;
})();

/* ================= boot ================= */
lastKey = store.get('last', '');
const cGen = $('[data-counter="gen"] .odo'), cDec = $('[data-counter="dec"] .odo');
odo(cGen, 0); odo(cDec, 0);
route();
restart($('.nav'), 'enter');
setTimeout(() => { odo(cGen, store.get('gen', 0)); odo(cDec, store.get('dec', 0)); }, reduce ? 0 : 450);
})();
