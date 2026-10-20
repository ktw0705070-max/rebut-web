"use strict";

// 레벨, 라운드, 문장, 빈칸, 정답, 오답 보기, 힌트를 한 상수에서 관리합니다.
const GAME_DATA = Object.freeze({
  1: Object.freeze([
    Object.freeze({
      words: Object.freeze([
        Object.freeze({ text: "김 씨가", size: "medium" }),
        Object.freeze({ text: "편지를", size: "medium" }),
        Object.freeze({ text: "붙였다.", size: "medium" }),
      ]),
      rows: Object.freeze([3]),
      blankIndex: 1,
      options: Object.freeze(["편지를", "우산을", "신물을", "열쇠를"]),
      hint: "우체국에서 부치는 거예요.",
    }),
    Object.freeze({
      words: Object.freeze([
        Object.freeze({ text: "아이가", size: "medium" }),
        Object.freeze({ text: "풍선을", size: "medium" }),
        Object.freeze({ text: "놓쳤다.", size: "medium" }),
      ]),
      rows: Object.freeze([3]),
      blankIndex: 1,
      options: Object.freeze(["신발을", "풍선을", "연필을", "공을"]),
      hint: "하늘로 날아가는 거예요.",
    }),
    Object.freeze({
      words: Object.freeze([
        Object.freeze({ text: "노인이", size: "medium" }),
        Object.freeze({ text: "지팡이를", size: "medium" }),
        Object.freeze({ text: "짚었다.", size: "medium" }),
      ]),
      rows: Object.freeze([3]),
      blankIndex: 1,
      options: Object.freeze(["우산을", "삽을", "지팡이를", "빗자루를"]),
      hint: "걸을 때 짚는 거예요.",
    }),
  ]),
  2: Object.freeze([
    Object.freeze({
      words: Object.freeze([
        Object.freeze({ text: "박 씨가", size: "medium" }),
        Object.freeze({ text: "어제", size: "short" }),
        Object.freeze({ text: "은행에서", size: "long" }),
        Object.freeze({ text: "통장을", size: "medium" }),
        Object.freeze({ text: "만들었다.", size: "long" }),
      ]),
      rows: Object.freeze([3, 2]),
      blankIndex: 2,
      options: Object.freeze(["병원에서", "관공서에서", "은행에서", "우체국에서"]),
      hint: "돈을 맡기는 곳이에요.",
    }),
    Object.freeze({
      words: Object.freeze([
        Object.freeze({ text: "학생이", size: "medium" }),
        Object.freeze({ text: "도서관에서", size: "long" }),
        Object.freeze({ text: "두꺼운", size: "medium" }),
        Object.freeze({ text: "책을", size: "short" }),
        Object.freeze({ text: "빌렸다.", size: "medium" }),
      ]),
      rows: Object.freeze([3, 2]),
      blankIndex: 3,
      options: Object.freeze(["잡지를", "신문을", "공책을", "책을"]),
      hint: "도서관에서 빌리는 거예요.",
    }),
    Object.freeze({
      words: Object.freeze([
        Object.freeze({ text: "환자가", size: "medium" }),
        Object.freeze({ text: "삼층", size: "short" }),
        Object.freeze({ text: "302호", size: "medium" }),
        Object.freeze({ text: "병실에", size: "medium" }),
        Object.freeze({ text: "입원했다.", size: "long" }),
      ]),
      rows: Object.freeze([3, 2]),
      blankIndex: 2,
      options: Object.freeze(["320호", "203호", "230호", "302호"]),
      hint: "3으로 시작하는 번호예요.",
    }),
  ]),
  3: Object.freeze([
    Object.freeze({
      words: Object.freeze([
        Object.freeze({ text: "정 씨가", size: "medium" }),
        Object.freeze({ text: "오늘", size: "short" }),
        Object.freeze({ text: "아침", size: "short" }),
        Object.freeze({ text: "지하철을", size: "long" }),
        Object.freeze({ text: "타고", size: "short" }),
        Object.freeze({ text: "회사에", size: "medium" }),
        Object.freeze({ text: "갔다.", size: "short" }),
      ]),
      rows: Object.freeze([4, 3]),
      blankIndex: 3,
      options: Object.freeze(["버스를", "지하철을", "전철을", "택시를"]),
      hint: "땅속으로 다니는 거예요.",
    }),
    Object.freeze({
      words: Object.freeze([
        Object.freeze({ text: "아이가", size: "medium" }),
        Object.freeze({ text: "주말에", size: "medium" }),
        Object.freeze({ text: "공원에서", size: "long" }),
        Object.freeze({ text: "강아지와", size: "long" }),
        Object.freeze({ text: "한참을", size: "medium" }),
        Object.freeze({ text: "산책했다.", size: "long" }),
      ]),
      rows: Object.freeze([3, 3]),
      blankIndex: 2,
      options: Object.freeze(["공원에서", "마당에서", "운동장에서", "광장에서"]),
      hint: "나무가 많은 곳이에요.",
    }),
    Object.freeze({
      words: Object.freeze([
        Object.freeze({ text: "김 씨가", size: "medium" }),
        Object.freeze({ text: "현관", size: "short" }),
        Object.freeze({ text: "비밀번호를", size: "long" }),
        Object.freeze({ text: "4507로", size: "medium" }),
        Object.freeze({ text: "새로", size: "short" }),
        Object.freeze({ text: "바꿨다.", size: "medium" }),
      ]),
      rows: Object.freeze([3, 3]),
      blankIndex: 3,
      options: Object.freeze(["7504로", "4570로", "5407로", "4507로"]),
      hint: "4로 시작하는 네 자리예요.",
    }),
  ]),
});

