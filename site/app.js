// Site v2. Sample data only. No network calls. Classic script: one closure, no globals.
(() => {

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Reuse a rendered image from the asset bank (keeps preview path rewriting intact).
const asset = k => { const i = document.querySelector(`.asset-bank [data-asset="${k}"]`); return i ? (i.currentSrc || i.src) : ''; };

/* ---------- Thinking orb ----------
   The production engine (thinking-orb.js, from web/ in pi-remote) gives the dots and
   lines of each frame. This page draws them on its own canvas, with space around the
   orb, a scale and a cross-fade between two states. */
const ORBS = new Set();
const orbHandles = {};
const orbHandle = (state, size) => (orbHandles[`${state}-${size}`] ||= window.ThinkingOrb.attach(document.createElement('canvas'), { state, size }));
function makeOrb(canvas, state, { size = 64, scale = 1, pad = .35 } = {}) {
  if (!window.ThinkingOrb) return null;
  const dpr = Math.min(2, devicePixelRatio || 1), box = size * (1 + pad * 2) * scale;
  canvas.width = Math.round(box * dpr); canvas.height = Math.round(box * dpr);
  canvas.style.width = canvas.style.height = `${box}px`;
  const o = { canvas, ctx: canvas.getContext('2d'), size, scale, dpr, off: size * pad, state, prev: null, t0: 0 };
  o.to = next => { if (next === o.state) return; o.prev = o.state; o.state = next; o.t0 = performance.now(); if (reduced) drawOrb(o, performance.now()); };
  ORBS.add(o); drawOrb(o, 2400); orbLoop();
  return o;
}
function paintFrame(o, frame, alpha, k) {
  const c = o.ctx, mid = o.off + o.size / 2;
  c.save(); c.translate(mid, mid); c.scale(k, k); c.translate(-o.size / 2, -o.size / 2);
  const col = (w, a) => { const v = Math.round(Math.min(1, Math.max(0, w)) * 255); return `rgba(${v},${v},${v},${(a ?? 1) * alpha})`; };
  for (const l of frame.lines) { c.strokeStyle = col(l.white, l.a); c.lineWidth = l.w; c.beginPath(); c.moveTo(l.x1, l.y1); c.lineTo(l.x2, l.y2); c.stroke(); }
  for (const d of frame.dots) { if (d.r <= 0) continue; c.fillStyle = col(d.white, d.a); c.beginPath(); c.arc(d.x, d.y, d.r, 0, 6.2832); c.fill(); }
  c.restore();
}
function drawOrb(o, now) {
  const t = reduced ? 2400 : now;
  const c = o.ctx; c.setTransform(o.dpr * o.scale, 0, 0, o.dpr * o.scale, 0, 0);
  c.clearRect(0, 0, o.size * 3, o.size * 3);
  const p = o.prev && !reduced ? Math.min(1, (now - o.t0) / 900) : 1;
  const ease = 1 - (1 - p) ** 3;
  if (p < 1) paintFrame(o, orbHandle(o.prev, o.size).snapshot(t).frame, 1 - ease, 1 - .35 * ease);
  else o.prev = null;
  paintFrame(o, orbHandle(o.state, o.size).snapshot(t).frame, ease, .65 + .35 * ease);
}
let orbRaf = 0;
function orbLoop() {
  if (orbRaf || reduced) return;
  const tick = now => {
    orbRaf = 0;
    for (const o of ORBS) {
      if (!o.canvas.isConnected) { ORBS.delete(o); continue; }
      const r = o.canvas.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight && !document.hidden) drawOrb(o, now);
    }
    if (ORBS.size) orbRaf = requestAnimationFrame(tick);
  };
  orbRaf = requestAnimationFrame(tick);
}

/* ---------- Pixel icons for the security diagram: 9 x 9 bitmaps ---------- */
const ICONS = {
  mac: '.........|.#######.|.#.....#.|.#.....#.|.#.....#.|.#######.|#########|.........|.........',
  phone: '..#####..|..#...#..|..#...#..|..#...#..|..#...#..|..#...#..|..##.##..|..#####..|.........',
  cloud: '.........|...###...|..#...#..|.##....#.|#.......#|#.......#|.#######.|.........|.........',
};
function bitmapSvg(rows) {
  let rects = '';
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }));
  return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" fill="currentColor" aria-hidden="true">${rects}</svg>`;
}
$$('.px-icon[data-icon]').forEach(el => { el.innerHTML = bitmapSvg(ICONS[el.dataset.icon].split('|')); });

/* ---------- Navigation background after scroll ---------- */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- Headline word scramble ---------- */
(function scramble() {
  const el = $('#scramble');
  const words = ['phone', 'sofa', 'iPad', 'commute', 'garden'];
  const chars = '0123456789:-*#/<>_';
  if (reduced) return;
  let index = 0;
  const run = () => {
    index = (index + 1) % words.length;
    const target = words[index];
    el.setAttribute('aria-label', target);
    $$('.hero-dog, .word-img').forEach(n => n.classList.toggle('on', n.dataset.word === target));
    let frame = 0; const total = 16;
    const step = () => {
      frame++;
      const done = Math.floor((frame / total) * target.length);
      el.textContent = [...target].map((c, i) => (i < done ? c : chars[Math.floor(Math.random() * chars.length)])).join('');
      if (frame < total) setTimeout(step, 45); else el.textContent = target;
    };
    step();
  };
  setInterval(() => { if (!document.hidden) run(); }, 3200);
})();

/* ============================================================
   S2 demo: one stage, three scenes. Phone screens follow the
   shipped iOS app; the Mac window is a concept surface.
   ============================================================ */

