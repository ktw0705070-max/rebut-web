// Reuse each game's real animated tutorial without navigating away from its run.
(() => {
  const query = new URLSearchParams(window.location.search);
  const embedded = window.parent !== window && query.get("book-tutorial") === "1";
  const message = action => window.parent.postMessage({ type: "rebut-book-tutorial", action }, window.location.origin);

  if (embedded) {
    document.documentElement.style.background = "transparent";
    // Capture before the original start handler can reset the game or show STEP 1.
    window.addEventListener("click", event => {
      if (!event.target.closest?.("#start-button, #tutorial-start")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      message("close");
    }, true);
    window.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        message("close");
      }
    }, true);
    const prepare = () => {
      const popup = document.querySelector("#tutorial-overlay, .tutorial-overlay, .tutorial-modal");
      if (!popup) return;
      // Keep ancestor geometry, but hide the tutorial's sample game and chrome.
      // The actual, paused game in the parent remains visible behind the popup.
      let branch = popup;
      while (branch.parentElement) {
        const parent = branch.parentElement;
        parent.style.setProperty("background", "transparent", "important");
        for (const sibling of parent.children) {
          if (sibling !== branch && !["SCRIPT", "STYLE", "LINK"].includes(sibling.tagName)) {
            sibling.style.setProperty("visibility", "hidden", "important");
            sibling.style.setProperty("pointer-events", "none", "important");
          }
        }
        branch = parent;
      }
      popup.querySelectorAll(".dim-layer, .tutorial-dim, .screen-dimmer").forEach(el => {
        el.style.setProperty("background", "transparent", "important");
      });
      document.querySelectorAll("iframe").forEach(frame => {
        if (!popup.contains(frame)) frame.remove();
      });
      document.querySelector("#start-button, #tutorial-start")?.focus({ preventScroll: true });
      message("ready");
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", prepare, { once: true });
    else prepare();
    return;
  }

  let active = null;
  function pauseDocument(win, paused, records) {
    win.RebutGameClock?.[paused ? "pause" : "resume"]("book");
    win.document.dispatchEvent(new win.CustomEvent("rebut:tutorial-pause", { detail: { paused } }));
    if (paused) {
      for (const animation of win.document.getAnimations()) {
        if (animation.playState === "running") {
          animation.pause();
          records.push(animation);
        }
      }
    }
    for (const frame of win.document.querySelectorAll("iframe:not([data-rebut-book-frame])")) {
      try { if (frame.contentDocument) pauseDocument(frame.contentWindow, paused, records); } catch { /* Other-origin frames are outside this game's state. */ }
    }
  }
  function close() {
    const view = active;
    if (!view || view.closing) return;
    view.closing = true;
    view.layer.style.opacity = "0";
    window.setTimeout(() => {
      view.layer.remove();
      view.inert.forEach(([element, previous]) => { element.inert = previous; });
      pauseDocument(window, false, []);
      view.animations.forEach(animation => {
        if (animation.playState === "paused") animation.play();
      });
      active = null;
      view.opener?.focus({ preventScroll: true });
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220);
  }
  function open() {
    if (active) return;
    const url = new URL("index.html", window.location.href);
    // This game's index is only a redirect. Use its tutorial-bearing page directly.
    if (url.pathname.includes("/sentence-order/")) url.pathname = url.pathname.replace(/index\.html$/, "game.html");
    url.search = "?book-tutorial=1";
    const layer = document.createElement("div");
    layer.id = "rebut-book-dialog";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-label", "게임 튜토리얼");
    Object.assign(layer.style, {
      position: "fixed", inset: "0", zIndex: "2147483646",
      background: "rgba(17,17,17,.35)", opacity: "1", transition: "opacity 220ms ease",
    });
    const frame = document.createElement("iframe");
    frame.dataset.rebutBookFrame = "";
    frame.title = "튜토리얼 — 시작하기를 누르면 현재 게임으로 돌아갑니다";
    Object.assign(frame.style, {
      width: "100%", height: "100%", display: "block", border: "0",
      background: "transparent", opacity: "0", transition: "opacity 160ms ease",
    });
    const view = { layer, frame, opener: document.activeElement, closing: false, animations: [], inert: [] };
    active = view;
    pauseDocument(window, true, view.animations);
    for (const element of document.body.children) {
      if (["SCRIPT", "STYLE", "LINK"].includes(element.tagName)) continue;
      view.inert.push([element, element.inert]);
      element.inert = true;
    }
    layer.append(frame);
    document.body.append(layer);
    frame.src = url.href;
  }
  window.addEventListener("message", event => {
    if (!active || event.source !== active.frame.contentWindow || event.origin !== window.location.origin ||
      event.data?.type !== "rebut-book-tutorial") return;
    if (event.data.action === "close") close();
    if (event.data.action === "ready") active.frame.style.opacity = "1";
  });
  // A word board can finish loading just after its parent opens the book.
  document.addEventListener("load", event => {
    const frame = event.target;
    if (!active || active.closing || frame.tagName !== "IFRAME" || frame === active.frame) return;
    try { if (frame.contentDocument) pauseDocument(frame.contentWindow, true, active.animations); } catch { /* Same-origin game boards only. */ }
  }, true);
  window.addEventListener("keydown", event => {
    if (!active) return;
    event.stopImmediatePropagation();
    if (event.key === "Escape") { event.preventDefault(); close(); }
  }, true);
  window.RebutBookTutorial = Object.freeze({ open, close });
})();