// 모든 시간과 모션 값은 여기에서 조정합니다.
const SETTINGS = Object.freeze({
  TOTAL_LEVELS: 3,
  ROUNDS_PER_LEVEL: 3,
  MAX_WRONG_ATTEMPTS: 2,
  MEMORY_SECONDS: Object.freeze({ 1: 4, 2: 6, 3: 8 }),
});

const TIMINGS = Object.freeze({
  BLANK_FILL_MS: 300,
  FEEDBACK_FILL_MS: 180,
  WRONG_SHAKE_MS: 200,
  WRONG_PAUSE_MS: 320,
  CORRECT_BOUNCE_MS: 540,
  CORRECT_STAGGER_MS: 145,
  CORRECT_HOLD_MS: 560,
  LOGO_WAVE_LETTER_MS: 660,
  LOGO_WAVE_STAGGER_MS: 85,
  HELP_VISIBLE_MS: 5000,
  LEVEL_BACKDROP_LEAD_MS: 200,
  LEVEL_FADE_IN_MS: 600,
  LEVEL_HOLD_MS: 1200,
  LEVEL_FADE_OUT_MS: 800,
});

// React Bits FallingText의 기본 Matter.js 물리값을 카드 크기에 그대로 적용합니다.
const FALLING_PHYSICS = Object.freeze({
  GRAVITY: 1,
  RESTITUTION: .8,
  FRICTION: .2,
  FRICTION_AIR: .01,
  INITIAL_SPEED_X: 5,
  INITIAL_ANGULAR_SPEED: .05,
});

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const TOP_FIXED_END_Y = 133;
const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  Object.freeze({ selector: ".info-popover", y: 220 }),
  Object.freeze({ selector: ".memory-timer", y: 230 }),
  Object.freeze({ selector: ".sentence-board", y: 342 }),
  Object.freeze({ selector: ".choice-arena", y: 500 }),
  Object.freeze({ selector: ".memory-pager", y: 715 }),
  Object.freeze({ selector: ".paper-speck", y: 926 }),
]);

const BOX_WIDTHS = Object.freeze({ short: 235, medium: 308, long: 362 });
const BOX_HEIGHT = 159;
const DROP_TARGET_PADDING = 18;
const RESULT_STORAGE_KEY = "rebut.keyword-restore.result.v1";
const ASSET = "./assets/";