// A QR-looking pattern. It encodes nothing.
const QR = (() => {
  const n = 25; let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const F = [[0, 0], [n - 7, 0], [0, n - 7]];
  const inF = (x, y) => F.some(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
  const onF = (x, y) => F.some(([a, b]) => { const i = x - a, j = y - b; if (i < 0 || j < 0 || i > 6 || j > 6) return false; return i === 0 || j === 0 || i === 6 || j === 6 || (i > 1 && i < 5 && j > 1 && j < 5); });
  let r = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (inF(x, y) ? onF(x, y) : rnd() > .5) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><g fill="#18181b">${r}</g></svg>`;
})();

const AV = {
  MB: ['MB', 'linear-gradient(135deg,#a58bff,#7b61ff)'], PW: ['PW', 'linear-gradient(135deg,#7fb2ff,#3f72d3)'],
  ID: ['ID', 'linear-gradient(135deg,#ffb37a,#e07a3a)'], HE: ['HE', 'linear-gradient(135deg,#8fdcaa,#2f9e5b)'],
  WE: ['WE', 'linear-gradient(135deg,#7fe0da,#27a59c)'], AN: ['AN', 'linear-gradient(135deg,#ff9a8a,#d9483f)'],
};
const av = k => `<span class="av" style="background:${AV[k][1]}">${AV[k][0]}</span>`;

// Updates feed. `col` is the column; `at` is the Mac run that sends it.
const TILES = [
  { id: 'brief', col: 0, k: 'MB', src: 'Morning brief', time: '7:00', title: '3 things need you today', body: 'Invoice due Friday · Dentist to confirm · Parcel at 2 pm' },
  { id: 'news', col: 1, k: 'AN', src: 'AI news daily', time: '7:05', title: '3 model releases worth a look', body: 'What changed, what it costs, and whether to switch.' },
  { id: 'flights', col: 1, k: 'PW', src: 'Price watch', time: '6:50', cover: 'sky', title: 'Tokyo flights dropped to $742', body: 'Return, 12–20 April. Down $96 since Monday.' },
  { id: 'energy', col: 0, k: 'HE', src: 'Home energy', time: '6:45', cover: 'chart', title: 'Power use down 12% this week', body: '' },
  { id: 'weather', col: 1, k: 'WE', src: 'Weather', time: '6:00', cover: 'sun', title: 'Weekend: sunny, 24°', body: 'Good for the market on Saturday.' },
  { id: 'inbox', col: 0, k: 'ID', src: 'Inbox digest', time: '6:30', title: 'Inbox: 2 replies worth reading', body: 'Lena sent the contract. Sam moved Monday’s call.' },
];
const RUNS = [ // Mac order, by time
  ['weather', 'Daily 6:00', '6:00 AM'], ['inbox', 'Daily 6:30', '6:30 AM'], ['energy', 'Daily 6:45', '6:45 AM'],
  ['flights', 'Every 6 hours', '6:50 AM'], ['brief', 'Daily 7:00', '7:00 AM'], ['news', 'Daily 7:05', '7:05 AM'],
];
const TODOS = [
  { id: 'passport', t: 'Renew passport before booking flights', s: 'Added by ATU' },
  { id: 'dentist', t: 'Book a dentist appointment', s: 'From an earlier day' },
  { id: 'power', t: 'Pay the electricity bill', s: 'From an earlier day · Added by ATU' },
  { id: 'lena', t: 'Reply to Lena about the contract', s: '' },
];

const ds = $('#ds'), wrap = $('#ds-wrap'), iph = $('#iph'), layers = $('#layers');
const tabbar = $('#tabbar'), tapDot = $('#tap');
const macBody = $('#mac-body'), macTitle = $('#mac-title'), macClock = $('#mac-clock'), sbTime = $('#sb-time');

/* Fit the stage to its column. */
function fit() {
  const w = wrap.clientWidth;
  const compact = w < 700;
  ds.classList.toggle('compact', compact);
  const bw = compact ? 440 : 1080, bh = compact ? 820 : 660;
  const k = Math.min(1, w / bw);
  if (wrap.style.getPropertyValue('--k') === String(k) && ds.classList.contains('compact') === compact) return;
  wrap.style.setProperty('--k', k); wrap.style.setProperty('--h', `${bh}px`);
  ds.style.setProperty('--k', k);
}
let fitFrame = 0;
new ResizeObserver(() => { cancelAnimationFrame(fitFrame); fitFrame = requestAnimationFrame(fit); }).observe(wrap); fit();

/* Cancellation: each run gets a token. A newer run stops older waits. */
let gen = 0;
const STOP = Symbol('stop');
const wait = (ms, tok) => new Promise((res, rej) => {
  if (reduced) ms = 0;
  setTimeout(() => (tok === gen ? res() : rej(STOP)), ms);
});

/* Phone helpers */
const icon = {
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  more: '<svg viewBox="0 0 24 24"><path d="M6 12h.01M12 12h.01M18 12h.01" stroke-width="3"/></svg>',
  bubble: '<svg viewBox="0 0 24 24"><path d="M5 5h14v10H10l-4 3v-3H5z"/></svg>',
};
let paired = true;
const host = () => `<div class="host${paired ? '' : ' off'}" data-act="host">${paired ? 'S' : '?'}</div>`;

function setTab(name) {
  tabbar.classList.toggle('hide', !name);
  $$('span', tabbar).forEach(s => s.classList.toggle('on', s.dataset.t === name));
}
function show(html, how = 'none') {
  const el = document.createElement('div');
  el.className = 'layer'; el.innerHTML = html;
  $$('canvas[data-orb]', el).forEach(c => makeOrb(c, c.dataset.orb, { size: 64, scale: 1.8 }));
  const prev = layers.lastElementChild;
  if (how === 'none' || !prev) { layers.replaceChildren(el); return el; }
  if (how === 'push') {
    el.classList.add('right'); layers.append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.remove('right'); prev.classList.add('left'); }));
  }
  return el;
}
function pop() {
  const top = layers.lastElementChild, prev = top?.previousElementSibling;
  if (!prev) return;
  top.classList.add('right'); prev.classList.remove('left');
  setTimeout(() => top.remove(), 460);
}
function centre(el) {
  const r = el.getBoundingClientRect(), p = iph.getBoundingClientRect(), s = p.width / 390;
  return [(r.left + r.width / 2 - p.left) / s, (r.top + r.height / 2 - p.top) / s];
}
async function tap(el, tok) {
  if (!el) return;
  const [x, y] = centre(el);
  tapDot.style.left = `${x}px`; tapDot.style.top = `${y}px`;
  tapDot.classList.remove('go'); void tapDot.offsetWidth; tapDot.classList.add('go');
  await wait(260, tok);
}
async function typeInto(el, text, tok, cls = 'typed') {
  el.classList.add(cls); el.textContent = '';
  for (let i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await wait(32, tok); }
}
function setMac(title, html, app = 'Pi Remote') {
  macTitle.textContent = title; $('#mac-app').textContent = app;
  macBody.innerHTML = html;
}

/* ---------- Screens ---------- */
const chatsHome = () => `
  <div class="hd" style="padding-top:62px"><div class="round" data-act="none">${icon.menu}</div>${host()}</div>
  <div class="empty"><canvas class="orb-c" data-orb="composing" aria-hidden="true"></canvas><p>Bring the hard part.</p></div>
  <div class="composer"><div class="ph" id="c-ph">Message your AI…</div>
    <div class="row"><span class="cplus">+</span><span class="cchip">claude-opus · High ⌄</span><span class="cchip">~/Home</span><span class="csend" id="c-send">↑</span></div></div>`;

const tileHtml = (t, hidden) => `<div class="ftile${hidden ? ' hidden' : ''}" data-tile="${t.id}">
  ${t.cover === 'chart' ? '<div class="fcover chart"><i style="height:52%"></i><i style="height:70%"></i><i style="height:60%"></i><i style="height:82%"></i><i style="height:66%"></i><i class="hi" style="height:44%"></i></div>' : t.cover ? `<div class="fcover ${t.cover}"></div>` : ''}
  <div class="in"><b>${t.title}</b>${t.body ? `<p>${t.body}</p>` : ''}<div class="src">${av(t.k)}<span>${t.src}</span><em>${t.time}</em></div></div></div>`;
const updatesScreen = (all = true) => `<div class="scroll">
  <div class="hd"><h3>Updates</h3>${host()}</div>
  <div class="fchips"><span class="on">All</span><span>Morning brief</span><span>Price watch</span><span>Inbox</span></div>
  <div class="day">Today</div>
  <div class="ffeed"><div class="fcol">${TILES.filter(t => t.col === 0).map(t => tileHtml(t, !all)).join('')}</div>
  <div class="fcol">${TILES.filter(t => t.col === 1).map(t => tileHtml(t, !all)).join('')}</div></div></div>`;

const detailScreen = id => {
  const t = TILES.find(x => x.id === id) || TILES[1];
  const body = id === 'flights'
    ? `<h5>Tokyo flights dropped to $742</h5><ul><li>Qantas · Sydney → Haneda · 12–20 April · <b>$742</b></li><li>JAL · $768 · one stop shorter</li><li>Lowest fare in 30 days.</li></ul>
       <div class="chart2"><i style="height:78%"></i><i style="height:84%"></i><i style="height:80%"></i><i style="height:92%"></i><i style="height:74%"></i><i style="height:70%"></i><i class="hi" style="height:58%"></i></div><p class="cap">Fare for your dates, last 7 checks</p>`
    : `<h5>${t.title}</h5>${t.body ? `<p style="font-size:15.5px;line-height:1.55;margin:0">${t.body}</p>` : ''}`;
  return `<div class="nav-bar"><div class="round" data-act="back">${icon.back}</div><b>${t.src}</b><div class="round">${icon.more}</div></div>
  <div class="detail"><div class="who">${av(t.k).replace('class="av"', 'class="av"')}<div><b>${t.src}</b><small>Today ${t.time} am</small></div></div>${body}</div>
  <div class="askbar" data-act="ask"><span id="ask-text">Ask about this update</span><span class="csend" id="ask-send" style="margin-left:auto">↑</span></div>
  <div class="discuss" id="discuss"><div class="grab"></div>
    <div class="ref">${av(t.k)}<div><b>${t.src} · Today</b><small>${t.title}</small></div><em>Open in Chats</em></div>
    <div class="thread" id="d-thread"></div><div class="chat-comp"><span class="cplus">+</span>Message your AI<span class="csend" style="margin-left:auto">↑</span></div></div>`;
};

const todoScreen = () => `<div class="scroll">
  <div class="hd"><div><h3>Todo</h3><small>Friday, 9 October</small></div>${host()}</div>
  <div class="card-a done-today" style="margin-top:14px"><div class="n"><b id="done-n">1</b><span>done today</span></div><div class="sq"><i class="f"></i><i class="now"></i><i></i><i></i><i></i></div></div>
  <div class="card-a recent"><div class="recent-h"><b>Recent</b><em>4</em><span class="pill-btn" data-act="select">Select</span><svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg></div>
    ${TODOS.map(t => `<div class="trow" data-todo="${t.id}"><span class="box" data-act="check"></span><div class="t">${t.t}${t.s ? `<small>${t.s}</small>` : ''}</div><span class="chat-ic">${icon.bubble}</span></div>`).join('')}</div>
  <div class="card-a mini-row"><b>Later</b> 6 <span>Next · Plan the market trip on Saturday</span></div>
  <div class="card-a mini-row"><b>Done</b> 1 <span>Latest · Send the invoice to Studio</span></div></div>
  <div class="atu-ask"><div class="f"><img src="${asset('atu')}" alt="">Ask ATU to plan your day</div><span class="p">+</span></div>
  <div class="scrim" id="scrim"></div>
  <div class="bsheet" id="bsheet"><div class="grab"></div><div class="bsheet-h"><b>Follow up together</b><span class="x" data-act="close">✕</span></div>
    <p>Pick the to-dos for one chat with ATU.</p><div class="sec"><span>Recent</span><span>4</span></div>
    <div class="list">${TODOS.map(t => `<div class="srow" data-pick="${t.id}"><span class="c">✓</span><span>${t.t}</span></div>`).join('')}</div>
    <div class="fu-btn" id="fu-btn" data-act="follow">${icon.bubble.replace('<svg', '<svg')}<span id="fu-label">Follow up · 0</span></div></div>`;

const atuChat = () => `<div class="chat-hd"><div class="round" data-act="back">${icon.menu}</div><div class="who"><img src="${asset('atu')}" alt=""><span>ATU</span></div>${host()}</div>
  <div class="thread" id="thread"></div>
  <div class="chat-comp"><span class="cplus">+</span>Message ATU<span class="csend" style="margin-left:auto">↑</span></div>`;

/* ---------- Mac windows ---------- */
const macPair = () => `<div class="mw-pair"><div>
  <img class="mw-avatar" src="${asset('atu')}" alt=""><h4>Pair your iPhone</h4>
  <p>Your AI stays on this computer. Your phone becomes its remote.</p>
  <ol><li>Open Pi Remote on your iPhone</li><li>Tap the computer button, then Pair</li><li>Point the camera at this code</li></ol></div>
  <div><div class="mw-qr" id="mw-qr">${QR}<span class="ok"><b>✓</b></span></div><div class="mw-status" id="mw-status"><i class="spin"></i><span id="mw-count">Waiting for iPhone · 1:58</span></div></div></div>`;
const macPaired = () => `<div class="mw-paired"><span class="big">✓</span><h4>Paired with iPhone</h4><p>You can close this window. Your computer stays connected in the background.</p>
  <div class="mw-rows"><span><i></i>Online</span><span>Starts at login</span><span>End-to-end encrypted</span></div></div>`;
const macRuns = () => `<div class="mw-h"><b>Scheduled tasks</b><small>Results go to your iPhone</small></div><ul class="mw-list">${RUNS.map(([id, when]) => {
  const t = TILES.find(x => x.id === id);
  return `<li data-run="${id}">${av(t.k)}<span>${t.src}</span><em>${when}</em><span class="st">Waiting</span></li>`;
}).join('')}</ul>`;
const macAtu = () => `<div class="mw-h"><b>ATU</b><small>Working on this computer</small></div><div class="mw-todo" id="mw-todo"></div><ul class="mw-log" id="mw-log"><li style="background:none;color:var(--a-faint)">Waiting for a follow-up from your iPhone…</li></ul>`;

/* ---------- Scenes ---------- */
const COPY = {
  pair: ['One scan. You’re in.', 'Install on your computer, then scan the code with your iPhone. No account, no VPN, no ports to open.'],
  updates: ['Wake up to finished work.', 'Scheduled tasks run on your computer while you sleep. Each result lands on your phone as a card. Tap one to ask about it.'],
  todo: ['Save it once. Pick it up together.', 'Turn any line into a to-do. Pick a few, and ATU works them through with you in one chat.'],
};
const LENGTH = { pair: 10400, updates: 15500, todo: 21500 };

function frame(scene) {
  $('#demo-title').textContent = COPY[scene][0];
  $('#demo-text').textContent = COPY[scene][1];
  $$('.demo-tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.scene === scene)));
  ds.dataset.scene = scene;
}

async function scenePair(tok) {
  paired = false; sbTime.textContent = '9:41'; macClock.textContent = 'Fri 9:41 AM';
  setMac('Pi Remote', macPair());
  show(chatsHome()); setTab('chats');
  let left = 118;
  const timer = setInterval(() => {
    if (tok !== gen) return clearInterval(timer);
    left--; const c = $('#mw-count'); if (c) c.textContent = `Waiting for iPhone · ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }, 1000);
  await wait(1100, tok);
  await tap($('[data-act=host]', layers), tok);
  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.innerHTML = '<small>Computers</small><div class="it" style="color:var(--a-faint)">None yet</div><hr><div class="it add" data-act="pair"><b>+</b>Pair</div>';
  layers.lastElementChild.append(menu);
  await wait(800, tok);
  await tap($('[data-act=pair]', menu), tok);
  menu.remove();
  const sc = document.createElement('div');
  sc.className = 'layer down scanner';
  sc.innerHTML = `<div class="camv" id="cam"><div class="scr"><div class="w"><i></i><i></i><i></i><i style="width:60%"></i></div><div class="q">${QR}</div></div></div>
    <div class="scan-top"><span>Cancel</span><span>Paste link</span></div><h4>Pair Mac</h4><div class="reticle" id="ret"><i></i><i></i><i></i><i></i></div>
    <div class="hint">Scan the code on your Mac.</div>`;
  layers.append(sc); setTab(null);
  requestAnimationFrame(() => requestAnimationFrame(() => sc.classList.remove('down')));
  await wait(1300, tok);
  $('#cam', sc).classList.add('near');
  await wait(1250, tok);
  lockOn(sc);
  await wait(650, tok);
  clearInterval(timer);
  $('#mw-qr')?.classList.add('used');
  const st = $('#mw-status'); if (st) st.innerHTML = '<span style="color:var(--a-green)">✓ iPhone connected</span>';
  await wait(700, tok);
  sc.classList.add('down'); paired = true;
  const home = layers.firstElementChild; const h = $('[data-act=host]', home); if (h) { h.classList.remove('off'); h.textContent = 'S'; }
  setTab('chats');
  await wait(350, tok);
  sc.remove();
  const toast = document.createElement('div'); toast.className = 'ptoast'; toast.innerHTML = '<i></i>Connected to Studio Mac';
  layers.lastElementChild.append(toast);
  setMac('Pi Remote', macPaired());
  await wait(1200, tok);
  await typeInto($('#c-ph'), 'What should I do first today?', tok);
  $('#c-send')?.classList.add('ready');
  await wait(1400, tok);
}

