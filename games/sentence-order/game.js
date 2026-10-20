"use strict";

const GUIDE_COPY = "먼저, 흩어진 문장들을 잘 읽으세요.\n그다음, 일이 일어난 순서대로 놓으세요.";
const SHOW_TUTORIAL = new URLSearchParams(window.location.search).get("tutorial") !== "0";

// 팝업 중앙 데모의 문장·정답·초기 순서·고정 이동은 이 세트만 사용합니다.
const TUTORIAL_GAME = Object.freeze({
  sentences: Object.freeze([
    Object.freeze({ id: "wake", text: "아침에 알람 소리를 듣고 잠에서 깼다." }),
    Object.freeze({ id: "breakfast", text: "그리고 세수를 한 뒤 아침밥을 먹었다." }),
    Object.freeze({ id: "leave", text: "마지막으로 가방을 메고 집을 나섰다." }),
  ]),
  correctOrder: Object.freeze(["wake", "breakfast", "leave"]),
  mixedOrder: Object.freeze(["breakfast", "leave", "wake"]),
  moves: Object.freeze([
    Object.freeze({ cardId: "wake", targetId: "breakfast" }),
    Object.freeze({ cardId: "breakfast", targetId: "leave" }),
  ]),
});

// 레벨별 문장 수와 피그마 보드 치수는 이 표에서만 관리합니다.
const GAME_SETTINGS = Object.freeze({
  TOTAL_LEVELS: 3,
  ROUNDS_PER_LEVEL: 3,
  MAX_WRONG_ATTEMPTS: 2,
  LEVELS: Object.freeze({
    1: Object.freeze({
      sentenceCount: 3,
      boardTop: 326,
      boardHeight: 429,
      stackTop: 32,
      stackHeight: 365.494,
      spine: "game-spine-lv1.png",
      spineTop: -1,
      spineLeft: 0,
      spineWidth: 96,
      spineHeight: 430,
    }),
    2: Object.freeze({
      sentenceCount: 4,
      boardTop: 270,
      boardHeight: 540,
      stackTop: 23,
      stackHeight: 491.992,
      spine: "game-spine-lv2.png",
      spineTop: -1,
      spineLeft: 0,
      spineWidth: 96,
      spineHeight: 541,
    }),
    3: Object.freeze({
      sentenceCount: 5,
      boardTop: 200,
      boardHeight: 681,
      stackTop: 32,
      stackHeight: 618.49,
      spine: "game-spine-lv3.png",
      spineTop: -2,
      spineLeft: 9,
      spineWidth: 88.005,
      spineHeight: 684,
    }),
  }),
});

// 판정·드래그·피드백·레벨 전환의 모든 시간(ms)은 이 상수에서 조정합니다.
const TIMINGS = Object.freeze({
  PICK_PRESS_MS: 150,
  REORDER_MS: 300,
  ROUND_ENTER_MS: 820,
  ROUND_ENTER_STAGGER_MS: 45,
  WRONG_SHAKE_MS: 200,
  WRONG_PAUSE_MS: 320,
  FEEDBACK_FILL_MS: 300,
  CORRECT_STAGGER_MS: 90,
  CORRECT_WAVE_MS: 450,
  CORRECT_HOLD_MS: 650,
  CORRECT_LOGO_WAVE_MS: 1000,
  LOGO_WAVE_LETTER_MS: 660,
  LOGO_WAVE_STAGGER_MS: 85,
  TUTORIAL_POPUP_FADE_OUT_MS: 300,
  TUTORIAL_PRESENTATION_HOLD_MS: 1500,
  TUTORIAL_CURSOR_MOVE_MS: 500,
  TUTORIAL_PICK_MS: 100,
  TUTORIAL_DRAG_MS: 700,
  TUTORIAL_SWAP_MS: 300,
  TUTORIAL_RELEASE_MS: 100,
  TUTORIAL_BETWEEN_MOVES_MS: 180,
  TUTORIAL_FEEDBACK_FILL_MS: 300,
  TUTORIAL_CORRECT_STAGGER_MS: 90,
  TUTORIAL_CORRECT_WAVE_MS: 450,
  TUTORIAL_COMPLETE_HOLD_MS: 1000,
  TUTORIAL_CURSOR_RESET_MS: 450,
  TUTORIAL_SCENE_RESET_MS: 250,
  HELP_VISIBLE_MS: 5000,
  LEVEL_BACKDROP_LEAD_MS: 200,
  LEVEL_FADE_IN_MS: 600,
  LEVEL_HOLD_MS: 1200,
  LEVEL_FADE_OUT_MS: 800,
});

