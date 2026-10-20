"use strict";

const KEYWORD_PROGRESS_ASSET = "../keyword-restore/assets/round-digit-";

// 모든 재생 시간은 이 객체에서만 조정합니다. 단위: ms
const TIMING = Object.freeze({
  POPUP_FADE_OUT: 300,
  BUTTON_PRESS: 100,
  STAMP_DROP: 250,
  IMPACT_SHAKE: 100,
  MARK_FADE: 300,
  STAMP_HOLD: 300,
  STAMP_RISE: 250,
  MARK_HOLD: 350,
  REPORT_EXIT: 450,
  ROUND_SETTLE: 100,
  WRONG_SHAKE: 420,
  WRONG_ANSWER_PAUSE: 180,
  CORRECT_LOGO_WAVE: 1000,
  LOGO_WAVE_LETTER: 660,
  LOGO_WAVE_STAGGER: 85,
  HELP_VISIBLE: 5000,
  TUTORIAL_PRESENT: 1500,
  TUTORIAL_CURSOR_MOVE: 500,
  TUTORIAL_MARK_HOLD: 1000,
  TUTORIAL_LOOP_PAUSE: 1000,
  TUTORIAL_CURSOR_RESET: 250,
  TUTORIAL_RESET_SETTLE: 80,
  TUTORIAL_PAGE_SWITCH: 220,
  TUTORIAL_IPAD_PRESENT: 600,
  TUTORIAL_PENCIL_APPROACH: 650,
  TUTORIAL_HIGHLIGHT_LINE_ONE: 300,
  TUTORIAL_HIGHLIGHT_LINE_TWO: 650,
  TUTORIAL_HIGHLIGHT_LINE_THREE: 420,
  TUTORIAL_PENCIL_LINE_BREAK: 120,
  TUTORIAL_IPAD_HOLD: 1400,
  TUTORIAL_DESKTOP_PRESENT: 600,
  TUTORIAL_DESKTOP_CURSOR_MOVE: 500,
  TUTORIAL_DESKTOP_CHECK_REVEAL: 160,
  TUTORIAL_DESKTOP_HOLD: 1400,
  STAGE_ENTER: 820,
  LEVEL_BACKDROP_LEAD: 200,
  LEVEL_FADE_IN: 600,
  LEVEL_HOLD: 1200,
  LEVEL_FADE_OUT: 800,
  IPAD_PENCIL_APPROACH: 320,
  IPAD_PENCIL_LINE_BREAK: 100,
  IPAD_HIGHLIGHT_MIN: 220,
  IPAD_HIGHLIGHT_MAX: 680,
  IPAD_CORRECT_HOLD: 360,
  IPAD_ROUND_MOVE: 520,
  DESKTOP_CURSOR_CLICK: 100,
  DESKTOP_CHECK_REVEAL: 160,
  DESKTOP_CORRECT_HOLD: 360,
  DESKTOP_ROUND_MOVE: 520,
  DESKTOP_BAR_RISE: 700,
  DESKTOP_BAR_STAGGER: 70,
});

const DISPLAY = Object.freeze({
  width: 1920,
  height: 1080,
  dimColor: "0, 0, 0",
  dimOpacity: 0.36,
  popupTop: 103.5,
  popupVerticalProgress: 0.5,
  tutorialCursor: Object.freeze({
    rest: Object.freeze({ x: 522, y: 507 }),
    targets: Object.freeze({
      biased: Object.freeze({ x: 304, y: 493 }),
      normal: Object.freeze({ x: 388, y: 493 }),
    }),
  }),
});

const MARK_ASSETS = Object.freeze({
  biased: "./assets/stamp-mark.png",
  normal: "./assets/stamp-mark-normal.png",
});

const MARK_PRELOADS = new Map(
  Object.values(MARK_ASSETS).map((source) => {
    const image = new Image();
    image.decoding = "async";
    const ready = new Promise((resolve) => {
      const settle = async () => {
        if (typeof image.decode === "function") await image.decode().catch(() => undefined);
        resolve();
      };
      image.addEventListener("load", settle, { once: true });
      image.addEventListener("error", resolve, { once: true });
      image.src = source;
      if (image.complete) settle();
    });
    return [source, ready];
  }),
);

// 화면 구조와 애니메이션은 공유하고, 단계별 중앙 원고지 데이터만 교체합니다.
// gridRows가 없는 새 문장은 8칸씩 자동 배치됩니다.
const GAME_STAGES = Object.freeze({
  "1-1": Object.freeze({
    level: 1,
    stage: 1,
    rounds: Object.freeze([
      Object.freeze({
        sentence: "한 번 성공했으니 다음에도 무조건 잘 된다.",
        answer: "biased",
        layer: "front",
        gridRows: Object.freeze(["한번_성공했으니", "다음에도_무조건", "잘된다.____"]),
      }),
      Object.freeze({
        sentence: "그 사람은 안경을 썼으니 분명 똑똑할 것이다.",
        answer: "biased",
        layer: "middle",
        gridRows: Object.freeze(["그_사람은_안경", "을_썼으니_분명", "똑똑할_것이다."]),
      }),
      Object.freeze({
        sentence: "어제 날이 흐리더니 결국 오늘 비가 오고야 말았다.",
        answer: "normal",
        layer: "base",
        gridRows: Object.freeze(["어제_날이_흐리", "더니_결국_오늘", "비가_오고야_말", "았다._____"]),
      }),
    ]),
  }),
  "1-2": Object.freeze({
    level: 1,
    stage: 2,
    rounds: Object.freeze([
      Object.freeze({
        sentence: "나는 어제 도서관에서 책을 빌렸다.",
        answer: "normal",
        layer: "front",
        gridRows: Object.freeze(["나는_어제_도서", "관에서_책을_빌", "렸다._____"]),
      }),
      Object.freeze({
        sentence: "한 번 지각한 걸 보니 그는 항상 게으르다.",
        answer: "biased",
        layer: "middle",
        gridRows: Object.freeze(["한_번_지각한_", "걸_보니_그는_", "항상_게으르다."]),
      }),
      Object.freeze({
        sentence: "이 가게는 사람이 많으니 음식이 다 맛있을 것이다.",
        answer: "biased",
        layer: "base",
        gridRows: Object.freeze(["이_가게는_사람", "이_많으니_음식", "이_다_맛있을_", "것이다.____"]),
      }),
    ]),
  }),
  "1-3": Object.freeze({
    level: 1,
    stage: 3,
    rounds: Object.freeze([
      Object.freeze({
        sentence: "비싼 물건이니까 당연히 좋은 물건이다.",
        answer: "biased",
        layer: "front",
        gridRows: Object.freeze(["비싼_물건이니까", "당연히_좋은_물", "건이다.____"]),
      }),
      Object.freeze({
        sentence: "그 팀이 지난번에 이겼으니 이번에도 반드시 이긴다.",
        answer: "biased",
        layer: "middle",
        gridRows: Object.freeze(["그_팀이_지난번", "에_이겼으니_이", "번에도_반드시_", "이긴다.____"]),
      }),
      Object.freeze({
        sentence: "창문을 열자 시원한 바람이 들어왔다.",
        answer: "normal",
        layer: "base",
        gridRows: Object.freeze(["창문을_열자_시", "원한_바람이_들", "어왔다.____"]),
      }),
    ]),
  }),
});

const NEXT_GAME_STAGE = Object.freeze({
  "1-1": "1-2",
  "1-2": "1-3",
});

