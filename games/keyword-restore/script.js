"use strict";

// 문장, 빈칸 위치, 정답은 이 상수 하나에서만 관리합니다.
const GAME = Object.freeze({
  words: Object.freeze([
    { text: "빵집", size: "short" },
    { text: "아저씨는", size: "long" },
    { text: "새벽에", size: "medium" },
    { text: "문을", size: "short" },
    { text: "연다.", size: "short" },
  ]),
  blankIndex: 2,
  get answer() {
    return this.words[this.blankIndex].text;
  },
});

const BACKGROUND_WORDS = Object.freeze([
  Object.freeze({ text: "김 씨가", size: "medium" }),
  Object.freeze({ text: "편지를", size: "medium" }),
  Object.freeze({ text: "붙였다.", size: "medium" }),
]);

// 모든 재생 시간(ms)은 이 상수에서 조정합니다.
const TIMING = Object.freeze({
  memoryHold: 2000,
  blankFill: 300,
  blankHold: 600,
  answerFade: 500,
  cursorMove: 500,
  cursorPress: 120,
  pressHold: 80,
  cursorRelease: 120,
  drag: 700,
  dropSettle: 180,
  feedbackFill: 300,
  cursorPark: 250,
  correctStagger: 145,
  correctBounce: 540,
  logoWaveLetter: 660,
  logoWaveStagger: 85,
  completeHold: 1000,
  cursorReset: 450,
  sceneReset: 250,
});

const CURSOR = Object.freeze({
  home: Object.freeze({ x: 516, y: 165 }),
  answerGrab: Object.freeze({ x: 367, y: 300 }),
  correctRest: Object.freeze({ x: 516, y: 165 }),
});

// 순서 암기 튜토리얼의 1920×1080 공통 프레임과 동일한 반응형 규칙입니다.
const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  { selector: ".background-timer", y: 230, progress: 0.5 },
  { selector: ".background-sentence", y: 342, progress: 0.5 },
  { selector: ".tutorial-back-guide", y: 977.87, progress: 1 },
  { selector: ".tutorial-panel", y: 104, progress: 0.5 },
]);

document.documentElement.style.setProperty("--blank-fill-duration", `${TIMING.blankFill}ms`);
document.documentElement.style.setProperty("--feedback-fill-duration", `${TIMING.feedbackFill}ms`);
document.documentElement.style.setProperty("--correct-bounce-duration", `${TIMING.correctBounce}ms`);
document.documentElement.style.setProperty("--logo-wave-letter-duration", `${TIMING.logoWaveLetter}ms`);

const sentenceRow = document.querySelector("#sentenceRow");
const answerSlot = document.querySelector("#answerSlot");
const backgroundSentence = document.querySelector("#backgroundSentence");
const cursor = document.querySelector("#demoCursor");
const cursorImage = cursor.querySelector(".demo-cursor__image");
const scene = document.querySelector(".stage");
const gameLogo = document.querySelector(".game-logo");
const gameLogoLetters = [...gameLogo.querySelectorAll("img")];
const startButton = document.querySelector("#start-button");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let cursorOffset = { x: 0, y: 0 };
let loopToken = 0;
let sceneScale = 1;
let closing = false;

gameLogoLetters.forEach((letter, index) => {
  letter.style.setProperty("--logo-wave-delay", `${index * TIMING.logoWaveStagger}ms`);
});

function fitSceneToViewport() {
  sceneScale = Math.min(
    window.innerWidth / STAGE_SIZE.width,
    window.innerHeight / STAGE_SIZE.height,
  );
  const verticalExtra = Math.max(
    0,
    window.innerHeight / sceneScale - STAGE_SIZE.height,
  );

  scene.style.setProperty("--scene-scale", sceneScale);
  scene.style.height = `${STAGE_SIZE.height + verticalExtra}px`;

  RESPONSIVE_VERTICAL_ANCHORS.forEach(({ selector, y, progress }) => {
    const element = scene.querySelector(selector);
    element.style.top = `${y + verticalExtra * progress}px`;
  });
}

function boxTexture(size, variant = "idle") {
  if (variant === "dark") return `assets/box-${size}-outline-dark.png`;
  return `assets/box-${size}.png`;
}

function boxSurfaces(size, variant = "idle") {
  const suffix = variant === "dark" ? "-dark" : "";
  return {
    bottom: `assets/box-${size}-bottom${suffix}.svg`,
    side: `assets/box-${size}-side${suffix}.svg`,
  };
}