// 각 라운드의 문장·정답·초기 배열·힌트·설명을 하나의 고정 세트로 묶습니다.
const GAME_DATA = Object.freeze({
  1: Object.freeze([
    Object.freeze({
      description: GUIDE_COPY,
      hint: "가장 먼저 일어난 일은 어젯밤에 있었어요.",
      sentences: Object.freeze([
        Object.freeze({ id: "charge", text: "어젯밤 잠들기 전에 충전기 꽂는 걸 깜빡했다." }),
        Object.freeze({ id: "phone-off", text: "그래서 아침에 보니 휴대폰이 완전히 꺼져 있었다." }),
        Object.freeze({ id: "oversleep", text: "결국 알람이 울리지 않아 늦잠을 자고 말았다." }),
      ]),
      correctOrder: Object.freeze(["charge", "phone-off", "oversleep"]),
      mixedOrder: Object.freeze(["oversleep", "phone-off", "charge"]),
    }),
    Object.freeze({
      description: GUIDE_COPY,
      hint: "우산을 챙긴 이유부터 생각해 보세요.",
      sentences: Object.freeze([
        Object.freeze({ id: "rain", text: "아침에 창밖을 보니 비가 세차게 내리고 있었다." }),
        Object.freeze({ id: "umbrella", text: "그래서 현관에서 우산을 챙겨 들고 나갔다." }),
        Object.freeze({ id: "arrive-dry", text: "덕분에 옷을 하나도 적시지 않고 도착했다." }),
      ]),
      correctOrder: Object.freeze(["rain", "umbrella", "arrive-dry"]),
      mixedOrder: Object.freeze(["umbrella", "rain", "arrive-dry"]),
    }),
    Object.freeze({
      description: GUIDE_COPY,
      hint: "배가 고파진 까닭이 맨 앞이에요.",
      sentences: Object.freeze([
        Object.freeze({ id: "miss-lunch", text: "바빠서 점심시간을 그냥 놓치고 말았다." }),
        Object.freeze({ id: "hungry", text: "그러다 보니 오후 내내 배가 너무 고팠다." }),
        Object.freeze({ id: "snack", text: "결국 편의점에 들러 간식을 사 먹었다." }),
      ]),
      correctOrder: Object.freeze(["miss-lunch", "hungry", "snack"]),
      mixedOrder: Object.freeze(["hungry", "snack", "miss-lunch"]),
    }),
  ]),
  2: Object.freeze([
    Object.freeze({
      description: GUIDE_COPY,
      hint: "지각하게 된 첫 번째 원인은 전날 밤에 있어요.",
      sentences: Object.freeze([
        Object.freeze({ id: "late-movie", text: "전날 밤 늦게까지 영화를 보다 늦게 잤다." }),
        Object.freeze({ id: "miss-bus", text: "그래서 아침에 늦잠을 자 버스를 놓쳤다." }),
        Object.freeze({ id: "next-bus", text: "다음 버스는 한참 뒤에야 도착했다." }),
        Object.freeze({ id: "late-work", text: "결국 회사에 삼십 분이나 지각하고 말았다." }),
      ]),
      correctOrder: Object.freeze(["late-movie", "miss-bus", "next-bus", "late-work"]),
      mixedOrder: Object.freeze(["next-bus", "late-movie", "late-work", "miss-bus"]),
    }),
    Object.freeze({
      description: GUIDE_COPY,
      hint: "감기에 걸리기까지 어떤 일이 먼저 있었을까요?",
      sentences: Object.freeze([
        Object.freeze({ id: "thin-clothes", text: "날이 풀린 줄 알고 얇은 옷을 입고 나갔다." }),
        Object.freeze({ id: "sudden-rain", text: "그러다 갑자기 쏟아진 비를 쫄딱 맞았다." }),
        Object.freeze({ id: "fever", text: "그날 밤부터 몸에 열이 오르기 시작했다." }),
        Object.freeze({ id: "cold", text: "결국 다음 날 병원에서 감기 진단을 받았다." }),
      ]),
      correctOrder: Object.freeze(["thin-clothes", "sudden-rain", "fever", "cold"]),
      mixedOrder: Object.freeze(["sudden-rain", "fever", "cold", "thin-clothes"]),
    }),
    Object.freeze({
      description: GUIDE_COPY,
      hint: "잎이 시든 까닭부터 찾아보세요.",
      sentences: Object.freeze([
        Object.freeze({ id: "trip", text: "여행을 다녀오느라 며칠 동안 화분을 잊고 있었다." }),
        Object.freeze({ id: "wilt", text: "그래서 잎이 노랗게 시들어 축 늘어졌다." }),
        Object.freeze({ id: "water", text: "뒤늦게 정신이 들어 흠뻑 물을 주었다." }),
        Object.freeze({ id: "revive", text: "며칠 지나자 잎이 다시 파릇하게 살아났다." }),
      ]),
      correctOrder: Object.freeze(["trip", "wilt", "water", "revive"]),
      mixedOrder: Object.freeze(["trip", "revive", "wilt", "water"]),
    }),
  ]),
  3: Object.freeze([
    Object.freeze({
      description: GUIDE_COPY,
      hint: "모든 일은 가게를 차린 것에서 시작돼요.",
      sentences: Object.freeze([
        Object.freeze({ id: "open-cafe", text: "작년에 큰맘 먹고 동네에 예쁜 카페를 차렸다." }),
        Object.freeze({ id: "franchise", text: "그런데 얼마 뒤 바로 옆에 큰 프랜차이즈가 생겼다." }),
        Object.freeze({ id: "sales", text: "손님들이 그쪽으로 몰리면서 매출이 점점 줄었다." }),
        Object.freeze({ id: "rent", text: "매달 나가는 임대료를 감당하지 못해 적자가 쌓였다." }),
        Object.freeze({ id: "close-cafe", text: "결국 문을 연 지 일 년 만에 가게를 닫고 말았다." }),
      ]),
      correctOrder: Object.freeze(["open-cafe", "franchise", "sales", "rent", "close-cafe"]),
      mixedOrder: Object.freeze(["close-cafe", "franchise", "sales", "rent", "open-cafe"]),
    }),
    Object.freeze({
      description: GUIDE_COPY,
      hint: "도시가 더워진 맨 처음 이유를 떠올려 보세요.",
      sentences: Object.freeze([
        Object.freeze({ id: "development", text: "도시가 개발되면서 높은 건물과 도로가 빽빽이 들어섰다." }),
        Object.freeze({ id: "sun-heat", text: "한낮의 뜨거운 햇볕이 아스팔트에 그대로 쌓였다." }),
        Object.freeze({ id: "night-heat", text: "그렇게 달궈진 열기는 밤이 되어도 좀처럼 식지 않았다." }),
        Object.freeze({ id: "heat-dome", text: "더운 공기가 도시 전체를 뚜껑처럼 덮어 버렸다." }),
        Object.freeze({ id: "sleepless", text: "결국 사람들은 밤새 잠을 못 이루고 숨 막혀 했다." }),
      ]),
      correctOrder: Object.freeze(["development", "sun-heat", "night-heat", "heat-dome", "sleepless"]),
      mixedOrder: Object.freeze(["sun-heat", "night-heat", "sleepless", "development", "heat-dome"]),
    }),
    Object.freeze({
      description: GUIDE_COPY,
      hint: "낮은 점수를 받기까지 무엇이 먼저였을까요?",
      sentences: Object.freeze([
        Object.freeze({ id: "wide-range", text: "시험 범위가 너무 넓어서 엄두가 나지 않았다." }),
        Object.freeze({ id: "delay-study", text: "그래서 계속 미루다가 하루 전날 밤에야 책을 폈다." }),
        Object.freeze({ id: "all-night", text: "밤을 새우다시피 하니 시험 날 정신이 몽롱했다." }),
        Object.freeze({ id: "mistake", text: "아는 문제조차 실수로 답을 잘못 적었다." }),
        Object.freeze({ id: "low-score", text: "결국 예상보다 훨씬 낮은 점수를 받고 말았다." }),
      ]),
      correctOrder: Object.freeze(["wide-range", "delay-study", "all-night", "mistake", "low-score"]),
      mixedOrder: Object.freeze(["all-night", "delay-study", "wide-range", "mistake", "low-score"]),
    }),
  ]),
});

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const TOP_FIXED_END_Y = 133;
const CARD_HEIGHT = 112.498;
const SLOT_STEP = 126.5;
const DRAG_LIFT = 8;
const TUTORIAL_CARD_HEIGHT = 67.08;
const TUTORIAL_SLOT_STEP = 78;
const TUTORIAL_CARD_LIFT = 8;
const TUTORIAL_CARD_STACK_TOP = 236;
const TUTORIAL_CURSOR_POINTS = Object.freeze({
  home: Object.freeze({ x: 586, y: 503 }),
  cardX: 570,
});
const ROUND_ENTER_DISTANCE = 1400;
const RESULT_STORAGE_KEY = "rebut.sentence-order.result.v1";
const RESULT_PAGE_URL = "result.html";
const ASSET = "assets/";

