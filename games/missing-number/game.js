// ─────────────────────────────────────────────────────────────────────────────
// Game tuning: level sizes, round count, retry limit, and every motion delay.
// ─────────────────────────────────────────────────────────────────────────────
const GAME_SETTINGS = Object.freeze({
  TOTAL_ROUNDS: 3,
  MAX_RETRIES: 2,
  LEVELS: Object.freeze({
    1: Object.freeze({ columns: 3, cellCount: 6, memorySeconds: 5, gridWidth: 890, timerWidth: 884, timerAsset: "timer-line-lv1.png" }),
    2: Object.freeze({ columns: 4, cellCount: 8, memorySeconds: 7, gridWidth: 1195, timerWidth: 1185, timerAsset: "timer-line-lv2.png" }),
    3: Object.freeze({ columns: 5, cellCount: 10, memorySeconds: 10, gridWidth: 1500, timerWidth: 1490, timerAsset: "timer-line-lv3.png" }),
  }),
});

const TIMINGS = Object.freeze({
  COVER_FILL_MS: 300,
  COVERED_HOLD_MS: 500,
  REVEAL_FILL_MS: 300,
  CLICK_PRESS_MS: 100,
  ANSWER_FILL_MS: 150,
  WRONG_SHAKE_MS: 420,
  WRONG_PAUSE_MS: 240,
  AUTO_REVEAL_HOLD_MS: 800,
  CORRECT_LOGO_WAVE_MS: 1000,
  LOGO_WAVE_LETTER_MS: 660,
  LOGO_WAVE_STAGGER_MS: 85,
  HELP_VISIBLE_MS: 5000,
  LEVEL_BACKDROP_LEAD_MS: 200,
  LEVEL_FADE_IN_MS: 600,
  LEVEL_HOLD_MS: 1200,
  LEVEL_FADE_OUT_MS: 800,
});

// Each round is one immutable object, so its original numbers, replacement
// position, and new answer can never drift apart during replay or retry.
const PUZZLE_DATA = Object.freeze({
  1: Object.freeze([
    Object.freeze({ original: Object.freeze([1, 23, 5, 7, 12, 14]), replacement: Object.freeze({ index: 2, value: 8 }) }),
    Object.freeze({ original: Object.freeze([3, 16, 28, 9, 21, 34]), replacement: Object.freeze({ index: 4, value: 6 }) }),
    Object.freeze({ original: Object.freeze([11, 4, 27, 32, 8, 19]), replacement: Object.freeze({ index: 1, value: 25 }) }),
  ]),
  2: Object.freeze([
    Object.freeze({ original: Object.freeze([2, 17, 31, 6, 24, 9, 38, 13]), replacement: Object.freeze({ index: 6, value: 20 }) }),
    Object.freeze({ original: Object.freeze([14, 3, 29, 11, 36, 7, 22, 18]), replacement: Object.freeze({ index: 0, value: 26 }) }),
    Object.freeze({ original: Object.freeze([5, 27, 12, 33, 8, 19, 41, 16]), replacement: Object.freeze({ index: 3, value: 30 }) }),
  ]),
  3: Object.freeze([
    Object.freeze({ original: Object.freeze([4, 18, 35, 7, 26, 11, 43, 21, 9, 30]), replacement: Object.freeze({ index: 8, value: 16 }) }),
    Object.freeze({ original: Object.freeze([13, 2, 28, 40, 6, 17, 32, 10, 24, 37]), replacement: Object.freeze({ index: 5, value: 44 }) }),
    Object.freeze({ original: Object.freeze([8, 25, 3, 39, 15, 29, 12, 46, 19, 34]), replacement: Object.freeze({ index: 1, value: 41 }) }),
  ]),
});

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const RESULT_STORAGE_KEY = "rebut.missing-number.result.v1";
const RESULT_PAGE_URL = "./result.html";
const TOP_FIXED_END_Y = 133;
const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  { selector: ".help-button", y: 159, progress: 0 },
  { selector: ".memory-timer", y: 209 },
  { selector: ".number-grid", y: 296 },
  { selector: ".memorize-button", y: 891.1 },
  { selector: ".paper-speck", y: 926 },
  { selector: ".back-control", y: 977.87, progress: 1 },
  { selector: ".restart-control", y: 253.6, progress: 0 },
]);
const ASSET = "./assets/";

