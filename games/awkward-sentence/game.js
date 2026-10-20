"use strict";

const GUIDE_COPY = "먼저, 글을 천천히 읽으세요.\n그다음, 어색한 문장을 찾아 지우세요.";
const PROGRESS_DIGIT_ASSET = "../sentence-order/assets/round-digit-";
const IS_TUTORIAL_BACKGROUND = new URLSearchParams(window.location.search).get("tutorial-bg") === "1";

const GAME_SETTINGS = Object.freeze({
  TOTAL_LEVELS: 3,
  ROUNDS_PER_LEVEL: 3,
  MAX_WRONG_ATTEMPTS: 2,
});

// 판정·피드백·문단 전환·레벨 전환의 모든 시간(ms)은 이 상수에서 조정합니다.
const TIMINGS = Object.freeze({
  PICK_PRESS_MS: 100,
  WRONG_SHAKE_MS: 200,
  WRONG_PAUSE_MS: 320,
  ANSWER_REVEAL_MS: 420,
  SENTENCE_ERASE_MS: 500,
  ROUND_CLEAR_HOLD_MS: 350,
  LOCK_UNLOCK_MS: 700,
  LOCK_UNLOCK_HOLD_MS: 550,
  ROUND_ERASE_MS: 500,
  ROUND_WRITE_MS: 800,
  LOGO_WAVE_MS: 1000,
  LOGO_WAVE_LETTER_MS: 660,
  LOGO_WAVE_STAGGER_MS: 85,
  HELP_VISIBLE_MS: 5000,
  LEVEL_BACKDROP_LEAD_MS: 200,
  LEVEL_FADE_IN_MS: 600,
  LEVEL_HOLD_MS: 1200,
  LEVEL_FADE_OUT_MS: 800,
});

function puzzle(hint, answerIndex, sentences, layout = "single", flowBreaks = []) {
  return Object.freeze({
    description: GUIDE_COPY,
    hint,
    answerIndex,
    layout,
    flowBreaks: Object.freeze(
      flowBreaks.map(([sentenceIndex, wordIndex]) => Object.freeze([sentenceIndex, wordIndex])),
    ),
    sentences: Object.freeze(sentences.slice()),
  });
}