const CARD_ASSETS = Object.freeze({
  shadow: "game-vector-174-shadow-only-v1.svg",
  idle: Object.freeze({
    front: "game-card-front-light.svg",
    bottom: "game-card-bottom-light.svg",
    side: "game-card-side-light.svg",
    texture: "game-card-outline-light.png",
  }),
  dark: Object.freeze({
    front: "game-card-front-dark.svg",
    bottom: "game-card-bottom-dark.svg",
    side: "game-card-side-dark.svg",
    texture: "game-card-outline-dark.png",
  }),
});

document.documentElement.style.setProperty("--feedback-fill-duration", `${TIMINGS.FEEDBACK_FILL_MS}ms`);
document.documentElement.style.setProperty("--reorder-duration", `${TIMINGS.REORDER_MS}ms`);
document.documentElement.style.setProperty("--round-enter-duration", `${TIMINGS.ROUND_ENTER_MS}ms`);
document.documentElement.style.setProperty("--round-enter-stagger", `${TIMINGS.ROUND_ENTER_STAGGER_MS}ms`);
document.documentElement.style.setProperty("--round-enter-distance", `${ROUND_ENTER_DISTANCE}px`);
document.documentElement.style.setProperty("--wrong-shake-duration", `${TIMINGS.WRONG_SHAKE_MS}ms`);
document.documentElement.style.setProperty("--correct-wave-duration", `${TIMINGS.CORRECT_WAVE_MS}ms`);
document.documentElement.style.setProperty(
  "--logo-wave-letter-duration",
  `${TIMINGS.LOGO_WAVE_LETTER_MS}ms`,
);
document.documentElement.style.setProperty("--level-fade-in", `${TIMINGS.LEVEL_FADE_IN_MS}ms`);
document.documentElement.style.setProperty("--level-fade-out", `${TIMINGS.LEVEL_FADE_OUT_MS}ms`);