// Move the reticle onto the code as it is drawn now, so the two always line up.
function lockOn(sc) {
  const q = $('.q', sc), ret = $('#ret', sc); if (!q || !ret) return;
  const a = q.getBoundingClientRect(), b = sc.getBoundingClientRect(), s = iph.getBoundingClientRect().width / 390;
  const pad = 12, size = Math.max(a.width, a.height) / s + pad * 2;
  const cx = (a.left + a.width / 2 - b.left) / s, cy = (a.top + a.height / 2 - b.top) / s;
  Object.assign(ret.style, { left: `${cx - size / 2}px`, top: `${cy - size / 2}px`, width: `${size}px`, height: `${size}px`, margin: '0' });
  ret.classList.add('lock');
}

async function sceneUpdates(tok) {
  paired = true; sbTime.textContent = '6:58';
  macClock.textContent = 'Fri 5:58 AM';
  setMac('Pi Remote — Scheduled tasks', macRuns());
  show(updatesScreen(false)); setTab('updates');
  await wait(700, tok);
  for (const [id, , clock] of RUNS) {
    const row = $(`[data-run=${id}] .st`);
    if (row) row.innerHTML = '<i class="spin"></i>Running';
    macClock.textContent = `Fri ${clock}`;
    await wait(520, tok);
    if (row) { row.classList.add('done'); row.textContent = '✓ Sent'; }
    const tile = $(`[data-tile=${id}]`, layers);
    if (tile) { tile.parentElement.prepend(tile); tile.classList.remove('hidden'); tile.classList.add('new'); }
    sbTime.textContent = clock.replace(' AM', '');
    await wait(330, tok);
  }
  await wait(900, tok);
  await openDetail('flights', tok);
  await wait(1300, tok);
  await ask(tok);
  await wait(2200, tok);
}
async function openDetail(id, tok) {
  await tap($(`[data-tile=${id}]`, layers), tok);
  show(detailScreen(id), 'push'); setTab(null);
  await wait(500, tok);
}
async function ask(tok) {
  const bar = $('[data-act=ask]', layers.lastElementChild);
  if (!bar || bar.dataset.done) return;
  bar.dataset.done = '1';
  await tap(bar, tok);
  await typeInto($('#ask-text', bar), 'Is now a good time to book?', tok);
  $('#ask-send', bar).classList.add('ready');
  await wait(450, tok);
  await tap($('#ask-send', bar), tok);
  const sheet = $('#discuss', layers.lastElementChild);
  sheet.classList.add('on');
  const th = $('#d-thread', sheet);
  th.insertAdjacentHTML('beforeend', '<div class="msg me">Is now a good time to book?<time>7:06</time></div>');
  await wait(500, tok);
  th.insertAdjacentHTML('beforeend', '<div class="typing"><i></i><i></i><i></i></div>');
  await wait(1300, tok);
  th.lastElementChild.remove();
  th.insertAdjacentHTML('beforeend', '<div class="msg">Yes. This is the lowest fare for your dates in 30 days, and this route usually rises three weeks out. I’ll keep watching and tell you if it drops below $700.<time>7:06</time></div>');
}

