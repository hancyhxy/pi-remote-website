// Light and dark mode. Loads in <head>, before the page draws, so the page
// never flashes in the wrong theme. A saved choice wins; else the system choice.
(() => {
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const saved = () => { try { return localStorage.getItem('theme'); } catch { return null; } };
  const apply = theme => {
    root.dataset.theme = theme;
    const btn = document.getElementById('theme-btn');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  };
  const pick = () => { const s = saved(); return s === 'light' || s === 'dark' ? s : media.matches ? 'dark' : 'light'; };
  root.dataset.theme = pick();
  // Follow the system only while the user has not chosen.
  media.addEventListener('change', () => { if (!saved()) apply(pick()); });
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.getElementById('theme-btn')?.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', next); } catch { /* The preview sandbox can block storage. */ }
      apply(next);
    });
  });
})();