const stage = document.querySelector("#game-stage");
const board = document.querySelector("#order-board");
const spine = document.querySelector("#order-spine");
const cardStack = document.querySelector("#game-card-stack");
const assembleButton = document.querySelector("#assemble-button");
const levelNumber = document.querySelector("#level-number");
const roundNumber = document.querySelector("#round-number");
const helpButton = document.querySelector("#help-button");
const restartControl = document.querySelector("#restart-control");
const backControl = document.querySelector("#back-control");
const tutorialOverlay = document.querySelector("#tutorial-overlay");
const tutorialCardStack = document.querySelector("#tutorial-card-stack");
const tutorialCursor = document.querySelector("#tutorial-cursor");
const tutorialCursorImage = document.querySelector("#tutorial-cursor-image");
const tutorialStartButton = document.querySelector("#tutorial-start");
const status = document.querySelector("#game-status");
const gameLogo = document.querySelector(".game-logo");
const gameLogoLetters = [...gameLogo.querySelectorAll("img")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

gameLogoLetters.forEach((letter, index) => {
  letter.style.setProperty(
    "--logo-wave-delay",
    `${index * TIMINGS.LOGO_WAVE_STAGGER_MS}ms`,
  );
});

const state = {
  level: 1,
  round: 1,
  phase: "idle",
  wrongAttempts: 0,
  totalWrongAttempts: 0,
  firstAttemptCorrectRounds: 0,
  reactionStartedAt: null,
  reactionTimesMs: [],
  order: [],
  runId: 0,
  completed: false,
};

const cardsById = new Map();
const tutorialCardsById = new Map();
const tutorialSlotById = new Map();
const tutorialActiveAnimations = new Set();
let sceneScale = 1;
let verticalExtra = 0;
let activeDrag = null;
let tutorialLoopToken = 0;
let tutorialClosing = false;
let initialGameStarted = false;
let tutorialCursorPoint = TUTORIAL_CURSOR_POINTS.home;
let tutorialCursorOffset = { x: 0, y: 0 };

function delay(milliseconds) {
  const duration = prefersReducedMotion.matches ? Math.min(milliseconds, 40) : milliseconds;
  return new Promise((resolve) => (window.RebutGameClock || window).setTimeout(resolve, duration));
}

function currentPuzzle() {
  return GAME_DATA[state.level][state.round - 1];
}

function currentLevelSettings() {
  return GAME_SETTINGS.LEVELS[state.level];
}

function validateGameData() {
  for (let level = 1; level <= GAME_SETTINGS.TOTAL_LEVELS; level += 1) {
    const rounds = GAME_DATA[level];
    if (!rounds || rounds.length !== GAME_SETTINGS.ROUNDS_PER_LEVEL) {
      throw new Error(`${level}단계 라운드 수가 설정과 다릅니다.`);
    }

    rounds.forEach((puzzle) => {
      const ids = puzzle.sentences.map((sentence) => sentence.id);
      const idSet = new Set(ids);
      const sameMembers = (order) => order.length === ids.length && order.every((id) => idSet.has(id));
      if (
        ids.length !== GAME_SETTINGS.LEVELS[level].sentenceCount ||
        idSet.size !== ids.length ||
        !sameMembers(puzzle.correctOrder) ||
        !sameMembers(puzzle.mixedOrder)
      ) {
        throw new Error(`${level}단계 문장 데이터와 순서 상수가 어긋났습니다.`);
      }
    });
  }
}

function updateProgress() {
  levelNumber.src = `${ASSET}round-digit-${state.level}.png`;
  levelNumber.alt = String(state.level);
  roundNumber.src = `${ASSET}round-digit-${state.round}.png`;
  roundNumber.alt = String(state.round);
  levelNumber.parentElement.setAttribute("aria-label", `현재 진행 ${state.level}-${state.round}`);
}

function setBoardLocked(locked) {
  board.classList.toggle("is-locked", locked);
  assembleButton.disabled = locked;
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

function createSideLayer(variant) {
  const side = document.createElement("span");
  side.className = `game-card__side game-card__state-layer game-card__state-layer--${variant}`;
  side.setAttribute("aria-hidden", "true");
  side.append(createImage("", CARD_ASSETS[variant].side));
  return side;
}

function createCard(sentence) {
  const card = document.createElement("button");
  card.className = "game-card";
  card.type = "button";
  card.dataset.cardId = sentence.id;
  card.setAttribute("aria-label", `${sentence.text} 문장 카드`);

  const shadow = createImage("game-card__shadow", CARD_ASSETS.shadow);
  const visual = document.createElement("span");
  visual.className = "game-card__visual";
  visual.setAttribute("aria-hidden", "true");

  ["idle", "dark"].forEach((variant) => {
    const stateClass = `game-card__state-layer game-card__state-layer--${variant}`;
    visual.append(
      createImage(`game-card__front ${stateClass}`, CARD_ASSETS[variant].front),
      createImage(`game-card__bottom ${stateClass}`, CARD_ASSETS[variant].bottom),
      createSideLayer(variant),
    );
  });

  const label = document.createElement("span");
  label.className = "game-card__label";
  label.textContent = sentence.text;
  visual.append(label);

  ["idle", "dark"].forEach((variant) => {
    visual.append(
      createImage(
        `game-card__texture game-card__state-layer game-card__state-layer--${variant}`,
        CARD_ASSETS[variant].texture,
      ),
    );
  });

  card.append(shadow, visual);
  card.addEventListener("pointerdown", beginDrag);
  card.addEventListener("pointermove", continueDrag);
  card.addEventListener("pointerup", finishDrag);
  card.addEventListener("pointercancel", finishDrag);
  card.addEventListener("keydown", moveCardWithKeyboard);
  cardsById.set(sentence.id, card);
  return card;
}

function createTutorialCard(sentence) {
  const card = document.createElement("article");
  card.className = "game-card tutorial-order-card";
  card.dataset.cardId = sentence.id;
  card.setAttribute("aria-label", sentence.text);

  const shadow = createImage("game-card__shadow", CARD_ASSETS.shadow);
  const visual = document.createElement("span");
  visual.className = "game-card__visual";
  visual.setAttribute("aria-hidden", "true");

  ["idle", "dark"].forEach((variant) => {
    const stateClass = `game-card__state-layer game-card__state-layer--${variant}`;
    visual.append(
      createImage(`game-card__front ${stateClass}`, CARD_ASSETS[variant].front),
      createImage(`game-card__bottom ${stateClass}`, CARD_ASSETS[variant].bottom),
      createSideLayer(variant),
    );
  });

  const label = document.createElement("span");
  label.className = "game-card__label";
  label.textContent = sentence.text;
  visual.append(label);

  ["idle", "dark"].forEach((variant) => {
    visual.append(
      createImage(
        `game-card__texture game-card__state-layer game-card__state-layer--${variant}`,
        CARD_ASSETS[variant].texture,
      ),
    );
  });

  card.append(shadow, visual);
  tutorialCardsById.set(sentence.id, card);
  return card;
}

function renderTutorialCards() {
  tutorialCardsById.clear();
  const fragment = document.createDocumentFragment();
  TUTORIAL_GAME.sentences.forEach((sentence) => fragment.append(createTutorialCard(sentence)));
  tutorialCardStack.replaceChildren(fragment);
}

function tutorialSlotY(slot) {
  return slot * TUTORIAL_SLOT_STEP;
}

function tutorialCardTransform(slot, { lift = 0, scale = 1 } = {}) {
  return `translate3d(0, ${tutorialSlotY(slot) - lift}px, 0) scale(${scale})`;
}

function setTutorialCardSlot(card, slot, options) {
  tutorialSlotById.set(card.dataset.cardId, slot);
  card.style.setProperty("--slot-y", `${tutorialSlotY(slot)}px`);
  card.style.transform = tutorialCardTransform(slot, options);
}

function tutorialPointForSlot(slot) {
  return Object.freeze({
    x: TUTORIAL_CURSOR_POINTS.cardX,
    y: TUTORIAL_CARD_STACK_TOP + tutorialSlotY(slot) + TUTORIAL_CARD_HEIGHT / 2,
  });
}

function tutorialSleep(milliseconds, token) {
  return new Promise((resolve) => {
    (window.RebutGameClock || window).setTimeout(() => resolve(token === tutorialLoopToken), milliseconds);
  });
}

function tutorialTrackAnimation(animation) {
  tutorialActiveAnimations.add(animation);
  animation.finished
    .catch(() => undefined)
    .finally(() => tutorialActiveAnimations.delete(animation));
  return animation;
}

async function tutorialAnimationFinished(animation, token) {
  try {
    await animation.finished;
    return token === tutorialLoopToken;
  } catch (_error) {
    return false;
  }
}

function cancelTutorialAnimations() {
  tutorialActiveAnimations.forEach((animation) => animation.cancel());
  tutorialActiveAnimations.clear();
}

function tutorialCursorTransform(offset = tutorialCursorOffset) {
  return `translate3d(${offset.x}px, ${offset.y}px, 0)`;
}

async function moveTutorialCursorTo(point, duration, token, easing = "ease-in-out") {
  const target = {
    x: point.x - TUTORIAL_CURSOR_POINTS.home.x,
    y: point.y - TUTORIAL_CURSOR_POINTS.home.y,
  };
  const animation = tutorialTrackAnimation(
    tutorialCursor.animate(
      [
        { transform: tutorialCursorTransform() },
        { transform: tutorialCursorTransform(target) },
      ],
      { duration, easing, fill: "forwards" },
    ),
  );

  if (!(await tutorialAnimationFinished(animation, token))) return false;
  tutorialCursorPoint = point;
  tutorialCursorOffset = target;
  tutorialCursor.style.transform = tutorialCursorTransform();
  animation.cancel();
  return true;
}

async function pickTutorialCard(card, token) {
  const slot = tutorialSlotById.get(card.dataset.cardId);
  card.classList.add("is-dragging");
  card.style.zIndex = "8";

  const cardAnimation = tutorialTrackAnimation(
    card.animate(
      [
        { transform: tutorialCardTransform(slot, { scale: .96 }) },
        { transform: tutorialCardTransform(slot, { lift: TUTORIAL_CARD_LIFT }) },
      ],
      {
        duration: TIMINGS.TUTORIAL_PICK_MS,
        easing: "cubic-bezier(.2, .8, .2, 1)",
        fill: "forwards",
      },
    ),
  );
  const cursorAnimation = tutorialTrackAnimation(
    tutorialCursorImage.animate(
      [
        { transform: "translate3d(0, 0, 0) scale(1)" },
        { transform: "translate3d(2px, 2px, 0) scale(.82)" },
      ],
      {
        duration: TIMINGS.TUTORIAL_PICK_MS,
        easing: "cubic-bezier(.2, .8, .2, 1)",
        fill: "forwards",
      },
    ),
  );

  const done = await Promise.all([
    tutorialAnimationFinished(cardAnimation, token),
    tutorialAnimationFinished(cursorAnimation, token),
  ]);
  if (done.some((value) => !value)) return false;

  card.style.transform = tutorialCardTransform(slot, { lift: TUTORIAL_CARD_LIFT });
  tutorialCursorImage.style.transform = "translate3d(2px, 2px, 0) scale(.82)";
  cardAnimation.cancel();
  cursorAnimation.cancel();
  return true;
}

async function releaseTutorialCard(card, token) {
  const slot = tutorialSlotById.get(card.dataset.cardId);
  const cardAnimation = tutorialTrackAnimation(
    card.animate(
      [
        { transform: tutorialCardTransform(slot, { lift: TUTORIAL_CARD_LIFT }) },
        { transform: tutorialCardTransform(slot) },
      ],
      { duration: TIMINGS.TUTORIAL_RELEASE_MS, easing: "ease-out", fill: "forwards" },
    ),
  );
  const cursorAnimation = tutorialTrackAnimation(
    tutorialCursorImage.animate(
      [
        { transform: "translate3d(2px, 2px, 0) scale(.82)" },
        { transform: "translate3d(0, 0, 0) scale(1.05)" },
        { transform: "translate3d(0, 0, 0) scale(1)" },
      ],
      { duration: TIMINGS.TUTORIAL_RELEASE_MS, easing: "ease-out", fill: "forwards" },
    ),
  );

  const done = await Promise.all([
    tutorialAnimationFinished(cardAnimation, token),
    tutorialAnimationFinished(cursorAnimation, token),
  ]);
  if (done.some((value) => !value)) return false;

  card.style.transform = tutorialCardTransform(slot);
  tutorialCursorImage.style.transform = "translate3d(0, 0, 0) scale(1)";
  cardAnimation.cancel();
  cursorAnimation.cancel();
  card.classList.remove("is-dragging");
  card.style.zIndex = "2";
  return true;
}

async function dragAndSwapTutorialCard(cardId, targetId, token) {
  const card = tutorialCardsById.get(cardId);
  const targetCard = tutorialCardsById.get(targetId);
  const sourceSlot = tutorialSlotById.get(cardId);
  const targetSlot = tutorialSlotById.get(targetId);

  const cardAnimation = tutorialTrackAnimation(
    card.animate(
      [
        { transform: tutorialCardTransform(sourceSlot, { lift: TUTORIAL_CARD_LIFT }) },
        { transform: tutorialCardTransform(targetSlot, { lift: TUTORIAL_CARD_LIFT }) },
      ],
      {
        duration: TIMINGS.TUTORIAL_DRAG_MS,
        easing: "ease-in-out",
        fill: "forwards",
      },
    ),
  );
  const swapAnimation = tutorialTrackAnimation(
    targetCard.animate(
      [
        { transform: tutorialCardTransform(targetSlot) },
        { transform: tutorialCardTransform(sourceSlot) },
      ],
      {
        duration: TIMINGS.TUTORIAL_SWAP_MS,
        delay: TIMINGS.TUTORIAL_DRAG_MS - TIMINGS.TUTORIAL_SWAP_MS,
        easing: "ease-in-out",
        fill: "both",
      },
    ),
  );

  const done = await Promise.all([
    tutorialAnimationFinished(cardAnimation, token),
    tutorialAnimationFinished(swapAnimation, token),
    moveTutorialCursorTo(tutorialPointForSlot(targetSlot), TIMINGS.TUTORIAL_DRAG_MS, token),
  ]);
  if (done.some((value) => !value)) return false;

  setTutorialCardSlot(targetCard, sourceSlot);
  setTutorialCardSlot(card, targetSlot, { lift: TUTORIAL_CARD_LIFT });
  cardAnimation.cancel();
  swapAnimation.cancel();
  return releaseTutorialCard(card, token);
}

function currentTutorialOrder() {
  return [...tutorialSlotById.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
}

function isTutorialOrderCorrect() {
  return currentTutorialOrder().every(
    (id, index) => id === TUTORIAL_GAME.correctOrder[index],
  );
}

async function playTutorialCorrectFeedback(token) {
  const cards = TUTORIAL_GAME.correctOrder.map((id) => tutorialCardsById.get(id));
  cards.forEach((card) => card.classList.add("is-correct"));
  if (!(await tutorialSleep(TIMINGS.TUTORIAL_FEEDBACK_FILL_MS, token))) return false;

  cards.forEach((card, index) => {
    card.style.setProperty(
      "--correct-wave-delay",
      `${index * TIMINGS.TUTORIAL_CORRECT_STAGGER_MS}ms`,
    );
    card.classList.add("is-correct-wave");
  });

  return tutorialSleep(
    TIMINGS.TUTORIAL_CORRECT_WAVE_MS +
      (cards.length - 1) * TIMINGS.TUTORIAL_CORRECT_STAGGER_MS,
    token,
  );
}

function resetTutorialScene({ immediate = false } = {}) {
  cancelTutorialAnimations();
  if (immediate) tutorialOverlay.classList.add("is-resetting");

  TUTORIAL_GAME.mixedOrder.forEach((id, slot) => {
    const card = tutorialCardsById.get(id);
    card.classList.remove("is-correct", "is-correct-wave", "is-dragging");
    card.style.removeProperty("--correct-wave-delay");
    card.style.zIndex = "2";
    setTutorialCardSlot(card, slot);
  });

  tutorialCursorPoint = TUTORIAL_CURSOR_POINTS.home;
  tutorialCursorOffset = { x: 0, y: 0 };
  tutorialCursor.style.transform = tutorialCursorTransform();
  tutorialCursorImage.style.transform = "translate3d(0, 0, 0) scale(1)";

  if (immediate) {
    (window.RebutGameClock || globalThis).requestAnimationFrame(() => {
      (window.RebutGameClock || globalThis).requestAnimationFrame(() => tutorialOverlay.classList.remove("is-resetting"));
    });
  }
}

async function playTutorialLoop() {
  const token = ++tutorialLoopToken;
  resetTutorialScene({ immediate: true });

  while (token === tutorialLoopToken && !prefersReducedMotion.matches) {
    if (!(await tutorialSleep(TIMINGS.TUTORIAL_PRESENTATION_HOLD_MS, token))) return;

    for (const move of TUTORIAL_GAME.moves) {
      const cardSlot = tutorialSlotById.get(move.cardId);
      if (
        !(await moveTutorialCursorTo(
          tutorialPointForSlot(cardSlot),
          TIMINGS.TUTORIAL_CURSOR_MOVE_MS,
          token,
        ))
      ) return;
      if (!(await pickTutorialCard(tutorialCardsById.get(move.cardId), token))) return;
      if (!(await dragAndSwapTutorialCard(move.cardId, move.targetId, token))) return;
      if (!(await tutorialSleep(TIMINGS.TUTORIAL_BETWEEN_MOVES_MS, token))) return;
    }

    if (!isTutorialOrderCorrect()) {
      throw new Error("튜토리얼 이동 시퀀스가 정답 순서와 어긋났습니다.");
    }
    if (!(await playTutorialCorrectFeedback(token))) return;
    if (!(await tutorialSleep(TIMINGS.TUTORIAL_COMPLETE_HOLD_MS, token))) return;
    if (
      !(await moveTutorialCursorTo(
        TUTORIAL_CURSOR_POINTS.home,
        TIMINGS.TUTORIAL_CURSOR_RESET_MS,
        token,
      ))
    ) return;

    resetTutorialScene();
    if (!(await tutorialSleep(TIMINGS.TUTORIAL_SCENE_RESET_MS, token))) return;
  }
}

function stopTutorialLoop() {
  tutorialLoopToken += 1;
  cancelTutorialAnimations();
}

function handleTutorialMotionPreference() {
  if (tutorialOverlay.hidden || tutorialClosing) return;
  stopTutorialLoop();
  resetTutorialScene({ immediate: true });
  if (!prefersReducedMotion.matches) void playTutorialLoop();
}

async function closeTutorial() {
  if (tutorialClosing) return;
  tutorialClosing = true;
  tutorialStartButton.disabled = true;
  stopTutorialLoop();
  tutorialOverlay.classList.add("is-closing");
  await delay(TIMINGS.TUTORIAL_POPUP_FADE_OUT_MS);
  tutorialOverlay.hidden = true;
  tutorialOverlay.setAttribute("aria-hidden", "true");
  await beginInitialGame();
}

function applyLevelLayout() {
  const level = currentLevelSettings();
  board.dataset.level = String(state.level);
  board.style.setProperty("--board-top", `${level.boardTop}px`);
  board.style.setProperty("--board-height", `${level.boardHeight}px`);
  board.style.setProperty("--stack-top", `${level.stackTop}px`);
  board.style.setProperty("--stack-height", `${level.stackHeight}px`);
  board.style.setProperty("--spine-top", `${level.spineTop}px`);
  board.style.setProperty("--spine-left", `${level.spineLeft}px`);
  board.style.setProperty("--spine-width", `${level.spineWidth}px`);
  board.style.setProperty("--spine-height", `${level.spineHeight}px`);
  spine.src = `${ASSET}${level.spine}`;
}

function updateCardPositions(exceptId = "") {
  state.order.forEach((id, index) => {
    const card = cardsById.get(id);
    card.dataset.slot = String(index);
    card.style.setProperty("--slot-y", `${index * SLOT_STEP}px`);
    card.style.setProperty("--round-enter-index", String(index));
    if (id !== exceptId) card.style.removeProperty("transform");
  });
}

function resetCardStates() {
  cardStack.classList.remove("is-shaking");
  gameLogo.classList.remove("is-waving");
  cardsById.forEach((card) => {
    card.classList.remove("is-dragging", "is-correct", "is-correct-wave");
    card.style.removeProperty("--correct-wave-delay");
    card.style.removeProperty("transform");
    card.style.removeProperty("transition");
    card.style.removeProperty("z-index");
  });
}

function renderRound({
  keepWrongAttempts = false,
  startReaction = true,
  prepareEntrance = false,
} = {}) {
  state.runId += 1;
  activeDrag = null;
  if (!keepWrongAttempts) state.wrongAttempts = 0;
  state.phase = "playing";
  state.order = [...currentPuzzle().mixedOrder];
  state.reactionStartedAt = startReaction ? (window.RebutGameClock?.now() ?? performance.now()) : null;
  state.completed = false;
  board.classList.remove("is-round-entering", "is-round-enter-pending");
  if (prepareEntrance) board.classList.add("is-round-enter-pending");
  cardsById.clear();
  cardStack.replaceChildren();
  applyLevelLayout();

  const fragment = document.createDocumentFragment();
  currentPuzzle().sentences.forEach((sentence) => fragment.append(createCard(sentence)));
  cardStack.append(fragment);
  updateCardPositions();
  resetCardStates();
  updateProgress();
  setBoardLocked(false);
  fitStageToViewport();
  status.textContent = `${state.level}단계 ${state.round}라운드 문장을 순서대로 놓으세요.`;
}

async function playRoundEntrance(runId) {
  state.phase = "round-transition";
  state.reactionStartedAt = null;
  setBoardLocked(true);
  board.classList.remove("is-round-entering");
  board.classList.add("is-round-enter-pending");
  void board.offsetWidth;
  board.classList.remove("is-round-enter-pending");
  board.classList.add("is-round-entering");
  status.textContent = `${state.level}단계 ${state.round}라운드가 들어옵니다.`;

  await delay(
    TIMINGS.ROUND_ENTER_MS +
      (state.order.length - 1) * TIMINGS.ROUND_ENTER_STAGGER_MS,
  );
  if (runId !== state.runId || state.completed) return;
  board.classList.remove("is-round-entering", "is-round-enter-pending");
  state.phase = "playing";
  state.reactionStartedAt = (window.RebutGameClock?.now() ?? performance.now());
  setBoardLocked(false);
  status.textContent = `${state.level}단계 ${state.round}라운드 문장을 순서대로 놓으세요.`;
}

function stageDelta(clientDelta) {
  return clientDelta / sceneScale;
}

function cardTransform(y) {
  return `translate3d(0, ${y}px, 0)`;
}

function beginDrag(event) {
  if (state.phase !== "playing" || activeDrag) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  const card = event.currentTarget;
  const id = card.dataset.cardId;
  const startIndex = state.order.indexOf(id);
  const startY = startIndex * SLOT_STEP;
  activeDrag = {
    card,
    id,
    pointerId: event.pointerId,
    startClientY: event.clientY,
    startY,
    currentY: startY,
    currentIndex: startIndex,
  };
  card.setPointerCapture(event.pointerId);
  card.classList.add("is-dragging");
  card.style.transform = cardTransform(startY - DRAG_LIFT);
}

function continueDrag(event) {
  if (!activeDrag || activeDrag.pointerId !== event.pointerId || activeDrag.card !== event.currentTarget) return;
  event.preventDefault();
  const lastIndex = state.order.length - 1;
  const rawY = activeDrag.startY + stageDelta(event.clientY - activeDrag.startClientY);
  const currentY = Math.max(0, Math.min(lastIndex * SLOT_STEP, rawY));
  const targetIndex = Math.max(0, Math.min(lastIndex, Math.round(currentY / SLOT_STEP)));
  activeDrag.currentY = currentY;
  activeDrag.card.style.transform = cardTransform(currentY - DRAG_LIFT);

  if (targetIndex === activeDrag.currentIndex) return;
  const previousIndex = state.order.indexOf(activeDrag.id);
  state.order.splice(previousIndex, 1);
  state.order.splice(targetIndex, 0, activeDrag.id);
  activeDrag.currentIndex = targetIndex;
  updateCardPositions(activeDrag.id);
}

async function settleDraggedCard(drag) {
  const targetIndex = state.order.indexOf(drag.id);
  const targetY = targetIndex * SLOT_STEP;
  drag.card.style.setProperty("--slot-y", `${targetY}px`);
  drag.card.style.transition = `transform ${TIMINGS.REORDER_MS}ms ease-in-out`;
  drag.card.classList.remove("is-dragging");
  void drag.card.offsetWidth;
  drag.card.style.transform = cardTransform(targetY);
  await delay(TIMINGS.REORDER_MS);
  drag.card.style.transition = "none";
  drag.card.style.removeProperty("transform");
  void drag.card.offsetWidth;
  drag.card.style.removeProperty("transition");
}

function finishDrag(event) {
  if (!activeDrag || activeDrag.pointerId !== event.pointerId || activeDrag.card !== event.currentTarget) return;
  event.preventDefault();
  const drag = activeDrag;
  activeDrag = null;
  if (drag.card.hasPointerCapture(event.pointerId)) drag.card.releasePointerCapture(event.pointerId);
  void settleDraggedCard(drag);
}

function moveCardWithKeyboard(event) {
  if (state.phase !== "playing") return;
  const direction = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
  if (!direction) return;
  event.preventDefault();
  const id = event.currentTarget.dataset.cardId;
  const index = state.order.indexOf(id);
  const target = Math.max(0, Math.min(state.order.length - 1, index + direction));
  if (target === index) return;
  state.order.splice(index, 1);
  state.order.splice(target, 0, id);
  updateCardPositions();
}

function isCorrectOrder() {
  return state.order.every((id, index) => id === currentPuzzle().correctOrder[index]);
}

async function revealCorrectOrder(runId) {
  state.order = [...currentPuzzle().correctOrder];
  updateCardPositions();
  await delay(TIMINGS.REORDER_MS);
  return runId === state.runId;
}

async function playCorrectLogoWave() {
  gameLogo.classList.remove("is-waving");
  void gameLogo.offsetWidth;
  gameLogo.classList.add("is-waving");
  await delay(TIMINGS.CORRECT_LOGO_WAVE_MS);
  gameLogo.classList.remove("is-waving");
}

async function playCorrectFeedback(runId, autoReveal = false) {
  state.phase = "feedback";
  setBoardLocked(true);
  if (typeof state.reactionStartedAt === "number") {
    state.reactionTimesMs.push(Math.max(0, (window.RebutGameClock?.now() ?? performance.now()) - state.reactionStartedAt));
    state.reactionStartedAt = null;
  }
  if (autoReveal && !(await revealCorrectOrder(runId))) return;

  const cards = currentPuzzle().correctOrder.map((id) => cardsById.get(id));
  cards.forEach((card) => card.classList.add("is-correct"));
  await delay(TIMINGS.FEEDBACK_FILL_MS);
  if (runId !== state.runId) return;

  cards.forEach((card, index) => {
    card.style.setProperty("--correct-wave-delay", `${index * TIMINGS.CORRECT_STAGGER_MS}ms`);
    card.classList.add("is-correct-wave");
  });
  const logoWave = playCorrectLogoWave();
  status.textContent = autoReveal ? "정답 순서를 표시합니다." : "정답입니다.";
  await Promise.all([
    logoWave,
    delay(
      TIMINGS.CORRECT_WAVE_MS +
        (cards.length - 1) * TIMINGS.CORRECT_STAGGER_MS +
        TIMINGS.CORRECT_HOLD_MS,
    ),
  ]);
  if (runId !== state.runId) return;
  cards.forEach((card) => card.classList.remove("is-correct-wave"));
  await advanceRound();
}

async function judgeOrder() {
  if (state.phase !== "playing" || activeDrag) return;
  const runId = state.runId;
  setBoardLocked(true);

  if (isCorrectOrder()) {
    if (state.wrongAttempts === 0) state.firstAttemptCorrectRounds += 1;
    await playCorrectFeedback(runId, false);
    return;
  }

  state.phase = "wrong";
  state.wrongAttempts += 1;
  state.totalWrongAttempts += 1;
  cardStack.classList.remove("is-shaking");
  void cardStack.offsetWidth;
  cardStack.classList.add("is-shaking");
  status.textContent = "문장 순서가 맞지 않습니다.";
  await delay(TIMINGS.WRONG_SHAKE_MS);
  if (runId !== state.runId) return;
  cardStack.classList.remove("is-shaking");

  if (state.wrongAttempts >= GAME_SETTINGS.MAX_WRONG_ATTEMPTS) {
    await delay(TIMINGS.WRONG_PAUSE_MS);
    if (runId !== state.runId) return;
    await playCorrectFeedback(runId, true);
    return;
  }

  state.phase = "playing";
  setBoardLocked(false);
  status.textContent = "같은 라운드에서 문장 순서를 다시 맞춰 보세요.";
}

async function advanceRound() {
  if (state.round < GAME_SETTINGS.ROUNDS_PER_LEVEL) {
    state.round += 1;
    renderRound({ startReaction: false, prepareEntrance: true });
    await playRoundEntrance(state.runId);
    return;
  }

  if (state.level < GAME_SETTINGS.TOTAL_LEVELS) {
    state.level += 1;
    state.round = 1;
    renderRound({ startReaction: false, prepareEntrance: true });
    setBoardLocked(true);
    await showLevelTransition(state.level);
    await playRoundEntrance(state.runId);
    return;
  }

  finishGame();
}

function finishGame() {
  state.completed = true;
  state.phase = "complete";
  setBoardLocked(true);
  status.textContent = "모든 단계와 라운드를 완료했습니다.";
  try {
    sessionStorage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        completedAt: new Date().toISOString(),
        completedRounds: GAME_SETTINGS.TOTAL_LEVELS * GAME_SETTINGS.ROUNDS_PER_LEVEL,
        firstAttemptCorrectRounds: state.firstAttemptCorrectRounds,
        reactionTimesMs: state.reactionTimesMs.slice(),
        retryCount: state.totalWrongAttempts,
      }),
    );
  } catch (_error) {
    // 저장소 사용이 막혀도 결과 화면은 기본값으로 열립니다.
  }
  window.location.href = RESULT_PAGE_URL;
}