const LIGHT_BOTTOM_ASSETS = Object.freeze([
  "card-bottom.svg",
  "light-bottom-1.svg",
  "light-bottom-2.svg",
  "light-bottom-3.svg",
  "light-bottom-4.svg",
  "light-bottom-5.svg",
]);
const DARK_BOTTOM_ASSETS = Object.freeze([
  "covered-bottom.svg",
  "covered-bottom-1.svg",
  "covered-bottom-2.svg",
  "covered-bottom-3.svg",
  "covered-bottom-4.svg",
  "covered-bottom-5.svg",
]);
const LIGHT_SIDE_ASSETS = Object.freeze([
  "card-side.svg",
  "light-side-common.svg",
  "light-side-common.svg",
  "light-side-common.svg",
  "light-side-common.svg",
  "light-side-5.svg",
]);
const DARK_SIDE_ASSETS = Object.freeze([
  "covered-side.svg",
  "covered-side-1.svg",
  "covered-side-2.svg",
  "covered-side-3.svg",
  "covered-side-4.svg",
  "covered-side-5.svg",
]);

const stage = document.querySelector("#game-stage");
const grid = document.querySelector("#number-grid");
const roundProgress = document.querySelector("#round-progress");
const levelProgressDigit = document.querySelector("#level-progress-digit");
const roundProgressDigit = document.querySelector("#round-progress-digit");
const timer = document.querySelector("#memory-timer");
const timerCopy = document.querySelector("#timer-copy");
const timerLine = document.querySelector("#timer-line");
const timerProgress = document.querySelector("#timer-progress");
const memorizeButton = document.querySelector("#memorize-button");
const helpButton = document.querySelector("#help-button");
const gameLogo = document.querySelector(".game-logo");
const gameLogoLetters = [...gameLogo.querySelectorAll("img")];
const restartControl = document.querySelector("#restart-control");
const backControl = document.querySelector("#back-control");
const status = document.querySelector("#game-status");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  level: 1,
  round: 1,
  phase: "idle",
  retryCount: 0,
  wrongAttemptsTotal: 0,
  firstAttemptCorrectRounds: 0,
  reactionStartedAt: null,
  reactionRecordedForRound: false,
  reactionTimesMs: [],
  acceptingInput: false,
  finishMemoryRequested: false,
  runId: 0,
  completed: false,
};

let cells = [];

document.documentElement.style.setProperty("--cover-duration", `${TIMINGS.COVER_FILL_MS}ms`);
document.documentElement.style.setProperty("--answer-duration", `${TIMINGS.ANSWER_FILL_MS}ms`);
document.documentElement.style.setProperty("--level-fade-in", `${TIMINGS.LEVEL_FADE_IN_MS}ms`);
document.documentElement.style.setProperty("--level-fade-out", `${TIMINGS.LEVEL_FADE_OUT_MS}ms`);
document.documentElement.style.setProperty("--wrong-shake", `${TIMINGS.WRONG_SHAKE_MS}ms`);
document.documentElement.style.setProperty("--logo-wave-letter-duration", `${TIMINGS.LOGO_WAVE_LETTER_MS}ms`);
gameLogoLetters.forEach((letter, index) => {
  letter.style.setProperty("--logo-wave-delay", `${index * TIMINGS.LOGO_WAVE_STAGGER_MS}ms`);
});

function delay(milliseconds) {
  return new Promise((resolve) => (window.RebutGameClock || window).setTimeout(resolve, milliseconds));
}

function nextFrame() {
  return new Promise((resolve) => (window.RebutGameClock || window).requestAnimationFrame(() => resolve()));
}

function motionDelay(milliseconds) {
  return prefersReducedMotion.matches ? Math.min(milliseconds, 40) : milliseconds;
}

function currentLevelSettings() {
  return GAME_SETTINGS.LEVELS[state.level];
}

function currentPuzzle() {
  return PUZZLE_DATA[state.level][state.round - 1];
}

function problemNumbers(puzzle) {
  return puzzle.original.map((number, index) =>
    index === puzzle.replacement.index ? puzzle.replacement.value : number,
  );
}