// 각 라운드의 문단·정답 위치·힌트·설명을 하나의 고정 세트로 묶습니다.
const GAME_DATA = Object.freeze({
  1: Object.freeze([
    puzzle("소풍과 상관없는 문장을 찾아보세요.", 6, [
      "아침에 일어나 창밖을 보니 날씨가 맑았다.",
      "엄마가 김밥을 싸주셔서 가방에 챙겨 넣었다.",
      "오늘은 반 친구들과 공원으로 소풍을 가는 날이었다.",
      "나는 설레는 마음으로 집을 나섰다.",
      "하늘에는 구름 한 점 없이 파랬다.",
      "버스를 타고 삼십 분쯤 달려 공원에 도착했다.",
      "컴퓨터는 여러 부품으로 이루어져 작동한다.",
      "친구들과 넓은 잔디밭에 돗자리를 폈다.",
      "여기저기서 웃음소리가 들려왔다.",
      "다 같이 김밥을 나눠 먹고 술래잡기를 했다.",
      "배가 부르니 나른해지기도 했다.",
      "즐거운 하루가 금방 지나갔다.",
    ]),
    puzzle("산책의 흐름과 관계없는 자연 현상을 찾아보세요.", 5, [
      "저녁을 먹고 나서 강아지와 산책을 나갔다.",
      "목줄을 채우자 강아지가 신나서 꼬리를 흔들었다.",
      "우리는 동네 공원을 천천히 한 바퀴 돌았다.",
      "강아지는 풀냄새를 맡느라 자꾸 멈춰 섰다.",
      "가로등이 하나둘 켜지기 시작했다.",
      "화산이 터지면 뜨거운 용암이 흘러나온다.",
      "강아지는 다른 강아지를 만나 반갑게 인사했다.",
      "나는 벤치에 앉아 잠시 쉬었다.",
      "집으로 돌아오니 강아지가 물을 벌컥벌컥 마셨다.",
      "발을 닦아 주자 얌전히 기다렸다.",
      "오늘도 즐거운 산책이었다.",
    ]),
    puzzle("김장하는 장면 사이에 다른 이동 장면이 하나 있어요.", 6, [
      "주말에 온 가족이 모여 김장을 하기로 했다.",
      "엄마가 아침 일찍 배추를 소금에 절여 두셨다.",
      "오후가 되자 절인 배추가 알맞게 숨이 죽었다.",
      "우리는 마당에 큰 대야를 펼쳐 놓았다.",
      "고춧가루와 마늘로 양념을 만들었다.",
      "다 함께 둘러앉아 배추에 양념을 발랐다.",
      "비행기는 활주로를 달리다 하늘로 떠오른다.",
      "할머니가 갓 버무린 김치를 입에 넣어 주셨다.",
      "매콤하면서도 시원한 맛이 났다.",
      "김치를 통에 차곡차곡 담아 정리했다.",
      "온 가족이 힘을 합치니 금방 끝났다.",
      "저녁에는 수육과 함께 김치를 맛보았다.",
    ]),
  ]),
  2: Object.freeze([
    puzzle("할머니 댁에서 겪은 일과 다른 문장을 찾아보세요.", 7, [
      "주말에 가족과 함께 시골 할머니 댁에 놀러 갔다.",
      "차로 두 시간을 달려 도착하니 점심때가 지나 있었다.",
      "오랜만에 뵙는 할머니는 대문 앞까지 나오셔서 반갑게 맞아주셨다.",
      "마당에는 낯익은 강아지가 꼬리를 흔들며 뛰어나왔다.",
      "마당 한쪽에는 빨간 고추가 널려 말라가고 있었다.",
      "할머니는 텃밭에서 직접 기른 채소로 저녁상을 차려주셨다.",
      "상추와 고추는 방금 딴 것이라 아주 싱싱했다.",
      "요즘 도시에서는 스마트팜으로 작물을 사철 기른다.",
      "된장찌개에서는 구수한 냄새가 풍겼다.",
      "온 가족이 둘러앉아 배부르게 저녁을 먹었다.",
      "식사 후에는 할머니와 마루에 앉아 옛날이야기를 나눴다.",
      "어릴 적 이야기를 듣다 보니 시간 가는 줄 몰랐다.",
      "밤하늘에는 별이 유난히 많았다.",
      "밤이 깊어서야 아쉬운 마음으로 집으로 돌아왔다.",
    ], "spread", [[0, 6], [4, 5], [4, 6], [9, 2], [9, 5], [13, 4]]),
    puzzle("여행 이야기와 어울리지 않는 설명을 찾아보세요.", 7, [
      "주말에 친구들과 함께 동해로 바다 여행을 떠났다.",
      "기차를 타고 세 시간을 달려 바닷가 마을에 도착했다.",
      "숙소에 짐을 풀자마자 우리는 해변으로 달려 나갔다.",
      "파도가 하얗게 부서지며 발밑까지 밀려왔다.",
      "멀리 수평선 위로 갈매기들이 한가롭게 날았다.",
      "점심으로는 항구 근처 식당에서 싱싱한 회를 먹었다.",
      "방금 잡아 올린 생선이라 살이 탱탱하고 고소했다.",
      "바닷물을 증발시키면 하얀 소금을 얻을 수 있다.",
      "우리는 배불리 먹고 다시 해변을 거닐었다.",
      "모래사장에 앉아 조개껍데기를 주우며 놀았다.",
      "하루 종일 걸었더니 다리가 뻐근했다.",
      "저녁에는 숙소 앞 모래밭에서 불꽃놀이를 구경했다.",
      "밤바다에 비친 불빛이 무척 아름다웠다.",
      "파도 소리를 들으며 도란도란 이야기를 나눴다.",
      "아쉬운 마음을 안고 다음 날 집으로 돌아왔다.",
    ], "spread", [[0, 5], [1, 5], [4, 2], [4, 5], [10, 3], [10, 4], [11, 4], [14, 5]]),
    puzzle("직접 겪은 일이 아닌 문장 하나를 찾아보세요.", 7, [
      "가을을 맞아 아버지와 함께 가까운 산에 오르기로 했다.",
      "이른 아침에 도시락을 챙겨 등산로 입구에 도착했다.",
      "단풍이 곱게 물들어 온 산이 붉게 빛났다.",
      "우리는 천천히 발걸음을 옮기며 산을 올랐다.",
      "맑은 공기를 마시니 가슴이 탁 트이는 듯했다.",
      "중턱에 이르자 시원한 계곡물이 흐르고 있었다.",
      "우리는 잠시 앉아 준비해 온 도시락을 먹었다.",
      "나무는 햇빛을 받아 광합성으로 양분을 만든다.",
      "아버지는 예전에 이 산을 자주 오르셨다고 하셨다.",
      "옛날이야기를 들으며 걷다 보니 힘든 줄도 몰랐다.",
      "정상에 다다르니 마을 전체가 한눈에 내려다보였다.",
      "내려오는 길에는 다리가 조금 후들거렸다.",
      "그래도 마음만은 어느 때보다 상쾌했다.",
      "산 아래 식당에서 따뜻한 국수로 몸을 녹였다.",
      "아버지와 함께한 하루가 오래 기억에 남을 것 같았다.",
    ], "spread", [[4, 6], [10, 3], [10, 5], [13, 6]]),
  ]),
  3: Object.freeze([
    puzzle("직접 겪은 일이 아닌 문장을 찾아보세요.", 10, [
      "지난여름 우리 가족은 오랜만에 바닷가로 여행을 떠났다.",
      "다 함께 가는 여행이 얼마 만인지 모두 들뜬 마음이었다.",
      "차 안에서는 신나는 노래를 크게 틀어 놓고 다 같이 따라 불렀다.",
      "창밖 풍경이 점점 바다에 가까워지고 있었다.",
      "세 시간을 달려 숙소에 도착해 짐을 풀었다.",
      "창문을 여니 저 멀리 파란 바다가 한눈에 들어왔다.",
      "짭조름한 바다 냄새가 코끝에 스쳤다.",
      "우리는 서둘러 수영복으로 갈아입고 해변으로 달려 나갔다.",
      "파도가 시원하게 밀려왔고 모래는 발밑에서 부드럽게 부서졌다.",
      "나는 튜브를 타고 물 위를 둥둥 떠다녔다.",
      "바닷물은 오래 햇볕을 받으면 하얀 소금만 남는다고 한다.",
      "동생은 모래성을 쌓느라 온 얼굴에 모래를 묻히고도 신이 났다.",
      "한참을 놀다 보니 어느새 해가 붉게 기울고 있었다.",
      "저녁에는 숙소 근처 식당에서 회를 먹었다.",
      "방금 잡아 올린 생선이라 살이 탱탱하고 고소했다.",
      "바다를 보며 먹는 저녁은 유난히 더 맛있게 느껴졌다.",
      "파도 소리가 식사 내내 잔잔하게 들려왔다.",
      "다음 날, 우리는 아쉬운 마음으로 짐을 챙겼다.",
      "바다를 한 번 더 눈에 담고 집으로 향했다.",
    ], "spread-full", [[0, 4], [1, 4], [2, 1], [4, 5], [7, 6], [9, 4], [12, 6], [12, 7], [13, 5], [16, 5]]),
    puzzle("캠핑 이야기와 결이 다른 문장은 무엇일까요?", 10, [
      "가을 연휴를 맞아 친구들과 함께 산속 캠핑장으로 떠났다.",
      "오랜만의 캠핑이라 다들 며칠 전부터 짐을 꾸리며 들떠 있었다.",
      "차를 타고 구불구불한 산길을 한참 올라갔다.",
      "창밖으로 울긋불긋 물든 단풍이 스쳐 지나갔다.",
      "캠핑장에 도착하자마자 우리는 텐트를 치기 시작했다.",
      "처음엔 서툴러 기둥을 몇 번이나 다시 세웠다.",
      "텐트를 다 치고 나니 이마에 땀이 송골송골 맺혔다.",
      "그래도 우리 손으로 완성했다는 뿌듯함이 밀려왔다.",
      "해가 지자 우리는 모닥불을 피우고 둘러앉았다.",
      "불빛에 비친 서로의 얼굴을 보며 도란도란 이야기를 나눴다.",
      "하늘에 반짝이는 별은 사실 아주 뜨겁게 타오르고 있다고 한다.",
      "누군가 가져온 기타로 노래를 부르기도 했다.",
      "고구마를 은박지에 싸서 불 속에 넣어 두었다.",
      "한참 뒤 잘 익은 고구마를 꺼내 호호 불며 나눠 먹었다.",
      "달콤하고 따끈한 맛에 모두 감탄했다.",
      "밤이 깊도록 이야기는 끝날 줄 몰랐다.",
      "텐트에 누우니 풀벌레 소리가 자장가처럼 들렸다.",
      "다음 날 아침, 우리는 텐트를 걷고 짐을 정리했다.",
      "상쾌한 공기를 마지막으로 들이마시고 산을 내려왔다.",
    ], "spread-full", [[2, 1], [3, 5], [5, 4], [7, 5], [9, 5], [11, 0], [12, 6], [13, 7], [16, 4], [16, 5]]),
    puzzle("눈 오는 하루와 어울리지 않는 문장을 찾아보세요.", 12, [
      "올겨울 첫눈이 내리던 날, 나는 창밖을 보고 탄성을 질렀다.",
      "밤사이 온 세상이 하얗게 뒤덮여 반짝이고 있었다.",
      "나는 두꺼운 외투를 껴입고 목도리까지 두른 뒤 밖으로 나갔다.",
      "발을 디딜 때마다 눈이 뽀드득 소리를 냈다.",
      "입김이 하얗게 퍼졌다 사라지곤 했다.",
      "동네 공원에는 벌써 아이들이 나와 신나게 놀고 있었다.",
      "나도 눈을 뭉쳐 커다란 눈사람을 만들기 시작했다.",
      "눈사람의 눈은 조약돌로, 코는 나뭇가지로 붙였다.",
      "마지막으로 내 목도리를 둘러 주니 제법 그럴듯했다.",
      "완성된 눈사람을 보니 절로 웃음이 나왔다.",
      "그때 친구들이 하나둘 모여 눈싸움이 벌어졌다.",
      "우리는 편을 나눠 눈덩이를 신나게 주고받았다.",
      "눈송이를 자세히 보면 모두 육각형 모양을 하고 있다고 한다.",
      "나는 눈덩이를 피하다 그만 엉덩방아를 찧고 말았다.",
      "다들 그 모습을 보고 한참을 깔깔 웃었다.",
      "볼이 빨갛게 얼도록 우리는 뛰어놀았다.",
      "집으로 돌아오니 엄마가 따뜻한 코코아를 타 주셨다.",
      "언 손을 녹이며 마시는 코코아가 유난히 달았다.",
      "창밖에는 여전히 눈이 소복소복 내리고 있었다.",
      "오늘 하루가 오래도록 기억에 남을 것 같았다.",
    ], "spread-full", [[4, 4], [5, 5], [7, 2], [9, 5], [15, 4], [18, 3]]),
  ]),
});

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const TOP_FIXED_END_Y = 133;
const RESULT_STORAGE_KEY = "rebut.awkward-sentence.result.v1";
const RESULT_PAGE_URL = "result.html";