// 2단계는 같은 아이패드 화면을 공유하고 문장 데이터와 정답 위치만 교체합니다.
const IPAD_STAGES = Object.freeze({
  "2-1": Object.freeze({
    level: 2,
    stage: 1,
    sentences: Object.freeze([
      "AI 판독 시스템을 들인 뒤로는 사람이 다시 들여다볼 이유가 사라졌다.",
      "한 병원이 AI 진단 보조 시스템을 도입해 영상 판독 시간을 크게 줄였다.",
      "초기 판독은 AI가 맡고 확진은 전문의가 내리는 방식으로 운영되었다.",
      "판독량이 늘어나면서 전문의의 최종 확인 절차도 함께 조정되었다.",
    ]),
    correctIndex: 0,
  }),
  "2-2": Object.freeze({
    level: 2,
    stage: 2,
    sentences: Object.freeze([
      "한 회사가 지원서를 선별하는 데 AI 채용 프로그램을 도입하기 시작했다.",
      "이 프로그램은 과거 합격자들의 이력을 학습해 지원자들을 평가했다.",
      "인사팀은 AI가 산출한 점수를 서류 심사의 참고 자료로 활용했다.",
      "AI가 방대한 데이터로 매긴 점수이니 사람의 판단보다 공정할 수밖에 없다.",
    ]),
    correctIndex: 3,
  }),
  "2-3": Object.freeze({
    level: 2,
    stage: 3,
    sentences: Object.freeze([
      "한 사람이 뉴스 앱의 자동 추천 기능만으로 세상 소식을 접하기 시작했다.",
      "추천 목록에 이렇게 많이 오르는 걸 보면 이게 가장 중요한 뉴스임이 분명하다.",
      "앱은 그가 오래 머물렀던 기사와 비슷한 내용을 주로 골라 보여주었다.",
      "그는 가끔 다른 매체의 기사도 일부러 찾아 읽어 보았다.",
    ]),
    correctIndex: 1,
  }),
});

const NEXT_IPAD_STAGE = Object.freeze({
  "2-1": "2-2",
  "2-2": "2-3",
});

// 3단계는 같은 데스크톱 프레임을 공유하며 차트와 문장 데이터만 교체합니다.
const DESKTOP_STAGES = Object.freeze({
  "3-1": Object.freeze({
    level: 3,
    stage: 1,
    title: "카페 월매출",
    note: "자료: 매장 자체 집계\n단위: 만원\n기간: 1월~4월\n비고: 4월 지역 축제 기간",
    labels: Object.freeze(["1월", "2월", "3월", "4월"]),
    values: Object.freeze(["800", "820", "810", "1500"]),
    bars: Object.freeze([
      Object.freeze({ x: 77, y: 445, width: 65, height: 48, valueX: 108.5, valueY: 411, asset: "./assets/desktop-bar-3-1-1.png" }),
      Object.freeze({ x: 199, y: 403, width: 65, height: 90, valueX: 230.5, valueY: 368, asset: "./assets/desktop-bar-3-1-2.png" }),
      Object.freeze({ x: 318, y: 425, width: 65, height: 68, valueX: 349.64, valueY: 391, asset: "./assets/desktop-bar-3-1-3.png" }),
      Object.freeze({ x: 438, y: 306, width: 66, height: 187, valueX: 469, valueY: 271, asset: "./assets/desktop-bar-3-1-4.png" }),
    ]),
    sentences: Object.freeze([
      "4개월 중 4월 매출이 가장 높았다.",
      "1~3월 매출은 큰 차이가 없었다.",
      "매출이 계속 오르니 5월엔 더 오를 것이다.",
      "4월 매출은 3월의 약 두 배였다.",
    ]),
    correctIndex: 2,
  }),
  "3-2": Object.freeze({
    level: 3,
    stage: 2,
    title: "앱 다운로드 수",
    note: "비고: 2주차 TV 광고 집행",
    labels: Object.freeze(["1주차", "2주차", "3주차", "4주차"]),
    values: Object.freeze(["1200", "3400", "1100", "900"]),
    bars: Object.freeze([
      Object.freeze({ x: 77, y: 354, width: 66, height: 139, valueX: 108.5, valueY: 319, asset: "./assets/desktop-bar-3-2-1.png" }),
      Object.freeze({ x: 199, y: 212, width: 66, height: 281, valueX: 230.5, valueY: 177, asset: "./assets/desktop-bar-3-2-2.png" }),
      Object.freeze({ x: 318, y: 382, width: 66, height: 111, valueX: 351, valueY: 347, asset: "./assets/desktop-bar-3-2-3.png" }),
      Object.freeze({ x: 439, y: 417, width: 65, height: 76, valueX: 470.5, valueY: 382, asset: "./assets/desktop-bar-3-2-4.png" }),
    ]),
    sentences: Object.freeze([
      "다운로드가 가장 많았던 때는 2주차였다.",
      "2주차에 광고는 언제나 효과가 있었다.",
      "3주차부터 다운로드가 다시 줄었다.",
      "4주차는 1주차보다 다운로드가 적었다.",
    ]),
    correctIndex: 1,
  }),
  "3-3": Object.freeze({
    level: 3,
    stage: 3,
    title: "학급 시험 평균",
    note: "비고: 4반은 시험 후 재시험 반영",
    labels: Object.freeze(["1반", "2반", "3반", "4반"]),
    values: Object.freeze(["72점", "74점", "73점", "91점"]),
    bars: Object.freeze([
      Object.freeze({ x: 79, y: 324, width: 65, height: 169, valueX: 105, valueY: 289, asset: "./assets/desktop-bar-3-3-1.png" }),
      Object.freeze({ x: 201, y: 299, width: 66, height: 194, valueX: 229, valueY: 265, asset: "./assets/desktop-bar-3-3-2.png" }),
      Object.freeze({ x: 320, y: 311, width: 65, height: 182, valueX: 347.14, valueY: 276, asset: "./assets/desktop-bar-3-3-3.png" }),
      Object.freeze({ x: 441, y: 210, width: 69, height: 283, valueX: 470, valueY: 177, asset: "./assets/desktop-bar-3-3-4.png" }),
    ]),
    sentences: Object.freeze([
      "4반이 제일 높으니 4반이 가장 똑똑하다.",
      "1~3반의 평균은 서로 비슷했다.",
      "가장 평균이 높은 반은 4반이었다.",
      "4반과 1반의 평균 차이는 약 19점이었다.",
    ]),
    correctIndex: 0,
  }),
});

const NEXT_DESKTOP_STAGE = Object.freeze({
  "3-1": "3-2",
  "3-2": "3-3",
});

const URL_OPTIONS = new URLSearchParams(window.location.search);
const REQUESTED_STAGE = URL_OPTIONS.get("stage") ?? "1-1";
const GAME_STAGE = GAME_STAGES[REQUESTED_STAGE] ? REQUESTED_STAGE : "1-1";
const GAME_CONFIG = GAME_STAGES[GAME_STAGE];
const ROUND_DATA = GAME_CONFIG.rounds;
const REQUESTED_IPAD_STAGE = IPAD_STAGES[REQUESTED_STAGE] ? REQUESTED_STAGE : null;
const REQUESTED_DESKTOP_STAGE = DESKTOP_STAGES[REQUESTED_STAGE] ? REQUESTED_STAGE : null;
const SHOW_TUTORIAL = URL_OPTIONS.get("tutorial") !== "0";

const RESULT_STORAGE_KEY = "rebut.bias-judgement.result.v1";
const TOTAL_RESULT_ITEMS =
  Object.values(GAME_STAGES).reduce((total, stage) => total + stage.rounds.length, 0) +
  Object.keys(IPAD_STAGES).length +
  Object.keys(DESKTOP_STAGES).length;

class ResultSession {
  constructor(totalItems) {
    this.totalItems = totalItems;
    this.reset();
  }

  reset() {
    this.items = new Map();
    this.firstAttemptCorrect = 0;
    this.retryCount = 0;
    this.reactionTimesMs = [];
  }

  beginItem(itemId) {
    let item = this.items.get(itemId);
    if (!item) {
      item = { attempts: 0, startedAt: (window.RebutGameClock?.now() ?? performance.now()), completed: false };
      this.items.set(itemId, item);
    } else if (!item.completed && !item.startedAt) {
      item.startedAt = (window.RebutGameClock?.now() ?? performance.now());
    }
  }

  recordAttempt(itemId, isCorrect) {
    this.beginItem(itemId);
    const item = this.items.get(itemId);
    if (item.completed) return;

    if (item.attempts === 0 && isCorrect) this.firstAttemptCorrect += 1;
    item.attempts += 1;

    if (!isCorrect) {
      this.retryCount += 1;
      return;
    }

    this.reactionTimesMs.push(Math.max(0, (window.RebutGameClock?.now() ?? performance.now()) - item.startedAt));
    item.completed = true;
  }

