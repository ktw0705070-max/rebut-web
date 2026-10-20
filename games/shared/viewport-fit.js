// Keep the 1920 × 1080 artwork proportional while its dimmer fills wide windows.
(() => {
  const root = document.documentElement;
  function fitViewport() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(width / 1920, height / 1080);
    const inlineBleed = scale > 0 ? Math.max(0, (width / scale - 1920) / 2) : 0;
    root.style.setProperty("--rebut-inline-bleed", `${inlineBleed}px`);
  }
  fitViewport();
  root.classList.add("rebut-viewport-fit");
  window.addEventListener("resize", fitViewport, { passive: true });
  window.visualViewport?.addEventListener("resize", fitViewport, { passive: true });
})();
