// Warm only the page the user points at or focuses; never download all games.
(() => {
  const queued = new Set();
  function prepare(event) {
    if (navigator.connection?.saveData) return;
    const target = event.target.closest?.('[data-game-link], a.game-menu-game');
    if (!target || target.hasAttribute('data-current-game')) return;
    const path = target.dataset.gameLink || target.getAttribute('href');
    if (!path) return;
    const url = new URL(path, window.location.href);
    if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return;
    if (queued.has(url.href)) return;
    queued.add(url.href);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.as = 'document';
    hint.href = url.href;
    document.head.append(hint);
  }
  document.addEventListener('pointerover', prepare, { passive: true });
  document.addEventListener('focusin', prepare);
})();