const stage = document.querySelector("#game-stage");
const gameLogo = document.querySelector(".game-logo");
const gameLogoLetters = Array.from(gameLogo.querySelectorAll("img"));
const sentenceBoard = document.querySelector("#sentence-board");
const choiceArena = document.querySelector("#choice-arena");
const levelNumber = document.querySelector("#level-number");
const roundNumber = document.querySelector("#round-number");
const memoryTimer = document.querySelector("#memory-timer");
const timerCopy = document.querySelector("#timer-copy");
const timerProgress = document.querySelector("#timer-progress");
const memoryPager = document.querySelector("#memory-pager");
const previousButton = document.querySelector("#previous-button");
const nextButton = document.querySelector("#next-button");
const helpButton = document.querySelector("#help-button");
const restartControl = document.querySelector("#restart-control");
const backControl = document.querySelector("#back-control");
const status = document.querySelector("#game-status");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  level: 1,
  round: 1,
  memoryPage: 0,
  phase: "idle",
  reviewOnly: false,
  wrongAttempts: 0,
  totalWrongAttempts: 0,
  firstAttemptCorrectRounds: 0,
  reactionStartedAt: null,
  reactionTimesMs: [],
  acceptingInput: false,
  runId: 0,
  completed: false,
};

let sceneScale = 1;
let verticalExtra = 0;
let timerAnimationFrame = 0;
let timerRunId = 0;
let physics = null;

document.documentElement.style.setProperty("--blank-fill-duration", String(TIMINGS.BLANK_FILL_MS) + "ms");
document.documentElement.style.setProperty("--feedback-fill-duration", String(TIMINGS.FEEDBACK_FILL_MS) + "ms");
document.documentElement.style.setProperty("--correct-bounce-duration", String(TIMINGS.CORRECT_BOUNCE_MS) + "ms");
document.documentElement.style.setProperty("--logo-wave-letter-duration", String(TIMINGS.LOGO_WAVE_LETTER_MS) + "ms");
document.documentElement.style.setProperty("--wrong-shake-duration", String(TIMINGS.WRONG_SHAKE_MS) + "ms");
document.documentElement.style.setProperty("--level-fade-in", String(TIMINGS.LEVEL_FADE_IN_MS) + "ms");
document.documentElement.style.setProperty("--level-fade-out", String(TIMINGS.LEVEL_FADE_OUT_MS) + "ms");

gameLogoLetters.forEach(function (letter, index) {
  letter.style.setProperty("--logo-wave-delay", String(index * TIMINGS.LOGO_WAVE_STAGGER_MS) + "ms");
});

function delay(milliseconds) {
  const duration = prefersReducedMotion.matches ? Math.min(milliseconds, 40) : milliseconds;
  return new Promise(function (resolve) {
    (window.RebutGameClock || window).setTimeout(resolve, duration);
  });
}

function currentPuzzle() {
  return GAME_DATA[state.level][state.round - 1];
}

function answerFor(puzzle) {
  return puzzle.words[puzzle.blankIndex].text;
}

function updateProgress() {
  const level = String(state.level);
  const round = String(state.round);
  levelNumber.src = ASSET + "round-digit-" + level + ".png?v=20260924-1";
  levelNumber.alt = level;
  roundNumber.src = ASSET + "round-digit-" + round + ".png?v=20260924-1";
  roundNumber.alt = round;
  document.querySelector(".round-progress").setAttribute("aria-label", "현재 진행 " + level + "-" + round);
}

function boxTexture(size, dark) {
  return ASSET + "box-" + size + (dark ? "-outline-dark.png" : ".png");
}

function boxSurface(size, side, dark) {
  return ASSET + "box-" + size + "-" + side + (dark ? "-dark.svg" : ".svg");
}

