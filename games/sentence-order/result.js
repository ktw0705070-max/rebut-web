"use strict";

// 다른 진단 게임에서는 이 객체의 지표·등급 컷·코멘트만 교체해 재사용합니다.
const resultData = Object.freeze({
  metrics: Object.freeze([
    Object.freeze({ key: "accuracy", label: "인과 정확도", unit: "점", isScore: true }),
    Object.freeze({ key: "time", label: "반응 시간", unit: "초", isScore: false }),
    Object.freeze({ key: "retry", label: "재시도 횟수", unit: "회", isScore: false }),
  ]),
  gradeCutoffs: Object.freeze([
    Object.freeze({ min: 85, grade: "선명해요" }),
    Object.freeze({ min: 70, grade: "견뎌냈어요" }),
    Object.freeze({ min: 50, grade: "흐릿해요" }),
    Object.freeze({ min: 0, grade: "실망스러워요" }),
  ]),
  comments: Object.freeze({
    "선명해요": Object.freeze([
      "당신의 언어는 아직 또렷합니다.",
      "흩어진 문장에서 앞뒤 인과를 정확히 이었습니다.",
      "무엇이 먼저이고 무엇이 뒤인지 흐트러지지 않았습니다.",
      "다만, 오늘의 흐름이 늘 매끄럽지는 않습니다.",
      "읽은 글을 순서대로 다시 말해 보는 습관을 이어가 보세요.",
    ]),
    "견뎌냈어요": Object.freeze([
      "당신의 언어는 아직 제 몫을 합니다.",
      "몇 군데는 뒤섞였지만 결국 흐름을 되찾았습니다.",
      "원인과 결과를 이으려는 힘이 남아 있었습니다.",
      "문장 사이의 \"그래서·그러니까\"를 짚으며 읽어 보세요.",
      "짧은 글을 문단 단위로 순서 맞추는 연습을 해 보세요.",
    ]),
    "흐릿해요": Object.freeze([
      "당신의 언어는 조금씩 흐려지고 있습니다.",
      "앞과 뒤가 자주 뒤바뀌었습니다.",
      "무엇이 원인인지 좀처럼 가려내지 못했습니다.",
      "문장을 이을 때 \"왜 그런가\"를 먼저 물어보세요.",
      "두세 문장의 짧은 이야기부터 순서대로 말하는 훈련이 도움이 됩니다.",
    ]),
    "실망스러워요": Object.freeze([
      "당신의 언어는 많이 흐려져 있습니다.",
      "문장의 앞뒤를 좀처럼 잇지 못했습니다.",
      "방금 읽은 흐름조차 손에 남지 않았습니다.",
      "말의 순서를 AI에 맡기는 사이, 당신의 문장이 흩어지고 있습니다.",
      "두 문장을 \"먼저·나중\"으로 잇는 연습부터 매일 이어가 보세요.",
    ]),
  }),
});

const RESULT_PAGE_CONFIG = Object.freeze({
  storageKey: "rebut.sentence-order.result.v1",
  scoreRange: Object.freeze({ minimum: 0, maximum: 100 }),
  fallbackResult: Object.freeze({
    firstAttemptCorrectRounds: 0,
    completedRounds: 9,
    reactionTimesMs: Object.freeze([]),
    retryCount: 0,
  }),
});

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const HEADER_BOTTOM_Y = 79;
const REFERENCE_ADVICE_FONT_SIZE = 27.5;
const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  Object.freeze({ selector: ".result-title", y: 142 }),
  Object.freeze({ selector: ".result-panels", y: 279 }),
  Object.freeze({ selector: ".result-actions", y: 946 }),
]);

const stage = document.querySelector("#result-stage");
const metricList = document.querySelector("#metric-list");
const accuracyScoreElement = document.querySelector("#accuracy-score");
const reactionTimeElement = document.querySelector("#reaction-time");
const retryCountElement = document.querySelector("#retry-count");
const overallScoreElement = document.querySelector("#overall-score");
const resultLabelElement = document.querySelector("#result-label");
const adviceCopyElement = document.querySelector("#advice-copy");
const resultStatusElement = document.querySelector("#result-status");
const homeButton = document.querySelector("#home-button");
const replayButton = document.querySelector("#replay-button");

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function asFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeStoredResult(source) {
  const fallback = RESULT_PAGE_CONFIG.fallbackResult;
  const result = source && typeof source === "object" ? source : fallback;
  const completedRoundsSource = result.completedRounds ?? result.totalRounds;

  return {
    firstAttemptCorrectRounds: Math.max(
      0,
      asFiniteNumber(result.firstAttemptCorrectRounds, fallback.firstAttemptCorrectRounds),
    ),
    completedRounds: Math.max(
      0,
      asFiniteNumber(completedRoundsSource, fallback.completedRounds),
    ),
    reactionTimesMs: Array.isArray(result.reactionTimesMs)
      ? result.reactionTimesMs
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value >= 0)
      : [...fallback.reactionTimesMs],
    retryCount: Math.max(
      0,
      Math.round(asFiniteNumber(result.retryCount, fallback.retryCount)),
    ),
  };
}

