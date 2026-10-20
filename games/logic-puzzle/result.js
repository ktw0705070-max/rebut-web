"use strict";

const resultData = Object.freeze({
  gradeCutoffs: Object.freeze([
    { min: 85, grade: "선명해요" },
    { min: 70, grade: "견뎌냈어요" },
    { min: 50, grade: "흐릿해요" },
    { min: 0, grade: "실망스러워요" },
  ]),
  comments: Object.freeze({
    "선명해요": [
      "대부분의 문제를 첫 배치에서 해결했습니다.",
      "조건에 맞는 순서를 정확히 찾았습니다.",
      "여러 관계를 연결해 배치를 완성했습니다.",
      "카드를 놓기 전 전체 순서를 떠올려 보세요.",
      "조건을 하나씩 확인하는 습관을 이어가세요.",
    ],
    "견뎌냈어요": [
      "대부분의 문제에서 순서를 정확히 찾았습니다.",
      "일부 문제에서는 배치를 다시 살펴봤습니다.",
      "여러 조건을 연결해 끝까지 완성했습니다.",
      "가장 큰 카드와 작은 카드부터 찾아보세요.",
      "남은 카드를 조건에 따라 차례로 놓아보세요.",
    ],
    "흐릿해요": [
      "여러 문제에서 배치를 다시 조정했습니다.",
      "첫 배치에서 일부 조건을 놓쳤습니다.",
      "순서를 고쳐 모든 문제를 완성했습니다.",
      "두 카드의 크기 관계부터 확인해 보세요.",
      "확인한 관계를 하나씩 이어 붙여 보세요.",
    ],
    "실망스러워요": [
      "많은 문제에서 배치를 다시 조정했습니다.",
      "첫 배치의 순서가 조건과 자주 달랐습니다.",
      "다시 시도해 모든 문제를 완성했습니다.",
      "크다와 작다의 방향부터 확인해 보세요.",
      "조건 한 개씩 읽고 카드 순서를 정해 보세요.",
    ],
  }),
});

// Keep the same coordinate system and typography as sentence-order/result.js.
const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const HEADER_BOTTOM_Y = 79;
const REFERENCE_ADVICE_FONT_SIZE = 27.5;
const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  Object.freeze({ selector: ".result-title", y: 142 }),
  Object.freeze({ selector: ".result-panels", y: 279 }),
  Object.freeze({ selector: ".result-actions", y: 946 }),
]);

const stage = document.querySelector("#result-stage");
const adviceCopy = document.querySelector("#advice-copy");
const resultStatus = document.querySelector("#result-status");

function getGrade(score) {
  return resultData.gradeCutoffs.find(cutoff => score >= cutoff.min).grade;
}

function renderResult() {
  const result = window.RebutLogicResults.read();
  const grade = result ? getGrade(result.accuracy) : "기록 없음";
  const time = result ? String(Math.round(result.time * 10) / 10) : "—";
  document.querySelector("#accuracy-score").textContent = result ? String(result.accuracy) : "—";
  document.querySelector("#reaction-time").textContent = time;
  document.querySelector("#retry-count").textContent = result ? String(result.retry) : "—";
  document.querySelector("#overall-score").textContent = result ? String(result.accuracy) : "—";
  document.querySelector("#result-label").textContent = grade;
  const comments = result ? resultData.comments[grade] : [
    "아직 완료한 게임 기록이 없습니다.",
    "아홉 문제를 마치면 결과가 표시됩니다.",
    "첫 배치의 정확도와 풀이 시간을 기록합니다.",
    "배치를 다시 시도한 횟수도 확인할 수 있습니다.",
    "다시하기를 눌러 STEP 1부터 시작해 보세요.",
  ];
  adviceCopy.replaceChildren(...comments.map(comment => {
    const paragraph = document.createElement("p");
    paragraph.textContent = comment;
    return paragraph;
  }));
  adviceCopy.style.fontSize = `${REFERENCE_ADVICE_FONT_SIZE}px`;
  resultStatus.textContent = result
    ? `논리 정확도 ${result.accuracy}점, ${grade}. 평균 풀이 시간 ${time}초, 재시도 ${result.retry}회. 이번 게임의 수행 기록입니다.`
    : "완료한 게임 기록이 없습니다. 다시하기를 눌러 게임을 시작하세요.";
}

function fitStageToViewport() {
  const scale = Math.min(window.innerWidth / STAGE_SIZE.width, window.innerHeight / STAGE_SIZE.height);
  const verticalExtra = Math.max(0, window.innerHeight / scale - STAGE_SIZE.height);
  stage.style.setProperty("--result-scale", String(scale));
  stage.style.height = `${STAGE_SIZE.height + verticalExtra}px`;
  RESPONSIVE_VERTICAL_ANCHORS.forEach(({ selector, y }) => {
    const progress = Math.min(1, Math.max(0, (y - HEADER_BOTTOM_Y) / (STAGE_SIZE.height - HEADER_BOTTOM_Y)));
    document.querySelector(selector).style.top = `${y + verticalExtra * progress}px`;
  });
}

document.querySelector("#home-button").addEventListener("click", () => {
  window.location.href = "../../?intro=restart";
});
document.querySelector("#replay-button").addEventListener("click", () => {
  window.RebutLogicResults.clear();
  window.location.href = "./index.html?restart=1";
});

window.addEventListener("resize", fitStageToViewport, { passive: true });
window.addEventListener("pageshow", renderResult);
renderResult();
fitStageToViewport();
