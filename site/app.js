// Site landing mockup. Sample data only. No network calls.

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Pixel icons: 9 x 9 bitmaps, '#' is a lit pixel ---------- */
const ICONS = {
  grid: '.........|.###.###.|.###.###.|.###.###.|.........|.###.###.|.###.###.|.###.###.|.........',
  bubble: '.........|.#######.|.#.....#.|.#.#.#.#.|.#.....#.|.#######.|..##.....|..#......|.........',
  ask: '..#####..|.##...##.|......##.|....###..|...##....|...##....|.........|...##....|...##....',
  file: '.#####...|.#...##..|.#....##.|.#.##..#.|.#.....#.|.#.###.#.|.#.....#.|.#######.|.........',
  pi: '.........|.#######.|.#######.|..#...#..|..#...#..|..#...#..|..#...#..|.##...##.|.........',
  mac: '.........|.#######.|.#.....#.|.#.....#.|.#.....#.|.#######.|#########|.........|.........',
  phone: '..#####..|..#...#..|..#...#..|..#...#..|..#...#..|..#...#..|..##.##..|..#####..|.........',
  tablet: '.#######.|.#.....#.|.#.....#.|.#.....#.|.#.....#.|.#.....#.|.###.###.|.#######.|.........',
  globe: '...###...|..#.#.#..|.#..#..#.|.#######.|.#..#..#.|.#######.|.#..#..#.|..#.#.#..|...###...',
  cloud: '.........|...###...|..#...#..|.##....#.|#.......#|#.......#|.#######.|.........|.........',
  qr: '###.#.###|#.#...#.#|###.#.###|....#....|##.#.##.#|....#.#..|###..#.#.|#.#.##.##|###.#..#.',
  plug: '..#...#..|..#...#..|.#######.|.#.....#.|.#.....#.|..#...#..|...###...|....#....|....#....',
  lock: '...###...|..#...#..|..#...#..|.#######.|.#.....#.|.#..#..#.|.#..#..#.|.#.....#.|.#######.',
  term: '#########|#.......#|#.#.....#|#..#....#|#.#..##.#|#.......#|#########|.........|.........',
  power: '....#....|.#..#..#.|#...#...#|#...#...#|#.......#|#.......#|.#.....#.|..#####..|.........',
  stack: '..######.|..#....#.|#######..|#.....#..|#.....#..|#.....#..|#######..|.........|.........',
  puzzle: '...##....|.######..|.#....#..|.#....###|.#....###|.#....#..|.######..|...##....|.........',
};
function bitmapSvg(rows) {
  const h = rows.length, w = rows[0].length;
  let rects = '';
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }));
  return `<svg viewBox="0 0 ${w} ${h}" fill="currentColor" aria-hidden="true">${rects}</svg>`;
}
$$('.px-icon[data-icon]').forEach(el => { el.innerHTML = bitmapSvg(ICONS[el.dataset.icon].split('|')); });