document.documentElement.style.setProperty("--wrong-shake-duration", `${TIMINGS.WRONG_SHAKE_MS}ms`);
document.documentElement.style.setProperty("--pick-press-duration", `${TIMINGS.PICK_PRESS_MS}ms`);
document.documentElement.style.setProperty("--sentence-erase-duration", `${TIMINGS.SENTENCE_ERASE_MS}ms`);
document.documentElement.style.setProperty("--lock-unlock-duration", `${TIMINGS.LOCK_UNLOCK_MS}ms`);
document.documentElement.style.setProperty("--round-erase-duration", `${TIMINGS.ROUND_ERASE_MS}ms`);
document.documentElement.style.setProperty("--round-write-duration", `${TIMINGS.ROUND_WRITE_MS}ms`);
document.documentElement.style.setProperty("--logo-wave-letter-duration", `${TIMINGS.LOGO_WAVE_LETTER_MS}ms`);
document.documentElement.style.setProperty("--level-fade-in", `${TIMINGS.LEVEL_FADE_IN_MS}ms`);
document.documentElement.style.setProperty("--level-fade-out", `${TIMINGS.LEVEL_FADE_OUT_MS}ms`);

const stage = document.querySelector("#game-stage");
const board = document.querySelector("#notebook-board");
const paragraph = document.querySelector("#paragraph");
const notebookLock = document.querySelector("#notebook-lock");
const levelNumber = document.querySelector("#level-number");
const roundNumber = document.querySelector("#round-number");
const helpButton = document.querySelector("#help-button");
const restartControl = document.querySelector("#restart-control");
const backControl = document.querySelector("#back-control");
const status = document.querySelector("#game-status");
const gameLogo = document.querySelector(".game-logo");
const gameLogoLetters = [...gameLogo.querySelectorAll("img")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

gameLogoLetters.forEach((letter, index) => {
  letter.style.setProperty("--logo-wave-delay", `${index * TIMINGS.LOGO_WAVE_STAGGER_MS}ms`);
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
  runId: 0,
  completed: false,
};

let sceneScale = 1;
let verticalExtra = 0;

function delay(milliseconds) {
  const duration = prefersReducedMotion.matches ? Math.min(milliseconds, 40) : milliseconds;
  return new Promise((resolve) => (window.RebutGameClock || window).setTimeout(resolve, duration));
}

function currentPuzzle() {
  return GAME_DATA[state.level][state.round - 1];
}

function validateGameData() {
  for (let level = 1; level <= GAME_SETTINGS.TOTAL_LEVELS; level += 1) {
    const rounds = GAME_DATA[level];
    if (!rounds || rounds.length !== GAME_SETTINGS.ROUNDS_PER_LEVEL) {
      throw new Error(`${level}단계 라운드 수가 설정과 다릅니다.`);
    }
    rounds.forEach((round) => {
      const hasInvalidFlowBreak = round.flowBreaks.some(([sentenceIndex, wordIndex]) => {
        const sentence = round.sentences[sentenceIndex];
        return !sentence || wordIndex < 0 || wordIndex >= (sentence.match(/\S+/g) || []).length;
      });
      if (
        round.description !== GUIDE_COPY ||
        !round.hint ||
        !["single", "spread", "spread-full"].includes(round.layout) ||
        !round.sentences.length ||
        hasInvalidFlowBreak ||
        round.answerIndex < 0 ||
        round.answerIndex >= round.sentences.length
      ) {
        throw new Error(`${level}단계 문장·정답·힌트 상수가 어긋났습니다.`);
      }
    });
  }
}

function updateProgress() {
  levelNumber.src = `${PROGRESS_DIGIT_ASSET}${state.level}.png?v=20261005-1`;
  levelNumber.alt = String(state.level);
  roundNumber.src = `${PROGRESS_DIGIT_ASSET}${state.round}.png?v=20261005-1`;
  roundNumber.alt = String(state.round);
  levelNumber.parentElement.setAttribute("aria-label", `현재 진행 ${state.level}-${state.round}`);
}

function setBoardLocked(locked) {
  board.classList.toggle("is-locked", locked);
}

function sentenceTokens(sentenceIndex) {
  return [...paragraph.querySelectorAll(`[data-sentence="${sentenceIndex}"]`)];
}

function setSentenceClass(sentenceIndex, className, enabled = true) {
  sentenceTokens(sentenceIndex).forEach((token) => token.classList.toggle(className, enabled));
}

function makeSentenceTokens(text, sentenceIndex, flowBreaks) {
  const fragment = document.createDocumentFragment();
  const words = text.match(/\S+/g) || [text];
  words.forEach((word, tokenIndex) => {
    const hasFlowBreak = flowBreaks.has(`${sentenceIndex}:${tokenIndex}`);
    const token = document.createElement("span");
    token.className = "sentence-token";
    token.dataset.sentence = String(sentenceIndex);
    token.dataset.token = String(tokenIndex);
    token.textContent = hasFlowBreak ? word : `${word} `;
    if (tokenIndex === 0) {
      token.tabIndex = 0;
      token.setAttribute("role", "button");
      token.setAttribute("aria-label", `${text} 문장 선택`);
    } else {
      token.tabIndex = -1;
      token.setAttribute("aria-hidden", "true");
    }
    fragment.append(token);
    if (hasFlowBreak) fragment.append(document.createElement("br"));
  });
  return fragment;
}

function buildParagraph() {
  const fragment = document.createDocumentFragment();
  const flowBreaks = new Set(
    currentPuzzle().flowBreaks.map(([sentenceIndex, wordIndex]) => `${sentenceIndex}:${wordIndex}`),
  );
  currentPuzzle().sentences.forEach((sentence, index) => {
    fragment.append(makeSentenceTokens(sentence, index, flowBreaks));
  });
  paragraph.replaceChildren(fragment);
}

async function beginRound({ keepWrongAttempts = false, animateWriting = true } = {}) {
  const runId = ++state.runId;
  state.phase = "round-transition";
  state.completed = false;
  state.reactionStartedAt = null;
  if (!keepWrongAttempts) state.wrongAttempts = 0;
  setBoardLocked(true);
  const layout = currentPuzzle().layout;
  board.classList.toggle("is-spread-layout", layout === "spread" || layout === "spread-full");
  board.classList.toggle("is-full-spread", layout === "spread-full");
  notebookLock.className = "notebook-lock";
  paragraph.className = "paragraph";
  buildParagraph();
  if (IS_TUTORIAL_BACKGROUND) {
    setSentenceClass(currentPuzzle().answerIndex, "is-tutorial-preview", true);
  }
  updateProgress();
  fitStageToViewport();

  if (animateWriting) {
    paragraph.classList.add("is-round-writing");
    status.textContent = `${state.level}단계 ${state.round}라운드 문단을 쓰고 있습니다.`;
    await delay(TIMINGS.ROUND_WRITE_MS);
    if (runId !== state.runId) return;
    paragraph.classList.remove("is-round-writing");
  }

  state.phase = "playing";
  state.reactionStartedAt = (window.RebutGameClock?.now() ?? performance.now());
  setBoardLocked(false);
  status.textContent = "어색한 문장을 찾아 지우세요.";
}

function eventSentenceIndex(target) {
  if (!(target instanceof Element)) return null;
  const token = target.closest(".sentence-token");
  if (!token || !paragraph.contains(token)) return null;
  return Number(token.dataset.sentence);
}

function pointerMovedWithinSentence(event, sentenceIndex) {
  return eventSentenceIndex(event.relatedTarget) === sentenceIndex;
}

function captureReactionTime() {
  if (typeof state.reactionStartedAt !== "number") return;
  state.reactionTimesMs.push(Math.max(0, (window.RebutGameClock?.now() ?? performance.now()) - state.reactionStartedAt));
  state.reactionStartedAt = null;
}

async function pressSentence(sentenceIndex) {
  setSentenceClass(sentenceIndex, "is-pressed", true);
  await delay(TIMINGS.PICK_PRESS_MS);
  setSentenceClass(sentenceIndex, "is-pressed", false);
}

async function shakeSentence(sentenceIndex, runId) {
  setSentenceClass(sentenceIndex, "is-wrong", false);
  void paragraph.offsetWidth;
  setSentenceClass(sentenceIndex, "is-wrong", true);
  await delay(TIMINGS.WRONG_SHAKE_MS);
  if (runId !== state.runId) return false;
  setSentenceClass(sentenceIndex, "is-wrong", false);
  return true;
}

async function eraseSentence(sentenceIndex, runId) {
  const tokens = sentenceTokens(sentenceIndex);
  const maximumDelay = Math.round(TIMINGS.SENTENCE_ERASE_MS * .42);
  const step = tokens.length > 1 ? maximumDelay / (tokens.length - 1) : 0;
  const tokenDuration = Math.max(90, TIMINGS.SENTENCE_ERASE_MS - maximumDelay);

  tokens.forEach((token, index) => {
    token.classList.remove("is-hovered", "is-selected", "is-pressed");
    token.style.setProperty("--token-delay", `${Math.round(index * step)}ms`);
    token.style.setProperty("--token-duration", `${tokenDuration}ms`);
    token.classList.add("is-erasing");
  });
  status.textContent = "어색한 문장을 지우고 있습니다.";
  await delay(TIMINGS.SENTENCE_ERASE_MS);
  if (runId !== state.runId) return false;
  tokens.forEach((token) => token.classList.add("is-erased"));
  return true;
}

async function playCorrectLogoWave() {
  gameLogo.classList.remove("is-waving");
  void gameLogo.offsetWidth;
  gameLogo.classList.add("is-waving");
  await delay(TIMINGS.LOGO_WAVE_MS);
  gameLogo.classList.remove("is-waving");
}

async function playUnlockMotion(runId) {
  notebookLock.className = "notebook-lock";
  void notebookLock.offsetWidth;
  notebookLock.classList.add("is-unlocking");
  status.textContent = `${state.level}단계의 자물쇠가 풀렸습니다.`;
  await delay(TIMINGS.LOCK_UNLOCK_MS);
  if (runId !== state.runId) return false;
  notebookLock.className = "notebook-lock is-unlocked";
  await delay(TIMINGS.LOCK_UNLOCK_HOLD_MS);
  return runId === state.runId;
}

async function completeCorrectSentence(runId, autoReveal = false) {
  state.phase = "feedback";
  setBoardLocked(true);
  const answerIndex = currentPuzzle().answerIndex;

  if (autoReveal) {
    setSentenceClass(answerIndex, "is-selected", true);
    status.textContent = "정답 문장을 표시합니다.";
    await delay(TIMINGS.ANSWER_REVEAL_MS);
    if (runId !== state.runId) return;
  }

  const logoWave = playCorrectLogoWave();
  if (!(await eraseSentence(answerIndex, runId))) return;
  const unlocksNextLevel =
    state.round === GAME_SETTINGS.ROUNDS_PER_LEVEL && state.level < GAME_SETTINGS.TOTAL_LEVELS;
  if (unlocksNextLevel) {
    if (!(await playUnlockMotion(runId))) return;
  } else {
    await delay(TIMINGS.ROUND_CLEAR_HOLD_MS);
  }
  if (runId !== state.runId) return;
  await advanceRound(runId);
  await logoWave;
}

async function chooseSentence(sentenceIndex) {
  if (state.phase !== "playing") return;
  const runId = state.runId;
  const answerIndex = currentPuzzle().answerIndex;
  captureReactionTime();
  setBoardLocked(true);
  await pressSentence(sentenceIndex);
  if (runId !== state.runId) return;

  if (sentenceIndex === answerIndex) {
    if (state.wrongAttempts === 0) state.firstAttemptCorrectRounds += 1;
    setSentenceClass(answerIndex, "is-selected", true);
    status.textContent = "정답입니다.";
    await completeCorrectSentence(runId, false);
    return;
  }

  state.phase = "wrong";
  state.wrongAttempts += 1;
  state.totalWrongAttempts += 1;
  status.textContent = "자연스러운 문장입니다. 다시 골라 보세요.";
  if (!(await shakeSentence(sentenceIndex, runId))) return;

  if (state.wrongAttempts >= GAME_SETTINGS.MAX_WRONG_ATTEMPTS) {
    await delay(TIMINGS.WRONG_PAUSE_MS);
    if (runId !== state.runId) return;
    await completeCorrectSentence(runId, true);
    return;
  }

  state.phase = "playing";
  setBoardLocked(false);
}

async function eraseWholeParagraph(runId) {
  setBoardLocked(true);
  state.phase = "round-transition";
  paragraph.classList.remove("is-round-writing");
  paragraph.classList.add("is-round-erasing");
  status.textContent = "다음 문제로 넘어갑니다.";
  await delay(TIMINGS.ROUND_ERASE_MS);
  return runId === state.runId;
}

async function advanceRound(runId) {
  if (!(await eraseWholeParagraph(runId))) return;

  if (state.round < GAME_SETTINGS.ROUNDS_PER_LEVEL) {
    state.round += 1;
    await beginRound({ animateWriting: true });
    return;
  }

  if (state.level < GAME_SETTINGS.TOTAL_LEVELS) {
    state.level += 1;
    state.round = 1;
    updateProgress();
    await showLevelTransition(state.level);
    if (!state.completed) await beginRound({ animateWriting: true });
    return;
  }

  finishGame();
}

function finishGame() {
  state.completed = true;
  state.phase = "complete";
  setBoardLocked(true);
  status.textContent = "모든 단계와 라운드를 완료했습니다.";
  const completedRounds = GAME_SETTINGS.TOTAL_LEVELS * GAME_SETTINGS.ROUNDS_PER_LEVEL;
  const accuracy = completedRounds > 0
    ? Math.round((state.firstAttemptCorrectRounds / completedRounds) * 100)
    : 0;
  try {
    sessionStorage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        completedAt: new Date().toISOString(),
        accuracy,
        completedRounds,
        firstAttemptCorrectRounds: state.firstAttemptCorrectRounds,
        reactionTimesMs: state.reactionTimesMs.slice(),
        retryCount: state.totalWrongAttempts,
      }),
    );
  } catch (_error) {
    // 저장소 사용이 막혀도 결과 화면의 기본값으로 이동합니다.
  }
  window.location.href = RESULT_PAGE_URL;
}

