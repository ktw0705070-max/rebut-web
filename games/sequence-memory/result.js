const RESULT_PAGE_CONFIG = Object.freeze({
  storageKey: "rebut.sequence-memory.result.v1",
  scoreRange: Object.freeze({ minimum: 0, maximum: 100 }),
  metrics: Object.freeze([
    Object.freeze({ key: "accuracy", label: "순서 정확도", unit: "점" }),
    Object.freeze({ key: "reactionTime", label: "반응 시간", unit: "초" }),
    Object.freeze({ key: "retryCount", label: "재시도 횟수", unit: "회" }),
  ]),
  tiers: Object.freeze([
    Object.freeze({
      minimum: 85,
      maximum: 100,
      label: "선명해요",
      comments: Object.freeze([
        "당신의 기억은 아직 선명합니다.",
        "순서를 붙잡는 손끝에 망설임이 없었습니다.",
        "다만, 기록은 오늘의 것일 뿐입니다.",
        "지금의 감각을 유지하려면 꾸준한 자극이 필요합니다.",
        "전화번호나 일정을 외워서 떠올리는 습관을 이어가 보세요.",
      ]),
    }),
    Object.freeze({
      minimum: 70,
      maximum: 84,
      label: "견뎌냈어요",
      comments: Object.freeze([
        "당신의 기억은 아직 제 몫을 하고 있습니다.",
        "순서가 몇 번 흔들렸지만 이내 바로잡았습니다.",
        "끝까지 붙잡으려는 힘이 남아 있었습니다.",
        "긴 순서는 서너 개씩 끊어서 외우면 한결 수월합니다.",
        "하루 한 번, 오늘 있었던 일을 순서대로 떠올려 보세요.",
      ]),
    }),
    Object.freeze({
      minimum: 50,
      maximum: 69,
      label: "흐릿해요",
      comments: Object.freeze([
        "당신의 기억은 조금씩 흐려지고 있습니다.",
        "처음은 붙잡아도 뒤로 갈수록 자주 놓쳤습니다.",
        "순서의 끝자락이 손가락 끝에서 흩어졌습니다.",
        "메모에 기대기 전에 먼저 머릿속으로 되짚어 보세요.",
        "장보기 목록을 외워서 사 오는 연습이 도움이 됩니다.",
      ]),
    }),
    Object.freeze({
      minimum: 0,
      maximum: 49,
      label: "실망스러워요",
      comments: Object.freeze([
        "당신의 기억은 많이 흐려져 있습니다.",
        "방금 본 순서조차 이내 미끄러졌습니다.",
        "무엇을 먼저 보았는지 붙잡지 못했습니다.",
        "기억할 일을 AI에 맡기는 사이, 당신의 차례가 흐려지고 있습니다.",
        "짧은 순서부터 반복해 떠올리는 훈련을 매일 이어가 보세요.",
      ]),
    }),
  ]),
  fallbackResult: Object.freeze({
    firstAttemptCorrectCells: 32,
    totalSequenceCells: 100,
    reactionTimesMs: Object.freeze([2000]),
    retryCount: 5,
  }),
});

const MAIN_MENU_URL = "../../?intro=restart";

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const HEADER_BOTTOM_Y = 79;
const REFERENCE_ADVICE_FONT_SIZE = 27.5;
const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  { selector: ".result-title", y: 142 },
  { selector: ".result-panels", y: 279 },
  { selector: ".result-actions", y: 946 },
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

  return {
    firstAttemptCorrectCells: Math.max(
      0,
      asFiniteNumber(result.firstAttemptCorrectCells, fallback.firstAttemptCorrectCells),
    ),
    totalSequenceCells: Math.max(
      0,
      asFiniteNumber(result.totalSequenceCells, fallback.totalSequenceCells),
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
  } catch {
    return normalizeStoredResult(null);
  }
}

function calculateAccuracyScore(result) {
  if (result.totalSequenceCells <= 0) return 0;

  const score = (result.firstAttemptCorrectCells / result.totalSequenceCells) * 100;
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
    reactionTimesMs.reduce((sum, time) => sum + time, 0) / reactionTimesMs.length;
  return averageMilliseconds / 1000;
}

function formatReactionSeconds(seconds) {
  const rounded = Math.round(seconds * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function findTier(accuracyScore) {
  return (
    RESULT_PAGE_CONFIG.tiers.find(
      (tier) => accuracyScore >= tier.minimum && accuracyScore <= tier.maximum,
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
  const verticalExtra = Math.max(0, window.innerHeight / scale - STAGE_SIZE.height);

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
  const accuracyScore = calculateAccuracyScore(result);
  const reactionSeconds = calculateAverageReactionSeconds(result.reactionTimesMs);
  const formattedReactionSeconds = formatReactionSeconds(reactionSeconds);
  const tier = findTier(accuracyScore);

  populateMetricLabels();
  accuracyScoreElement.textContent = String(accuracyScore);
  reactionTimeElement.textContent = formattedReactionSeconds;
  retryCountElement.textContent = String(result.retryCount);

  // 우측 점수·등급·코멘트는 모두 이 순서 정확도 하나에서 파생됩니다.
  overallScoreElement.textContent = String(accuracyScore);
  resultLabelElement.textContent = tier.label;
  renderAdvice(tier);

  resultStatusElement.textContent =
    `순서 정확도 ${accuracyScore}점, 점수 등급 ${tier.label}. ` +
    `평균 반응 시간 ${formattedReactionSeconds}초, 재시도 ${result.retryCount}회입니다.`;
}

homeButton.addEventListener("click", () => {
  window.location.href = MAIN_MENU_URL;
});

replayButton.addEventListener("click", () => {
  try {
    sessionStorage.removeItem(RESULT_PAGE_CONFIG.storageKey);
  } catch {
    // 저장소를 사용할 수 없는 환경에서도 Lv1·1라운드부터 다시 시작합니다.
  }

  window.location.href = "./game.html?restart=1";
});

window.addEventListener("resize", () => {
  fitStageToViewport();
  fitAdviceToOneLineEach();
}, { passive: true });

document.fonts?.ready.then(fitAdviceToOneLineEach);
renderResult();
fitStageToViewport();