function createWordBox(word, index, extraClass) {
  const isChoice = extraClass && extraClass.indexOf("choice-box") !== -1;
  const box = document.createElement(isChoice ? "button" : "div");
  box.className = "word-box" + (extraClass ? " " + extraClass : "");
  box.dataset.size = word.size;
  box.dataset.index = String(index);
  box.dataset.word = word.text;
  if (isChoice) {
    box.type = "button";
    box.setAttribute("aria-label", word.text + " 보기");
  }

  const figmaShadow = document.createElement("img");
  figmaShadow.className = "word-box__figma-shadow";
  figmaShadow.src = ASSET + "vector-164-shadow-only.svg";
  figmaShadow.alt = "";
  figmaShadow.setAttribute("aria-hidden", "true");
  figmaShadow.draggable = false;

  const visual = document.createElement("span");
  visual.className = "word-box__visual";
  visual.innerHTML =
    '<img class="word-box__bottom-face word-box__surface word-box__surface--idle" src="' + boxSurface(word.size, "bottom", false) + '" alt="" />' +
    '<img class="word-box__bottom-face word-box__surface word-box__surface--dark" src="' + boxSurface(word.size, "bottom", true) + '" alt="" />' +
    '<span class="word-box__side-face word-box__surface word-box__surface--idle"><img src="' + boxSurface(word.size, "side", false) + '" alt="" /></span>' +
    '<span class="word-box__side-face word-box__surface word-box__surface--dark"><img src="' + boxSurface(word.size, "side", true) + '" alt="" /></span>' +
    '<span class="word-box__front-face" aria-hidden="true"></span>' +
    '<span class="word-box__label">' + word.text + '</span>' +
    '<img class="word-box__texture word-box__texture--idle" src="' + boxTexture(word.size, false) + '" alt="" />' +
    '<img class="word-box__texture word-box__texture--dark" src="' + boxTexture(word.size, true) + '" alt="" />';
  box.append(figmaShadow, visual);
  return box;
}

function rowWidth(words) {
  return words.reduce(function (total, word) {
    return total + BOX_WIDTHS[word.size];
  }, 0) - Math.max(0, words.length - 1) * 8;
}

function renderSentence(puzzle, blank) {
  sentenceBoard.replaceChildren();
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  let widest = 0;

  puzzle.rows.forEach(function (rowLength) {
    const row = document.createElement("div");
    row.className = "sentence-row";
    const rowWords = puzzle.words.slice(cursor, cursor + rowLength);
    widest = Math.max(widest, rowWidth(rowWords));

    rowWords.forEach(function (word, localIndex) {
      const absoluteIndex = cursor + localIndex;
      const box = createWordBox(word, absoluteIndex, "");
      if (blank && absoluteIndex === puzzle.blankIndex) box.classList.add("is-blank");
      row.append(box);
    });

    cursor += rowLength;
    fragment.append(row);
  });

  sentenceBoard.style.setProperty("--sentence-width", String(widest) + "px");
  sentenceBoard.append(fragment);
  sentenceBoard.setAttribute("aria-label", puzzle.words.map(function (word) { return word.text; }).join(" "));
}

function cancelMemoryTimer() {
  timerRunId += 1;
  (window.RebutGameClock || window).cancelAnimationFrame(timerAnimationFrame);
}

function formatSeconds(value) {
  return "0:" + String(Math.max(0, Math.ceil(value))).padStart(2, "0");
}

function startMemoryTimer() {
  cancelMemoryTimer();
  const runId = timerRunId;
  const duration = SETTINGS.MEMORY_SECONDS[state.level] * 1000;
  const startedAt = (window.RebutGameClock?.now() ?? performance.now());

  function tick(now) {
    if (runId !== timerRunId || state.phase !== "memory") return;
    const elapsed = Math.min(duration, now - startedAt);
    const remaining = duration - elapsed;
    timerCopy.textContent = formatSeconds(remaining / 1000);
    timerProgress.style.setProperty("--timer-progress", String(Math.max(0, remaining / duration)));

    if (remaining <= 0) {
      void moveMemoryForward();
      return;
    }
    timerAnimationFrame = (window.RebutGameClock || window).requestAnimationFrame(tick);
  }

  timerCopy.textContent = formatSeconds(SETTINGS.MEMORY_SECONDS[state.level]);
  timerProgress.style.setProperty("--timer-progress", "1");
  timerAnimationFrame = (window.RebutGameClock || window).requestAnimationFrame(tick);
}