function restartCurrentRound() {
  if (state.completed || state.phase === "level-transition") return;
  void beginRound({ keepWrongAttempts: true, animateWriting: true });
  status.textContent = "이번 라운드 문단을 처음부터 다시 보여드립니다.";
}




async function showLevelTransition(level) {
  state.phase = "level-transition";
  setBoardLocked(true);
  await window.RebutStepTransition.show(level);
}

function fitStageToViewport() {
  sceneScale = Math.min(window.innerWidth / STAGE_SIZE.width, window.innerHeight / STAGE_SIZE.height);
  verticalExtra = Math.max(0, window.innerHeight / sceneScale - STAGE_SIZE.height);
  stage.style.setProperty("--game-scale", String(sceneScale));
  stage.style.height = `${STAGE_SIZE.height + verticalExtra}px`;

  const anchors = [
    { selector: ".utility-controls", y: 151 },
    { selector: ".info-popover", y: 220 },
    { selector: ".notebook-board", y: 228.92 },
    { selector: ".back-control", y: 977.87 },
    { selector: ".restart-control", y: 253.6 },
  ];

  anchors.forEach(({ selector, y }) => {
    document.querySelectorAll(selector).forEach((element) => {
      const progress = Math.min(1, Math.max(0, (y - TOP_FIXED_END_Y) / (STAGE_SIZE.height - TOP_FIXED_END_Y)));
      element.style.setProperty("--responsive-y", `${verticalExtra * progress}px`);
    });
  });
}

