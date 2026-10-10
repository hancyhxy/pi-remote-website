// Waitlist sheet, shared by the home page and the MCP page. Sample data only. No network calls.
(() => {
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Waitlist sheet (preview) ----------
   Steps: choose -> done (Google, or an address already on the list)
                 -> check (new typed address: confirm link by email).
   State stays in memory for this page view. No network call. */
(() => {
  const dlg = $('#waitlist'); if (!dlg) return;
  const gBtn = $('#wl-google'), input = $('#wl-email'), status = $('#wl-status');
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
    if (!joined) gBtn.focus();
  }
  const close = () => dlg.close();
  function finish(email, via) {
    const again = !!joined && joined.email === email;
    joined = { email, via: again ? joined.via : via };
    show(via === 'google' || again ? 'done' : 'check');
    if (again) $('[data-step="done"] h2', dlg).textContent = 'You’re already on the list';
    const hj = $('#hero-join'), hh = $('#hero-hint');
    if (hj) hj.textContent = '✓ You’re on the list';
    if (hh) hh.textContent = joined.via === 'google' || again
      ? `We will email ${email} when your invite is ready.`
      : `Tap the link we sent to ${email} to confirm.`;
  }

  $$('[data-join]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(); }));
  $$('[data-close]', dlg).forEach(b => b.addEventListener('click', close));
  $('[data-restart]', dlg).addEventListener('click', () => {
    joined = null; input.value = ''; say(''); show('choose'); input.focus();
    const hj = $('#hero-join'), hh = $('#hero-hint');
    if (hj) hj.textContent = 'Join the waitlist';
    if (hh) hh.textContent = 'One tap with Google, or use any email.';
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
  // No <form> submit: the phone preview sandbox blocks form submission.
  function submitEmail() {
    const v = input.value.trim().toLowerCase();
    if (!EMAIL_RE.test(v)) { say('Enter a valid email address.', 'err'); input.focus(); return; }
    finish(v, 'email');
  }
  $('#wl-join').addEventListener('click', submitEmail);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitEmail(); } });
})();

})();