function setPhaseVisibility(memoryVisible) {
  memoryTimer.classList.toggle("is-hidden", !memoryVisible);
  memoryPager.classList.toggle("is-hidden", !memoryVisible);
  choiceArena.classList.toggle("is-visible", !memoryVisible);
}

function showMemoryPage(page, reviewOnly) {
  stopPhysics();
  cancelMemoryTimer();
  state.phase = "memory";
  state.acceptingInput = false;
  state.reviewOnly = Boolean(reviewOnly);
  state.memoryPage = page;
  state.round = page + 1;
  updateProgress();
  setPhaseVisibility(true);
  renderSentence(GAME_DATA[state.level][page], false);
  previousButton.disabled = state.reviewOnly || page === 0;
  nextButton.querySelector("span").textContent = "다음";
  status.textContent = String(state.level) + "단계 " + String(state.round) + "라운드 문장을 기억하세요.";
  startMemoryTimer();
}

async function moveMemoryForward() {
  if (state.phase !== "memory") return;
  cancelMemoryTimer();
  if (state.reviewOnly) {
    showProblem(state.memoryPage, true);
    return;
  }
  if (state.memoryPage < SETTINGS.ROUNDS_PER_LEVEL - 1) {
    showMemoryPage(state.memoryPage + 1, false);
    return;
  }
  showProblem(0, false);
}

function moveMemoryBackward() {
  if (state.phase !== "memory" || state.reviewOnly || state.memoryPage === 0) return;
  showMemoryPage(state.memoryPage - 1, false);
}

function sizeForOption(text) {
  const compact = text.replace(/\s/g, "");
  if (compact.length <= 3) return "short";
  if (compact.length <= 4) return "medium";
  return "long";
}

function arenaPoint(event) {
  const rect = choiceArena.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / sceneScale,
    y: (event.clientY - rect.top) / sceneScale,
  };
}

function choiceTransform(record) {
  const body = record.body;
  const left = body.position.x - record.width / 2;
  const top = body.position.y - record.height / 2;
  record.element.style.transform =
    "translate3d(" + left.toFixed(2) + "px," + top.toFixed(2) + "px,0) rotate(" + body.angle.toFixed(4) + "rad)";
}

function stopPhysics() {
  if (physics) {
    physics.active = null;
    window.Matter.Runner.stop(physics.runner);
    window.Matter.World.clear(physics.engine.world, false);
    window.Matter.Engine.clear(physics.engine);
    physics = null;
  }
  choiceArena.replaceChildren();
  choiceArena.classList.remove("is-visible");
}