  finish() {
    const accuracy = Math.round((this.firstAttemptCorrect / this.totalItems) * 100);
    const averageReactionMs = this.reactionTimesMs.length
      ? this.reactionTimesMs.reduce((sum, value) => sum + value, 0) / this.reactionTimesMs.length
      : 0;
    const result = {
      accuracy,
      time: Math.round(averageReactionMs / 100) / 10,
      retry: this.retryCount,
    };

    try {
      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
    } catch {
      // 저장소가 막힌 환경에서는 결과 페이지의 기본값을 사용합니다.
    }
    return result;
  }
}

const resultSession = new ResultSession(TOTAL_RESULT_ITEMS);

const GRID_LAYOUTS = Object.freeze({
  front: Object.freeze({
    columns: Object.freeze([0, 112, 223, 336, 446, 556, 667, 778]),
    rows: Object.freeze([0, 113.02, 225.02, 338.04]),
    width: 56,
  }),
  middle: Object.freeze({
    columns: Object.freeze([0, 111, 223, 334, 445, 557, 668, 779]),
    rows: Object.freeze([0, 110, 221, 332]),
    width: 56,
  }),
  base: Object.freeze({
    columns: Object.freeze([0, 112, 225, 336, 448, 560, 670, 782]),
    rows: Object.freeze([0, 110, 221, 332]),
    width: 56,
  }),
  tutorial: Object.freeze({
    columns: Object.freeze([0, 52.69, 104.91, 158.08, 209.83, 262.06, 313.82, 366.5]),
    rows: Object.freeze([0, 53.18, 105.87, 159.05]),
    width: 26.35,
  }),
});

const sleep = (duration) => new Promise((resolve) => (window.RebutGameClock || window).setTimeout(resolve, duration));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionDuration = (duration) => (prefersReducedMotion.matches ? Math.min(duration, 40) : duration);

function autoGridRows(sentence) {
  const characters = [...sentence.replaceAll(" ", "")];
  const rows = [];
  while (characters.length) {
    rows.push(characters.splice(0, 8).join("").padEnd(8, "_"));
  }
  return rows;
}

function renderGrid(container, round, layoutName) {
  const layout = GRID_LAYOUTS[layoutName];
  const rows = round.gridRows ?? autoGridRows(round.sentence);
  const cells = [];

  rows.forEach((row, rowIndex) => {
    [...row].slice(0, 8).forEach((character, columnIndex) => {
      if (character === "_") return;
      const cell = document.createElement("span");
      cell.textContent = character;
      cell.style.setProperty("--cell-x", `${layout.columns[columnIndex]}px`);
      cell.style.setProperty("--cell-y", `${layout.rows[rowIndex]}px`);
      cell.style.setProperty("--cell-width", `${layout.width}px`);
      cells.push(cell);
    });
  });

  container.replaceChildren(...cells);
  container.setAttribute("aria-label", round.sentence);
}

async function pressControl(control, cursor = null) {
  cursor?.classList.add("is-clicking");
  control.classList.add("is-pressed");
  await sleep(TIMING.BUTTON_PRESS);
  cursor?.classList.remove("is-clicking");
  control.classList.remove("is-pressed");
}

async function playCorrectLogoWave(logo) {
  logo.classList.remove("is-waving");
  void logo.offsetWidth;
  logo.classList.add("is-waving");
  await sleep(motionDuration(TIMING.CORRECT_LOGO_WAVE));
  logo.classList.remove("is-waving");
}

async function playWrongReportShake(report) {
  report.classList.remove("is-wrong-shaking");
  void report.offsetWidth;
  report.classList.add("is-wrong-shaking");
  await sleep(motionDuration(TIMING.WRONG_SHAKE));
  report.classList.remove("is-wrong-shaking");
  await sleep(TIMING.WRONG_ANSWER_PAUSE);
}

function resetStampVisuals(stamp, mark, hiddenTransform) {
  stamp.getAnimations().forEach((animation) => animation.cancel());
  mark.getAnimations().forEach((animation) => animation.cancel());
  stamp.style.transition = "none";
  stamp.style.opacity = "0";
  stamp.style.transform = hiddenTransform;
  mark.style.transition = "none";
  mark.style.opacity = "0";
  mark.style.transform = "none";
}

async function prepareMarkImage(mark, source) {
  if (!source) return;
  await MARK_PRELOADS.get(source);
  if (mark.getAttribute("src") !== source) mark.src = source;
  if (typeof mark.decode === "function") {
    await mark.decode().catch(() => undefined);
  }
}

async function runStampMotion({ stamp, mark, shakeTarget, hiddenTransform, markSource }) {
  mark.style.transition = "none";
  mark.style.opacity = "0";
  await prepareMarkImage(mark, markSource);

  stamp.style.transition = [
    `transform ${TIMING.STAMP_DROP}ms cubic-bezier(0.55, 0.055, 0.675, 0.19)`,
    "opacity 45ms linear",
  ].join(", ");
  stamp.style.opacity = "1";
  stamp.style.transform = "translateY(0) scale(1)";
  await sleep(TIMING.STAMP_DROP);

  const impact = shakeTarget.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: "translate(-8px, 2px)" },
      { transform: "translate(8px, -2px)" },
      { transform: "translate(-4px, 2px)" },
      { transform: "translate(0, 0)" },
    ],
    { duration: TIMING.IMPACT_SHAKE, easing: "linear" },
  );

  await Promise.all([impact.finished, sleep(TIMING.STAMP_HOLD)]);

  // 도장이 눌려 있는 동안에는 인장을 숨기고, 도장이 올라가는 순간 함께 드러냅니다.
  mark.style.transition = `opacity ${TIMING.MARK_FADE}ms ease-out`;
  mark.style.opacity = "1";
  stamp.style.transition = [
    `transform ${TIMING.STAMP_RISE}ms ease-in`,
    `opacity ${TIMING.STAMP_RISE}ms ease-in`,
  ].join(", ");
  stamp.style.opacity = "0";
  stamp.style.transform = hiddenTransform;
  await sleep(TIMING.STAMP_RISE);
}

class GameController {
  constructor(screen, stageKey, onLevelComplete) {
    this.screen = screen;
    this.stageKey = stageKey;
    this.onLevelComplete = onLevelComplete;
    this.config = GAME_STAGES[stageKey];
    this.rounds = this.config.rounds;
    this.stack = screen.querySelector("#game-card-stack");
    this.logo = screen.querySelector(".game-logo");
    this.stamp = screen.querySelector("#game-stamp");
    this.mark = screen.querySelector("#game-stamp-mark");
    this.progress = screen.querySelector(".round-progress");
    this.levelProgressDigit = screen.querySelector("#level-progress-digit");
    this.progressDigit = screen.querySelector("#round-progress-digit");
    this.helpToggle = screen.querySelector("#help-toggle");
    this.restartButton = screen.querySelector("#game-restart");
    this.buttons = [...screen.querySelectorAll("[data-game-choice]")];
    this.layers = new Map(
      [...screen.querySelectorAll("[data-report-layer]")].map((element) => [element.dataset.reportLayer, element]),
    );
    this.currentRound = 0;
    this.busy = false;
    this.complete = false;

    this.populateCards();
    this.bindEvents();
    this.reset();
  }

  populateCards() {
    this.rounds.forEach((round, index) => {
      const textLayer = this.screen.querySelector(`[data-round-index="${index}"]`);
      renderGrid(textLayer, round, round.layer);
    });
  }

  bindEvents() {
    this.buttons.forEach((button) => {
      button.addEventListener("click", () => this.choose(button.dataset.gameChoice, button));
    });
    this.helpToggle.addEventListener("click", () => this.showHelp());
  }

  activate() {
    this.screen.classList.remove("is-ipad-mode");
    this.screen.classList.add("is-playable");
    resultSession.beginItem(this.getItemId());
    this.setButtonsDisabled(false);
  }

  deactivate() {
    this.setButtonsDisabled(true);
  }