function createImage(className, source) {
  const image = document.createElement("img");
  image.className = className;
  image.src = `${ASSET}${source}`;
  image.alt = "";
  image.draggable = false;
  image.setAttribute("aria-hidden", "true");
  return image;
}

function createCardSurface(surfaceName, visualIndex) {
  const surface = document.createElement("span");
  surface.className = `card-state surface--${surfaceName}`;
  surface.setAttribute("aria-hidden", "true");

  const isDark = surfaceName === "dark";
  const face = document.createElement("span");
  face.className = "card-face";

  const bottomAssets = isDark ? DARK_BOTTOM_ASSETS : LIGHT_BOTTOM_ASSETS;
  const sideAssets = isDark ? DARK_SIDE_ASSETS : LIGHT_SIDE_ASSETS;
  const bottom = createImage("card-bottom", bottomAssets[visualIndex]);

  const side = document.createElement("span");
  side.className = "card-side";
  side.append(createImage("", sideAssets[visualIndex]));

  const outline = createImage(
    "card-outline",
    isDark ? "outline-covered.png" : "card-outline.png",
  );

  surface.append(bottom, face, side, outline);
  return surface;
}

function createCell(index) {
  const visualIndex = index % LIGHT_BOTTOM_ASSETS.length;
  const button = document.createElement("button");
  button.className = "number-card";
  button.type = "button";
  button.dataset.index = String(index);
  button.setAttribute("aria-label", `${index + 1}번 숫자 칸`);

  const number = document.createElement("span");
  number.className = "card-number";

  button.append(
    createCardSurface("light", visualIndex),
    createCardSurface("dark", visualIndex),
    number,
  );
  button.addEventListener("click", (event) => {
    if (event.detail > 0) button.blur();
    handleCellSelection(index);
  });
  return button;
}

function buildGrid() {
  const level = currentLevelSettings();
  grid.replaceChildren();
  grid.style.setProperty("--grid-columns", level.columns);
  grid.style.setProperty("--grid-width", `${level.gridWidth}px`);
  grid.setAttribute("aria-label", `2×${level.columns} 숫자 기억 게임 보드`);

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < level.cellCount; index += 1) {
    fragment.append(createCell(index));
  }
  grid.append(fragment);
  cells = [...grid.querySelectorAll(".number-card")];

  timer.style.setProperty("--timer-width", `${level.timerWidth}px`);
  timerLine.src = `${ASSET}${level.timerAsset}`;
}

function fitStageToViewport() {
  const scale = Math.min(
    window.innerWidth / STAGE_SIZE.width,
    window.innerHeight / STAGE_SIZE.height,
  );
  const verticalExtra = Math.max(0, window.innerHeight / scale - STAGE_SIZE.height);

  stage.style.setProperty("--game-scale", scale);
  stage.style.height = `${STAGE_SIZE.height + verticalExtra}px`;

  RESPONSIVE_VERTICAL_ANCHORS.forEach(({ selector, y, progress: fixedProgress }) => {
    const element = document.querySelector(selector);
    const progress = fixedProgress ?? Math.min(
      1,
      Math.max(0, (y - TOP_FIXED_END_Y) / (STAGE_SIZE.height - TOP_FIXED_END_Y)),
    );
    element.style.top = `${y + verticalExtra * progress}px`;
  });
}

function updateProgress() {
  levelProgressDigit.src = `./assets/round-digit-${state.level}.png`;
  levelProgressDigit.alt = String(state.level);
  roundProgressDigit.src = `./assets/round-digit-${state.round}.png`;
  roundProgressDigit.alt = String(state.round);
  roundProgress.setAttribute(
    "aria-label",
    `현재 진행 ${state.level}-${state.round}`,
  );
}

function setInputLocked(isLocked) {
  state.acceptingInput = !isLocked;
  grid.classList.toggle("is-locked", isLocked);
}

function setMemorizeButtonVisible(isVisible) {
  memorizeButton.classList.toggle("is-hidden", !isVisible);
  memorizeButton.disabled = !isVisible;
}

function showNumbers(numbers) {
  cells.forEach((cell, index) => {
    cell.querySelector(".card-number").textContent = String(numbers[index]);
  });
}