function createWordBox(word, index, floating = false) {
  const box = document.createElement("div");
  box.className = "word-box";
  box.dataset.size = word.size;
  box.dataset.index = String(index);
  if (floating) box.classList.add("word-box--floating");
  const idleSurfaces = boxSurfaces(word.size);
  const darkSurfaces = boxSurfaces(word.size, "dark");
  box.innerHTML = `
    <span class="word-box__contact-shadow" aria-hidden="true"></span>
    <img class="word-box__bottom-face word-box__surface word-box__surface--idle" src="${idleSurfaces.bottom}" alt="" aria-hidden="true" />
    <img class="word-box__bottom-face word-box__surface word-box__surface--dark" src="${darkSurfaces.bottom}" alt="" aria-hidden="true" />
    <span class="word-box__side-face word-box__surface word-box__surface--idle" aria-hidden="true">
      <img src="${idleSurfaces.side}" alt="" />
    </span>
    <span class="word-box__side-face word-box__surface word-box__surface--dark" aria-hidden="true">
      <img src="${darkSurfaces.side}" alt="" />
    </span>
    <span class="word-box__front-face" aria-hidden="true"></span>
    <span class="word-box__label">${word.text}</span>
    <img class="word-box__texture word-box__texture--idle" src="${boxTexture(word.size)}" alt="" aria-hidden="true" />
    <img class="word-box__texture word-box__texture--dark" src="${boxTexture(word.size, "dark")}" alt="" aria-hidden="true" />
  `;
  return box;
}

function render() {
  const fragment = document.createDocumentFragment();
  GAME.words.forEach((word, index) => fragment.append(createWordBox(word, index)));
  sentenceRow.replaceChildren(fragment);
  answerSlot.replaceChildren(createWordBox(GAME.words[GAME.blankIndex], GAME.blankIndex, true));

  const backgroundFragment = document.createDocumentFragment();
  BACKGROUND_WORDS.forEach((word, index) => {
    backgroundFragment.append(createWordBox(word, index));
  });
  backgroundSentence.replaceChildren(backgroundFragment);
}

function sleep(ms, token) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(token === loopToken), ms);
  });
}

function finishAnimation(animation) {
  return animation.finished.catch(() => undefined);
}

function cursorTransform(offset = cursorOffset) {
  return `translate3d(${offset.x}px, ${offset.y}px, 0)`;
}

function cursorPointOffset(point) {
  return {
    x: point.x - CURSOR.home.x,
    y: point.y - CURSOR.home.y,
  };
}

async function moveCursorTo(point, duration, token, easing = "ease-in-out") {
  const target = cursorPointOffset(point);
  const animation = cursor.animate(
    [{ transform: cursorTransform() }, { transform: cursorTransform(target) }],
    { duration, easing, fill: "forwards" },
  );
  await finishAnimation(animation);
  if (token !== loopToken) return false;
  cursorOffset = target;
  cursor.style.transform = cursorTransform();
  animation.cancel();
  return true;
}