async function sceneTodo(tok) {
  paired = true; sbTime.textContent = '8:12'; macClock.textContent = 'Fri 8:12 AM';
  setMac('Pi Remote — ATU', macAtu());
  show(todoScreen()); setTab('todo');
  await wait(1200, tok);
  await openSelect(tok);
  for (const id of ['passport', 'dentist']) { await wait(450, tok); await pick(id, tok); }
  await wait(600, tok);
  await followUp(tok, true);
}
async function openSelect(tok) {
  await tap($('[data-act=select]', layers), tok);
  $('#scrim', layers).classList.add('on'); $('#bsheet', layers).classList.add('on'); setTab(null);
  await wait(500, tok);
}
async function pick(id, tok) {
  const row = $(`[data-pick=${id}]`, layers);
  if (tok !== undefined) await tap(row, tok);
  row.classList.toggle('sel');
  const n = $$('.srow.sel', layers).length;
  $('#fu-label', layers).textContent = `Follow up · ${n}`;
  $('#fu-btn', layers).classList.toggle('on', n > 0);
}
async function followUp(tok, auto = false) {
  const picked = $$('.srow.sel', layers).map(r => TODOS.find(t => t.id === r.dataset.pick));
  if (!picked.length) return;
  await tap($('#fu-btn', layers), tok);
  $('#bsheet', layers).classList.remove('on'); $('#scrim', layers).classList.remove('on');
  await wait(250, tok);
  show(atuChat(), 'push'); setTab(null);
  const th = $('#thread', layers.lastElementChild);
  const mwTodo = $('#mw-todo'), log = $('#mw-log');
  if (mwTodo) mwTodo.innerHTML = picked.map(t => `<span>${t.t}</span>`).join('');
  if (log) log.innerHTML = '';
  await wait(450, tok);
  th.insertAdjacentHTML('beforeend', `<div class="msg me">${picked.map(t => `<span class="tpill">✓ Todo · ${t.t}</span>`).join('')}Help me get these done.<time>8:13</time></div>`);
  await wait(400, tok);
  th.insertAdjacentHTML('beforeend', '<div class="typing"><i></i><i></i><i></i></div>');
  const ids = picked.map(t => t.id).sort().join(',');
  const sample = ids === 'dentist,passport';
  const steps = sample
    ? [['Read the passport renewal rules', 'passports.gov.au'], ['Checked your calendar for next week', '3 free mornings'], ['Found your dentist’s booking page', 'Smile Dental']]
    : picked.map(t => ['Looked into it', t.t]);
  for (const [a, b] of steps) { await wait(650, tok); log?.insertAdjacentHTML('beforeend', `<li><b>✓</b>${a}<em>${b}</em></li>`); }
  await wait(500, tok);
  th.lastElementChild.remove();
  if (sample) {
    th.insertAdjacentHTML('beforeend', '<div class="msg">Here’s the plan.<ul><li><b>Passport:</b> renew online today. It takes about 3 weeks, so it is back before you book Tokyo.</li><li><b>Dentist:</b> you are free Tue 9:30, Wed 2:00 pm and Fri 11:15.</li></ul><time>8:14</time></div>');
    await wait(700, tok);
    th.insertAdjacentHTML('beforeend', '<div class="opts"><b>Which dentist time?</b><div class="ropt" data-act="opt" data-todo="dentist">Tue 9:30</div><div class="ropt" data-act="opt" data-todo="dentist">Wed 2:00 pm</div><div class="ropt" data-act="opt" data-todo="dentist">Fri 11:15</div></div>');
  } else {
    th.insertAdjacentHTML('beforeend', `<div class="msg">I have what I need for ${picked.length === 1 ? 'this one' : `these ${picked.length}`}.<ul>${picked.map(t => `<li><b>${t.t}</b></li>`).join('')}</ul><time>8:14</time></div>`);
    await wait(700, tok);
    th.insertAdjacentHTML('beforeend', `<div class="opts"><b>Where should we start?</b>${picked.slice(0, 3).map(t => `<div class="ropt" data-act="opt" data-todo="${t.id}">${t.t}</div>`).join('')}</div>`);
  }
  if (!auto) return;
  await wait(1500, tok);
  await chooseOption($('[data-act=opt]', th), tok);
  await wait(2000, tok);
}
async function chooseOption(opt, tok) {
  const box = opt.closest('.opts');
  if (box.classList.contains('used')) return;
  await tap(opt, tok);
  box.classList.add('used'); opt.classList.add('pick');
  const th = box.parentElement, choice = opt.textContent, todo = TODOS.find(t => t.id === opt.dataset.todo);
  const dentist = todo?.id === 'dentist';
  await wait(400, tok);
  th.insertAdjacentHTML('beforeend', `<div class="msg me">${choice}<time>8:15</time></div>`);
  await wait(800, tok);
  $('#mw-log')?.insertAdjacentHTML('beforeend', `<li><b>✓</b>${dentist ? 'Sent the booking request' : 'Started on it'}<em>${dentist ? choice : 'now'}</em></li>`);
  th.insertAdjacentHTML('beforeend', `<div class="msg">${dentist ? `${choice} it is. Booking it now.` : 'On it.'}<time>8:15</time></div>`);
  await wait(900, tok);
  // Concept: the to-do is done, so the chat celebrates it. Not in the app yet.
  const when = dentist ? (choice.startsWith('Tue') ? 'Tue 13 Oct' : choice.startsWith('Wed') ? 'Wed 14 Oct' : 'Fri 16 Oct') : 'today';
  th.insertAdjacentHTML('beforeend', `<div class="msg">${dentist ? `Booked for ${choice}. Smile Dental confirmed it.` : 'Done.'} That one is off your list.<time>8:16</time></div>`);
  await wait(500, tok);
  th.insertAdjacentHTML('beforeend', `<div class="change done"><div class="change-h"><span>Todo · Done</span><b>Undo</b></div><div class="change-r"><i>✓</i><div><s>${todo ? todo.t : choice}</s><small>Done ${dentist ? `· appointment ${when}, ${choice.replace(/^\w+ /, '')}` : when}</small></div></div></div>`);
  $('#mw-log')?.insertAdjacentHTML('beforeend', `<li><b>✓</b>${dentist ? 'Booked with Smile Dental' : 'Finished'}<em>${dentist ? choice : 'done'}</em></li>`);
  const card = th.lastElementChild;
  await wait(250, tok);
  celebrate($('.change-r i', card));
}

