const RESULT_STORAGE_KEY = "rebut.hidden-weight.result.v1";

const resultData = Object.freeze({
  metrics: Object.freeze([
    Object.freeze({ key: "accuracy", label: "판정 정확도", unit: "점", isScore: true }),
    Object.freeze({ key: "time", label: "반응 시간", unit: "초", isScore: false }),
    Object.freeze({ key: "efficiency", label: "추론 효율", unit: "%", isScore: false }),
  ]),
  gradeCutoffs: Object.freeze([
    Object.freeze({ min: 85, grade: "선명해요" }),
    Object.freeze({ min: 70, grade: "견뎌냈어요" }),
    Object.freeze({ min: 50, grade: "흐릿해요" }),
    Object.freeze({ min: 0, grade: "실망스러워요" }),
  ]),
  comments: Object.freeze({
    "선명해요": Object.freeze([
      "당신의 판단은 아직 또렷합니다.",
      "눈에 보이지 않는 무게를 정확히 가려냈습니다.",
      "성급히 고르지 않고 끝까지 따져 물었습니다.",
      "다만, 오늘의 판단이 늘 옳지는 않습니다.",
      "답을 정하기 전 한 번 더 견주는 습관을 이어가 보세요.",
    ]),
    "견뎌냈어요": Object.freeze([
      "당신의 판단은 아직 제 몫을 합니다.",
      "몇 번은 헷갈렸지만 결국 무게를 가려냈습니다.",
      "근거를 견주려는 힘이 남아 있었습니다.",
      "한쪽만 보지 말고 양쪽을 나란히 놓고 비교해 보세요.",
      "결정 전 \"왜 그런가\"를 스스로 물어보는 연습을 해 보세요.",
    ]),
    "흐릿해요": Object.freeze([
      "당신의 판단은 조금씩 흐려지고 있습니다.",
      "무엇이 더 무거운지 자주 헷갈렸습니다.",
      "겉으로 보이는 것에 쉽게 이끌렸습니다.",
      "눈에 보이는 크기보다 실제 근거를 따져 보세요.",
      "작은 선택부터 스스로 이유를 대는 훈련이 도움이 됩니다.",
    ]),
    "실망스러워요": Object.freeze([
      "당신의 판단은 많이 흐려져 있습니다.",
      "무엇이 무거운지 좀처럼 가려내지 못했습니다.",
      "따져 보기도 전에 답을 내려 버렸습니다.",
      "판단을 AI에 맡기는 사이, 스스로 재는 힘이 무뎌지고 있습니다.",
      "무엇이든 고르기 전 두 번 견주는 습관을 매일 이어가 보세요.",
    ]),
  }),
});

const DEFAULT_RESULT = Object.freeze({
  accuracy: 76,
  time: 18.4,
  efficiency: 75,
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
const overallScore = document.querySelector("#overall-score");
const resultLabel = document.querySelector("#result-label");
const adviceCopy = document.querySelector("#advice-copy");
const resultStatus = document.querySelector("#result-status");
const homeButton = document.querySelector("#home-button");
const replayButton = document.querySelector("#replay-button");

function getGrade(score) {
  return resultData.gradeCutoffs.find((cutoff) => score >= cutoff.min).grade;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function readResult() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(RESULT_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return { ...DEFAULT_RESULT };
    return {
      accuracy: clamp(toFiniteNumber(saved.accuracy, DEFAULT_RESULT.accuracy), 0, 100),
      time: Math.max(0, toFiniteNumber(saved.time, DEFAULT_RESULT.time)),
      efficiency: clamp(toFiniteNumber(saved.efficiency, DEFAULT_RESULT.efficiency), 0, 100),
    };
  } catch {
    return { ...DEFAULT_RESULT };
  }
}

function formatMetric(metric, value) {
  if (metric.key === "time") return value.toFixed(1).replace(/\.0$/, "");
  return String(Math.round(value));
}

function renderMetrics(values) {
  metricList.replaceChildren(
    ...resultData.metrics.map((metric, index) => {
      const row = document.createElement("div");
      row.className = `metric-row ${["metric-row-accuracy", "metric-row-reaction", "metric-row-retries"][index]}`;
      row.dataset.metric = metric.key;

      const label = document.createElement("dt");
      label.textContent = metric.label;

      const value = document.createElement("dd");
      const number = document.createElement("span");
      number.textContent = formatMetric(metric, values[metric.key]);
      const unit = document.createElement("small");
      unit.textContent = metric.unit;
      value.append(number, unit);
      row.append(label, value);
      return row;
    }),
  );
}

function fitAdviceToOneLineEach() {
  const lines = [...adviceCopy.querySelectorAll("p")];
  if (lines.length === 0) return;

  adviceCopy.style.fontSize = `${REFERENCE_ADVICE_FONT_SIZE}px`;
}

function renderResult() {
  const values = readResult();
  const grade = getGrade(values.accuracy);

  renderMetrics(values);
  overallScore.textContent = String(Math.round(values.accuracy));
  resultLabel.textContent = grade;
  adviceCopy.replaceChildren(
    ...resultData.comments[grade].map((comment) => {
      const line = document.createElement("p");
      line.textContent = comment;
      return line;
    }),
  );
  fitAdviceToOneLineEach();
  resultStatus.textContent = `판정 정확도 ${Math.round(values.accuracy)}점, 점수 등급 ${grade}`;
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

homeButton.addEventListener("click", () => {
  window.location.href = "../../?intro=restart";
});

replayButton.addEventListener("click", () => {
  sessionStorage.removeItem(RESULT_STORAGE_KEY);
  window.location.href = "./game.html?restart=1";
});

window.addEventListener("resize", () => {
  fitStageToViewport();
  fitAdviceToOneLineEach();
}, { passive: true });

window.REBUT_HIDDEN_WEIGHT_RESULT = Object.freeze({
  resultData,
  getGrade,
  storageKey: RESULT_STORAGE_KEY,
});

renderResult();
fitStageToViewport();
document.fonts?.ready.then(fitAdviceToOneLineEach);