function startPhysicsChoices(puzzle) {
  stopPhysics();
  choiceArena.classList.add("is-visible");
  const Matter = window.Matter;
  const engine = Matter.Engine.create();
  engine.gravity.y = FALLING_PHYSICS.GRAVITY;
  const runner = Matter.Runner.create();
  const width = choiceArena.offsetWidth;
  const height = choiceArena.offsetHeight;
  const boundaries = [
    Matter.Bodies.rectangle(width / 2, height + 25, width, 50, { isStatic: true }),
    Matter.Bodies.rectangle(-25, height / 2, 50, height, { isStatic: true }),
    Matter.Bodies.rectangle(width + 25, height / 2, 50, height, { isStatic: true }),
    Matter.Bodies.rectangle(width / 2, -25, width, 50, { isStatic: true }),
  ];
  Matter.World.add(engine.world, boundaries);

  const starts = [
    Object.freeze({ x: 360, y: 84, angle: 0 }),
    Object.freeze({ x: 630, y: 248, angle: .16 }),
    Object.freeze({ x: 1010, y: 84, angle: -.02 }),
    Object.freeze({ x: 1280, y: 248, angle: .42 }),
  ];
  const records = [];

  puzzle.options.forEach(function (option, index) {
    const size = option === answerFor(puzzle) ? puzzle.words[puzzle.blankIndex].size : sizeForOption(option);
    const word = Object.freeze({ text: option, size: size });
    const element = createWordBox(word, index, "choice-box");
    element.dataset.correct = option === answerFor(puzzle) ? "true" : "false";
    choiceArena.append(element);
    const bodyWidth = BOX_WIDTHS[size];
    const body = Matter.Bodies.rectangle(starts[index].x, starts[index].y, bodyWidth, BOX_HEIGHT, {
      restitution: FALLING_PHYSICS.RESTITUTION,
      friction: FALLING_PHYSICS.FRICTION,
      frictionAir: FALLING_PHYSICS.FRICTION_AIR,
    });
    Matter.Body.setAngle(body, starts[index].angle);
    Matter.Body.setVelocity(body, {
      x: (Math.random() - .5) * FALLING_PHYSICS.INITIAL_SPEED_X,
      y: 0,
    });
    Matter.Body.setAngularVelocity(body, (Math.random() - .5) * FALLING_PHYSICS.INITIAL_ANGULAR_SPEED);
    const record = { element: element, body: body, width: bodyWidth, height: BOX_HEIGHT, start: starts[index] };
    records.push(record);
    Matter.World.add(engine.world, body);

    element.addEventListener("pointerdown", function (event) {
      if (!state.acceptingInput || state.phase !== "problem" || physics.active) return;
      event.preventDefault();
      const point = arenaPoint(event);
      physics.active = {
        record: record,
        pointerId: event.pointerId,
        offsetX: point.x - body.position.x,
        offsetY: point.y - body.position.y,
      };
      element.setPointerCapture(event.pointerId);
      element.classList.add("is-grabbed");
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(body, 0);
      Matter.Body.setStatic(body, true);
    });

    element.addEventListener("pointermove", function (event) {
      if (!physics || !physics.active || physics.active.record !== record || physics.active.pointerId !== event.pointerId) return;
      const point = arenaPoint(event);
      Matter.Body.setPosition(body, {
        x: Math.max(record.width / 2, Math.min(width - record.width / 2, point.x - physics.active.offsetX)),
        // 낙하 영역의 상단 경계는 자동 물리에만 적용합니다. 사용자가 잡은
        // 동안에는 튜토리얼처럼 위쪽 문장 빈칸까지 자유롭게 이동할 수 있습니다.
        y: Math.min(height - record.height / 2, point.y - physics.active.offsetY),
      });
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      choiceTransform(record);
    });

    function release(event) {
      if (!physics || !physics.active || physics.active.record !== record || physics.active.pointerId !== event.pointerId) return;
      const point = arenaPoint(event);
      physics.active = null;
      element.classList.remove("is-grabbed");
      Matter.Body.setStatic(body, false);
      Matter.Body.setVelocity(body, { x: 0, y: 1.4 });
      const blank = sentenceBoard.querySelector(".word-box.is-blank");
      const blankRect = blank ? blank.getBoundingClientRect() : null;
      const arenaRect = choiceArena.getBoundingClientRect();
      const cardCenterX = arenaRect.left + body.position.x * sceneScale;
      const cardCenterY = arenaRect.top + body.position.y * sceneScale;
      const dropPadding = DROP_TARGET_PADDING * sceneScale;
      const overBlank = blankRect &&
        ((event.clientX >= blankRect.left - dropPadding &&
          event.clientX <= blankRect.right + dropPadding &&
          event.clientY >= blankRect.top - dropPadding &&
          event.clientY <= blankRect.bottom + dropPadding) ||
         (cardCenterX >= blankRect.left - dropPadding &&
          cardCenterX <= blankRect.right + dropPadding &&
          cardCenterY >= blankRect.top - dropPadding &&
          cardCenterY <= blankRect.bottom + dropPadding));
      if (overBlank) void judgeChoice(record);
      else if (body.position.y < record.height / 2) {
        Matter.Body.setPosition(body, {
          x: body.position.x,
          y: record.height / 2 + 4,
        });
      }
    }

    element.addEventListener("pointerup", release);
    element.addEventListener("pointercancel", release);
  });

  Matter.Events.on(engine, "afterUpdate", function () {
    records.forEach(function (record) {
      choiceTransform(record);
    });
  });
  physics = { engine: engine, runner: runner, records: records, active: null };
  Matter.Runner.run(runner, engine);
}