/* Fireworks over the phone, from a point on screen. Reduced motion: no particles. */
const fx = (() => { const c = document.createElement('canvas'); c.className = 'fx'; c.width = 390 * 2; c.height = 844 * 2; iph.append(c); return c; })();
const FX_COLOURS = ['#ff5fb4', '#d463ff', '#8a74ff', '#4aa6ff', '#34dcd0', '#66e896', '#ffd84e', '#ffa062'];
let sparks = [], fxRaf = 0;
function burst(x, y, n, power) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = power * (.45 + Math.random() * .75);
    sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * .25, life: 1, decay: .012 + Math.random() * .014, r: 1.6 + Math.random() * 2.2, c: FX_COLOURS[(Math.random() * FX_COLOURS.length) | 0], px: x, py: y });
  }
}
function celebrate(el) {
  const card = el?.closest('.change'); card?.classList.add('glow');
  if (reduced || !el) return;
  const [x, y] = centre(el);
  burst(x, y, 70, 7);
  setTimeout(() => burst(x + 120, y - 150, 50, 5.5), 260);
  setTimeout(() => burst(x + 30, y - 260, 55, 6), 520);
  setTimeout(() => burst(x + 200, y - 40, 40, 5), 780);
  if (!fxRaf) fxRaf = requestAnimationFrame(fxTick);
}
function fxTick() {
  const c = fx.getContext('2d');
  c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, 390, 844);
  sparks = sparks.filter(p => p.life > 0);
  for (const p of sparks) {
    p.px = p.x; p.py = p.y; p.vx *= .965; p.vy = p.vy * .965 + .16; p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    c.globalAlpha = Math.max(0, p.life); c.strokeStyle = p.c; c.lineWidth = p.r; c.lineCap = 'round';
    c.beginPath(); c.moveTo(p.px - p.vx * 1.6, p.py - p.vy * 1.6); c.lineTo(p.x, p.y); c.stroke();
    if (Math.random() < .08) { c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x, p.y, p.r * .9, 0, 6.3); c.fill(); }
  }
  c.globalAlpha = 1;
  fxRaf = sparks.length ? requestAnimationFrame(fxTick) : 0;
}

const SCENES = { pair: scenePair, updates: sceneUpdates, todo: sceneTodo };
const ORDER = ['pair', 'updates', 'todo'];
let current = 'pair', autoplay = !reduced, visible = false;
const tabs = $('.demo-tabs');

function progress(scene) {
  $$('.demo-tabs .bar i').forEach(i => i.getAnimations().forEach(a => a.cancel()));
  if (!autoplay) return;
  $(`[data-scene=${scene}] .bar i`).animate([{ width: '0%' }, { width: '100%' }], { duration: LENGTH[scene], fill: 'forwards', easing: 'linear' });
}
async function play(scene) {
  const tok = ++gen; current = scene;
  frame(scene); progress(scene);
  try { await SCENES[scene](tok); return true; } catch (e) { if (e !== STOP) throw e; return false; }
}
async function cycle() {
  while (autoplay) {
    if (!visible || document.hidden) { await new Promise(r => setTimeout(r, 300)); continue; }
    const done = await play(current);
    if (!done || !autoplay) return;
    current = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  }
}
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .3 }).observe(wrap);

function takeOver() {
  if (!autoplay) return;
  autoplay = false; tabs.classList.add('manual'); progress(current);
}
$$('.demo-tabs [role=tab]').forEach(btn => btn.addEventListener('click', () => { takeOver(); play(btn.dataset.scene); }));
tabs.addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const i = ORDER.indexOf(current) + (e.key === 'ArrowRight' ? 1 : -1);
  const btn = $(`.demo-tabs [data-scene=${ORDER[(i + ORDER.length) % ORDER.length]}]`);
  btn.focus(); btn.click();
});

