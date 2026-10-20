const GAME_SETTINGS = Object.freeze({
  TOTAL_ROUNDS: 3,
  CELL_TRANSITION_MS: 120,
  LEVELS: Object.freeze({
    1: Object.freeze({ sequenceLength: 3, lightOnMs: 600, lightGapMs: 400 }),
    2: Object.freeze({ sequenceLength: 4, lightOnMs: 400, lightGapMs: 300 }),
    3: Object.freeze({ sequenceLength: 5, lightOnMs: 300, lightGapMs: 200 }),
  }),
});

const RESULT_STORAGE_KEY = "rebut.sequence-memory.result.v1";
const RESULT_PAGE_URL = "./result.html";

const TIMINGS = Object.freeze({
  ROUND_START_PAUSE_MS: 350,
  CLICK_PRESS_MS: 100,
  WRONG_SHAKE_MS: 420,
  WRONG_ANSWER_PAUSE_MS: 180,
  CORRECT_LOGO_WAVE_MS: 1000,
  LOGO_WAVE_LETTER_MS: 660,
  LOGO_WAVE_STAGGER_MS: 85,
  HELP_VISIBLE_MS: 5000,
  LEVEL_BACKDROP_LEAD_MS: 200,
  LEVEL_FADE_IN_MS: 600,
  LEVEL_HOLD_MS: 1200,
  LEVEL_FADE_OUT_MS: 800,
});

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const TOP_FIXED_END_Y = 133;
const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  { selector: ".help-button", y: 159, progress: 0 },
  { selector: ".game-grid", y: 244 },
  { selector: ".paper-speck", y: 926 },
  { selector: ".back-control", y: 977.87, progress: 1 },
  { selector: ".restart-control", y: 253.6, progress: 0 },
]);

const stage = document.querySelector("#game-stage");
const grid = document.querySelector("#game-grid");
const roundProgress = document.querySelector("#round-progress");
const levelProgressDigit = document.querySelector("#level-progress-digit");
const roundProgressDigit = document.querySelector("#round-progress-digit");
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
  answer: [],
  input: [],
  retryCount: 0,
  firstAttemptCorrectCells: 0,
  totalSequenceCells: 0,
  firstAttemptActive: true,
  reactionStartedAt: null,
  reactionRecordedForRound: false,
  reactionTimesMs: [],
  acceptingInput: false,
  runId: 0,
};

let cells = [];

document.documentElement.style.setProperty(
  "--cell-transition",
  `${GAME_SETTINGS.CELL_TRANSITION_MS}ms`,
);
document.documentElement.style.setProperty(
  "--level-fade-in",
  `${TIMINGS.LEVEL_FADE_IN_MS}ms`,
);
document.documentElement.style.setProperty(
  "--level-fade-out",
  `${TIMINGS.LEVEL_FADE_OUT_MS}ms`,
);
document.documentElement.style.setProperty(
  "--wrong-shake",
  `${TIMINGS.WRONG_SHAKE_MS}ms`,
);
document.documentElement.style.setProperty(
  "--logo-wave-letter-duration",
  `${TIMINGS.LOGO_WAVE_LETTER_MS}ms`,
);
gameLogoLetters.forEach((letter, index) => {
  letter.style.setProperty(
    "--logo-wave-delay",
    `${index * TIMINGS.LOGO_WAVE_STAGGER_MS}ms`,
  );
});