function restartCurrentRound() {
  if (state.completed || state.phase === "level-transition") return;
  renderRound({ keepWrongAttempts: true });
  status.textContent = "이번 라운드를 처음 섞인 순서로 다시 보여드립니다.";
}




async function showLevelTransition(level) {
  state.phase = "level-transition";
  await window.RebutStepTransition.show(level);
}

function fitStageToViewport() {
  sceneScale = Math.min(window.innerWidth / STAGE_SIZE.width, window.innerHeight / STAGE_SIZE.height);
  verticalExtra = Math.max(0, window.innerHeight / sceneScale - STAGE_SIZE.height);
  stage.style.setProperty("--game-scale", String(sceneScale));
  stage.style.height = `${STAGE_SIZE.height + verticalExtra}px`;
  stage.style.setProperty("--tutorial-popup-shift", `${verticalExtra * .5}px`);

  const anchors = [
    { selector: ".info-popover", y: 220 },
    { selector: ".order-board", y: currentLevelSettings().boardTop },
    { selector: ".assemble-button", y: 910 },
    { selector: ".back-control", y: 977.87 },
  ];

  anchors.forEach(({ selector, y }) => {
    document.querySelectorAll(selector).forEach((element) => {
      const progress = Math.min(1, Math.max(0, (y - TOP_FIXED_END_Y) / (STAGE_SIZE.height - TOP_FIXED_END_Y)));
      element.style.setProperty("--responsive-y", `${verticalExtra * progress}px`);
    });
  });
}