/* Manual use inside the phone. Each action starts its own short run. */
iph.addEventListener('click', async e => {
  const was = autoplay; takeOver();
  const tok = ++gen;
  const t = e.target;
  const run = async fn => { try { await fn(); } catch (err) { if (err !== STOP) throw err; } };
  const tabBtn = t.closest('.tabbar span');
  if (tabBtn) {
    const name = tabBtn.dataset.t; paired = true;
    if (name === 'chats') show(chatsHome()); else if (name === 'updates') show(updatesScreen(true)); else { show(todoScreen()); }
    if (name === 'todo') setMac('Pi Remote — ATU', macAtu());
    if (name === 'updates') { setMac('Pi Remote — Scheduled tasks', macRuns()); $$('.mw-list .st').forEach(s => { s.classList.add('done'); s.textContent = '✓ Sent'; }); }
    const clock = { chats: '9:41', updates: '7:05', todo: '8:12' }[name];
    sbTime.textContent = clock; macClock.textContent = `Fri ${clock} AM`;
    setTab(name); frame(name === 'chats' ? 'pair' : name); return;
  }
  const tile = t.closest('[data-tile]');
  if (tile) return run(() => openDetail(tile.dataset.tile, tok));
  const act = t.closest('[data-act]')?.dataset.act;
  if (act === 'back') { const under = layers.lastElementChild?.previousElementSibling; if (!under) return; pop(); setTab($('.ffeed', under) ? 'updates' : $('.done-today', under) ? 'todo' : null); if ($('.done-today', under)) { $('#bsheet', under)?.classList.remove('on'); $('#scrim', under)?.classList.remove('on'); } return; }
  if (act === 'ask') return run(() => ask(tok));
  if (act === 'select') return run(() => openSelect(tok));
  if (act === 'close') { $('#bsheet', layers).classList.remove('on'); $('#scrim', layers).classList.remove('on'); setTab('todo'); return; }
  if (act === 'follow') return run(() => followUp(tok));
  if (act === 'opt') return run(() => chooseOption(t.closest('.ropt'), tok));
  if (act === 'check') { const row = t.closest('.trow'); row.classList.toggle('checked'); row.querySelector('.box').textContent = row.classList.contains('checked') ? '✓' : ''; const n = $('#done-n', layers); n.textContent = 1 + $$('.trow.checked', layers).length; return; }
  if (act === 'host' || act === 'pair') { if (!was) return run(() => play('pair')); return; }
  const srow = t.closest('[data-pick]');
  if (srow) { pick(srow.dataset.pick); return; }
});

if (reduced) { autoplay = false; tabs.classList.add('manual'); play('pair'); } else cycle();

/* Run fn only while el is on screen. fn(true) starts, fn(false) stops. */
function whileSeen(el, fn, threshold = .25) {
  let on = false;
  new IntersectionObserver(([e]) => { if (e.isIntersecting !== on) { on = e.isIntersecting; fn(on); } }, { threshold }).observe(el);
}

/* ---------- S3 Models: a 3D sphere of provider logos ----------
   Fibonacci sphere with billboard nodes, after the tool sphere of the
   knowledge_monetization landing (landing-a.html). Logos fly in from the sides. */
