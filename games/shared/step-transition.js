/* One STEP transition for all nine games. Artwork and timing match hidden-weight. */
(() => {
  "use strict";

  const assetRoot = new URL("./assets/step-transition/", document.currentScript.src);
  const timing = Object.freeze({
    blocks: 8, cover: 760, stagger: 70, overlap: 160,
    assemble: 1800, pieceStagger: 14, hold: 180, shake: 1050,
    fade: 500, reveal: 720, revealStagger: 70,
  });
  const letters = { s: 5, t: 2, e: 4, p: 4 };
  const sources = [
    ...Object.entries(letters).flatMap(([letter, count]) =>
      Array.from({ length: count }, (_, i) => `step-${letter}-0${i + 1}.png`)),
    "step-1-01.png", "step-1-02.png", "step-1-03.png", "step-2.svg", "step-3.svg",
  ];
  const assetsReady = Promise.all(sources.map((file) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => image.decode().catch(() => {}).then(resolve);
    image.onerror = resolve;
    image.src = new URL(file, assetRoot).href;
  })));
  let current = null;

  function seededRandom(seed) {
    return () => {
      seed = seed * 16807 % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  function image(file, extraClass = "") {
    const piece = document.createElement("img");
    piece.className = `rebut-step-piece ${extraClass}`.trim();
    piece.src = new URL(file, assetRoot).href;
    piece.alt = "";
    piece.draggable = false;
    return piece;
  }

  function build(level) {
    const root = document.createElement("section");
    root.id = "rebut-step-transition";
    root.className = "rebut-step";
    root.dataset.level = String(level);
    root.setAttribute("role", "status");
    root.setAttribute("aria-label", `스텝 ${level}`);
    const wipe = document.createElement("div");
    wipe.className = "rebut-step-wipe";
    wipe.setAttribute("aria-hidden", "true");
    for (let i = 0; i < timing.blocks; i += 1) {
      const block = document.createElement("span");
      block.className = "rebut-step-block";
      block.style.setProperty("--step-index", i);
      wipe.append(block);
    }
    const title = document.createElement("div");
    title.className = "rebut-step-title";
    title.dataset.level = String(level);
    title.setAttribute("aria-hidden", "true");
    for (const [letter, count] of Object.entries(letters)) {
      const group = document.createElement("span");
      group.className = `rebut-step-letter rebut-step-letter--${letter}`;
      for (let i = 1; i <= count; i += 1) group.append(image(`step-${letter}-0${i}.png`));
      title.append(group);
    }
    // Only the current digit exists: no hidden old digits can be reanimated.
    const digit = document.createElement("span");
    digit.className = `rebut-step-number rebut-step-number--${level}`;
    digit.dataset.stepNumber = String(level);
    if (level === 1) {
      for (let i = 1; i <= 3; i += 1) digit.append(image(`step-1-0${i}.png`));
    } else {
      digit.append(image(`step-${level}.svg`, "rebut-step-digit-image"));
    }
    title.append(digit);
    root.append(wipe, title);
    const pieces = [...title.querySelectorAll(".rebut-step-piece")];
    const random = seededRandom(77 + level * 31);
    pieces.forEach((piece, index) => {
      const set = (name, value) => piece.style.setProperty(name, value);
      const angle = random() * Math.PI * 2;
      const distance = 230 + random() * 430;
      set("--scatter-x", `${(Math.cos(angle) * distance).toFixed(1)}px`);
      set("--scatter-y", `${(Math.sin(angle) * distance).toFixed(1)}px`);
      set("--scatter-rotate", `${(-180 + random() * 360).toFixed(1)}deg`);
      set("--settle-x", `${(-1.1 + random() * 2.2).toFixed(2)}px`);
      set("--settle-y", `${(-1.1 + random() * 2.2).toFixed(2)}px`);
      set("--settle-rotate", `${(-2.5 + random() * 5).toFixed(2)}deg`);
      const direction = random() > .5 ? 1 : -1;
      const x = (.55 + random() * .5) * (random() > .5 ? 1 : -1);
      const y = (.55 + random() * .5) * (random() > .5 ? 1 : -1);
      const rotation = (4 + random() * 3) * direction;
      set("--shake-duration", `${(650 + random() * 300).toFixed(0)}ms`);
      set("--shake-delay", `${(random() * 100).toFixed(0)}ms`);
      [1, -.72, .38].forEach((factor, i) => {
        set(`--shake-x-${i + 1}`, `${(x * factor).toFixed(2)}px`);
        set(`--shake-y-${i + 1}`, `${(y * factor).toFixed(2)}px`);
      });
      [1, -.7, .35].forEach((factor, i) => set(`--shake-r-${i + 1}`, `${(rotation * factor).toFixed(2)}deg`));
      set("--piece-index", index);
    });
    return { root, pieceCount: pieces.length };
  }

  function wait(ms, signal) {
    return new Promise((resolve) => {
      if (signal.aborted) return resolve(false);
      const finish = (active) => {
        clearTimeout(timer);
        signal.removeEventListener("abort", abort);
        resolve(active);
      };
      const abort = () => finish(false);
      const timer = setTimeout(() => finish(true), ms);
      signal.addEventListener("abort", abort, { once: true });
    });
  }

  function hide() {
    if (!current) return;
    const run = current;
    current = null;
    run.controller.abort();
    window.removeEventListener("resize", run.resize);
    run.root.remove();
    for (const [element, inert] of run.background) element.inert = inert;
  }

  async function show(level, { signal: externalSignal, onCovered } = {}) {
    level = Number(level);
    if (![1, 2, 3].includes(level)) throw new RangeError("STEP must be 1, 2 or 3");
    if (externalSignal?.aborted) return false;
    hide();
    const { root, pieceCount } = build(level);
    const controller = new AbortController();
    const { signal } = controller;
    const resize = () => root.style.setProperty("--rebut-step-scale",
      Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    const background = [...document.body.children].map((element) => [element, element.inert]);
    const run = { root, controller, resize, background };
    current = run;
    const abort = () => { if (current === run) hide(); };
    externalSignal?.addEventListener("abort", abort, { once: true });
    background.forEach(([element]) => { element.inert = true; });
    document.body.append(root);
    resize();
    window.addEventListener("resize", resize, { passive: true });
    const phase = (name) => { root.dataset.phase = name; root.classList.add(`is-${name}`); };
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        await assetsReady;
        if (signal.aborted) return false;
        phase("reduced");
        await onCovered?.();
        return await wait(420, signal);
      }
      void root.offsetWidth;
      if (!await wait(20, signal)) return false;
      phase("covering");
      const coverTime = timing.cover + timing.stagger * (timing.blocks - 1);
      if (!await wait(coverTime - timing.overlap, signal)) return false;
      await assetsReady;
      if (signal.aborted) return false;
      phase("title-active");
      // Change the underlying game only after the final black block covers it.
      if (!await wait(timing.overlap, signal)) return false;
      await onCovered?.();
      const titleTime = timing.assemble + timing.pieceStagger * (pieceCount - 1);
      if (!await wait(titleTime + timing.hold - timing.overlap, signal)) return false;
      phase("title-shaking");
      if (!await wait(timing.shake, signal)) return false;
      phase("title-fading");
      if (!await wait(timing.fade, signal)) return false;
      phase("revealing");
      return await wait(timing.reveal + timing.revealStagger * (timing.blocks - 1), signal);
    } finally {
      externalSignal?.removeEventListener("abort", abort);
      if (current === run) hide();
    }
  }

  window.RebutStepTransition = Object.freeze({ show, hide });
  window.addEventListener("pagehide", hide);
})();
