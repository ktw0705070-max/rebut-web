"use strict";

// 지표 배열, 등급 기준, 등급별 5줄 코멘트를 한 객체에서 관리합니다.
const RESULT_PAGE_CONFIG = Object.freeze({
  storageKey: "rebut.keyword-restore.result.v1",
  scoreRange: Object.freeze({ minimum: 0, maximum: 100 }),
  metrics: Object.freeze([
    Object.freeze({ key: "restorationAccuracy", label: "복원 정확도", unit: "점" }),
    Object.freeze({ key: "reactionTime", label: "반응 시간", unit: "초" }),
    Object.freeze({ key: "retryCount", label: "재시도 횟수", unit: "회" }),
  ]),
  tiers: Object.freeze([
    Object.freeze({
      minimum: 85,
      maximum: 100,
      label: "선명해요",
      comments: Object.freeze([
        "당신의 기억은 아직 또렷합니다.",
        "사라진 낱말을 어렵지 않게 되살렸습니다.",
        "다만, 오늘 붙잡은 말이 내일도 남지는 않습니다.",
        "읽은 문장을 되뇌는 습관이 이 힘을 지킵니다.",
        "방금 들은 말을 그대로 옮겨 보는 연습을 이어가 보세요.",
      ]),
    }),
    Object.freeze({
      minimum: 70,
      maximum: 84,
      label: "견뎌냈어요",
      comments: Object.freeze([
        "당신의 기억은 아직 제 몫을 합니다.",
        "몇 낱말은 놓쳤지만 문장의 결은 붙잡았습니다.",
        "빈자리를 메우려는 힘이 남아 있었습니다.",
        "문장을 통째로 외우기보다 핵심 낱말을 잡아 보세요.",
        "하루 한 문장을 외웠다 그대로 적어 보세요.",
      ]),
    }),
    Object.freeze({
      minimum: 50,
      maximum: 69,
      label: "흐릿해요",
      comments: Object.freeze([
        "당신의 기억은 조금씩 흐려지고 있습니다.",
        "어떤 낱말이 있었는지 자주 헷갈렸습니다.",
        "방금 읽은 말이 금세 빠져나갔습니다.",
        "긴 문장은 짧게 끊어 읽는 것이 도움이 됩니다.",
        "짧은 문장을 외웠다 떠올리는 훈련을 해 보세요.",
      ]),
    }),
    Object.freeze({
      minimum: 0,
      maximum: 49,
      label: "실망스러워요",
      comments: Object.freeze([
        "당신의 기억은 많이 흐려져 있습니다.",
        "어떤 낱말이 사라졌는지 좀처럼 찾지 못했습니다.",
        "방금 본 문장조차 손에 남지 않았습니다.",
        "기억할 말을 AI에 맡기는 사이, 당신의 말이 흐려지고 있습니다.",
        "두세 낱말의 짧은 문장부터 외우는 훈련을 매일 이어가 보세요.",
      ]),
    }),
  ]),
  fallbackResult: Object.freeze({
    firstAttemptCorrectRounds: 3,
    completedRounds: 9,
    reactionTimesMs: Object.freeze([2000]),
    retryCount: 5,
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
  const completedRounds = asFiniteNumber(
    result.completedRounds ?? result.totalRounds,
    fallback.completedRounds,
  );

  return {
    firstAttemptCorrectRounds: Math.max(
      0,
      asFiniteNumber(
        result.firstAttemptCorrectRounds,
        fallback.firstAttemptCorrectRounds,
      ),
    ),
    completedRounds: Math.max(0, completedRounds),
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
  } catch {
    return normalizeStoredResult(null);
  }
}

function calculateRestorationAccuracy(result) {
  if (result.completedRounds <= 0) return 0;

  const score =
    (result.firstAttemptCorrectRounds / result.completedRounds) * 100;
  return Math.round(
    clamp(
      score,
      RESULT_PAGE_CONFIG.scoreRange.minimum,
      RESULT_PAGE_CONFIG.scoreRange.maximum,
    ),
  );
}

function calculateAverageReactionSeconds(reactionTimesMs) {
  if (reactionTimesMs.length === 0) return 0;

  const averageMilliseconds =
    reactionTimesMs.reduce((sum, time) => sum + time, 0) /
    reactionTimesMs.length;
  return averageMilliseconds / 1000;
}

function formatReactionSeconds(seconds) {
  const rounded = Math.round(seconds * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function findTier(restorationAccuracy) {
  return (
    RESULT_PAGE_CONFIG.tiers.find(
      (tier) =>
        restorationAccuracy >= tier.minimum &&
        restorationAccuracy <= tier.maximum,
    ) || RESULT_PAGE_CONFIG.tiers.at(-1)
  );
}

function populateMetricLabels() {
  RESULT_PAGE_CONFIG.metrics.forEach((metric) => {
    const row = metricList.querySelector(`[data-metric="${metric.key}"]`);
    if (!row) return;
    row.querySelector("dt").textContent = metric.label;
    row.querySelector("small").textContent = metric.unit;
  });
}

function fitAdviceToOneLineEach() {
  const paragraphs = [...adviceCopyElement.querySelectorAll("p")];
  if (paragraphs.length === 0) return;

  adviceCopyElement.style.fontSize = `${REFERENCE_ADVICE_FONT_SIZE}px`;
}

function renderAdvice(tier) {
  const fragment = document.createDocumentFragment();

  tier.comments.forEach((comment) => {
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
  const verticalExtra = Math.max(
    0,
    window.innerHeight / scale - STAGE_SIZE.height,
  );

  stage.style.setProperty("--result-scale", scale);
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
  const restorationAccuracy = calculateRestorationAccuracy(result);
  const reactionSeconds = calculateAverageReactionSeconds(
    result.reactionTimesMs,
  );
  const formattedReactionSeconds = formatReactionSeconds(reactionSeconds);
  const tier = findTier(restorationAccuracy);

  populateMetricLabels();
  accuracyScoreElement.textContent = String(restorationAccuracy);
  reactionTimeElement.textContent = formattedReactionSeconds;
  retryCountElement.textContent = String(result.retryCount);

  // 우측 점수·등급·5줄 코멘트는 모두 좌측 복원 정확도 하나에서 파생됩니다.
  overallScoreElement.textContent = String(restorationAccuracy);
  resultLabelElement.textContent = tier.label;
  renderAdvice(tier);

  resultStatusElement.textContent =
    `복원 정확도 ${restorationAccuracy}점, 점수 등급 ${tier.label}. ` +
    `평균 반응 시간 ${formattedReactionSeconds}초, 재시도 ${result.retryCount}회입니다.`;
}

homeButton.addEventListener("click", () => {
  window.location.href = "../../?intro=restart";
});

replayButton.addEventListener("click", () => {
  try {
    sessionStorage.removeItem(RESULT_PAGE_CONFIG.storageKey);
  } catch {
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
