"use strict";

const resultData = Object.freeze({
  storageKey: "rebut.awkward-sentence.result.v1",
  metrics: Object.freeze([
    Object.freeze({ key: "accuracy", label: "판별 정확도", unit: "점", isScore: true }),
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
      "당신의 언어 감각은 아직 또렷합니다.",
      "매끄러운 말 속에서 어긋난 문장을 정확히 골라냈습니다.",
      "귀에 걸리는 표현을 놓치지 않았습니다.",
      "다만, 익숙한 문장일수록 어색함은 더 잘 숨습니다.",
      "글을 소리 내어 읽고 걸리는 곳을 짚어 보세요.",
    ]),
    "견뎌냈어요": Object.freeze([
      "당신의 언어 감각은 아직 제 몫을 합니다.",
      "몇 번은 지나쳤지만 결국 어색한 문장을 찾아냈습니다.",
      "자연스러운 말과 어긋난 말을 가르는 힘이 남아 있었습니다.",
      "문장을 읽을 때 \"이 말이 자연스러운가\"를 되물어 보세요.",
      "짧은 글에서 어색한 표현을 고쳐 써 보는 연습을 해 보세요.",
    ]),
    "흐릿해요": Object.freeze([
      "당신의 언어 감각은 조금씩 흐려지고 있습니다.",
      "어색한 문장을 자주 그냥 지나쳤습니다.",
      "무엇이 어긋났는지 좀처럼 짚어 내지 못했습니다.",
      "문장을 끝까지 천천히 읽으며 걸리는 곳을 찾아보세요.",
      "하루 한 문장을 소리 내어 읽고 다듬는 훈련이 도움이 됩니다.",
    ]),
    "실망스러워요": Object.freeze([
      "당신의 언어 감각은 많이 흐려져 있습니다.",
      "어긋난 문장을 좀처럼 가려내지 못했습니다.",
      "어색한 말과 자연스러운 말의 경계가 손에 잡히지 않았습니다.",
      "말을 AI에 맡기며 언어 감각이 무뎌지고 있습니다.",
      "짧은 문장의 어색한 곳부터 매일 찾아보세요.",
    ]),
  }),
  fallbackResult: Object.freeze({
    firstAttemptCorrectRounds: 32,
    completedRounds: 100,
    reactionTimesMs: Object.freeze([2000]),
    retryCount: 5,
  }),
});

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

function getGrade(score) {
  return resultData.gradeCutoffs.find((cutoff) => score >= cutoff.min).grade;
}

function normalizeStoredResult(source) {
  const fallback = resultData.fallbackResult;
  const stored = source && typeof source === "object" ? source : fallback;
  const directAccuracy = Number(stored.accuracy);
  const directTime = Number(stored.time);

  return {
    accuracy: Number.isFinite(directAccuracy)
      ? clamp(directAccuracy, 0, 100)
      : null,
    firstAttemptCorrectRounds: Math.max(
      0,
      asFiniteNumber(
        stored.firstAttemptCorrectRounds,
        fallback.firstAttemptCorrectRounds,
      ),
    ),
    completedRounds: Math.max(
      0,
      asFiniteNumber(
        stored.completedRounds ?? stored.totalRounds,
        fallback.completedRounds,
      ),
    ),
    time: Number.isFinite(directTime) && directTime >= 0 ? directTime : null,
    reactionTimesMs: Array.isArray(stored.reactionTimesMs)
      ? stored.reactionTimesMs
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value >= 0)
      : [...fallback.reactionTimesMs],
    retry: Math.max(
      0,
      Math.round(asFiniteNumber(stored.retry ?? stored.retryCount, fallback.retryCount)),
    ),
  };
}

function readStoredResult() {
  try {
    const storedValue = sessionStorage.getItem(resultData.storageKey);
    return normalizeStoredResult(storedValue ? JSON.parse(storedValue) : null);
  } catch {
    return normalizeStoredResult(null);
  }
}

function calculateAccuracy(result) {
  if (result.accuracy !== null) return Math.round(result.accuracy);
  if (result.completedRounds <= 0) return 0;

  return Math.round(
    clamp(
      (result.firstAttemptCorrectRounds / result.completedRounds) * 100,
      0,
      100,
    ),
  );
}

function calculateRawReactionSeconds(result) {
  if (result.time !== null) return result.time;
  if (result.reactionTimesMs.length === 0) return 0;

  const averageMilliseconds =
    result.reactionTimesMs.reduce((sum, value) => sum + value, 0) /
    result.reactionTimesMs.length;
  return averageMilliseconds / 1000;
}

function formatRawSeconds(seconds) {
  return String(Math.round(seconds * 100) / 100);
}

function populateMetrics(values) {
  resultData.metrics.forEach((metric) => {
    const row = metricList.querySelector(`[data-metric="${metric.key}"]`);
    if (!row) return;

    row.querySelector("dt").textContent = metric.label;
    row.querySelector("dd span").textContent = String(values[metric.key]);
    row.querySelector("small").textContent = metric.unit;
  });
}

function fitAdviceToOneLineEach() {
  const paragraphs = [...adviceCopyElement.querySelectorAll("p")];
  if (paragraphs.length === 0) return;

  adviceCopyElement.style.fontSize = `${REFERENCE_ADVICE_FONT_SIZE}px`;
  paragraphs.forEach((paragraph) => {
    paragraph.style.transform = "none";
  });
}

function renderAdvice(grade) {
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
  const storedResult = readStoredResult();
  const accuracy = calculateAccuracy(storedResult);
  const time = formatRawSeconds(calculateRawReactionSeconds(storedResult));
  const retry = storedResult.retry;
  const grade = getGrade(accuracy);

  populateMetrics({ accuracy, time, retry });

  // 정확도 한 값만 등급과 코멘트의 단일 기준으로 사용합니다.
  overallScoreElement.textContent = String(accuracy);
  resultLabelElement.textContent = grade;
  renderAdvice(grade);

  resultStatusElement.textContent =
    `판별 정확도 ${accuracy}점, 점수 등급 ${grade}. ` +
    `평균 반응 시간 ${time}초, 재시도 ${retry}회입니다.`;
}

homeButton.addEventListener("click", () => {
  window.location.href = "../../?intro=restart";
});

replayButton.addEventListener("click", () => {
  try {
    sessionStorage.removeItem(resultData.storageKey);
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
