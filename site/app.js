// Site v2. Sample data only. No network calls. Classic script: one closure, no globals.
(() => {

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Reuse a rendered image from the asset bank (keeps preview path rewriting intact).
const asset = k => { const i = document.querySelector(`.asset-bank [data-asset="${k}"]`); return i ? (i.currentSrc || i.src) : ''; };

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
  <div class="empty"><i class="orb"></i><p>Bring the hard part.</p></div>
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
const LENGTH = { pair: 9800, updates: 15500, todo: 17500 };

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
  await wait(700, tok);
  $('#ret', sc).classList.add('lock');
  await wait(550, tok);
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
  $('#mw-log')?.insertAdjacentHTML('beforeend', `<li><b>✓</b>${dentist ? 'Drafted the booking request' : 'Started on it'}<em>${dentist ? choice : 'now'}</em></li>`);
  th.insertAdjacentHTML('beforeend', `<div class="msg">${dentist ? `${choice} it is. The booking request is ready; send it when you like.` : 'On it. I’ll report back in this chat.'}<time>8:15</time></div>`);
  await wait(500, tok);
  const when = dentist ? (choice.startsWith('Tue') ? 'Tue 13 Oct' : choice.startsWith('Wed') ? 'Wed 14 Oct' : 'Fri 16 Oct') : 'Today';
  th.insertAdjacentHTML('beforeend', `<div class="change"><div class="change-h"><span>Todo</span><b>Undo</b></div><div class="change-r"><i>✓</i><div>${todo ? todo.t : choice}<small>Moved to ${when}</small></div></div></div>`);
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

/* ---------- Waitlist sheet (preview) ----------
   Steps: choose -> done (Google, or an address already on the list)
                 -> check (new typed address: confirm link by email).
   State stays in memory for this page view. No network call. */
(() => {
  const dlg = $('#waitlist'); if (!dlg) return;
  const gBtn = $('#wl-google'), form = $('#wl-form'), input = $('#wl-email'), status = $('#wl-status');
  const SAMPLE_GOOGLE = 'alex.chen@gmail.com';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let joined = null;            // { email, via: 'google' | 'email' }
  let busy = false;

  const say = (text, cls = '') => { status.className = `wl-status ${cls}`; status.textContent = text; };
  function show(step) {
    $$('.wl-step', dlg).forEach(s => { s.hidden = s.dataset.step !== step; });
    if (joined) $$('.wl-addr', dlg).forEach(b => { b.textContent = joined.email; });
    $('.wl-via', dlg).hidden = !(joined && joined.via === 'google');
    if (step !== 'choose') $(`[data-step="${step}"] h2`, dlg).focus();
  }
  function open() {
    say('');
    $('[data-step="done"] h2', dlg).textContent = 'You’re on the list';
    dlg.showModal();
    show(!joined ? 'choose' : joined.via === 'google' ? 'done' : 'check');
  }
  const close = () => dlg.close();
  function finish(email, via) {
    const again = !!joined && joined.email === email;
    joined = { email, via: again ? joined.via : via };
    show(via === 'google' || again ? 'done' : 'check');
    if (again) $('[data-step="done"] h2', dlg).textContent = 'You’re already on the list';
    $('#hero-join').textContent = '✓ You’re on the list';
    $('#hero-hint').textContent = joined.via === 'google' || again
      ? `We will email ${email} when your invite is ready.`
      : `Tap the link we sent to ${email} to confirm.`;
  }

  $$('[data-join]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(); }));
  $$('[data-close]', dlg).forEach(b => b.addEventListener('click', close));
  $('[data-restart]', dlg).addEventListener('click', () => {
    joined = null; input.value = ''; say(''); show('choose'); input.focus();
    $('#hero-join').textContent = 'Join the waitlist';
    $('#hero-hint').textContent = 'One tap with Google, or use any email.';
  });
  // A click on the backdrop closes the sheet.
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });

  // Production: Google returns an ID token; the Worker checks it and keeps the verified address.
  gBtn.addEventListener('click', () => {
    if (busy) return; busy = true;
    gBtn.classList.add('busy'); $('.glabel', gBtn).textContent = 'Connecting to Google…';
    setTimeout(() => {
      busy = false; gBtn.classList.remove('busy'); $('.glabel', gBtn).textContent = 'Continue with Google';
      finish(SAMPLE_GOOGLE, 'google');
    }, reduced ? 0 : 900);
  });

  // A Gmail address typed by hand: point to the one-tap path, which needs no confirmation email.
  input.addEventListener('input', () => {
    const v = input.value.trim().toLowerCase();
    if (/@(gmail|googlemail)\.com$/.test(v)) say('Tip: Continue with Google skips the confirmation email.', 'tip');
    else if (/\b(tip|err)\b/.test(status.className)) say('');
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = input.value.trim().toLowerCase();
    if (!EMAIL_RE.test(v)) { say('Enter a valid email address.', 'err'); input.focus(); return; }
    finish(v, 'email');
  });
})();

/* ---------- Model provider wall ---------- */
(() => {
  const wall = $('#logo-wall'); if (!wall) return;
  const names = ['claude', 'openai', 'google', 'xai', 'deepseek', 'kimi', 'qwen', 'mistral', 'meta', 'githubcopilot', 'openrouter', 'groq', 'nvidia', 'minimax', 'zhipu', 'huggingface',
    'together', 'fireworks', 'cerebras', 'azure', 'bedrock', 'vertexai', 'cloudflare', 'vercel', 'moonshot', 'baseten', 'zai', 'opencode', 'antgroup', 'xiaomimimo'];
  const narrow = matchMedia('(max-width: 900px)').matches;
  names.slice(0, narrow ? 20 : 30).forEach((n, i) => {
    const s = document.createElement('span');
    s.style.setProperty('--dl', `${-(i * 0.37) % 6}s`);
    s.innerHTML = `<img src="${asset(n)}" alt="">`;
    wall.append(s);
  });
})();

/* ---------- Charts fill when seen; scroll reveal ---------- */
(() => {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .3 });
  $$('.chart').forEach(c => (reduced ? c.classList.add('in') : io.observe(c)));
  if (reduced) return;
  const els = $$('.demo-copy, .demo-tabs, .ds-wrap, .sp h2, .sp p, .big-num, .stat, .chart, .timeline, .plan, .dt, .section-title, .security > :not(.section-title), .access > *');
  const ro = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
  els.forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--d', `${(i % 3) * .06}s`); ro.observe(el); });
})();

window.__site = { play, stop: () => { autoplay = false; } };
})();