(() => {
  const stage = $('#pv-sphere'), tip = $('#pv-tip'); if (!stage) return;
  const P = [['claude', 'Anthropic Claude'], ['openai', 'OpenAI'], ['google', 'Google Gemini'], ['xai', 'xAI Grok'], ['deepseek', 'DeepSeek'], ['kimi', 'Kimi'],
    ['qwen', 'Qwen'], ['mistral', 'Mistral'], ['meta', 'Meta Llama'], ['githubcopilot', 'GitHub Copilot'], ['openrouter', 'OpenRouter'], ['groq', 'Groq'],
    ['nvidia', 'NVIDIA'], ['minimax', 'MiniMax'], ['zhipu', 'Zhipu GLM'], ['huggingface', 'Hugging Face'], ['together', 'Together AI'], ['fireworks', 'Fireworks AI'],
    ['cerebras', 'Cerebras'], ['azure', 'Azure OpenAI'], ['bedrock', 'Amazon Bedrock'], ['vertexai', 'Google Vertex AI'], ['cloudflare', 'Cloudflare Workers AI'],
    ['vercel', 'Vercel AI Gateway'], ['moonshot', 'Moonshot'], ['baseten', 'Baseten'], ['zai', 'Z.ai'], ['opencode', 'OpenCode Zen'], ['antgroup', 'Ant Group'], ['xiaomimimo', 'Xiaomi MiMo']];
  const N = P.length, GOLD = Math.PI * (3 - Math.sqrt(5));
  const pts = P.map(([k, name], i) => {
    const el = document.createElement('span');
    el.className = 'pv-node'; el.dataset.name = name; el.style.opacity = 0;
    el.innerHTML = `<img src="${asset(k)}" alt="">`;
    stage.append(el);
    const y = 1 - (i + .5) * 2 / N, r = Math.sqrt(1 - y * y), th = i * GOLD;
    return { el, x: Math.cos(th) * r, y, z: Math.sin(th) * r, delay: (i * 137) % 500, sx: 0, sy: 0 };
  });
  let ang = 0, last = 0, paused = false, raf = 0, t0 = null;
  const INTRO = 1300, TILT = -.32, SPEED = .22, ct = Math.cos(TILT), st = Math.sin(TILT);
  stage.addEventListener('pointerover', e => { const n = e.target.closest('.pv-node'); if (!n) return; paused = true; tip.textContent = n.dataset.name; tip.classList.add('show'); });
  stage.addEventListener('pointerout', e => { if (e.target.closest('.pv-node')) { paused = false; tip.classList.remove('show'); } });
  function frame(ts) {
    raf = 0;
    if (!last) last = ts;
    const dt = Math.min((ts - last) / 1000, .05); last = ts;
    if (t0 === null) t0 = ts;
    if (!paused && !reduced && ts - t0 > INTRO + 300) ang += dt * SPEED;
    const R = Math.min(stage.clientWidth, stage.clientHeight) * .42, ca = Math.cos(ang), sa = Math.sin(ang);
    let moving = !reduced && ts - t0 < INTRO + 800;
    for (const p of pts) {
      const x = p.x * ca - p.z * sa, z0 = p.x * sa + p.z * ca;
      const y = p.y * ct - z0 * st, z = p.y * st + z0 * ct, d = (z + 1) / 2;
      const tx = x * R * 1.12, ty = y * R * .9, k = .55 + d * .6, o = .2 + d * .8;
      let e = 1;
      if (!reduced) { const raw = (ts - t0 - p.delay) / INTRO; e = raw >= 1 ? 1 : raw <= 0 ? 0 : 1 - (1 - raw) ** 3; }
      p.el.style.transform = `translate(${p.sx + (tx - p.sx) * e}px, ${p.sy + (ty - p.sy) * e}px) scale(${.3 + (k - .3) * e})`;
      p.el.style.opacity = o * e; p.el.style.zIndex = Math.round(d * 100);
      p.el.style.filter = d < .35 ? `blur(${(.35 - d) * 4}px)` : 'none';
    }
    if (!reduced || moving) raf = requestAnimationFrame(frame);
  }
  whileSeen(stage, on => {
    if (on && t0 === null) {
      const w = stage.clientWidth, h = stage.clientHeight;
      pts.forEach((p, i) => { const side = i % 2 ? 1 : -1; p.sx = side * (w * .55 + ((i * 53) % 100) / 100 * w * .4); p.sy = (((i * 71) % 100) / 100 - .5) * h; });
    }
    if (on && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  });
})();

/* ---------- S4 Cost: one race ----------
   Every meter fills at the same rate. A lane stops at its own result, so Pi
   stops first. Tabs switch the measure; autoplay cycles until a tab is used. */
(() => {
  const race = $('#race'); if (!race) return;
  const LANES = [['pi', 'Pi', 1], ['openai', 'Codex'], ['opencode', 'OpenCode'], ['claude', 'Claude Code']];
  const M = {
    time: { v: [156, 233, 271, 331], f: v => `${Math.round(v)} s`, big: '2×', line: 'faster than', cap: 'Median time per task. Every bar runs at the same speed; a bar stops when its agent finishes.', win: 'Finished first' },
    cost: { v: [.57, .66, .72, 1.96], f: v => `$${v.toFixed(2)}`, big: '3.4×', line: 'cheaper per finished task than', cap: 'Cost per finished task, at the model prices of August 2026.', win: 'Cheapest' },
    tokens: { v: [7.6, 9.2, 9.5, 15.1], f: v => `${v.toFixed(1)}M`, big: '50%', line: 'fewer tokens than', cap: 'Tokens for all 25 tasks.', win: 'Fewest tokens' },
  };
  const lanesEl = $('#lanes', race);
  lanesEl.innerHTML = LANES.map(([k, n, me]) => `<div class="lane${me ? ' me' : ''}"><div class="who"><span class="logo"><img src="${asset(k)}" alt=""></span><b>${n}</b></div>
    <div class="track"><i class="bar"></i><span class="val">–</span><em class="win"></em></div></div>`).join('');
  const lanes = $$('.lane', lanesEl);
  const num = $('#race-num'), line = $('#race-line'), cap = $('#race-cap');
  let metric = 'time', auto = !reduced, raf = 0, timer = 0, seen = false;
  function run(m) {
    metric = m; cancelAnimationFrame(raf); clearTimeout(timer);
    $$('[role=tab]', race).forEach(b => b.setAttribute('aria-selected', String(b.dataset.m === m)));
    const d = M[m], max = Math.max(...d.v), D = 2600;
    num.textContent = d.big; num.classList.remove('num-in'); void num.offsetWidth; num.classList.add('num-in');
    line.innerHTML = `${d.line} <img src="${asset('claude')}" alt=""> Claude Code`;
    cap.textContent = d.cap;
    lanes.forEach(l => { l.classList.remove('stop'); $('.win', l).textContent = ''; });
    const t0 = performance.now();
    const step = now => {
      const p = reduced ? 1 : Math.min(1, (now - t0) / D), cur = max * p;
      lanes.forEach((l, i) => {
        const v = Math.min(cur, d.v[i]);
        $('.bar', l).style.width = `${(v / max) * 100}%`;
        $('.val', l).textContent = d.f(v);
        if (cur >= d.v[i] && !l.classList.contains('stop')) { l.classList.add('stop'); if (i === 0) $('.win', l).textContent = d.win; }
      });
      if (p < 1) raf = requestAnimationFrame(step);
      else if (auto && seen) timer = setTimeout(() => run(m === 'time' ? 'cost' : m === 'cost' ? 'tokens' : 'time'), 2600);
    };
    raf = requestAnimationFrame(step);
  }
  $$('[role=tab]', race).forEach(b => b.addEventListener('click', () => { auto = false; run(b.dataset.m); }));
  whileSeen(race, on => { seen = on; if (on) run(metric); else { cancelAnimationFrame(raf); clearTimeout(timer); } }, .4);
})();

/* ---------- S5 Security: a sealed message ----------
   A sentence is sealed on the phone (scrambled, lock closes), crosses the
   relay as noise, and opens on the computer. Then the answer goes back. */
(() => {
  const box = $('#seal'); if (!box) return;
  const msg = $('#seal-msg'), text = $('#seal-text'), blind = $('#seal-blind'), glow = $('#seal-glow');
  const node = n => $(`[data-n=${n}]`, box);
  const HEX = '0123456789abcdef';
  const noise = len => Array.from({ length: len }, (_, i) => (i % 5 === 4 ? ' ' : HEX[(Math.random() * 16) | 0])).join('');
  let tok = 0;
  const sleep = (ms, t) => new Promise((res, rej) => setTimeout(() => (t === tok ? res() : rej(STOP)), ms));
  function at(n) {
    const a = node(n).querySelector('.seal-ic').getBoundingClientRect(), b = box.getBoundingClientRect();
    // Keep the whole message inside the card on narrow screens.
    const half = msg.offsetWidth / 2 + 8;
    const x = Math.min(b.width - half, Math.max(half, a.left + a.width / 2 - b.left));
    return [x, a.top - b.top - 30];
  }
  function place(n, ms = 0) {
    const [x, y] = at(n);
    msg.style.transition = ms ? `transform ${ms}ms cubic-bezier(.45,.05,.25,1)` : 'none';
    msg.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }
  async function morph(to, t, ms = 520) {
    const from = text.textContent, n = Math.max(from.length, to.length), steps = 14;
    for (let k = 1; k <= steps; k++) {
      const done = Math.floor((k / steps) * n);
      text.textContent = Array.from({ length: n }, (_, i) => (i < done ? to[i] || '' : HEX[(Math.random() * 16) | 0])).join('').trimEnd();
      await sleep(ms / steps, t);
    }
    text.textContent = to;
  }
  async function trip(from, to, plain, t) {
    box.dataset.dir = from === 'phone' ? 'out' : 'back';
    msg.className = 'seal-msg open'; text.textContent = plain; place(from); node(from).classList.add('on');
    await sleep(900, t);
    msg.className = 'seal-msg sealed'; await morph(noise(plain.length), t);
    await sleep(350, t);
    glow.className = `seal-glow go ${from === 'phone' ? 'ltr' : 'rtl'}`;
    place('relay', 1100); await sleep(1150, t);
    node('relay').classList.add('on'); blind.classList.add('show');
    for (let i = 0; i < 4; i++) { text.textContent = noise(plain.length); await sleep(160, t); }
    await sleep(500, t); blind.classList.remove('show'); node('relay').classList.remove('on');
    place(to, 1100); await sleep(1150, t);
    glow.className = 'seal-glow';
    node(to).classList.add('on'); msg.className = 'seal-msg open'; await morph(plain, t);
    await sleep(1500, t); node(from).classList.remove('on'); node(to).classList.remove('on');
  }
  async function loop(t) {
    try {
      for (;;) { await trip('phone', 'mac', 'Book the dentist, Tue 9:30', t); await trip('mac', 'phone', 'Booked. Smile Dental, 9:30', t); }
    } catch (e) { if (e !== STOP) throw e; }
  }
  if (reduced) { msg.className = 'seal-msg sealed'; text.textContent = noise(26); requestAnimationFrame(() => place('relay')); blind.classList.add('show'); return; }
  whileSeen(box, on => { tok++; if (on) loop(tok); }, .35);
  addEventListener('resize', () => { if (msg.style.transform) place(box.dataset.dir === 'back' ? 'phone' : 'mac'); });
})();

/* ---------- S7 Details ---------- */
// Thinking orb: the fifteen production forms, one after another. Tap for the next.
(() => {
  const stage = $('#dt-orb'); if (!stage || !window.ThinkingOrb) return;
  const states = window.ThinkingOrb.STATES, order = ['composing', ...states.filter(s => s !== 'composing')];
  const LINES = ['Bring the hard part.', 'What are we making?', 'Your move.', 'Start wherever.', 'Small fix or big plan.', 'What should Pi do?'];
  const o = makeOrb($('#dt-orb-c'), order[0], { size: 64, scale: 2, pad: .2 });
  const name = $('#dt-orb-name'), copy = $('#dt-orb-copy');
  let i = 0, timer = 0, seen = false;
  function next() {
    i = (i + 1) % order.length; o.to(order[i]);
    name.textContent = `${order[i]} · ${i + 1} / ${order.length}`;
    copy.classList.remove('type'); void copy.offsetWidth; copy.textContent = LINES[i % LINES.length]; copy.classList.add('type');
  }
  const schedule = () => { clearTimeout(timer); if (seen && !reduced) timer = setTimeout(() => { next(); schedule(); }, 3200); };
  stage.addEventListener('click', () => { next(); schedule(); });
  stage.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); schedule(); } });
  whileSeen(stage, on => { seen = on; schedule(); });
})();