/* ---------- Navigation background after scroll ---------- */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- Digit matrix behind the hero and the access card ---------- */
function matrix(canvas, { cell = 16, alpha = .1, glyphs = '0 1 · ·  ' } = {}) {
  const ctx = canvas.getContext('2d');
  let cols, rows, cells, dpr;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr; canvas.height = height * dpr;
    cols = Math.ceil(width / cell); rows = Math.ceil(height / cell);
    cells = Array.from({ length: cols * rows }, () => glyphs[Math.floor(Math.random() * glyphs.length)]);
    draw();
  };
  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `10px "Departure Mono", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    cells.forEach((g, i) => {
      if (g === ' ') return;
      ctx.fillStyle = `rgba(255,255,255,${g === '·' ? alpha * .7 : alpha})`;
      ctx.fillText(g, (i % cols) * cell + cell / 2, Math.floor(i / cols) * cell + cell / 2);
    });
  };
  resize(); addEventListener('resize', resize);
  if (reduced) return;
  let last = 0;
  const tick = t => {
    if (t - last > 90 && !document.hidden) {
      last = t;
      for (let k = 0; k < cells.length / 60; k++) cells[Math.floor(Math.random() * cells.length)] = glyphs[Math.floor(Math.random() * glyphs.length)];
      draw();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
// The light redesign drops the digit matrix; matrix() stays for reuse.

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
    // Swap the mascot outfit and its floating objects with the word.
    $$('.hero-dog, .word-img').forEach(n => n.classList.toggle('on', n.dataset.word === target));
    let frame = 0;
    const total = 16;
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

/* ---------- Product stage scenes ---------- */
// A QR-looking pattern: three finder squares and seeded noise. It encodes nothing.
(function drawQr() {
  const n = 25; let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const finder = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  const on = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => { const a = x - fx, b = y - fy; if (a < 0 || b < 0 || a > 6 || b > 6) return false; return a === 0 || b === 0 || a === 6 || b === 6 || (a > 1 && a < 5 && b > 1 && b < 5); });
  let rects = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (finder(x, y) ? on(x, y) : rnd() > .52) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  const svg = `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="#1d1a17">${rects}</g></svg>`;
  document.getElementById('qr-code').innerHTML = svg;
  document.getElementById('qr-mini').innerHTML = svg;
})();
const stage = $('#stage');
const term = $('#term');
const phone = $('#phone');
const sheet = $('#sheet');
const composer = $('#composer');
const composerText = $('#composer-text');
const toast = $('#toast');
const toastText = $('#toast-text');

const COPY = {
  pair: ['Scan. Sign in. Done.', 'Scan one QR code to pair your phone, then sign in with the model subscriptions you already have. Keys stay on your Mac.'],
  work: ['Your Mac, in your pocket.', 'Pi works on your Mac. You watch, reply and decide from your phone.'],
};
const TOAST = {
  pair: ['var(--green)', 'Signed in: Claude, ChatGPT'],
  work: ['var(--accent)', 'Message from iPhone'],
};

const t = (html, cls = '') => ({ kind: 'term', html, cls });
const p = html => ({ kind: 'phone', html });
const tool = (state, name, arg) => `<div class="tool">${state === 'run' ? '<i class="spin"></i>' : '<b class="g">✓</b>'}<span>${name}</span><em>${arg}</em></div>`;
const pairTerm = [
  t('<b class="o">$</b> pi-remote pair'),
  t('<span class="dim">Scan this code with the Pi Remote app.</span>'),
];

// Each scene is a list of steps. A step waits `at` ms, then runs.
const SCENES = {
  pair: [
    ...pairTerm.map(s => ({ ...s, at: 300 })),
    { at: 200, kind: 'qr', on: true },
    { at: 500, kind: 'cam', on: true },
    { at: 900, kind: 'scan' },
    { at: 700, kind: 'qr', on: false },
    { at: 0, kind: 'cam', on: false },
    { at: 0, kind: 'paired', on: true },
    { at: 0, ...t('<b class="g">✓</b> Paired: iPhone · runs at login') },
    { at: 1000, kind: 'paired', on: false },
    { at: 0, kind: 'signin', on: true },
    { at: 500, ...t('<b class="g">✓</b> Signed in: Anthropic (Claude)') },
    { at: 500, ...t('<b class="g">✓</b> Signed in: OpenAI (ChatGPT · Codex)') },
    { at: 0, kind: 'toast' },
    { at: 300, ...t('<b class="g">●</b> Online — ready for work') },
  ],
  work: [
    { at: 0, ...t('<b class="g">●</b> Online — ready for work') },
    { at: 400, kind: 'type', text: 'Fix the empty state on the project list' },
    { at: 400, kind: 'send' },
    { at: 0, ...p('<div class="bubble">Fix the empty state on the project list</div>') },
    { at: 250, ...t('<b class="o">›</b> Fix the empty state on the project list <span class="b">[iPhone]</span>') },
    { at: 0, kind: 'toast' },
    { at: 450, ...t('<b class="g">●</b> Read(src/ProjectList.tsx)') },
    { at: 0, ...t('<span class="dim">  └─ 142 lines</span>') },
    { at: 0, ...p(tool('ok', 'read', 'src/ProjectList.tsx')) },
    { at: 450, ...t('<b class="g">●</b> Edit(src/ProjectList.tsx)') },
    { at: 0, ...t('<span class="dim"> 13</span> -   return null;', 'diff-del') },
    { at: 0, ...t('<span class="dim"> 13</span> +   return &lt;EmptyState /&gt;;', 'diff-add') },
    { at: 0, ...p(tool('ok', 'edit', 'ProjectList.tsx  +8 −1')) },
    { at: 450, ...t('<b class="o">●</b> Bash(npm test)') },
    { at: 0, ...p(tool('run', 'bash', 'npm test')) },
    { at: 900, ...t('<span class="dim">  └─</span> <b class="g">✓ 11 tests passed</b>') },
    { at: 0, ...p('<p class="say">Done. The empty list now shows a “Create your first project” button. 11 tests pass.</p>') },
  ],
};

let generation = 0;
let current = 'pair';

function setToast(scene) {
  const [colour, text] = TOAST[scene];
  toast.style.color = colour;
  toastText.textContent = text;
  toast.classList.remove('pulse'); void toast.offsetWidth; toast.classList.add('pulse');
}

function resetStage(scene) {
  term.innerHTML = ''; phone.innerHTML = '';
  ['#qr', '#cam', '#paired', '#signin'].forEach(id => $(id).classList.remove('on', 'hit'));
  sheet.className = 'sheet'; sheet.innerHTML = '';
  composer.className = 'phone-composer'; composerText.textContent = 'Message Pi…';
  $('#scene-title').textContent = COPY[scene][0];
  $('#scene-text').textContent = COPY[scene][1];
  $$('.tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.scene === scene)));
  stage.dataset.scene = scene;
  // A scene without an explicit toast step shows its toast at the start.
  if (!SCENES[scene].some(s => s.kind === 'toast')) setToast(scene);
  else { toast.style.color = 'rgba(255,255,255,.7)'; toastText.textContent = scene === 'work' ? 'Studio Mac · online' : 'Waiting for iPhone…'; }
}

function runStep(step, scene, instant) {
  const add = (root, html, cls) => {
    let el;
    if (root === term) { el = document.createElement('div'); el.innerHTML = html; if (!instant) el.classList.add('line-in'); }
    else { root.insertAdjacentHTML('beforeend', html); el = root.lastElementChild; }
    if (cls) el.classList.add(cls);
    root.append(el);
    return el;
  };
  switch (step.kind) {
    case 'term': add(term, step.html, step.cls); break;
    case 'phone': {
      if (!step.html.startsWith('<div class="working"')) $$('.working, .tool .spin', phone).forEach(n => (n.classList.contains('working') ? n.remove() : n.replaceWith(Object.assign(document.createElement('b'), { className: 'g', textContent: '✓' }))));
      add(phone, step.html); break;
    }
    case 'type': composer.classList.add('typing'); composerText.textContent = ''; return typeText(step.text, instant);
    case 'send': composer.className = 'phone-composer'; composerText.textContent = 'Message Pi…'; break;
    case 'toast': setToast(scene); break;
    case 'sheet': sheet.className = 'sheet open'; sheet.innerHTML = step.html; break;
    case 'pick': $('[data-o=yes]', sheet)?.classList.add('on'); break;
    case 'sheet-close': sheet.className = 'sheet'; break;
    case 'qr': $('#qr').classList.toggle('on', step.on); break;
    case 'cam': $('#cam').classList.toggle('on', step.on); break;
    case 'scan': $('#cam').classList.add('hit'); break;
    case 'signin': $('#signin').classList.toggle('on', step.on); break;
    case 'paired': $('#paired').classList.toggle('on', step.on); break;
    case 'doc': sheet.className = 'sheet doc open'; sheet.innerHTML = step.html; break;
  }
  return null;
}

function typeText(text, instant) {
  if (instant) { composerText.textContent = text; composer.classList.add('ready'); return null; }
  const token = generation;
  return new Promise(resolve => {
    let i = 0;
    const next = () => {
      if (token !== generation) return resolve();
      composerText.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(next, 38); else { composer.classList.add('ready'); resolve(); }
    };
    next();
  });
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function play(scene, { instant = reduced } = {}) {
  const token = ++generation;
  current = scene;
  resetStage(scene);
  for (const step of SCENES[scene]) {
    if (!instant && step.at) await wait(step.at);
    if (token !== generation) return false;
    // Skip transient steps in the static view, so the end state stays readable.
    if (instant && (step.kind === 'type' || step.kind === 'send')) continue;
    const pending = runStep(step, scene, instant);
    if (pending) await pending;
    if (token !== generation) return false;
  }
  return true;
}

/* Autoplay cycles the scenes while the stage is on screen. A click stops it. */
const ORDER = ['pair', 'work'];
let autoplay = !reduced;
let visible = false;
async function cycle() {
  while (autoplay) {
    if (!visible || document.hidden) { await wait(400); continue; }
    const done = await play(current);
    if (!done || !autoplay) return;
    await wait(3200);
    if (!autoplay) return;
    current = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  }
}
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .25 }).observe(stage);

$$('.tabs [role=tab]').forEach(btn => btn.addEventListener('click', () => {
  autoplay = false;
  play(btn.dataset.scene, { instant: reduced });
}));
$('.tabs').addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const i = ORDER.indexOf(current) + (e.key === 'ArrowRight' ? 1 : -1);
  const btn = $(`.tabs [data-scene=${ORDER[(i + ORDER.length) % ORDER.length]}]`);
  btn.focus(); btn.click();
});

if (reduced) play('work', { instant: true }); else cycle();

/* ---------- Waitlist preview ---------- */
$('#bottom-join').addEventListener('click', () => {
  requestAnimationFrame(() => $('#email').focus({ preventScroll: true }));
});

$('#access-form').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#email');
  const status = $('#form-status');
  if (!input.checkValidity() || !input.value) {
    status.className = 'form-status err';
    status.textContent = 'Enter a valid email address.';
    input.focus();
    return;
  }
  input.value = '';
  status.className = 'form-status ok';
  status.textContent = '✓ Preview only — nothing was sent or saved.';
});

// Expose the scene player for the review check.
window.__siteLanding = { play, stop: () => { autoplay = false; } };

// Logo wall of the model band: sharp in the middle, blurred at the edges.
(() => {
  const wall = document.getElementById("logo-wall");
  if (!wall) return;
  const mono = new Set(["openai", "xai", "githubcopilot", "openrouter", "groq", "kimi", "moonshot", "vercel", "zai", "opencode", "commandcode", "baseten", "xiaomimimo"]);
  const sharp = ["groq", "claude", "openai", "nvidia", "deepseek", "google", "xai", "mistral", "githubcopilot", "openrouter", "qwen", "meta", "kimi", "zhipu", "minimax", "huggingface"];
  const edge = ["together", "fireworks", "cerebras", "azure", "bedrock", "vertexai", "cloudflare", "vercel", "moonshot", "baseten", "zai", "opencode", "antgroup", "xiaomimimo", "commandcode", "together", "azure", "vercel", "bedrock", "cloudflare"];
  const cols = window.matchMedia("(max-width: 900px)").matches ? 4 : 6, rows = 6;
  let s = 0, e = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const inner = r > 0 && r < rows - 1 && c > 0 && c < cols - 1;
    const name = inner ? sharp[s++ % sharp.length] : edge[e++ % edge.length];
    const tile = document.createElement("span");
    if (!inner) tile.className = "blur";
    tile.innerHTML = `<img src="assets/providers/${name}.png" alt="">`;
    wall.append(tile);
  }
})();

// Scroll reveal: fade sections up as they enter. Groups stagger their children.
(() => {
  if (reduced || !('IntersectionObserver' in window)) return;
  const single = ['.scene-copy', '.tabs', '#stage', '.strip', '.band .copy', '.band .vis', '.section-title', '.security > :not(.section-title)', '.own .card', '.faq details', '.access > *'];
  const groups = ['.features .card', '.todo-points li'];
  const els = [];
  single.forEach(sel => $$(sel).forEach(el => els.push(el)));
  groups.forEach(sel => $$(sel).forEach((el, i) => { el.style.setProperty('--d', `${(i % 3) * 0.08}s`); els.push(el); }));
  $$('.band .vis').forEach(el => el.style.setProperty('--d', '.12s'));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
  }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  [...new Set(els)].forEach(el => { el.classList.add('reveal'); io.observe(el); });
})();
