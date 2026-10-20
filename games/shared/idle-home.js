// One real-time inactivity clock per tab, including same-origin game/tutorial frames.
(() => {
  if (window.top !== window) return;

  const IDLE_MS = 5 * 60 * 1000;
  const home = new URL("../../index.html", document.currentScript.src);
  const storageKey = `rebut:idle-home:${home.pathname}`;
  const activityEvents = [
    "pointerdown", "pointermove", "pointerup", "mousedown", "mousemove",
    "touchstart", "touchmove", "keydown", "wheel", "click",
  ];
  const observedDocuments = new WeakSet();
  let timer = null;
  let returning = false;
  let lastSavedAt = 0;

  function storedActivity() {
    try {
      const value = Number(window.sessionStorage.getItem(storageKey));
      return value > 0 && Number.isFinite(value) && value <= Date.now() ? value : null;
    } catch {
      return null;
    }
  }
  let lastActivity = storedActivity() ?? Date.now();

  function saveActivity() {
    try { window.sessionStorage.setItem(storageKey, String(lastActivity)); } catch { /* Storage may be disabled. */ }
    lastSavedAt = Date.now();
  }

  function homeIsVisible() {
    const page = new URL(window.location.href);
    const homeDirectory = home.pathname.replace(/index\.html$/, "");
    const isHomePage = page.pathname === home.pathname || page.pathname === homeDirectory;
    return isHomePage && !document.body?.classList.contains("memory-open");
  }

  function checkDeadline() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    if (returning) return;
    const remaining = IDLE_MS - (Date.now() - lastActivity);
    if (remaining > 0) {
      // Use the browser clock, not the gameplay clock paused by the book popup.
      timer = window.setTimeout(checkDeadline, remaining);
    } else if (!homeIsVisible()) {
      returning = true;
      lastActivity = Date.now();
      saveActivity();
      home.search = "?intro=restart";
      window.location.replace(home.href);
    }
    // Already on the home screen: leave it alone, without a five-minute reload loop.
  }

  function recordActivity(event) {
    // Animations, scripted clicks, focus and programmatic scrolling are not users.
    if (!event.isTrusted || returning) return;
    lastActivity = Date.now();
    if (lastActivity - lastSavedAt >= 1000 || event.type !== "pointermove" && event.type !== "mousemove") {
      saveActivity();
    }
    if (timer === null) checkDeadline();
  }

  function observeWindow(target) {
    try {
      const doc = target.document;
      if (!doc || observedDocuments.has(doc)) return;
      observedDocuments.add(doc);
      for (const type of activityEvents) {
        target.addEventListener(type, recordActivity, { capture: true, passive: true });
      }
      const scanFrames = () => {
        for (const frame of doc.querySelectorAll("iframe")) observeWindow(frame.contentWindow);
      };
      // load is captured on each document, including nested boards and new book popups.
      doc.addEventListener("load", event => {
        if (event.target.tagName === "IFRAME") observeWindow(event.target.contentWindow);
      }, true);
      doc.addEventListener("DOMContentLoaded", scanFrames, { once: true });
      scanFrames();
    } catch { /* Cross-origin frames are deliberately outside this site's scope. */ }
  }

  observeWindow(window);
  saveActivity();
  checkDeadline();
  window.addEventListener("pagehide", () => {
    saveActivity();
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
  });
  window.addEventListener("pageshow", () => {
    lastActivity = storedActivity() ?? lastActivity;
    checkDeadline();
  });
  window.addEventListener("focus", checkDeadline);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkDeadline();
  });
})();