// Max thinking: the level steps up to Max, the label turns rainbow and the aura rises.
// Aura after NativeMaxEffortAura (NativeAppearance.swift): columns and a hump, blurred by CSS.
(() => {
  const cv = $('#dt-aura'); if (!cv) return;
  const thumb = $('#mx-thumb'), level = $('#mx-level'), track = $('#mx-track');
  const PAL = [0xff8cc8, 0xdc94ff, 0xa9a0ff, 0x86c2ff, 0x7ee6dc, 0x9aeeb8, 0xffe08a, 0xffba94];
  const COLS = [[0, 70, 1], [-60, 50, .85], [60, 50, .85], [-120, 46, .7], [120, 46, .7], [-170, 40, .55], [170, 40, .55]];
  const rainbow = q => { const n = PAL.length, p = ((q % 1) + 1) % 1 * n, a = PAL[p | 0], b = PAL[((p | 0) + 1) % n], t = p - (p | 0);
    const c = s => Math.round(((a >> s) & 255) + ((((b >> s) & 255) - ((a >> s) & 255)) * t)); return `${c(16)},${c(8)},${c(0)}`; };
  let rise = 0, target = 0, raf = 0, seen = false, step = 2, timer = 0;
  const NAMES = ['Low', 'Medium', 'High', 'Max'];
  function setLevel(k) {
    step = k; thumb.style.left = `${k * 25}%`;
    $$('span', track).forEach((s, j) => s.classList.toggle('on', j === k));
    level.textContent = NAMES[k]; level.classList.toggle('max', k === 3); target = k === 3 ? 1 : 0; kick();
  }
  function draw(time) {
    const ctx = cv.getContext('2d'), W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (rise < .001) return;
    const sc = W / 390, br = .5 + .5 * Math.sin(2 * Math.PI * time / 3.6), swell = .5 + .5 * br, flow = time / 12;
    const cx = W / 2 + Math.sin(2 * Math.PI * time / 7.3) * W * .04, bottom = H;
    const tint = (x, a) => `rgba(${rainbow(x / W * .85 - flow)},${a})`;
    COLS.forEach(([dx, w, h], i) => {
      const ph = time * (1.1 + .23 * i) + i * 1.9, sway = Math.sin(ph * .6), pulse = .5 + .5 * Math.sin(ph + 1.3);
      const x = cx + dx * sc + sway * 14 * sc, rx = w * sc * (.85 + .25 * swell), ry = H * h * rise * (.55 + .45 * (.5 * pulse + .5 * br));
      const a = .36 * rise * (.6 + .4 * pulse), g = ctx.createLinearGradient(0, bottom - ry, 0, bottom);
      g.addColorStop(0, tint(x, 0)); g.addColorStop(.5, tint(x, a * .6)); g.addColorStop(1, tint(x, a));
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, bottom, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    });
    const peak = 60 * sc * rise * (.55 + .45 * br) * 1.4, width = W * .3;
    const hgt = x => { const d = x - cx; return peak * (.5 * Math.exp(-((d / (width * .5)) ** 2)) + .5 * Math.exp(-((d / (width * 1.15)) ** 2))) * (1 + .1 * Math.sin(x / W * 7 + time * 1.4)) + 10 * sc * rise; };
    const g = ctx.createLinearGradient(0, 0, W, 0);
    for (let k = 0; k <= 12; k++) g.addColorStop(k / 12, tint(k / 12 * W, .75 * rise * (.8 + .2 * br)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, bottom);
    for (let k = 0; k <= 48; k++) { const x = W * k / 48; ctx.lineTo(x, bottom - hgt(x)); }
    ctx.lineTo(W, bottom); ctx.closePath(); ctx.fill();
  }
  function kick() {
    if (raf) return;
    let last = performance.now();
    const tick = now => {
      raf = 0; const dt = (now - last) / 1000; last = now;
      rise = target > rise ? Math.min(1, rise + dt / 1.4) : Math.max(0, rise - dt / .6);
      draw(reduced ? 0 : now / 1000);
      if (seen && (rise > 0 || target > 0) && !reduced) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  const SEQ = [[1, 900], [2, 900], [3, 4200], [2, 1600]];
  let si = 0;
  const cycle = () => { clearTimeout(timer); if (!seen) return; const [k, ms] = SEQ[si]; setLevel(k); si = (si + 1) % SEQ.length; timer = setTimeout(cycle, ms); };
  if (reduced) { rise = 1; setLevel(3); requestAnimationFrame(() => draw(0)); return; }
  setLevel(2);
  whileSeen(cv.closest('.dt'), on => { seen = on; if (on) { cycle(); kick(); } else clearTimeout(timer); });
})();

// Running: a small working orb and a seconds counter beside the beaming message box.
(() => {
  const c = $('#hl-orb'); if (!c) return;
  makeOrb(c, 'weaving', { size: 20, scale: 1, pad: .1 });
  const sec = $('#hl-sec'); let n = 12;
  whileSeen(c.closest('.dt'), on => { clearInterval(c._t); if (on && !reduced) c._t = setInterval(() => { n = n >= 59 ? 1 : n + 1; sec.textContent = n; }, 1000); });
})();

// Reading font: the same answer in Mono, then in the Reading face.
(() => {
  const box = $('#rd-text'); if (!box) return;
  let serif = false, timer = 0;
  const flip = () => { serif = !serif; box.classList.toggle('serif-on', serif); $('#rd-a').classList.toggle('on', !serif); $('#rd-b').classList.toggle('on', serif); };
  if (reduced) { flip(); return; }
  whileSeen(box.closest('.dt'), on => { clearInterval(timer); if (on) timer = setInterval(flip, 2800); });
})();

/* ---------- Scroll reveal ---------- */
(() => {
  if (reduced) return;
  const els = $$('.demo-copy, .demo-tabs, .ds-wrap, .sp h2, .sp p:not(.pv-tip), .big-num, .race, .timeline, .plan, .dt, .section-title, .security > :not(.section-title), .access > *');
  const ro = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
  els.forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--d', `${(i % 3) * .06}s`); ro.observe(el); });
})();

window.__site = { play, stop: () => { autoplay = false; }, celebrate: () => celebrate($$('.change-r i', layers).pop()) };
})();