function readStoredResult() {
  try {
    const storedValue = sessionStorage.getItem(RESULT_PAGE_CONFIG.storageKey);
    return normalizeStoredResult(storedValue ? JSON.parse(storedValue) : null);
  } catch (_error) {
    return normalizeStoredResult(null);
  }
}

function calculateAccuracy(result) {
  if (result.completedRounds <= 0) return 0;
  return Math.round(
    clamp(
      (result.firstAttemptCorrectRounds / result.completedRounds) * 100,
      RESULT_PAGE_CONFIG.scoreRange.minimum,
      RESULT_PAGE_CONFIG.scoreRange.maximum,
    ),
  );
}

function calculateAverageReactionSeconds(reactionTimesMs) {
  if (reactionTimesMs.length === 0) return 0;
  const averageMilliseconds =
    reactionTimesMs.reduce((sum, time) => sum + time, 0) / reactionTimesMs.length;
  return averageMilliseconds / 1000;
}

function formatReactionSeconds(seconds) {
  const rounded = Math.round(seconds * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function getGrade(score) {
  return resultData.gradeCutoffs.find((cutoff) => score >= cutoff.min).grade;
}

function populateMetricLabels() {
  resultData.metrics.forEach((metric) => {
    const row = metricList.querySelector(`[data-metric="${metric.key}"]`);
    if (!row) return;
    row.querySelector("dt").textContent = metric.label;
    row.querySelector("small").textContent = metric.unit;
    row.dataset.scoreMetric = String(metric.isScore);
  });
}

function fitAdviceToOneLineEach() {
  const paragraphs = [...adviceCopyElement.querySelectorAll("p")];
  if (paragraphs.length === 0) return;

  adviceCopyElement.style.fontSize = `${REFERENCE_ADVICE_FONT_SIZE}px`;
}

function renderComments(grade) {
  const fragment = document.createDocumentFragment();
  resultData.comments[grade].forEach((comment) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = comment;
    fragment.append(paragraph);
  });
  adviceCopyElement.replaceChildren(fragment);
  fitAdviceToOneLineEach();
}

function fitStageToViewport() {
  const scale = Math.min(
    window.innerWidth / STAGE_SIZE.width,
    window.innerHeight / STAGE_SIZE.height,
  );
  const verticalExtra = Math.max(0, window.innerHeight / scale - STAGE_SIZE.height);

  stage.style.setProperty("--result-scale", String(scale));
  stage.style.height = `${STAGE_SIZE.height + verticalExtra}px`;

  RESPONSIVE_VERTICAL_ANCHORS.forEach(({ selector, y }) => {
    const element = document.querySelector(selector);
    const progress = clamp(
      (y - HEADER_BOTTOM_Y) / (STAGE_SIZE.height - HEADER_BOTTOM_Y),
      0,
      1,
    );
    element.style.top = `${y + verticalExtra * progress}px`;
  });
}

function renderResult() {
  const result = readStoredResult();
  const accuracy = calculateAccuracy(result);
  const reactionSeconds = calculateAverageReactionSeconds(result.reactionTimesMs);
  const formattedReactionSeconds = formatReactionSeconds(reactionSeconds);
  const grade = getGrade(accuracy);

  populateMetricLabels();
  accuracyScoreElement.textContent = String(accuracy);
  reactionTimeElement.textContent = formattedReactionSeconds;
  retryCountElement.textContent = String(result.retryCount);

  // 인과 정확도 하나가 우측 점수·등급·코멘트까지 모두 결정합니다.
  overallScoreElement.textContent = String(accuracy);
  resultLabelElement.textContent = grade;
  renderComments(grade);

  resultStatusElement.textContent =
    `인과 정확도 ${accuracy}점, 점수 등급 ${grade}. ` +
    `평균 반응 시간 ${formattedReactionSeconds}초, 재시도 ${result.retryCount}회입니다.`;
}

homeButton.addEventListener("click", () => {
  window.location.href = "../../?intro=restart";
});

replayButton.addEventListener("click", () => {
  try {
    sessionStorage.removeItem(RESULT_PAGE_CONFIG.storageKey);
  } catch (_error) {
    // 저장소를 사용할 수 없는 환경에서도 Lv1·1라운드부터 다시 시작합니다.
  }
  window.location.href = "./game.html?restart=1";
});

window.addEventListener(
  "resize",
  () => {
    fitStageToViewport();
    fitAdviceToOneLineEach();
  },
  { passive: true },
);

document.fonts?.ready.then(fitAdviceToOneLineEach);
renderResult();
fitStageToViewport();
