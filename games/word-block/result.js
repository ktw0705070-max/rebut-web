const resultData = {
  metrics: [
    { key: "accuracy", label: "조립 정확도", unit: "점", isScore: true },
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
      "당신의 언어는 아직 또렷합니다.",
      "흩어진 조각을 정확히 이어 낱말을 완성했습니다.",
      "어떤 글자가 어디에 들어갈지 놓치지 않았습니다.",
      "다만, 쉬운 낱말일수록 손이 먼저 움직입니다.",
      "낱말 조각을 머릿속으로 맞춰 보는 습관을 이어가 보세요.",
    ],
    "견뎌냈어요": [
      "당신의 언어는 아직 제 몫을 합니다.",
      "몇 조각은 헤맸지만 결국 낱말을 맞춰 냈습니다.",
      "조각을 이어 붙이려는 힘이 남아 있었습니다.",
      "빈칸을 채우기 전 완성될 낱말을 먼저 떠올려 보세요.",
      "끝말잇기나 낱말 맞추기 놀이를 자주 해 보세요.",
    ],
    "흐릿해요": [
      "당신의 언어는 조금씩 흐려지고 있습니다.",
      "어떤 조각이 어디에 들어갈지 자주 헷갈렸습니다.",
      "낱말의 모양이 잘 떠오르지 않았습니다.",
      "조각을 하나씩 소리 내어 읽으며 맞춰 보세요.",
      "짧은 낱말부터 글자 순서대로 떠올리는 훈련이 도움이 됩니다.",
    ],
    "실망스러워요": [
      "당신의 언어는 많이 흐려져 있습니다.",
      "조각을 좀처럼 하나의 낱말로 잇지 못했습니다.",
      "완성될 낱말의 모양이 손에 잡히지 않았습니다.",
      "낱말을 AI에 맡기며 당신의 말이 흩어지고 있습니다.",
      "두세 글자의 짧은 낱말을 맞추는 연습부터 매일 이어가 보세요.",
    ],
  },
};

const RESULT_STORAGE_KEY = "rebut.word-block.result.v1";
const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const HEADER_BOTTOM_Y = 79;
const REFERENCE_ADVICE_FONT_SIZE = 27.5;
const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  { selector: ".result-title", y: 142 },
  { selector: ".result-panels", y: 279 },
  { selector: ".result-actions", y: 946 },
]);
const FALLBACK_RESULT = Object.freeze({ accuracy: 76, time: 14, retry: 3 });

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

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getGrade(score) {
  return resultData.gradeCutoffs.find((cutoff) => score >= cutoff.min).grade;
}

function normalizeResult(source) {
  const result = source && typeof source === "object" ? source : FALLBACK_RESULT;
  return {
    accuracy: Math.round(clamp(toFiniteNumber(result.accuracy, FALLBACK_RESULT.accuracy), 0, 100)),
    time: Math.max(0, toFiniteNumber(result.time, FALLBACK_RESULT.time)),
    retry: Math.max(0, Math.round(toFiniteNumber(result.retry, FALLBACK_RESULT.retry))),
  };
}

function readResult() {
  let storedResult = null;
  try {
    const storedValue = sessionStorage.getItem(RESULT_STORAGE_KEY);
    storedResult = storedValue ? JSON.parse(storedValue) : null;
  } catch {
    storedResult = null;
  }

  const result = normalizeResult(storedResult);
  const query = new URLSearchParams(window.location.search);
  ["accuracy", "time", "retry"].forEach((key) => {
    if (query.has(key)) result[key] = normalizeResult({ ...result, [key]: query.get(key) })[key];
  });
  return result;
}

function formatRawNumber(value) {
  const rounded = Math.round(value * 10) / 10;
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
  const scale = Math.min(window.innerWidth / STAGE_SIZE.width, window.innerHeight / STAGE_SIZE.height);
  const verticalExtra = Math.max(0, window.innerHeight / scale - STAGE_SIZE.height);
  stage.style.setProperty("--result-scale", scale);
  stage.style.height = `${STAGE_SIZE.height + verticalExtra}px`;

  RESPONSIVE_VERTICAL_ANCHORS.forEach(({ selector, y }) => {
    const element = document.querySelector(selector);
    const progress = clamp((y - HEADER_BOTTOM_Y) / (STAGE_SIZE.height - HEADER_BOTTOM_Y), 0, 1);
    element.style.top = `${y + verticalExtra * progress}px`;
  });
}

function renderResult() {
  const result = readResult();
  const grade = getGrade(result.accuracy);
  const formattedTime = formatRawNumber(result.time);

  populateMetricLabels();
  accuracyScoreElement.textContent = String(result.accuracy);
  reactionTimeElement.textContent = formattedTime;
  retryCountElement.textContent = String(result.retry);

  // 정확도 하나만이 등급과 다섯 줄 코멘트를 결정하는 단일 기준입니다.
  overallScoreElement.textContent = String(result.accuracy);
  resultLabelElement.textContent = grade;
  renderComments(grade);

  resultStatusElement.textContent =
    `조립 정확도 ${result.accuracy}점, 점수 등급 ${grade}. ` +
    `반응 시간 ${formattedTime}초, 재시도 ${result.retry}회입니다.`;
}

homeButton.addEventListener("click", () => {
  window.location.href = "../../?intro=restart";
});

replayButton.addEventListener("click", () => {
  try {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
  } catch {
    // 저장소를 사용할 수 없는 환경에서도 첫 단계부터 다시 시작합니다.
  }
  window.location.href = "./index.html?tutorial=0&level=1&restart=1";
});

window.addEventListener("resize", () => {
  fitStageToViewport();
  fitAdviceToOneLineEach();
}, { passive: true });

document.fonts?.ready.then(fitAdviceToOneLineEach);
window.resultData = resultData;
window.getGrade = getGrade;
renderResult();
fitStageToViewport();