function resetBoardState() {
  grid.classList.remove("is-covered", "is-shaking");
  cells.forEach((cell) => cell.classList.remove("is-selected"));
}

function updateTimer(remainingMilliseconds, durationMilliseconds) {
  const seconds = Math.max(0, Math.ceil(remainingMilliseconds / 1000));
  timerCopy.textContent = `0:${String(seconds).padStart(2, "0")}`;
  const progress = durationMilliseconds > 0
    ? Math.max(0, Math.min(1, remainingMilliseconds / durationMilliseconds))
    : 0;
  timerProgress.style.setProperty("--timer-progress", progress);
}

function runMemoryCountdown(runId, durationMilliseconds) {
  const startedAt = (window.RebutGameClock?.now() ?? performance.now());
  updateTimer(durationMilliseconds, durationMilliseconds);

  return new Promise((resolve) => {
    function tick(now) {
      if (runId !== state.runId) {
        resolve(false);
        return;
      }

      const elapsed = now - startedAt;
      const remaining = state.finishMemoryRequested
        ? 0
        : Math.max(0, durationMilliseconds - elapsed);
      updateTimer(remaining, durationMilliseconds);

      if (remaining <= 0) {
        resolve(true);
        return;
      }

      (window.RebutGameClock || window).requestAnimationFrame(tick);
    }

    (window.RebutGameClock || window).requestAnimationFrame(tick);
  });
}

async function beginRound({ newRound = false } = {}) {
  const runId = ++state.runId;
  const level = currentLevelSettings();
  const puzzle = currentPuzzle();

  if (newRound) {
    state.retryCount = 0;
    state.reactionStartedAt = null;
    state.reactionRecordedForRound = false;
  }

  state.phase = "memory";
  state.finishMemoryRequested = false;
  setInputLocked(true);
  setMemorizeButtonVisible(true);
  buildGrid();
  resetBoardState();
  showNumbers(puzzle.original);
  updateProgress();
  status.textContent = `${state.level}단계 ${state.round}라운드 숫자를 기억하세요.`;

  await nextFrame();
  const countdownFinished = await runMemoryCountdown(
    runId,
    level.memorySeconds * 1000,
  );
  if (!countdownFinished || runId !== state.runId) return;

  state.phase = "cover";
  setMemorizeButtonVisible(false);
  grid.style.setProperty("--cover-duration", `${TIMINGS.COVER_FILL_MS}ms`);
  grid.classList.add("is-covered");
  await delay(motionDelay(TIMINGS.COVER_FILL_MS));
  if (runId !== state.runId) return;

  await delay(TIMINGS.COVERED_HOLD_MS);
  if (runId !== state.runId) return;

  showNumbers(problemNumbers(puzzle));
  grid.style.setProperty("--cover-duration", `${TIMINGS.REVEAL_FILL_MS}ms`);
  await nextFrame();
  grid.classList.remove("is-covered");
  await delay(motionDelay(TIMINGS.REVEAL_FILL_MS));
  if (runId !== state.runId) return;

  state.phase = "problem";
  if (!state.reactionRecordedForRound) {
    state.reactionStartedAt = (window.RebutGameClock?.now() ?? performance.now());
  }
  setInputLocked(false);
  status.textContent = "처음에 없던 숫자를 찾아 누르세요.";
}