assembleButton.addEventListener("click", () => { void judgeOrder(); });
helpButton.addEventListener("click", () => { window.RebutBookTutorial.open(); });
restartControl.addEventListener("click", restartCurrentRound);
backControl.addEventListener("click", () => { window.location.href = "../../?rehab=language"; });
tutorialStartButton.addEventListener("click", () => { void closeTutorial(); });
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") restartCurrentRound();
});
window.addEventListener("resize", fitStageToViewport, { passive: true });
prefersReducedMotion.addEventListener("change", handleTutorialMotionPreference);

async function beginInitialGame() {
  if (initialGameStarted || state.completed) return;
  initialGameStarted = true;
  await showLevelTransition(1);
  if (!state.completed) await playRoundEntrance(state.runId);
}

async function startGame() {
  validateGameData();
  try {
    if (new URLSearchParams(window.location.search).get("book-tutorial") !== "1") {
      sessionStorage.removeItem(RESULT_STORAGE_KEY);
    }
  } catch (_error) {
    // 저장소 사용 여부와 관계없이 게임은 시작합니다.
  }
  updateProgress();
  applyLevelLayout();
  fitStageToViewport();
  renderRound({ startReaction: false, prepareEntrance: true });
  setBoardLocked(true);
  renderTutorialCards();
  resetTutorialScene({ immediate: true });

  if (!SHOW_TUTORIAL) {
    tutorialOverlay.hidden = true;
    tutorialOverlay.setAttribute("aria-hidden", "true");
    await beginInitialGame();
    return;
  }

  tutorialOverlay.hidden = false;
  tutorialOverlay.setAttribute("aria-hidden", "false");
  handleTutorialMotionPreference();
}

window.addEventListener("load", () => { void startGame(); });