async function judgeChoice(record) {
  if (!state.acceptingInput || state.phase !== "problem") return;
  state.acceptingInput = false;
  const isCorrect = record.element.dataset.correct === "true";
  if (isCorrect) {
    await completeAnswer(record, false);
    return;
  }

  state.wrongAttempts += 1;
  state.totalWrongAttempts += 1;
  record.element.classList.add("is-wrong");
  sentenceBoard.classList.add("is-wrong");
  status.textContent = "정답이 아닙니다.";
  await delay(TIMINGS.WRONG_SHAKE_MS);
  record.element.classList.remove("is-wrong");
  sentenceBoard.classList.remove("is-wrong");

  if (state.wrongAttempts >= SETTINGS.MAX_WRONG_ATTEMPTS) {
    await delay(TIMINGS.WRONG_PAUSE_MS);
    await completeAnswer(null, true);
    return;
  }

  if (physics) {
    window.Matter.Body.setStatic(record.body, false);
    window.Matter.Body.setPosition(record.body, {
      x: record.start.x,
      y: record.height / 2 + 4,
    });
    window.Matter.Body.setAngle(record.body, record.start.angle);
    window.Matter.Body.setVelocity(record.body, { x: 0, y: 1 });
    window.Matter.Body.setAngularVelocity(record.body, .02);
  }
  state.acceptingInput = true;
  status.textContent = "같은 라운드에서 다시 골라 빈칸에 넣으세요.";
}

async function completeAnswer(record, autoReveal) {
  state.phase = "feedback";
  state.acceptingInput = false;
  if (typeof state.reactionStartedAt === "number") {
    state.reactionTimesMs.push(Math.max(0, (window.RebutGameClock?.now() ?? performance.now()) - state.reactionStartedAt));
    state.reactionStartedAt = null;
  }
  if (!autoReveal && state.wrongAttempts === 0) state.firstAttemptCorrectRounds += 1;

  if (record) record.element.style.visibility = "hidden";
  if (physics) {
    window.Matter.Runner.stop(physics.runner);
  }

  const blank = sentenceBoard.querySelector(".word-box.is-blank");
  if (blank) {
    blank.classList.remove("is-blank");
    blank.classList.add("is-filled");
  }
  await delay(TIMINGS.FEEDBACK_FILL_MS);

  const boxes = Array.from(sentenceBoard.querySelectorAll(".word-box"));
  boxes.forEach(function (box) { box.classList.add("is-correct"); });
  boxes.forEach(function (box, index) {
    box.style.setProperty("--correct-bounce-delay", String(index * TIMINGS.CORRECT_STAGGER_MS) + "ms");
    box.classList.add("is-complete-bounce");
  });
  gameLogo.classList.remove("is-waving");
  void gameLogo.offsetWidth;
  gameLogo.classList.add("is-waving");
  status.textContent = autoReveal ? "정답을 표시합니다." : "정답입니다.";
  await delay(TIMINGS.CORRECT_BOUNCE_MS + (boxes.length - 1) * TIMINGS.CORRECT_STAGGER_MS + TIMINGS.CORRECT_HOLD_MS);
  gameLogo.classList.remove("is-waving");
  await advanceAfterCorrect();
}

