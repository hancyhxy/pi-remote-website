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

/* ---------- Sample QR bitmap (decorative; not scannable) ---------- */
(function drawQr() {
  const n = 25; let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd() > .52));
  const finder = (ox, oy) => { for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
    const edge = x === 0 || y === 0 || x === 6 || y === 6, core = x > 1 && x < 5 && y > 1 && y < 5;
    grid[oy + y][ox + x] = edge || core;
  } for (let i = -1; i < 8; i++) for (const [a, b] of [[i, -1], [i, 7], [-1, i], [7, i]]) {
    const yy = oy + b, xx = ox + a; if (grid[yy] && xx >= 0 && xx < n) grid[yy][xx] = false; } };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  $('#qr').innerHTML = bitmapSvg(grid.map(r => r.map(v => (v ? '#' : '.')).join(''))).replace('currentColor', '#111');
})();

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
const stage = $('#stage');
const term = $('#term');
const phone = $('#phone');
const sheet = $('#sheet');
const composer = $('#composer');
const composerText = $('#composer-text');
const toast = $('#toast');
const toastText = $('#toast-text');

const COPY = {
  check: ['See what Pi is doing.', 'Every read, edit and command — live on your phone, as it happens on your Mac.'],
  reply: ['Send the next step.', 'Type an instruction on your phone. Pi picks it up on your Mac and keeps going.'],
  answer: ['Answer from anywhere.', 'When Pi needs a decision, the dialog opens on your phone and in your terminal. First answer wins.'],
  preview: ['Read the result.', 'Open Markdown, images and HTML that Pi wrote, without going back to your desk.'],
};
const TOAST = {
  check: ['var(--green)', 'iPhone watching'],
  reply: ['var(--accent)', 'Message from iPhone'],
  answer: ['var(--green)', 'Answered on iPhone'],
  preview: ['var(--accent-2)', 'Opened test-report.md'],
};

const t = (html, cls = '') => ({ kind: 'term', html, cls });
const p = html => ({ kind: 'phone', html });
const tool = (state, name, arg) => `<div class="tool">${state === 'run' ? '<i class="spin"></i>' : '<b class="g">✓</b>'}<span>${name}</span><em>${arg}</em></div>`;
const baseTerm = [
  t('<b class="o">›</b> Add an empty state to the project list.'),
  t('<b class="g">●</b> Read(src/ProjectList.tsx)'), t('<span class="dim">  └─ 142 lines</span>'),
  t('<b class="g">●</b> Edit(src/ProjectList.tsx)'),
  t('<span class="dim"> 12</span>   if (!projects.length) {'),
  t('<span class="dim"> 13</span> -   return null;', 'diff-del'),
  t('<span class="dim"> 13</span> +   return &lt;EmptyState /&gt;;', 'diff-add'),
];

