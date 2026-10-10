// MCP page. Sample data only. No network calls. Classic script: one closure, no globals.
(() => {
const $ = (s, root = document) => root.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Navigation background after scroll */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- Demo: approve once, then three tool calls and an answer ---------- */
const stage = $('#m-stage'); if (!stage) return;
const thread = $('#m-thread'), log = $('#m-log'), ask = $('#m-ask'), allow = $('#m-allow'), state = $('#m-state'), arrow = $('.m-arrow', stage);
const CALLS = [
  ['ls', '~/Documents/Thesis', '12 ms', '6 files'],
  ['bash', 'git log --since=monday --oneline', '84 ms', '5 commits'],
  ['read', 'chapter-3.md', '9 ms', '412 lines'],
];
const STOP = Symbol('stop');
let tok = 0;
const sleep = (ms, t) => new Promise((res, rej) => setTimeout(() => (t === tok ? res() : rej(STOP)), reduced ? 0 : ms));
const add = (el, html) => { el.insertAdjacentHTML('beforeend', html); return el.lastElementChild; };

async function run(t) {
  thread.innerHTML = ''; log.innerHTML = ''; ask.classList.remove('show'); state.textContent = 'Ready';
  await sleep(600, t);
  add(thread, '<div class="m-me">What changed in my thesis folder this week? Give me a short summary.</div>');
  await sleep(900, t);
  // First use: the computer asks the owner.
  ask.classList.add('show'); state.textContent = 'Waiting for you';
  await sleep(1500, t);
  allow.classList.add('press'); await sleep(180, t); allow.classList.remove('press');
  ask.classList.remove('show');
  add(log, '<li class="grant"><span>Claude can use this Mac</span><em>Allowed</em></li>');
  state.textContent = 'Connected';
  await sleep(600, t);
  for (const [tool, arg, ms, result] of CALLS) {
    const chip = add(thread, `<div class="m-tool"><b>Pi Remote</b>${tool} ${arg}<span class="st">running…</span></div>`);
    arrow.classList.remove('go'); void arrow.offsetWidth; arrow.classList.add('go');
    await sleep(700, t);
    add(log, `<li><code>${tool}</code><span>${arg}</span><em>✓ ${ms}</em></li>`);
    chip.classList.add('ok'); $('.st', chip).textContent = `✓ ${result}`;
    await sleep(500, t);
  }
  await sleep(400, t);
  add(thread, `<div class="m-ai">Five commits this week, all in chapter 3:<ul><li>New section on survey method</li><li>Fixed the figure numbers</li><li>Cut the intro from 900 to 600 words</li></ul></div>`);
  await sleep(5200, t);
}
async function loop(t) {
  try { for (;;) await run(t); } catch (e) { if (e !== STOP) throw e; }
}
if (reduced) { tok++; run(tok).catch(() => {}); return; }
new IntersectionObserver(([e]) => { tok++; if (e.isIntersecting) loop(tok); }, { threshold: .3 }).observe(stage);
})();