paragraph.addEventListener("pointerover", (event) => {
  if (state.phase !== "playing") return;
  const sentenceIndex = eventSentenceIndex(event.target);
  if (sentenceIndex === null || pointerMovedWithinSentence(event, sentenceIndex)) return;
  setSentenceClass(sentenceIndex, "is-hovered", true);
});

paragraph.addEventListener("pointerout", (event) => {
  const sentenceIndex = eventSentenceIndex(event.target);
  if (sentenceIndex === null || pointerMovedWithinSentence(event, sentenceIndex)) return;
  setSentenceClass(sentenceIndex, "is-hovered", false);
});

paragraph.addEventListener("click", (event) => {
  const sentenceIndex = eventSentenceIndex(event.target);
  if (sentenceIndex !== null) void chooseSentence(sentenceIndex);
});

paragraph.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const sentenceIndex = eventSentenceIndex(event.target);
  if (sentenceIndex === null) return;
  event.preventDefault();
  void chooseSentence(sentenceIndex);
});

paragraph.addEventListener("focusin", (event) => {
  const sentenceIndex = eventSentenceIndex(event.target);
  if (sentenceIndex !== null) setSentenceClass(sentenceIndex, "is-hovered", true);
});

paragraph.addEventListener("focusout", (event) => {
  const sentenceIndex = eventSentenceIndex(event.target);
  if (sentenceIndex !== null && !pointerMovedWithinSentence(event, sentenceIndex)) {
    setSentenceClass(sentenceIndex, "is-hovered", false);
  }
});

helpButton.addEventListener("click", () => { window.RebutBookTutorial.open(); });
restartControl.addEventListener("click", restartCurrentRound);
backControl.addEventListener("click", () => { window.location.href = "../../?rehab=language"; });

window.addEventListener("keydown", (event) => {
  if (!event.repeat && event.key.toLowerCase() === "r") restartCurrentRound();
});
window.addEventListener("resize", fitStageToViewport, { passive: true });

async function startGame() {
  validateGameData();
  if (!IS_TUTORIAL_BACKGROUND) {
    try {
      sessionStorage.removeItem(RESULT_STORAGE_KEY);
    } catch (_error) {
      // 저장소 사용 여부와 관계없이 게임은 시작합니다.
    }
  }
  updateProgress();
  fitStageToViewport();
  if (IS_TUTORIAL_BACKGROUND) {
    await beginRound({ animateWriting: false });
    return;
  }
  await showLevelTransition(1);
  if (!state.completed) await beginRound({ animateWriting: true });
}

window.addEventListener("load", () => { void startGame(); });