// Each scene is a list of steps. A step waits `at` ms, then runs.
const SCENES = {
  check: [
    ...baseTerm.map(s => ({ ...s, at: 260 })),
    { at: 0, ...p('<div class="bubble">Add an empty state to the project list.</div>') },
    { at: 300, ...p(tool('ok', 'read', 'src/ProjectList.tsx')) },
    { at: 300, ...p(tool('ok', 'edit', 'ProjectList.tsx  +8 −1')) },
    { at: 350, ...t('<b class="o">●</b> Bash(npm test)') },
    { at: 0, ...p(tool('run', 'bash', 'npm test')) },
    { at: 200, ...t('<span class="dim">  └─ running… </span><span class="cursor"></span>') },
    { at: 0, ...p('<div class="working"><i></i>Working · 0:42</div>') },
  ],
  reply: [
    ...baseTerm.map(s => ({ ...s, at: 0 })),
    { at: 0, ...t('<b class="g">✓</b> 11 tests passed') },
    { at: 0, ...p('<div class="bubble">Add an empty state to the project list.</div>') },
    { at: 0, ...p(tool('ok', 'edit', 'ProjectList.tsx  +8 −1')) },
    { at: 0, ...p('<p class="say">Done. The empty state shows a “Create your first project” button. 11 tests pass.</p>') },
    { at: 500, kind: 'type', text: 'Also add a test for the empty list.' },
    { at: 500, kind: 'send' },
    { at: 0, ...p('<div class="bubble">Also add a test for the empty list.</div>') },
    { at: 250, ...t('<b class="o">›</b> Also add a test for the empty list. <span class="b">[iPhone]</span>') },
    { at: 0, kind: 'toast' },
    { at: 500, ...t('<b class="g">●</b> Write(src/ProjectList.test.tsx)') },
    { at: 0, ...p(tool('run', 'write', 'ProjectList.test.tsx')) },
    { at: 0, ...p('<div class="working"><i></i>Working · 0:03</div>') },
  ],
  answer: [
    { at: 0, ...t('<b class="g">●</b> Write(migrations/0007_projects.sql)') },
    { at: 0, ...t('<span class="dim">  └─ 18 lines</span>') },
    { at: 0, ...p(tool('ok', 'write', 'migrations/0007_projects.sql')) },
    { at: 300, ...t('<div class="term-select"><b class="o">?</b> Run the database migration first?\n<b class="o">›</b> Yes, run it\n  No, skip for now\n  Type something…</div>') },
    { at: 0, kind: 'sheet', html: '<h4>Run the database migration first?</h4><p class="hint">Also shown in your terminal. First answer wins.</p><span class="opt" data-o="yes">Yes, run it</span><span class="opt">No, skip for now</span><span class="opt">Type something…</span>' },
    { at: 1400, kind: 'pick' },
    { at: 600, kind: 'sheet-close' },
    { at: 0, ...t('<b class="g">✓</b> Answered on iPhone: <b>Yes, run it</b>') },
    { at: 0, kind: 'toast' },
    { at: 0, ...p('<p class="say">You chose <b>Yes, run it</b>.</p>') },
    { at: 350, ...t('<b class="g">●</b> Bash(npm run migrate)') },
    { at: 0, ...p(tool('run', 'bash', 'npm run migrate')) },
  ],
  preview: [
    { at: 0, ...t('<b class="g">●</b> Bash(npm test)') },
    { at: 0, ...t('<span class="dim">  └─</span> <b class="g">✓ 12 tests passed</b>') },
    { at: 0, ...p(tool('ok', 'bash', 'npm test')) },
    { at: 300, ...t('<b class="g">●</b> Write(test-report.md)') },
    { at: 0, ...t('<span class="dim">  └─ 24 lines</span>') },
    { at: 0, ...p('<p class="say">The report is ready.</p>') },
    { at: 0, ...p('<div class="file-link">▤ test-report.md<span style="margin-left:auto">Open ↗</span></div>') },
    { at: 900, kind: 'doc', html: '<div class="doc-head"><span>test-report.md</span><span>Done</span></div><h5>Empty state. Covered.</h5><p class="say">The project list now has a regression test.</p><div class="pass">✓ 12 tests passed</div><ul><li>Added a test for an empty list</li><li>Checked the first-project button</li><li>Kept existing tests unchanged</li></ul><pre>Test files  3 passed\nTests      12 passed\nDuration   1.24 s</pre>' },
    { at: 0, kind: 'toast' },
  ],
};

let generation = 0;
let current = 'check';

function setToast(scene) {
  const [colour, text] = TOAST[scene];
  toast.style.color = colour;
  toastText.textContent = text;
  toast.classList.remove('pulse'); void toast.offsetWidth; toast.classList.add('pulse');
}

function resetStage(scene) {
  term.innerHTML = ''; phone.innerHTML = '';
  sheet.className = 'sheet'; sheet.innerHTML = '';
  composer.className = 'phone-composer'; composerText.textContent = 'Message Pi…';
  $('#scene-title').textContent = COPY[scene][0];
  $('#scene-text').textContent = COPY[scene][1];
  $$('.tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.scene === scene)));
  stage.dataset.scene = scene;
  $$('.stage-dogs img').forEach(n => n.classList.toggle('on', n.dataset.scene === scene));
  // A scene without an explicit toast step shows its toast at the start.
  if (!SCENES[scene].some(s => s.kind === 'toast')) setToast(scene);
  else { toast.style.color = 'rgba(255,255,255,.7)'; toastText.textContent = 'Studio Mac · online'; }
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
const ORDER = ['check', 'reply', 'answer', 'preview'];
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

if (reduced) play('check', { instant: true }); else cycle();

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