function captureReactionTime() {
  if (
    state.reactionRecordedForRound ||
    typeof state.reactionStartedAt !== "number"
  ) {
    return;
  }

  state.reactionTimesMs.push(
    Math.max(0, (window.RebutGameClock?.now() ?? performance.now()) - state.reactionStartedAt),
  );
  state.reactionRecordedForRound = true;
  state.reactionStartedAt = null;
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

function handleCellSelection(index) {
  if (!state.acceptingInput || state.phase !== "problem") return;

  const puzzle = currentPuzzle();
  const runId = state.runId;
  setInputLocked(true);
  captureReactionTime();
  pressCell(cells[index]);

  if (index === puzzle.replacement.index) {
    if (state.retryCount === 0) {
      state.firstAttemptCorrectRounds += 1;
    }
    state.phase = "correct";
    cells[index].classList.add("is-selected");
    status.textContent = "정답입니다.";
    void completeRound(runId);
    return;
  }

  state.phase = "wrong";
  state.retryCount += 1;
  state.wrongAttemptsTotal += 1;
  grid.classList.add("is-shaking");
  status.textContent = "다른 숫자입니다. 같은 문제를 다시 보여드립니다.";
  void handleWrongAnswer(runId);
}

async function handleWrongAnswer(runId) {
  await delay(motionDelay(TIMINGS.WRONG_SHAKE_MS));
  if (runId !== state.runId) return;
  grid.classList.remove("is-shaking");
  await delay(TIMINGS.WRONG_PAUSE_MS);
  if (runId !== state.runId) return;

  if (state.retryCount >= GAME_SETTINGS.MAX_RETRIES) {
    const answerIndex = currentPuzzle().replacement.index;
    cells[answerIndex].classList.add("is-selected");
    status.textContent = "정답 칸을 표시합니다.";
    await delay(TIMINGS.AUTO_REVEAL_HOLD_MS);
    if (runId !== state.runId) return;
    await advanceRound();
    return;
  }

  await beginRound({ newRound: false });
}

async function playCorrectLogoWave() {
  gameLogo.classList.remove("is-waving");
  void gameLogo.offsetWidth;
  gameLogo.classList.add("is-waving");
  await delay(motionDelay(TIMINGS.CORRECT_LOGO_WAVE_MS));
  gameLogo.classList.remove("is-waving");
}

async function completeRound(runId) {
  await delay(motionDelay(TIMINGS.ANSWER_FILL_MS));
  if (runId !== state.runId) return;
  await playCorrectLogoWave();
  if (runId !== state.runId) return;
  await advanceRound();
}

async function advanceRound() {
  setInputLocked(true);

  if (state.round < GAME_SETTINGS.TOTAL_ROUNDS) {
    state.round += 1;
    updateProgress();
    await beginRound({ newRound: true });
    return;
  }

  if (state.level < Object.keys(GAME_SETTINGS.LEVELS).length) {
    state.level += 1;
    state.round = 1;
    updateProgress();
    buildGrid();
    resetBoardState();
    await showLevelTransition(state.level);
    await beginRound({ newRound: true });
    return;
  }

  finishGame();
}

function finishGame() {
  state.completed = true;
  state.phase = "complete";
  setInputLocked(true);
  setMemorizeButtonVisible(false);
  timerProgress.style.setProperty("--timer-progress", 0);
  timerCopy.textContent = "0:00";
  status.textContent = "모든 단계를 완료했습니다.";

  try {
    sessionStorage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        completedAt: new Date().toISOString(),
        firstAttemptCorrectRounds: state.firstAttemptCorrectRounds,
        totalRounds:
          Object.keys(GAME_SETTINGS.LEVELS).length * GAME_SETTINGS.TOTAL_ROUNDS,
        reactionTimesMs: [...state.reactionTimesMs],
        retryCount: state.wrongAttemptsTotal,
      }),
    );
  } catch {
    // Storage is optional; the completed game remains usable without it.
  }

  window.location.href = RESULT_PAGE_URL;
}

function restartCurrentRound() {
  if (state.completed || state.phase === "level-transition") return;
  state.finishMemoryRequested = false;
  status.textContent = "이번 문제를 처음부터 다시 보여드립니다.";
  void beginRound({ newRound: false });
}




async function showLevelTransition(level) {
  state.phase = "level-transition";
  await window.RebutStepTransition.show(level);
}

async function startGame() {
  try {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
  } catch {
    // Storage is optional.
  }

  updateProgress();
  buildGrid();
  fitStageToViewport();
  setInputLocked(true);
  setMemorizeButtonVisible(false);
  await showLevelTransition(1);
  await beginRound({ newRound: true });
}

memorizeButton.addEventListener("click", () => {
  if (state.phase !== "memory") return;
  state.finishMemoryRequested = true;
  setMemorizeButtonVisible(false);
});
helpButton.addEventListener("click", () => { window.RebutBookTutorial.open(); });
restartControl.addEventListener("click", restartCurrentRound);
backControl.addEventListener("click", () => {
  window.location.href = "../../?rehab=memory";
});
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") restartCurrentRound();
});
window.addEventListener("resize", fitStageToViewport, { passive: true });
window.addEventListener("load", () => {
  void startGame();
});
