"use strict";

(() => {
  const { TutorialOverlay, unit } = window.RebutTutorial;
  const root = document.documentElement;
  const stage = document.querySelector(".stage");
  const set = (name, value) => root.style.setProperty(name, value);
  set("--dim-color", DISPLAY.dimColor);
  set("--dim-opacity", DISPLAY.dimOpacity);
  set("--popup-left", `${DISPLAY.popup.left / DISPLAY.width * 100}%`);
  set("--popup-width", `${DISPLAY.popup.width / DISPLAY.width * 100}%`);
  set("--popup-height", unit(DISPLAY.popup.height));
  set("--popup-fade", `${TIMING.POPUP_FADE_OUT}ms`);
  set("--press-duration", `${TIMING.BUTTON_PRESS}ms`);
  set("--invert-duration", `${TIMING.CORRECT_INVERT}ms`);
  set("--wave-duration", `${TIMING.WAVE}ms`);
  set("--wave-up", unit(DISPLAY.wave.up));
  set("--wave-down", unit(DISPLAY.wave.down));
  set("--wave-settle", unit(DISPLAY.wave.settle));
  set("--step-block-duration", `${GAME_TIMING.LEVEL_BLOCK_DURATION}ms`);
  set("--step-block-stagger", `${GAME_TIMING.LEVEL_BLOCK_STAGGER}ms`);
  set("--step-title-duration", `${GAME_TIMING.LEVEL_TITLE_ASSEMBLE}ms`);
  set("--step-title-stagger", `${GAME_TIMING.LEVEL_TITLE_STAGGER}ms`);
  set("--step-title-fade", `${GAME_TIMING.LEVEL_TITLE_FADE_OUT}ms`);
  set("--step-reveal-duration", `${GAME_TIMING.LEVEL_REVEAL_DURATION}ms`);
  set("--step-reveal-stagger", `${GAME_TIMING.LEVEL_REVEAL_STAGGER}ms`);
  set("--wrong-shake", `${GAME_TIMING.WRONG_SHAKE}ms`);
  set("--logo-wave-duration", `${GAME_TIMING.LOGO_WAVE}ms`);
  document.querySelectorAll(".game-logo img").forEach((letter, index) => letter.style.setProperty("--logo-wave-delay", `${GAME_TIMING.LOGO_STAGGER * index}ms`));
  for (const [group, values] of Object.entries(GAME_DISPLAY)) {
    for (const [key, value] of Object.entries(values)) set(`--game-${group}-${key}`, unit(value));
  }

  // 순서 암기와 같은 확대율. 위쪽 UI 고정, 중앙 보드/팝업 및 하단 뒤로가기 앵커.
  function fitStageToViewport() {
    const scale = Math.min(window.innerWidth / DISPLAY.width, window.innerHeight / DISPLAY.height);
    const verticalExtra = Math.max(0, window.innerHeight / scale - DISPLAY.height);
    stage.style.setProperty("--game-scale", scale);
    stage.style.height = `${DISPLAY.height + verticalExtra}px`;
    set("--popup-top", unit(DISPLAY.popup.top + verticalExtra * 0.5));
    set("--board-shift", unit(verticalExtra * 0.5));
    set("--back-top", `${977.87 + verticalExtra}px`);
  }
  fitStageToViewport();
  window.addEventListener("resize", fitStageToViewport, { passive: true });

  const game = new window.RebutLogicGame();
  const tutorial = new TutorialOverlay(
    document.querySelector("#tutorial-overlay"), LEVEL_1,
    () => game.resume(),
    // 시작 버튼 즉시 STEP 1 전환을 표시합니다. 기존 팝업 퇴장은 아래에서 마칩니다.
    () => { if (game.phase === "preview") void game.start(); },
  );
  const showTutorial = (restart = false) => {
    if (restart) game.preview();
    else if (!game.pause() && game.phase !== "preview") return;
    tutorial.open();
  };
  document.querySelector(".game-book").addEventListener("click", () => window.RebutBookTutorial.open());
  document.querySelector(".game-back").addEventListener("click", () => { window.location.href = "../../?intro=restart"; });
  document.querySelector(".game-restart").addEventListener("click", () => game.resetRound());
  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "r" && tutorial.overlay.hidden) game.resetRound();
  });

  // 모든 에셋은 로컬 파일이며 단일 HTML에서도 외부 주소를 생성하지 않습니다.
  const sources = [...Object.values(ASSETS), ...Object.values(PROGRESS_DIGITS), ...[...document.images].map((img) => img.src)];
  const loaded = [...new Set(sources)].map((src) => new Promise((resolve) => {
    const img = new Image(); img.onload = () => img.decode().catch(() => {}).then(resolve); img.onerror = resolve; img.src = src;
  }));
  Promise.all([document.fonts.ready, ...loaded]).then(() => {
    stage.dataset.ready = "true";
    if (new URLSearchParams(window.location.search).get("restart") === "1") {
      tutorial.overlay.hidden = true;
      void game.start();
    } else tutorial.open({ focus: false });
  });
  window.REBUT = Object.freeze({ tutorial, game, rounds: GAME_ROUNDS, level: LEVEL_1, timing: TIMING, gameTiming: GAME_TIMING, display: DISPLAY, resetGame: () => game.resetRound(), showTutorial });
  window.addEventListener("pagehide", () => { tutorial.sequence.stop(); game.cancelDrag(); });
  window.addEventListener("pageshow", (event) => { if (event.persisted && !tutorial.overlay.hidden) tutorial.open({ focus: false }); });
})();