async function pressCursor(token) {
  const down = cursorImage.animate(
    [
      { transform: "translate3d(0, 0, 0) scale(1)" },
      { transform: "translate3d(2px, 2px, 0) scale(0.82)" },
    ],
    { duration: TIMING.cursorPress, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" },
  );
  await finishAnimation(down);
  if (!(await sleep(TIMING.pressHold, token))) return false;
  return true;
}

async function releaseCursor(token) {
  const up = cursorImage.animate(
    [
      { transform: "translate3d(2px, 2px, 0) scale(0.82)" },
      { transform: "translate3d(0, 0, 0) scale(1.05)" },
      { transform: "translate3d(0, 0, 0) scale(1)" },
    ],
    { duration: TIMING.cursorRelease, easing: "ease-out", fill: "forwards" },
  );
  await finishAnimation(up);
  if (token !== loopToken) return false;
  cursorImage.style.transform = "translate3d(0, 0, 0) scale(1)";
  up.cancel();
  return true;
}

function resetScene({ immediate = false } = {}) {
  gameLogo.classList.remove("is-waving");
  const boxes = sentenceRow.querySelectorAll(".word-box");
  boxes.forEach((box) => {
    const transitionLayers = box.querySelectorAll(
      ".word-box__front-face, .word-box__label, .word-box__surface, .word-box__texture",
    );
    if (immediate) {
      transitionLayers.forEach((layer) => {
        layer.style.transition = "none";
      });
    }
    box.classList.remove("is-blank", "is-filled", "is-correct", "is-complete-bounce");
    box.style.removeProperty("--correct-bounce-delay");
    box.style.transform = "translate3d(0, 0, 0)";
  });

  answerSlot.classList.remove("is-visible", "is-dragging");
  answerSlot.style.opacity = "0";
  answerSlot.style.removeProperty("visibility");
  answerSlot.style.transform = "translate3d(0, 0, 0)";
  cursorOffset = { x: 0, y: 0 };
  cursor.style.transform = cursorTransform();
  cursorImage.style.transform = "translate3d(0, 0, 0) scale(1)";

  if (immediate) {
    requestAnimationFrame(() => {
      boxes.forEach((box) => {
        box.querySelectorAll(
          ".word-box__front-face, .word-box__label, .word-box__surface, .word-box__texture",
        ).forEach((layer) => {
          layer.style.removeProperty("transition");
        });
      });
    });
  }
}

async function fadeInAnswer(token) {
  answerSlot.classList.add("is-visible");
  const animation = answerSlot.animate(
    [
      { opacity: 0, transform: "translate3d(0, 10px, 0)" },
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
    ],
    { duration: TIMING.answerFade, easing: "ease-out", fill: "forwards" },
  );
  await finishAnimation(animation);
  if (token !== loopToken) return false;
  answerSlot.style.opacity = "1";
  answerSlot.style.transform = "translate3d(0, 0, 0)";
  animation.cancel();
  return true;
}

async function dragAnswerToBlank(token) {
  const blankBox = sentenceRow.children[GAME.blankIndex];
  const answerRect = answerSlot.getBoundingClientRect();
  const blankRect = blankBox.getBoundingClientRect();
  const delta = {
    x: (blankRect.left - answerRect.left) / sceneScale,
    y: (blankRect.top - answerRect.top) / sceneScale,
  };
  const nextCursorOffset = {
    x: cursorOffset.x + delta.x,
    y: cursorOffset.y + delta.y,
  };

  answerSlot.classList.add("is-dragging");
  const answerAnimation = answerSlot.animate(
    [
      { transform: "translate3d(0, 0, 0) scale(1)" },
      { transform: `translate3d(${delta.x}px, ${delta.y}px, 0) scale(0.985)` },
    ],
    { duration: TIMING.drag, easing: "ease-in-out", fill: "forwards" },
  );
  const cursorAnimation = cursor.animate(
    [
      { transform: cursorTransform() },
      { transform: cursorTransform(nextCursorOffset) },
    ],
    { duration: TIMING.drag, easing: "ease-in-out", fill: "forwards" },
  );

  await Promise.all([finishAnimation(answerAnimation), finishAnimation(cursorAnimation)]);
  if (token !== loopToken) return false;

  cursorOffset = nextCursorOffset;
  cursor.style.transform = cursorTransform();
  cursorAnimation.cancel();
  if (!(await releaseCursor(token))) return false;

  blankBox.classList.remove("is-blank");
  blankBox.classList.add("is-filled");
  answerSlot.style.visibility = "hidden";
  answerAnimation.cancel();
  return sleep(TIMING.dropSettle, token);
}

async function correctFeedback(token) {
  const boxes = [...sentenceRow.querySelectorAll(".word-box")];
  boxes.forEach((box) => {
    box.classList.remove("is-blank", "is-filled");
    box.classList.add("is-correct");
  });

  const [fillDone, cursorParked] = await Promise.all([
    sleep(TIMING.feedbackFill, token),
    moveCursorTo(CURSOR.correctRest, TIMING.cursorPark, token),
  ]);
  if (!fillDone || !cursorParked) return false;

  boxes.forEach((box, index) => {
    box.style.setProperty("--correct-bounce-delay", `${index * TIMING.correctStagger}ms`);
    box.classList.add("is-complete-bounce");
  });

  gameLogo.classList.remove("is-waving");
  void gameLogo.offsetWidth;
  gameLogo.classList.add("is-waving");

  const completed = await sleep(
    TIMING.correctBounce + (boxes.length - 1) * TIMING.correctStagger,
    token,
  );
  gameLogo.classList.remove("is-waving");
  return completed;
}

async function playLoop() {
  const token = ++loopToken;
  resetScene({ immediate: true });

  while (token === loopToken && !reducedMotion.matches) {
    if (!(await sleep(TIMING.memoryHold, token))) return;

    const blankBox = sentenceRow.children[GAME.blankIndex];
    blankBox.classList.add("is-blank");
    if (!(await sleep(TIMING.blankFill, token))) return;
    if (!(await sleep(TIMING.blankHold, token))) return;

    if (!(await fadeInAnswer(token))) return;
    if (!(await moveCursorTo(CURSOR.answerGrab, TIMING.cursorMove, token))) return;
    if (!(await pressCursor(token))) return;
    if (!(await dragAnswerToBlank(token))) return;
    if (!(await correctFeedback(token))) return;
    if (!(await sleep(TIMING.completeHold, token))) return;

    if (!(await moveCursorTo(CURSOR.home, TIMING.cursorReset, token))) return;
    resetScene();
    if (!(await sleep(TIMING.sceneReset, token))) return;
  }
}

function handleMotionPreference() {
  ++loopToken;
  resetScene({ immediate: true });
  document.querySelector(".reduced-motion-note").textContent = reducedMotion.matches
    ? "동작 줄이기 설정에 따라 데모 모션을 정지했습니다."
    : "";
  if (!reducedMotion.matches) playLoop();
}

render();
fitSceneToViewport();
handleMotionPreference();
reducedMotion.addEventListener("change", handleMotionPreference);
window.addEventListener("resize", fitSceneToViewport, { passive: true });
startButton.addEventListener("click", () => {
  if (closing) return;
  closing = true;
  ++loopToken;
  startButton.disabled = true;
  window.location.href = "./game.html?v=20261011-shared-step";
});