  setButtonsDisabled(disabled) {
    this.buttons.forEach((button) => {
      button.disabled = disabled;
    });
  }

  showHelp() {
    window.RebutBookTutorial.open();
  }

  updateProgress() {
    this.levelProgressDigit.src = `${KEYWORD_PROGRESS_ASSET}${this.config.level}.png?v=20260924-1`;
    this.levelProgressDigit.alt = String(this.config.level);
    this.progressDigit.src = `${KEYWORD_PROGRESS_ASSET}${this.config.stage}.png?v=20260924-1`;
    this.progressDigit.alt = String(this.config.stage);
    this.progress.setAttribute("aria-label", `현재 진행 ${this.config.level}-${this.config.stage}`);
    document.title = `REBUT — 편향 문장 판정 ${this.config.level}-${this.config.stage}`;
    this.stack.setAttribute("aria-label", `문장: ${this.rounds[this.currentRound].sentence}`);
  }

  getItemId() {
    return `manuscript:${this.stageKey}:${this.currentRound}`;
  }

  async choose(choice, button) {
    if (this.busy || this.complete || !this.screen.classList.contains("is-playable")) return;
    this.busy = true;
    this.setButtonsDisabled(true);

    const round = this.rounds[this.currentRound];
    const activeLayer = this.layers.get(round.layer);
    resultSession.recordAttempt(this.getItemId(), choice === round.answer);
    this.stack.dataset.selected = choice;
    this.stack.dataset.correct = String(choice === round.answer);

    await pressControl(button);
    if (choice === round.answer) {
      await playCorrectLogoWave(this.logo);
    } else {
      await playWrongReportShake(activeLayer);
    }

    await runStampMotion({
      stamp: this.stamp,
      mark: this.mark,
      shakeTarget: activeLayer,
      hiddenTransform: "translateY(-580px) scale(1.025)",
      markSource: MARK_ASSETS[choice],
    });

    await sleep(TIMING.MARK_HOLD);

    if (this.currentRound === this.rounds.length - 1) {
      const nextStageKey = NEXT_GAME_STAGE[this.stageKey];
      if (nextStageKey) await this.advanceStage(nextStageKey);
      else {
        this.complete = true;
        this.busy = false;
        await this.onLevelComplete?.();
      }
      return;
    }

    await this.exitReport(activeLayer);
    this.currentRound += 1;
    this.updateProgress();
    resultSession.beginItem(this.getItemId());
    await sleep(TIMING.ROUND_SETTLE);
    this.busy = false;
    this.setButtonsDisabled(false);
  }

  async advanceStage(nextStageKey) {
    const nextConfig = GAME_STAGES[nextStageKey];
    if (!nextConfig) return;

    this.complete = true;
    this.setButtonsDisabled(true);
    this.stageKey = nextStageKey;
    this.config = nextConfig;
    this.rounds = nextConfig.rounds;
    this.currentRound = 0;
    this.stack.removeAttribute("data-selected");
    this.stack.removeAttribute("data-correct");
    this.stack.classList.remove("is-stage-entering");
    this.stack.classList.add("is-stage-enter-pending");
    this.layers.forEach((layer) => {
      layer.getAnimations().forEach((animation) => animation.cancel());
      layer.style.display = "";
      layer.style.opacity = "";
      layer.style.transform = "";
      layer.classList.remove("is-wrong-shaking");
    });
    this.logo.classList.remove("is-waving");
    resetStampVisuals(this.stamp, this.mark, "translateY(-580px) scale(1.025)");
    this.populateCards();
    this.updateProgress();

    const nextStageUrl = new URL(window.location.href);
    nextStageUrl.searchParams.set("stage", nextStageKey);
    nextStageUrl.searchParams.set("tutorial", "0");
    window.history.replaceState(null, "", nextStageUrl.href);

    await this.playStageEntrance();
    resultSession.beginItem(this.getItemId());
    this.complete = false;
    this.busy = false;
    this.setButtonsDisabled(false);
  }

  async playStageEntrance() {
    this.stack.classList.remove("is-stage-entering");
    this.stack.classList.add("is-stage-enter-pending");
    void this.stack.offsetWidth;
    this.stack.classList.remove("is-stage-enter-pending");
    this.stack.classList.add("is-stage-entering");
    await sleep(motionDuration(TIMING.STAGE_ENTER));
    this.stack.classList.remove("is-stage-entering");
  }