function buildGrid() {
  cells = window.MemoryGrid.build(grid, handleCellSelection);
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

function delay(milliseconds) {
  return new Promise((resolve) => (window.RebutGameClock || window).setTimeout(resolve, milliseconds));
}

function motionDelay(milliseconds) {
  return prefersReducedMotion.matches ? Math.min(milliseconds, 40) : milliseconds;
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

function setCellActive(index, isActive) {
  cells[index].classList.toggle("is-active", isActive);
}

function clearBoard() {
  cells.forEach((cell) => cell.classList.remove("is-active"));
}

function generateSequence(length) {
  const pool = Array.from({ length: 9 }, (_, index) => index);

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, length);
}

async function playSequence(sequence, runId) {
  const level = GAME_SETTINGS.LEVELS[state.level];
  status.textContent = `${state.level}단계 ${state.round}라운드 순서를 보여줍니다.`;

  for (let step = 0; step < sequence.length; step += 1) {
    const index = sequence[step];
    if (runId !== state.runId) return false;
    setCellActive(index, true);
    await delay(level.lightOnMs);
    setCellActive(index, false);

    if (step < sequence.length - 1) {
      await delay(level.lightGapMs);
    }
  }

  return runId === state.runId;
}

async function beginRound({ reuseAnswer = false } = {}) {
  const runId = ++state.runId;
  setInputLocked(true);
  clearBoard();
  state.input = [];

  if (!reuseAnswer) {
    const { sequenceLength } = GAME_SETTINGS.LEVELS[state.level];
    state.answer = generateSequence(sequenceLength);
    state.totalSequenceCells += sequenceLength;
    state.firstAttemptActive = true;
    state.reactionStartedAt = null;
    state.reactionRecordedForRound = false;
  }

  updateProgress();
  await delay(TIMINGS.ROUND_START_PAUSE_MS);

  const finished = await playSequence(state.answer, runId);
  if (!finished) return;

  if (!reuseAnswer && !state.reactionRecordedForRound) {
    state.reactionStartedAt = (window.RebutGameClock?.now() ?? performance.now());
  }

  setInputLocked(false);
  status.textContent = "같은 순서로 칸을 누르세요.";
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
  if (!state.acceptingInput) return;

  captureReactionTime();
  const expectedIndex = state.answer[state.input.length];
  state.input.push(index);
  setCellActive(index, true);
  pressCell(cells[index]);

  if (index !== expectedIndex) {
    state.retryCount += 1;
    state.firstAttemptActive = false;
    setInputLocked(true);
    state.input = [];
    grid.classList.add("is-shaking");
    status.textContent = "순서가 달라 같은 라운드를 다시 보여줍니다.";
    void retryRound();
    return;
  }

  if (state.firstAttemptActive) {
    state.firstAttemptCorrectCells += 1;
  }

  if (state.input.length === state.answer.length) {
    setInputLocked(true);
    status.textContent = "정답입니다.";
    void completeRound();
  }
}

async function retryRound() {
  await delay(motionDelay(TIMINGS.WRONG_SHAKE_MS));
  grid.classList.remove("is-shaking");
  await delay(TIMINGS.WRONG_ANSWER_PAUSE_MS);
  await beginRound({ reuseAnswer: true });
}

async function playCorrectLogoWave() {
  gameLogo.classList.remove("is-waving");
  void gameLogo.offsetWidth;
  gameLogo.classList.add("is-waving");
  await delay(motionDelay(TIMINGS.CORRECT_LOGO_WAVE_MS));
  gameLogo.classList.remove("is-waving");
}

async function completeRound() {
  await playCorrectLogoWave();

  if (state.round < GAME_SETTINGS.TOTAL_ROUNDS) {
    state.round += 1;
    await beginRound();
    return;
  }

  if (state.level < Object.keys(GAME_SETTINGS.LEVELS).length) {
    state.level += 1;
    state.round = 1;
    updateProgress();
    clearBoard();
    await showLevelTransition(state.level);
    await beginRound();
    return;
  }

  finishGame();
}

function finishGame() {
  clearBoard();
  status.textContent = "게임을 완료했습니다. 진단 결과를 계산합니다.";

  const result = {
    version: 1,
    completedAt: new Date().toISOString(),
    completedRounds:
      Object.keys(GAME_SETTINGS.LEVELS).length * GAME_SETTINGS.TOTAL_ROUNDS,
    firstAttemptCorrectCells: state.firstAttemptCorrectCells,
    totalSequenceCells: state.totalSequenceCells,
    reactionTimesMs: [...state.reactionTimesMs],
    retryCount: state.retryCount,
  };

  try {
    sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // 세션 저장이 막혀도 결과 페이지의 기본값으로 안전하게 이동합니다.
  }

  window.location.href = RESULT_PAGE_URL;
}

function resetCurrentInput() {
  if (!state.acceptingInput) return;

  state.retryCount += 1;
  state.firstAttemptActive = false;
  state.input = [];
  clearBoard();
  status.textContent = "이번 입력을 초기화했습니다. 같은 순서로 다시 누르세요.";
}


async function showLevelTransition(level) {
  await window.RebutStepTransition.show(level);
}

async function startGame() {
  try {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
  } catch {
    // 저장소 사용 불가 환경에서도 게임 진행은 유지합니다.
  }

  setInputLocked(true);
  updateProgress();
  await showLevelTransition(1);
  await beginRound();
}

helpButton.addEventListener("click", () => { window.RebutBookTutorial.open(); });
restartControl.addEventListener("click", resetCurrentInput);
backControl.addEventListener("click", () => {
  window.location.href = "../../?rehab=memory";
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") resetCurrentInput();
});
window.addEventListener("resize", fitStageToViewport, { passive: true });

buildGrid();
fitStageToViewport();
window.addEventListener("load", () => {
  void startGame();
});
