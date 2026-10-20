"use strict";

const RESULT_STORAGE_KEY = "rebut.bias-judgement.result.v1";

// 다른 게임에서는 이 객체의 지표·등급·코멘트만 교체합니다.
const resultData = {
  metrics: [
    { key: "accuracy", label: "분별 정확도", unit: "점", isScore: true },
    { key: "time", label: "반응 시간", unit: "초", isScore: false },
    { key: "retry", label: "재시도 횟수", unit: "회", isScore: false },
  ],
  gradeCutoffs: [
    { min: 85, grade: "선명해요" },
    { min: 70, grade: "견뎌냈어요" },
    { min: 50, grade: "흐릿해요" },
    { min: 0, grade: "실망스러워요" },
  ],
  comments: {
    "선명해요": [
      "당신의 판단은 아직 또렷합니다.",
      "한쪽으로 치우친 말을 정확히 가려냈습니다.",
      "그럴듯한 문장 뒤의 편향을 놓치지 않았습니다.",
      "다만, 내 생각과 같은 말일수록 편향은 더 잘 숨습니다.",
      "주장을 볼 때 \"반대쪽은 뭐라 할까\" 떠올려 보세요.",
    ],
    "견뎌냈어요": [
      "당신의 판단은 아직 제 몫을 합니다.",
      "몇 번은 넘어갔지만 결국 치우친 말을 짚어 냈습니다.",
      "중립과 편향을 가르는 힘이 남아 있었습니다.",
      "문장에 \"누구에게 유리한 말인가\"를 물어보세요.",
      "같은 사안을 다룬 두 글을 나란히 읽어 비교해 보세요.",
    ],
    "흐릿해요": [
      "당신의 판단은 조금씩 흐려지고 있습니다.",
      "치우친 말을 자주 그대로 받아들였습니다.",
      "무엇이 편향인지 좀처럼 가려내지 못했습니다.",
      "단정적인 표현이 나오면 한 번 멈춰 의심해 보세요.",
      "주장과 사실을 나눠 적어 보는 훈련이 도움이 됩니다.",
    ],
    "실망스러워요": [
      "당신의 판단은 많이 흐려져 있습니다.",
      "편향된 말과 중립적인 말을 좀처럼 구분하지 못했습니다.",
      "치우침을 의심해 볼 틈 없이 그대로 믿었습니다.",
      "판단을 AI에 맡기며 의심하는 힘이 무뎌집니다.",
      "한 문장의 편향부터 매일 판단해 보세요.",
    ],
  },
};

function getGrade(score) {
  return resultData.gradeCutoffs.find((cutoff) => score >= cutoff.min).grade;
}

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const HEADER_BOTTOM_Y = 79;
const REFERENCE_ADVICE_FONT_SIZE = 27.5;
const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  { selector: ".result-title", y: 142 },
  { selector: ".result-panels", y: 279 },
  { selector: ".result-actions", y: 946 },
]);
const FALLBACK_RESULT = Object.freeze({ accuracy: 0, time: 0, retry: 0 });

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

function normalizeResult(source) {
  const result = source && typeof source === "object" ? source : FALLBACK_RESULT;
  return {
    accuracy: Math.round(clamp(asFiniteNumber(result.accuracy), 0, 100)),
    time: Math.max(0, asFiniteNumber(result.time)),
    retry: Math.max(0, Math.round(asFiniteNumber(result.retry))),
  };
}

function readStoredResult() {
  try {
    const stored = sessionStorage.getItem(RESULT_STORAGE_KEY);
    return normalizeResult(stored ? JSON.parse(stored) : null);
  } catch {
    return normalizeResult(null);
  }
}

function formatSeconds(seconds) {
  const rounded = Math.round(seconds * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function populateMetricLabels() {
  resultData.metrics.forEach((metric) => {
    const row = metricList.querySelector(`[data-metric="${metric.key}"]`);
    if (!row) return;
    row.querySelector("dt").textContent = metric.label;
    row.querySelector("small").textContent = metric.unit;
  });
}

function fitAdviceToOneLineEach() {
  const paragraphs = [...adviceCopyElement.querySelectorAll("p")];
  if (!paragraphs.length) return;

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
  const grade = getGrade(result.accuracy);
  const formattedTime = formatSeconds(result.time);

  populateMetricLabels();
  accuracyScoreElement.textContent = String(result.accuracy);
  reactionTimeElement.textContent = formattedTime;
  retryCountElement.textContent = String(result.retry);

  // 분별 정확도 하나가 점수 등급과 5줄 코멘트를 함께 결정합니다.
  overallScoreElement.textContent = String(result.accuracy);
  resultLabelElement.textContent = grade;
  renderComments(grade);

  resultStatusElement.textContent =
    `분별 정확도 ${result.accuracy}점, 점수 등급 ${grade}. ` +
    `반응 시간 ${formattedTime}초, 재시도 ${result.retry}회입니다.`;
}

homeButton.addEventListener("click", () => {
  window.location.href = "../../?intro=restart";
});

replayButton.addEventListener("click", () => {
  try {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
  } catch {
    // 저장소를 사용할 수 없는 환경에서도 1-1부터 다시 시작합니다.
  }
  window.location.href = "./index.html?stage=1-1&tutorial=0&restart=1";
});

window.addEventListener("resize", () => {
  fitStageToViewport();
  fitAdviceToOneLineEach();
}, { passive: true });

document.fonts?.ready.then(fitAdviceToOneLineEach);
renderResult();
fitStageToViewport();