  async exitReport(activeLayer) {
    const exitsLeft = this.currentRound % 2 === 0;
    const x = exitsLeft ? -1550 : 1550;
    const y = exitsLeft ? -130 : 170;
    const rotation = exitsLeft ? -14 : 14;
    const keyframes = [
      { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
      { transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`, opacity: 1 },
    ];
    const options = {
      duration: TIMING.REPORT_EXIT,
      easing: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
      fill: "forwards",
    };

    const reportAnimation = activeLayer.animate(keyframes, options);
    const markAnimation = this.mark.animate(keyframes, options);
    await Promise.all([reportAnimation.finished, markAnimation.finished]);

    activeLayer.style.display = "none";
    this.mark.style.opacity = "0";
    reportAnimation.cancel();
    markAnimation.cancel();
    this.mark.style.transform = "none";
  }

  reset() {
    this.currentRound = 0;
    this.busy = false;
    this.complete = false;
    this.stack.classList.remove("is-stage-entering", "is-stage-enter-pending");
    this.stack.removeAttribute("data-selected");
    this.stack.removeAttribute("data-correct");
    this.layers.forEach((layer) => {
      layer.getAnimations().forEach((animation) => animation.cancel());
      layer.style.display = "";
      layer.style.opacity = "";
      layer.style.transform = "";
      layer.classList.remove("is-wrong-shaking");
    });
    this.logo.classList.remove("is-waving");
    resetStampVisuals(this.stamp, this.mark, "translateY(-580px) scale(1.025)");
    this.updateProgress();
    if (this.screen.classList.contains("is-playable")) resultSession.beginItem(this.getItemId());
    this.setButtonsDisabled(!this.screen.classList.contains("is-playable"));
  }
}

class LevelTransition {
  async show(level, onCovered) {
    return window.RebutStepTransition.show(level, { onCovered });
  }
}

class IpadGameController {
  constructor(screen, initialStageKey = "2-1", onComplete = null) {
    this.screen = screen;
    this.root = screen.querySelector("#ipad-game");
    this.object = screen.querySelector("#ipad-game-object");
    this.copy = screen.querySelector("#ipad-game-copy");
    this.text = screen.querySelector("#ipad-game-text");
    this.highlightLayer = screen.querySelector("#ipad-highlight-layer");
    this.pencil = screen.querySelector("#ipad-game-pencil");
    this.logo = screen.querySelector(".game-logo");
    this.progress = screen.querySelector(".round-progress");
    this.levelProgressDigit = screen.querySelector("#level-progress-digit");
    this.progressDigit = screen.querySelector("#round-progress-digit");
    this.stageElement = document.querySelector("#game-stage");
    this.stageKey = initialStageKey;
    this.config = IPAD_STAGES[initialStageKey];
    this.onComplete = onComplete;
    this.active = false;
    this.busy = false;
    this.complete = false;
    this.currentPencilTransform = "translate3d(0, 0, 0)";

    this.object.addEventListener("pointermove", (event) => this.followPointer(event));
    this.object.addEventListener("pointerleave", () => {
      if (!this.busy) this.setPencilTransform("translate3d(0, 0, 0)");
    });
  }

  updateProgress() {
    this.levelProgressDigit.src = `${KEYWORD_PROGRESS_ASSET}${this.config.level}.png?v=20260924-1`;
    this.levelProgressDigit.alt = String(this.config.level);
    this.progressDigit.src = `${KEYWORD_PROGRESS_ASSET}${this.config.stage}.png?v=20260924-1`;
    this.progressDigit.alt = String(this.config.stage);
    this.progress.setAttribute("aria-label", `현재 진행 ${this.config.level}-${this.config.stage}`);
    document.title = `REBUT — 편향 문장 찾기 ${this.config.level}-${this.config.stage}`;
  }

  updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("stage", this.stageKey);
    url.searchParams.set("tutorial", "0");
    window.history.replaceState(null, "", url.href);
  }

  getItemId() {
    return `ipad:${this.stageKey}`;
  }

  renderSentences() {
    const nodes = [];
    this.config.sentences.forEach((sentence, index) => {
      const target = document.createElement("span");
      target.className = "ipad-sentence";
      target.tabIndex = 0;
      target.setAttribute("role", "button");
      target.setAttribute("aria-label", `${index + 1}번째 문장: ${sentence}`);
      target.dataset.sentenceIndex = String(index);
      target.textContent = sentence;
      target.addEventListener("click", () => this.choose(index, target));
      target.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        this.choose(index, target);
      });
      nodes.push(target);
      if (index < this.config.sentences.length - 1) nodes.push(document.createTextNode(" "));
    });
    this.text.replaceChildren(...nodes);
    this.text.setAttribute("aria-label", this.config.sentences.join(" "));
  }

  setPencilTransform(transform) {
    this.pencil.getAnimations().forEach((animation) => animation.cancel());
    this.currentPencilTransform = transform;
    this.pencil.style.transform = transform;
  }

  resetVisuals() {
    this.object.getAnimations().forEach((animation) => animation.cancel());
    this.object.classList.remove("is-entering", "is-exiting", "is-wrong-shaking");
    this.object.style.transform = "";
    this.object.style.opacity = "";
    this.highlightLayer.replaceChildren();
    this.text.querySelectorAll(".ipad-sentence").forEach((sentence) => {
      sentence.classList.remove("is-selected", "is-hovered");
    });
    this.setPencilTransform("translate3d(0, 0, 0)");
  }

  renderStage(stageKey) {
    this.stageKey = stageKey;
    this.config = IPAD_STAGES[stageKey];
    this.busy = false;
    this.complete = false;
    this.renderSentences();
    this.resetVisuals();
    this.updateProgress();
    this.updateUrl();
  }

  async activate(stageKey = this.stageKey, { enter = false, track = true } = {}) {
    this.active = true;
    this.root.hidden = false;
    this.screen.classList.add("is-ipad-mode", "is-playable");
    this.renderStage(stageKey);
    if (enter) await this.enterRound();
    if (track) resultSession.beginItem(this.getItemId());
  }

  deactivate() {
    this.active = false;
    this.root.hidden = true;
    this.screen.classList.remove("is-ipad-mode");
  }

  resetCurrent() {
    if (!this.active) return;
    this.renderStage(this.stageKey);
    resultSession.beginItem(this.getItemId());
  }

  getScale() {
    return this.stageElement.getBoundingClientRect().width / DISPLAY.width;
  }

  followPointer(event) {
    if (!this.active || this.busy || this.complete) return;
    const objectRect = this.object.getBoundingClientRect();
    const scale = this.getScale();
    const localX = (event.clientX - objectRect.left) / scale;
    const localY = (event.clientY - objectRect.top) / scale;
    const x = localX - 715;
    const y = localY - 590;
    this.setPencilTransform(`translate3d(${x}px, ${y}px, 0)`);
  }

  async animatePencilTo(localX, localY, duration, easing = "ease-in-out") {
    const x = localX - 715;
    const y = localY - 590;
    const destination = `translate3d(${x}px, ${y}px, 0)`;
    this.pencil.style.transition = `transform ${motionDuration(duration)}ms ${easing}`;
    this.pencil.style.transform = this.currentPencilTransform;
    void this.pencil.offsetWidth;
    this.currentPencilTransform = destination;
    this.pencil.style.transform = destination;
    await sleep(motionDuration(duration));
    this.pencil.style.transition = "none";
  }

  measureHighlightLines(sentence) {
    const scale = this.getScale();
    const copyRect = this.copy.getBoundingClientRect();
    const objectRect = this.object.getBoundingClientRect();
    return [...sentence.getClientRects()]
      .filter((rect) => rect.width > 1 && rect.height > 1)
      .map((rect) => ({
        left: (rect.left - copyRect.left) / scale,
        top: (rect.top - copyRect.top) / scale + 11,
        width: rect.width / scale,
        height: Math.min(54, rect.height / scale - 16),
        pencilStartX: (rect.left - objectRect.left) / scale,
        pencilEndX: (rect.right - objectRect.left) / scale,
        pencilY: (rect.top - objectRect.top) / scale + rect.height / scale * 0.82,
      }));
  }

  async highlightSentence(sentence) {
    this.highlightLayer.replaceChildren();
    sentence.classList.add("is-selected");
    const lines = this.measureHighlightLines(sentence);
    if (!lines.length) return;

    await this.animatePencilTo(
      lines[0].pencilStartX,
      lines[0].pencilY,
      TIMING.IPAD_PENCIL_APPROACH,
      "cubic-bezier(0.33, 1, 0.68, 1)",
    );

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const segment = document.createElement("span");
      segment.className = "ipad-highlight-segment";
      segment.style.left = `${line.left}px`;
      segment.style.top = `${line.top}px`;
      segment.style.width = `${line.width}px`;
      segment.style.height = `${Math.max(28, line.height)}px`;
      this.highlightLayer.append(segment);

      if (index > 0) {
        await this.animatePencilTo(
          line.pencilStartX,
          line.pencilY,
          TIMING.IPAD_PENCIL_LINE_BREAK,
        );
      }

      const duration = Math.max(
        TIMING.IPAD_HIGHLIGHT_MIN,
        Math.min(TIMING.IPAD_HIGHLIGHT_MAX, Math.round((line.width / 840) * 1050)),
      );
      segment.style.transition = `transform ${motionDuration(duration)}ms linear`;
      void segment.offsetWidth;
      segment.style.transform = "scaleX(1)";
      await Promise.all([
        sleep(motionDuration(duration)),
        this.animatePencilTo(line.pencilEndX, line.pencilY, duration, "linear"),
      ]);
      segment.style.transition = "none";
    }
  }

  async choose(index, sentence) {
    if (!this.active || this.busy || this.complete) return;
    this.busy = true;
    resultSession.recordAttempt(this.getItemId(), index === this.config.correctIndex);
    await this.highlightSentence(sentence);

    if (index !== this.config.correctIndex) {
      await playWrongReportShake(this.object);
      this.highlightLayer.replaceChildren();
      sentence.classList.remove("is-selected");
      this.setPencilTransform("translate3d(0, 0, 0)");
      this.busy = false;
      return;
    }

    await playCorrectLogoWave(this.logo);
    await sleep(TIMING.IPAD_CORRECT_HOLD);
    const nextStageKey = NEXT_IPAD_STAGE[this.stageKey];
    if (!nextStageKey) {
      this.complete = true;
      await this.onComplete?.();
      this.busy = false;
      return;
    }

    await this.exitRound();
    this.renderStage(nextStageKey);
    await this.enterRound();
    resultSession.beginItem(this.getItemId());
    this.busy = false;
  }

  async exitRound() {
    this.object.classList.remove("is-entering");
    void this.object.offsetWidth;
    this.object.classList.add("is-exiting");
    await sleep(motionDuration(TIMING.IPAD_ROUND_MOVE));
    this.object.classList.remove("is-exiting");
  }

  async enterRound() {
    this.object.classList.remove("is-exiting");
    void this.object.offsetWidth;
    this.object.classList.add("is-entering");
    await sleep(motionDuration(TIMING.IPAD_ROUND_MOVE));
    this.object.classList.remove("is-entering");
  }
}

class DesktopGameController {
  constructor(screen, initialStageKey = "3-1", onComplete = null) {
    this.screen = screen;
    this.root = screen.querySelector("#desktop-game");
    this.object = screen.querySelector("#desktop-game-object");
    this.chartTitle = screen.querySelector("#desktop-chart-title");
    this.chartNote = screen.querySelector("#desktop-chart-note");
    this.bars = screen.querySelector("#desktop-bars");
    this.answerList = screen.querySelector("#desktop-answer-list");
    this.cursor = screen.querySelector("#desktop-game-cursor");
    this.logo = screen.querySelector(".game-logo");
    this.progress = screen.querySelector(".round-progress");
    this.levelProgressDigit = screen.querySelector("#level-progress-digit");
    this.progressDigit = screen.querySelector("#round-progress-digit");
    this.stageElement = document.querySelector("#game-stage");
    this.stageKey = initialStageKey;
    this.config = DESKTOP_STAGES[initialStageKey];
    this.onComplete = onComplete;
    this.active = false;
    this.busy = false;
    this.complete = false;
    this.cursorX = 0;
    this.cursorY = 0;

    this.object.addEventListener("pointermove", (event) => this.followPointer(event));
    this.object.addEventListener("pointerleave", () => {
      if (!this.busy) this.setCursorPosition(0, 0);
    });
  }

  getScale() {
    return this.stageElement.getBoundingClientRect().width / DISPLAY.width;
  }

  updateProgress() {
    this.levelProgressDigit.src = `${KEYWORD_PROGRESS_ASSET}${this.config.level}.png?v=20260924-1`;
    this.levelProgressDigit.alt = String(this.config.level);
    this.progressDigit.src = `${KEYWORD_PROGRESS_ASSET}${this.config.stage}.png?v=20260924-1`;
    this.progressDigit.alt = String(this.config.stage);
    this.progress.setAttribute("aria-label", `현재 진행 ${this.config.level}-${this.config.stage}`);
    document.title = `REBUT — 잘못 해석한 문장 찾기 ${this.config.level}-${this.config.stage}`;
  }

  updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("stage", this.stageKey);
    url.searchParams.set("tutorial", "0");
    window.history.replaceState(null, "", url.href);
  }

  getItemId() {
    return `desktop:${this.stageKey}`;
  }

  renderBars() {
    const fragment = document.createDocumentFragment();
    this.config.bars.forEach((bar, index) => {
      const shape = document.createElement("div");
      shape.className = "desktop-chart-bar";
      shape.style.left = `${bar.x}px`;
      shape.style.top = `${bar.y}px`;
      shape.style.width = `${bar.width}px`;
      shape.style.height = `${bar.height}px`;
      shape.style.setProperty("--bar-delay", `${index * TIMING.DESKTOP_BAR_STAGGER}ms`);

      const image = document.createElement("img");
      image.src = bar.asset;
      image.alt = "";
      image.draggable = false;
      shape.append(image);

      const value = document.createElement("p");
      value.className = "desktop-bar-value";
      value.style.left = `${bar.valueX}px`;
      value.style.top = `${bar.valueY}px`;
      value.textContent = this.config.values[index];

      const label = document.createElement("p");
      label.className = "desktop-bar-label";
      label.style.left = `${bar.valueX}px`;
      label.textContent = this.config.labels[index];

      fragment.append(shape, value, label);
    });
    this.bars.replaceChildren(fragment);
  }

  startBarAnimation() {
    const bars = [...this.bars.querySelectorAll(".desktop-chart-bar")];
    bars.forEach((bar) => bar.classList.remove("is-rising"));
    void this.bars.offsetWidth;
    bars.forEach((bar) => bar.classList.add("is-rising"));
  }

  renderAnswers() {
    const fragment = document.createDocumentFragment();
    this.config.sentences.forEach((sentence, index) => {
      const row = document.createElement("div");
      row.className = "desktop-answer-row";
      row.style.top = `${index * 70}px`;
      row.dataset.answerIndex = String(index);

      const checkbox = document.createElement("button");
      checkbox.className = "desktop-answer-checkbox";
      checkbox.type = "button";
      checkbox.setAttribute("aria-label", `${index + 1}번째 문장 선택: ${sentence}`);
      checkbox.addEventListener("click", () => this.choose(index, row));

      const box = document.createElement("img");
      box.className = "desktop-answer-box";
      box.src = "./assets/desktop-game-checkbox.png";
      box.alt = "";
      box.draggable = false;

      const check = document.createElement("img");
      check.className = "desktop-answer-check";
      check.src = "./assets/desktop-game-check.svg";
      check.alt = "";
      check.draggable = false;
      checkbox.append(box, check);

      const copy = document.createElement("p");
      copy.className = "desktop-answer-copy";
      copy.textContent = sentence;
      row.append(checkbox, copy);
      fragment.append(row);
    });
    this.answerList.replaceChildren(fragment);
  }

  setCursorPosition(x, y) {
    this.cursor.getAnimations().forEach((animation) => animation.cancel());
    this.cursorX = x;
    this.cursorY = y;
    this.cursor.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
  }

  followPointer(event) {
    if (!this.active || this.busy || this.complete) return;
    const objectRect = this.object.getBoundingClientRect();
    const scale = this.getScale();
    const localX = (event.clientX - objectRect.left) / scale;
    const localY = (event.clientY - objectRect.top) / scale;
    this.setCursorPosition(localX - 1135, localY - 521.5);
  }

  async animateCursorTo(x, y, duration = 120) {
    const from = `translate3d(${this.cursorX}px, ${this.cursorY}px, 0) scale(1)`;
    const to = `translate3d(${x}px, ${y}px, 0) scale(1)`;
    const animation = this.cursor.animate(
      [{ transform: from }, { transform: to }],
      { duration: motionDuration(duration), easing: "cubic-bezier(0.33, 1, 0.68, 1)", fill: "forwards" },
    );
    await animation.finished.catch(() => undefined);
    animation.cancel();
    this.setCursorPosition(x, y);
  }

  async pressCursor() {
    const base = `translate3d(${this.cursorX}px, ${this.cursorY}px, 0)`;
    const animation = this.cursor.animate(
      [
        { transform: `${base} scale(1)` },
        { transform: `${base} scale(0.86)`, offset: 0.5 },
        { transform: `${base} scale(1)` },
      ],
      { duration: motionDuration(TIMING.DESKTOP_CURSOR_CLICK), easing: "ease-in-out" },
    );
    await animation.finished.catch(() => undefined);
  }

  resetVisuals() {
    this.object.getAnimations().forEach((animation) => animation.cancel());
    this.object.classList.remove("is-entering", "is-exiting", "is-wrong-shaking");
    this.object.style.transform = "";
    this.object.style.opacity = "";
    this.answerList.querySelectorAll(".desktop-answer-row").forEach((row) => row.classList.remove("is-checked"));
    this.setCursorPosition(0, 0);
  }

  renderStage(stageKey) {
    this.stageKey = stageKey;
    this.config = DESKTOP_STAGES[stageKey];
    this.busy = false;
    this.complete = false;
    this.chartTitle.textContent = this.config.title;
    this.chartNote.textContent = this.config.note;
    this.renderBars();
    this.renderAnswers();
    this.resetVisuals();
    this.updateProgress();
    this.updateUrl();
  }

  async activate(stageKey = this.stageKey, { enter = false, animateBars = true, track = true } = {}) {
    this.active = true;
    this.root.hidden = false;
    this.screen.classList.add("is-desktop-mode", "is-playable");
    this.renderStage(stageKey);
    if (enter) await this.enterRound();
    if (animateBars) this.startBarAnimation();
    if (track) resultSession.beginItem(this.getItemId());
  }

  deactivate() {
    this.active = false;
    this.root.hidden = true;
    this.screen.classList.remove("is-desktop-mode");
  }

  resetCurrent() {
    if (!this.active) return;
    this.renderStage(this.stageKey);
    this.startBarAnimation();
    resultSession.beginItem(this.getItemId());
  }

  async choose(index, row) {
    if (!this.active || this.busy || this.complete) return;
    this.busy = true;
    resultSession.recordAttempt(this.getItemId(), index === this.config.correctIndex);
    const cursorTargetX = 687.5 - 1135;
    const cursorTargetY = 301.5 + index * 70 - 521.5;
    await this.animateCursorTo(cursorTargetX, cursorTargetY);
    await this.pressCursor();
    row.classList.add("is-checked");
    await sleep(motionDuration(TIMING.DESKTOP_CHECK_REVEAL));

    if (index !== this.config.correctIndex) {
      await playWrongReportShake(this.object);
      row.classList.remove("is-checked");
      this.setCursorPosition(0, 0);
      this.busy = false;
      return;
    }

    await playCorrectLogoWave(this.logo);
    await sleep(TIMING.DESKTOP_CORRECT_HOLD);
    const nextStageKey = NEXT_DESKTOP_STAGE[this.stageKey];
    if (!nextStageKey) {
      this.complete = true;
      this.busy = false;
      await this.onComplete?.();
      return;
    }

    await this.exitRound();
    this.renderStage(nextStageKey);
    await this.enterRound();
    this.startBarAnimation();
    resultSession.beginItem(this.getItemId());
    this.busy = false;
  }

  async exitRound() {
    this.object.classList.remove("is-entering");
    void this.object.offsetWidth;
    this.object.classList.add("is-exiting");
    await sleep(motionDuration(TIMING.DESKTOP_ROUND_MOVE));
    this.object.classList.remove("is-exiting");
  }

  async enterRound() {
    this.object.classList.remove("is-exiting");
    void this.object.offsetWidth;
    this.object.classList.add("is-entering");
    await sleep(motionDuration(TIMING.DESKTOP_ROUND_MOVE));
    this.object.classList.remove("is-entering");
  }
}

class TutorialOverlay {
  constructor(overlay, round, onComplete) {
    this.overlay = overlay;
    this.round = round;
    this.onComplete = onComplete;
    this.panel = overlay.querySelector("#tutorial-panel");
    this.manuscriptPage = overlay.querySelector("#tutorial-manuscript-page");
    this.ipadPage = overlay.querySelector("#tutorial-ipad-page");
    this.desktopPage = overlay.querySelector("#tutorial-desktop-page");
    this.indicatorDots = [...overlay.querySelectorAll("[data-tutorial-dot]")];
    this.card = overlay.querySelector("#tutorial-card");
    this.grid = overlay.querySelector("#tutorial-example-grid");
    this.cursor = overlay.querySelector("#tutorial-cursor");
    this.stamp = overlay.querySelector("#tutorial-stamp");
    this.mark = overlay.querySelector("#tutorial-stamp-mark");
    this.answerButton = overlay.querySelector(`[data-tutorial-choice="${round.answer}"]`);
    this.startButton = overlay.querySelector("#tutorial-start");
    this.pencil = overlay.querySelector("#tutorial-pencil");
    this.highlightLines = [...overlay.querySelectorAll(".tutorial-highlight")];
    this.desktopCursor = overlay.querySelector("#tutorial-desktop-cursor");
    this.desktopCheck = overlay.querySelector("#tutorial-desktop-check");
    this.running = false;
    this.closing = false;

    renderGrid(this.grid, round, "tutorial");
    this.startButton.addEventListener("click", () => this.close());
  }

  resetManuscriptVisuals({ keepCursor = false } = {}) {
    resetStampVisuals(this.stamp, this.mark, "translateY(-270px) scale(1.025)");
    this.answerButton.classList.remove("is-pressed");
    this.cursor.classList.remove("is-clicking");
    this.card.getAnimations().forEach((animation) => animation.cancel());
    if (!keepCursor) {
      this.cursor.style.setProperty("--cursor-duration", "0ms");
      this.cursor.style.setProperty("--cursor-x", "0px");
      this.cursor.style.setProperty("--cursor-y", "0px");
    }
  }

  resetIpadVisuals() {
    this.pencil.getAnimations().forEach((animation) => animation.cancel());
    this.pencil.style.transform = "translate3d(0, 0, 0)";
    this.highlightLines.forEach((line) => {
      line.getAnimations().forEach((animation) => animation.cancel());
      line.style.transform = "scaleX(0)";
    });
  }

  resetDesktopVisuals() {
    this.desktopCursor.getAnimations().forEach((animation) => animation.cancel());
    this.desktopCheck.getAnimations().forEach((animation) => animation.cancel());
    this.desktopCursor.style.transform = "translate3d(0, 0, 0) rotate(3.94deg) scale(1)";
    this.desktopCheck.style.opacity = "0";
    this.desktopCheck.style.transform = "scale(0.65)";
  }

  async showPage(index, { immediate = false } = {}) {
    const pages = [this.manuscriptPage, this.ipadPage, this.desktopPage];
    pages.forEach((page, pageIndex) => {
      const active = pageIndex === index;
      page.classList.toggle("is-active", active);
      page.setAttribute("aria-hidden", String(!active));
    });
    this.indicatorDots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
    });
    if (!immediate) await sleep(TIMING.TUTORIAL_PAGE_SWITCH);
  }

  async animateTransform(element, from, to, duration, easing = "ease-in-out") {
    const animation = element.animate(
      [{ transform: from }, { transform: to }],
      { duration: motionDuration(duration), easing, fill: "forwards" },
    );
    await animation.finished.catch(() => undefined);
    element.style.transform = to;
    animation.cancel();
  }

  async drawHighlight(line, pencilFrom, pencilTo, duration) {
    const highlight = line.animate(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: motionDuration(duration), easing: "linear", fill: "forwards" },
    );
    await Promise.all([
      highlight.finished.catch(() => undefined),
      this.animateTransform(this.pencil, pencilFrom, pencilTo, duration, "linear"),
    ]);
    line.style.transform = "scaleX(1)";
    highlight.cancel();
  }

  async moveCursorToAnswer() {
    const destination = DISPLAY.tutorialCursor.targets[this.round.answer];
    const dx = destination.x - DISPLAY.tutorialCursor.rest.x;
    const dy = destination.y - DISPLAY.tutorialCursor.rest.y;
    this.cursor.style.setProperty("--cursor-duration", `${TIMING.TUTORIAL_CURSOR_MOVE}ms`);
    this.cursor.style.setProperty("--cursor-x", `${dx}px`);
    this.cursor.style.setProperty("--cursor-y", `${dy}px`);
    await sleep(TIMING.TUTORIAL_CURSOR_MOVE);
  }

  async returnCursor() {
    this.cursor.style.setProperty("--cursor-duration", `${TIMING.TUTORIAL_CURSOR_RESET}ms`);
    this.cursor.style.setProperty("--cursor-x", "0px");
    this.cursor.style.setProperty("--cursor-y", "0px");
    await sleep(TIMING.TUTORIAL_CURSOR_RESET);
  }

  async playManuscriptPage() {
    this.resetManuscriptVisuals();
    await sleep(TIMING.TUTORIAL_PRESENT);
    await this.moveCursorToAnswer();
    await pressControl(this.answerButton, this.cursor);
    await runStampMotion({
      stamp: this.stamp,
      mark: this.mark,
      shakeTarget: this.card,
      hiddenTransform: "translateY(-270px) scale(1.025)",
      markSource: MARK_ASSETS[this.round.answer],
    });
    await sleep(TIMING.TUTORIAL_MARK_HOLD);
  }

  async playIpadPage() {
    this.resetIpadVisuals();
    await sleep(TIMING.TUTORIAL_IPAD_PRESENT);

    const rest = "translate3d(0, 0, 0)";
    const lineOneStart = "translate3d(4px, -287px, 0)";
    const lineOneEnd = "translate3d(109px, -287px, 0)";
    const lineTwoStart = "translate3d(-277px, -251px, 0)";
    const lineTwoEnd = "translate3d(109px, -251px, 0)";
    const lineThreeStart = "translate3d(-277px, -216px, 0)";
    const finalPosition = "translate3d(-44.77px, -223.04px, 0)";

    await this.animateTransform(
      this.pencil,
      rest,
      lineOneStart,
      TIMING.TUTORIAL_PENCIL_APPROACH,
      "cubic-bezier(0.33, 1, 0.68, 1)",
    );
    await this.drawHighlight(
      this.highlightLines[0],
      lineOneStart,
      lineOneEnd,
      TIMING.TUTORIAL_HIGHLIGHT_LINE_ONE,
    );
    await this.animateTransform(
      this.pencil,
      lineOneEnd,
      lineTwoStart,
      TIMING.TUTORIAL_PENCIL_LINE_BREAK,
    );
    await this.drawHighlight(
      this.highlightLines[1],
      lineTwoStart,
      lineTwoEnd,
      TIMING.TUTORIAL_HIGHLIGHT_LINE_TWO,
    );
    await this.animateTransform(
      this.pencil,
      lineTwoEnd,
      lineThreeStart,
      TIMING.TUTORIAL_PENCIL_LINE_BREAK,
    );
    await this.drawHighlight(
      this.highlightLines[2],
      lineThreeStart,
      finalPosition,
      TIMING.TUTORIAL_HIGHLIGHT_LINE_THREE,
    );
    await sleep(TIMING.TUTORIAL_IPAD_HOLD);
  }

  async playDesktopPage() {
    this.resetDesktopVisuals();
    await sleep(TIMING.TUTORIAL_DESKTOP_PRESENT);

    const rest = "translate3d(0, 0, 0) rotate(3.94deg) scale(1)";
    const target = "translate3d(-204.79px, -98px, 0) rotate(3.94deg) scale(1)";
    const pressed = "translate3d(-204.79px, -98px, 0) rotate(3.94deg) scale(0.86)";

    await this.animateTransform(
      this.desktopCursor,
      rest,
      target,
      TIMING.TUTORIAL_DESKTOP_CURSOR_MOVE,
      "cubic-bezier(0.33, 1, 0.68, 1)",
    );
    await this.animateTransform(
      this.desktopCursor,
      target,
      pressed,
      TIMING.BUTTON_PRESS / 2,
      "ease-in",
    );

    const checkReveal = this.desktopCheck.animate(
      [
        { opacity: 0, transform: "scale(0.65)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      {
        duration: motionDuration(TIMING.TUTORIAL_DESKTOP_CHECK_REVEAL),
        easing: "cubic-bezier(0.33, 1, 0.68, 1)",
        fill: "forwards",
      },
    );
    await Promise.all([
      checkReveal.finished.catch(() => undefined),
      this.animateTransform(
        this.desktopCursor,
        pressed,
        target,
        TIMING.BUTTON_PRESS / 2,
        "ease-out",
      ),
    ]);
    this.desktopCheck.style.opacity = "1";
    this.desktopCheck.style.transform = "scale(1)";
    checkReveal.cancel();
    await sleep(TIMING.TUTORIAL_DESKTOP_HOLD);
  }

  async playCycle() {
    this.resetManuscriptVisuals();
    this.resetIpadVisuals();
    this.resetDesktopVisuals();
    await this.showPage(0, { immediate: true });
    await this.playManuscriptPage();
    if (!this.running) return;

    await this.showPage(1);
    await this.playIpadPage();
    if (!this.running) return;

    await this.showPage(2);
    await this.playDesktopPage();
    if (!this.running) return;

    this.resetManuscriptVisuals();
    this.resetIpadVisuals();
    this.resetDesktopVisuals();
    await this.showPage(0);
    await sleep(TIMING.TUTORIAL_RESET_SETTLE);
  }

  async start() {
    if (this.running) return;
    this.running = true;
    while (this.running) await this.playCycle();
  }

  async close() {
    if (this.closing) return;
    this.closing = true;
    this.running = false;
    this.startButton.disabled = true;
    this.overlay.classList.add("is-closing");
    await sleep(TIMING.POPUP_FADE_OUT);
    this.overlay.hidden = true;
    this.onComplete();
  }
}

function resizeStage(stage) {
  const scale = Math.min(
    window.innerWidth / DISPLAY.width,
    window.innerHeight / DISPLAY.height,
  );
  const scaledWidth = DISPLAY.width * scale;
  const logicalHeight = window.innerHeight / scale;
  const verticalExtra = Math.max(0, logicalHeight - DISPLAY.height);

  stage.style.left = `${(window.innerWidth - scaledWidth) / 2}px`;
  stage.style.top = "0px";
  stage.style.height = `${DISPLAY.height + verticalExtra}px`;
  stage.style.transform = `scale(${scale})`;

  document.documentElement.style.setProperty("--vertical-extra", `${verticalExtra}px`);
  document.documentElement.style.setProperty("--game-center-shift", `${verticalExtra * 0.5}px`);
  document.documentElement.style.setProperty("--game-bottom-shift", `${verticalExtra}px`);
  document.documentElement.style.setProperty(
    "--popup-top",
    `${DISPLAY.popupTop + verticalExtra * DISPLAY.popupVerticalProgress}px`,
  );
}

const stage = document.querySelector("#game-stage");
const screen = document.querySelector("#game-screen");
const levelTransition = new LevelTransition();
let ipadGame;
let desktopGame;
const game = new GameController(screen, GAME_STAGE, async () => {
  await levelTransition.show(2, async () => {
    game.deactivate();
    await ipadGame.activate("2-1", { track: false });
  });
  resultSession.beginItem(ipadGame.getItemId());
});
ipadGame = new IpadGameController(screen, REQUESTED_IPAD_STAGE ?? "2-1", async () => {
  await levelTransition.show(3, async () => {
    ipadGame.deactivate();
    await desktopGame.activate("3-1", { animateBars: false, track: false });
  });
  desktopGame.startBarAnimation();
  resultSession.beginItem(desktopGame.getItemId());
});
desktopGame = new DesktopGameController(
  screen,
  REQUESTED_DESKTOP_STAGE ?? "3-1",
  async () => {
    resultSession.finish();
    window.location.href = "./result.html";
  },
);

function activateInitialGame() {
  if (REQUESTED_DESKTOP_STAGE) {
    game.deactivate();
    ipadGame.deactivate();
    desktopGame.activate(REQUESTED_DESKTOP_STAGE);
    return;
  }
  if (REQUESTED_IPAD_STAGE) {
    game.deactivate();
    desktopGame.deactivate();
    ipadGame.activate(REQUESTED_IPAD_STAGE);
    return;
  }
  ipadGame.deactivate();
  desktopGame.deactivate();
  game.activate();
}

function initialLevelNumber() {
  if (REQUESTED_DESKTOP_STAGE) return 3;
  if (REQUESTED_IPAD_STAGE) return 2;
  return 1;
}

async function revealInitialGame() {
  await levelTransition.show(initialLevelNumber());
  activateInitialGame();
}

const tutorial = new TutorialOverlay(
  document.querySelector("#tutorial-overlay"),
  ROUND_DATA[0],
  () => { void revealInitialGame(); },
);

document.querySelector("#game-restart").addEventListener("click", () => {
  if (desktopGame.active) desktopGame.resetCurrent();
  else if (ipadGame.active) ipadGame.resetCurrent();
  else game.reset();
});

document.querySelector(".game-back").addEventListener("click", () => {
  window.location.href = "../../?rehab=judgment";
});

document.documentElement.style.setProperty("--dim-color", DISPLAY.dimColor);
document.documentElement.style.setProperty("--dim-opacity", String(DISPLAY.dimOpacity));
document.documentElement.style.setProperty("--wrong-shake", `${TIMING.WRONG_SHAKE}ms`);
document.documentElement.style.setProperty("--logo-wave-letter-duration", `${TIMING.LOGO_WAVE_LETTER}ms`);
document.documentElement.style.setProperty("--stage-enter-duration", `${TIMING.STAGE_ENTER}ms`);
document.documentElement.style.setProperty("--level-fade-in", `${TIMING.LEVEL_FADE_IN}ms`);
document.documentElement.style.setProperty("--level-fade-out", `${TIMING.LEVEL_FADE_OUT}ms`);
document.documentElement.style.setProperty("--ipad-round-move", `${TIMING.IPAD_ROUND_MOVE}ms`);
document.documentElement.style.setProperty("--desktop-round-move", `${TIMING.DESKTOP_ROUND_MOVE}ms`);
document.documentElement.style.setProperty("--desktop-bar-rise", `${TIMING.DESKTOP_BAR_RISE}ms`);
document.querySelectorAll("[data-logo-letter]").forEach((letter, index) => {
  letter.style.setProperty("--logo-wave-delay", `${index * TIMING.LOGO_WAVE_STAGGER}ms`);
});
window.addEventListener("resize", () => resizeStage(stage), { passive: true });
resizeStage(stage);

if (SHOW_TUTORIAL) {
  window.addEventListener("load", () => tutorial.start());
} else {
  tutorial.overlay.hidden = true;
  void revealInitialGame();
}
