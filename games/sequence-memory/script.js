"use strict";

// 기존 순서 암기 시연의 배열과 타이밍은 이곳에서만 조정합니다. 단위: ms
const STEP_SEQUENCE = Object.freeze([1, 4, 6]);

const TIMINGS = Object.freeze({
  CELL_TRANSITION_MS: 120,
  INTRO_MS: 500,
  LIGHT_ON_MS: 600,
  LIGHT_GAP_MS: 400,
  MEMORY_PAUSE_MS: 500,
  CURSOR_MOVE_MS: 400,
  CLICK_PRESS_MS: 100,
  INPUT_GAP_MS: 200,
  LOOP_PAUSE_MS: 1000,
  POPUP_FADE_OUT_MS: 300,
});

const DISPLAY = Object.freeze({
  width: 1920,
  height: 1080,
  popupTop: 104,
  popupVerticalProgress: 0.5,
});

const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  { selector: ".tutorial-background-grid", y: 266.3, progress: 0.5 },
  { selector: ".tutorial-back-guide", y: 977.87, progress: 1 },
  { selector: ".tutorial-panel", y: DISPLAY.popupTop, progress: DISPLAY.popupVerticalProgress },
]);

const stage = document.querySelector("#tutorial-stage");
const backgroundGrid = document.querySelector("#background-grid");
const demoGrid = document.querySelector("#tutorial-grid");
const panel = document.querySelector("#tutorial-panel");
const overlay = document.querySelector("#tutorial-overlay");
const cursor = document.querySelector("#demo-cursor");
const status = document.querySelector("#demo-status");
const startButton = document.querySelector("#start-button");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

window.MemoryGrid.build(backgroundGrid);
const cells = window.MemoryGrid.build(demoGrid);

let cursorTargetIndex = null;
let running = true;
let closing = false;

document.documentElement.style.setProperty(
  "--cell-transition",
  `${TIMINGS.CELL_TRANSITION_MS}ms`,
);
function fitStageToViewport() {
  const scale = Math.min(
    window.innerWidth / DISPLAY.width,
    window.innerHeight / DISPLAY.height,
  );
  const verticalExtra = Math.max(
    0,
    window.innerHeight / scale - DISPLAY.height,
  );

  stage.style.setProperty("--game-scale", scale);
  stage.style.height = `${DISPLAY.height + verticalExtra}px`;

  RESPONSIVE_VERTICAL_ANCHORS.forEach(({ selector, y, progress }) => {
    const element = stage.querySelector(selector);
    element.style.top = `${y + verticalExtra * progress}px`;
  });

  window.requestAnimationFrame(() => {
    if (cursorTargetIndex === null) resetCursor();
    else placeCursorOnCell(cursorTargetIndex, false);
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function rectInPanel(element) {
  const stageRect = stage.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const scale = stageRect.width / stage.offsetWidth;

  return {
    x: (elementRect.left - panelRect.left) / scale,
    y: (elementRect.top - panelRect.top) / scale,
    width: elementRect.width / scale,
    height: elementRect.height / scale,
  };
}

function setCellActive(index, active) {
  cells[index].classList.toggle("is-active", active);
}

function clearBoard() {
  cells.forEach((cell) => cell.classList.remove("is-active"));
}

function setCursorPosition(x, y, animate) {
  cursor.style.transition = animate && !prefersReducedMotion.matches
    ? `transform ${TIMINGS.CURSOR_MOVE_MS}ms ease-in-out`
    : "none";
  cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function resetCursor() {
  cursorTargetIndex = null;
  const board = rectInPanel(demoGrid);
  setCursorPosition(
    board.x + board.width + 15,
    board.y + board.height * 0.42,
    false,
  );
}

function placeCursorOnCell(index, animate = true) {
  cursorTargetIndex = index;
  const cell = rectInPanel(cells[index]);
  setCursorPosition(
    cell.x + cell.width / 2 - 9,
    cell.y + cell.height / 2 - 9,
    animate,
  );
}

function pressCell(cell) {
  cell.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(0.96)", offset: 0.5 },
      { transform: "scale(1)" },
    ],
    {
      duration: prefersReducedMotion.matches ? 1 : TIMINGS.CLICK_PRESS_MS,
      easing: "ease-out",
    },
  );
}

async function playMemoryStep() {
  status.textContent = "불이 켜지는 순서를 기억하세요.";
  for (const index of STEP_SEQUENCE) {
    if (!running) return;
    setCellActive(index, true);
    await delay(TIMINGS.LIGHT_ON_MS);
    setCellActive(index, false);
    await delay(TIMINGS.LIGHT_GAP_MS);
  }
}

async function playInputStep() {
  status.textContent = "같은 순서로 칸을 누르세요.";
  for (const index of STEP_SEQUENCE) {
    if (!running) return;
    placeCursorOnCell(index);
    await delay(TIMINGS.CURSOR_MOVE_MS);
    cursor.classList.add("is-clicking");
    setCellActive(index, true);
    pressCell(cells[index]);
    await delay(TIMINGS.CLICK_PRESS_MS);
    cursor.classList.remove("is-clicking");
    await delay(TIMINGS.INPUT_GAP_MS);
  }
}

async function playTutorialLoop() {
  while (running) {
    clearBoard();
    resetCursor();
    status.textContent = "순서 암기 시연을 시작합니다.";
    await delay(TIMINGS.INTRO_MS);
    await playMemoryStep();
    if (!running) return;
    await delay(TIMINGS.MEMORY_PAUSE_MS);
    await playInputStep();
    if (!running) return;

    await delay(TIMINGS.LOOP_PAUSE_MS);
  }
}

async function closeTutorial() {
  if (closing) return;
  closing = true;
  running = false;
  startButton.disabled = true;
  overlay.classList.add("is-closing");
  await delay(TIMINGS.POPUP_FADE_OUT_MS);
  window.location.href = "./game.html?v=20261005-4";
}

startButton.addEventListener("click", () => {
  void closeTutorial();
});
window.addEventListener("resize", fitStageToViewport, { passive: true });

fitStageToViewport();
window.addEventListener("load", () => {
  void playTutorialLoop();
});