async function advanceAfterCorrect() {
  if (state.round < SETTINGS.ROUNDS_PER_LEVEL) {
    showProblem(state.round, false);
    return;
  }
  if (state.level < SETTINGS.TOTAL_LEVELS) {
    state.level += 1;
    state.round = 1;
    updateProgress();
    stopPhysics();
    sentenceBoard.replaceChildren();
    await showLevelTransition(state.level);
    showMemoryPage(0, false);
    return;
  }
  finishGame();
}

function showProblem(page, fromReview) {
  cancelMemoryTimer();
  stopPhysics();
  state.phase = "problem";
  state.round = page + 1;
  state.memoryPage = page;
  state.reviewOnly = false;
  if (!fromReview) state.wrongAttempts = 0;
  updateProgress();
  setPhaseVisibility(false);
  const puzzle = currentPuzzle();
  renderSentence(puzzle, true);
  state.acceptingInput = true;
  state.reactionStartedAt = (window.RebutGameClock?.now() ?? performance.now());
  status.textContent = "보기 낱말을 빈칸으로 끌어 넣으세요.";
  startPhysicsChoices(puzzle);
}

function reviewCurrentProblem() {
  if (state.phase !== "problem") return;
  showMemoryPage(state.round - 1, true);
}

async function showLevelTransition(level) {
  await window.RebutStepTransition.show(level);
}

function finishGame() {
  state.completed = true;
  state.phase = "complete";
  stopPhysics();
  const result = {
    version: 1,
    completedAt: new Date().toISOString(),
    completedRounds: SETTINGS.TOTAL_LEVELS * SETTINGS.ROUNDS_PER_LEVEL,
    firstAttemptCorrectRounds: state.firstAttemptCorrectRounds,
    reactionTimesMs: state.reactionTimesMs.slice(),
    retryCount: state.totalWrongAttempts,
  };
  try {
    sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
  } catch (_error) {
    // 세션 저장이 막혀도 결과 페이지는 기본값으로 열립니다.
  }
  window.location.href = "./result.html";
}

function fitStageToViewport() {
  sceneScale = Math.min(window.innerWidth / STAGE_SIZE.width, window.innerHeight / STAGE_SIZE.height);
  verticalExtra = Math.max(0, window.innerHeight / sceneScale - STAGE_SIZE.height);
  stage.style.setProperty("--game-scale", String(sceneScale));
  stage.style.height = String(STAGE_SIZE.height + verticalExtra) + "px";

  RESPONSIVE_VERTICAL_ANCHORS.forEach(function (anchor) {
    document.querySelectorAll(anchor.selector).forEach(function (element) {
      const progress = Math.min(1, Math.max(0, (anchor.y - TOP_FIXED_END_Y) / (STAGE_SIZE.height - TOP_FIXED_END_Y)));
      element.style.setProperty("--responsive-y", String(verticalExtra * progress) + "px");
    });
  });
}

helpButton.addEventListener("click", () => { window.RebutBookTutorial.open(); });
document.addEventListener("rebut:tutorial-pause", event => {
  if (physics?.runner) physics.runner.enabled = !event.detail.paused;
});


previousButton.addEventListener("click", moveMemoryBackward);
nextButton.addEventListener("click", function () { void moveMemoryForward(); });
restartControl.addEventListener("click", reviewCurrentProblem);
backControl.addEventListener("click", function () {
  window.location.href = "../../?rehab=memory";
});

window.addEventListener("keydown", function (event) {
  if (event.key.toLowerCase() === "r") reviewCurrentProblem();
});
window.addEventListener("resize", fitStageToViewport, { passive: true });

async function startGame() {
  try {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
  } catch (_error) {
    // 저장소를 사용할 수 없어도 게임 진행은 유지합니다.
  }
  updateProgress();
  fitStageToViewport();
  await showLevelTransition(1);
  showMemoryPage(0, false);
}

window.addEventListener("load", function () {
  void startGame();
});
