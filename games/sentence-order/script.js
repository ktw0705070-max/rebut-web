"use strict";

// 문장, 정답 순서, 초기 순서, 고정 이동은 이 상수 하나에서만 관리합니다.
const GAME = Object.freeze({
  sentences: Object.freeze([
    Object.freeze({
      id: "wake",
      text: "아침에 알람 소리를 듣고 잠에서 깼다.",
    }),
    Object.freeze({
      id: "breakfast",
      text: "그리고 세수를 한 뒤 아침밥을 먹었다.",
    }),
    Object.freeze({
      id: "leave",
      text: "마지막으로 가방을 메고 집을 나섰다.",
    }),
  ]),
  correctOrder: Object.freeze(["wake", "breakfast", "leave"]),
  mixedOrder: Object.freeze(["breakfast", "leave", "wake"]),
  moves: Object.freeze([
    Object.freeze({ cardId: "wake", targetId: "breakfast" }),
    Object.freeze({ cardId: "breakfast", targetId: "leave" }),
  ]),
});

// 모든 재생 시간(ms)은 이 상수에서 조정합니다.
const TIMING = Object.freeze({
  presentationHold: 1500,
  cursorMove: 500,
  pick: 100,
  drag: 700,
  swap: 300,
  release: 100,
  betweenMoves: 180,
  feedbackFill: 300,
  correctStagger: 90,
  correctWave: 450,
  completeHold: 1000,
  cursorReset: 450,
  sceneReset: 250,
});

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const HEADER_BOTTOM_Y = 77;
const TIMELINE_Y = 318;
const CARD_STACK_Y = TIMELINE_Y + 23.57;
const CARD_HEIGHT = 82.866;
const SLOT_STEP = 93.18;
const CARD_LIFT = 8;

const CURSOR = Object.freeze({
  home: Object.freeze({ x: 1274, y: 646 }),
  cardX: 1150,
});

const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  Object.freeze({ selector: ".title", y: 134 }),
  Object.freeze({ selector: ".timeline", y: TIMELINE_Y }),
  Object.freeze({ selector: ".demo-cursor", y: CURSOR.home.y }),
  Object.freeze({ selector: ".instructions", y: 728 }),
  Object.freeze({ selector: ".start-slot", y: 915 }),
  Object.freeze({ selector: ".back-hint", y: 943 }),
]);

const CARD_ASSETS = Object.freeze({
  shadow: "assets/vector-174-drop-shadow-442-v4.svg",
  idle: Object.freeze({
    front: "assets/sentence-card-front.svg",
    bottom: "assets/sentence-card-bottom.svg",
    side: "assets/sentence-card-side.svg",
    texture: "assets/sentence-card-outline.png",
  }),
  dark: Object.freeze({
    front: "assets/sentence-card-front-dark.svg",
    bottom: "assets/sentence-card-bottom-dark.svg",
    side: "assets/sentence-card-side-dark.svg",
    texture: "assets/sentence-card-outline-dark.png",
  }),
});

document.documentElement.style.setProperty(
  "--state-fill-duration",
  `${TIMING.feedbackFill}ms`,
);
document.documentElement.style.setProperty(
  "--correct-wave-duration",
  `${TIMING.correctWave}ms`,
);

const scene = document.querySelector(".stage");
const cardStack = document.querySelector("#cardStack");
const cursor = document.querySelector("#demoCursor");
const cursorImage = cursor.querySelector(".demo-cursor__image");
const startButton = document.querySelector("#start-button");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const cardsById = new Map();
const slotById = new Map();
const activeAnimations = new Set();

let loopToken = 0;
let sceneScale = 1;
let verticalExtra = 0;
let cursorOffset = { x: 0, y: 0 };
let currentCursorPoint = CURSOR.home;

function responsiveVerticalOffset(baseY) {
  const progress = Math.min(
    1,
    Math.max(
      0,
      (baseY - HEADER_BOTTOM_Y) / (STAGE_SIZE.height - HEADER_BOTTOM_Y),
    ),
  );

  return verticalExtra * progress;
}

function cursorPointOffset(point) {
  return {
    x: point.x - CURSOR.home.x,
    y:
      point.y -
      CURSOR.home.y +
      responsiveVerticalOffset(point.y) -
      responsiveVerticalOffset(CURSOR.home.y),
  };
}

function cursorTransform(offset = cursorOffset) {
  return `translate3d(${offset.x}px, ${offset.y}px, 0)`;
}

function fitSceneToViewport() {
  sceneScale = Math.min(
    window.innerWidth / STAGE_SIZE.width,
    window.innerHeight / STAGE_SIZE.height,
  );
  verticalExtra = Math.max(
    0,
    window.innerHeight / sceneScale - STAGE_SIZE.height,
  );

  scene.style.setProperty("--scene-scale", sceneScale);
  scene.style.height = `${STAGE_SIZE.height + verticalExtra}px`;

  RESPONSIVE_VERTICAL_ANCHORS.forEach(({ selector, y }) => {
    document
      .querySelector(selector)
      .style.setProperty("--responsive-y", `${responsiveVerticalOffset(y)}px`);
  });

  cursorOffset = cursorPointOffset(currentCursorPoint);
  cursor.style.transform = cursorTransform();
}

function createImage(className, src) {
  const image = document.createElement("img");
  image.className = className;
  image.src = src;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  return image;
}

function createSideLayer(variant) {
  const side = document.createElement("span");
  side.className = [
    "sentence-card__side",
    "sentence-card__state-layer",
    `sentence-card__state-layer--${variant}`,
  ].join(" ");
  side.setAttribute("aria-hidden", "true");
  side.append(createImage("", CARD_ASSETS[variant].side));
  return side;
}

function createCard(sentence) {
  const card = document.createElement("article");
  card.className = "sentence-card";
  card.dataset.cardId = sentence.id;
  card.setAttribute("aria-label", sentence.text);

  const figmaShadow = createImage(
    "sentence-card__figma-shadow",
    CARD_ASSETS.shadow,
  );
  figmaShadow.draggable = false;

  const visual = document.createElement("span");
  visual.className = "sentence-card__visual";
  visual.setAttribute("aria-hidden", "true");

  ["idle", "dark"].forEach((variant) => {
    const stateClass = `sentence-card__state-layer sentence-card__state-layer--${variant}`;
    visual.append(
      createImage(`sentence-card__front ${stateClass}`, CARD_ASSETS[variant].front),
      createImage(`sentence-card__bottom ${stateClass}`, CARD_ASSETS[variant].bottom),
      createSideLayer(variant),
    );
  });

  const label = document.createElement("span");
  label.className = "sentence-card__label";
  label.textContent = sentence.text;
  visual.append(label);

  ["idle", "dark"].forEach((variant) => {
    const texture = createImage(
      [
        "sentence-card__texture",
        "sentence-card__state-layer",
        `sentence-card__state-layer--${variant}`,
      ].join(" "),
      CARD_ASSETS[variant].texture,
    );
    visual.append(texture);
  });

  card.append(figmaShadow, visual);

  cardsById.set(sentence.id, card);
  return card;
}

function renderCards() {
  const fragment = document.createDocumentFragment();
  GAME.sentences.forEach((sentence) => fragment.append(createCard(sentence)));
  cardStack.replaceChildren(fragment);
}

function slotY(slot) {
  return slot * SLOT_STEP;
}

function cardTransform(slot, { lift = 0, scale = 1 } = {}) {
  return `translate3d(0, ${slotY(slot) - lift}px, 0) scale(${scale})`;
}

function setCardSlot(card, slot, options) {
  slotById.set(card.dataset.cardId, slot);
  card.style.setProperty("--slot-y", `${slotY(slot)}px`);
  card.style.transform = cardTransform(slot, options);
}

function pointForSlot(slot) {
  return Object.freeze({
    x: CURSOR.cardX,
    y: CARD_STACK_Y + slotY(slot) + CARD_HEIGHT / 2,
  });
}

function sleep(ms, token) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(token === loopToken), ms);
  });
}

function trackAnimation(animation) {
  activeAnimations.add(animation);
  animation.finished
    .catch(() => undefined)
    .finally(() => activeAnimations.delete(animation));
  return animation;
}

async function animationFinished(animation, token) {
  try {
    await animation.finished;
    return token === loopToken;
  } catch {
    return false;
  }
}

function cancelActiveAnimations() {
  activeAnimations.forEach((animation) => animation.cancel());
  activeAnimations.clear();
}

async function moveCursorTo(point, duration, token, easing = "ease-in-out") {
  const target = cursorPointOffset(point);
  const animation = trackAnimation(
    cursor.animate(
      [
        { transform: cursorTransform() },
        { transform: cursorTransform(target) },
      ],
      { duration, easing, fill: "forwards" },
    ),
  );

  if (!(await animationFinished(animation, token))) return false;
  currentCursorPoint = point;
  cursorOffset = target;
  cursor.style.transform = cursorTransform();
  animation.cancel();
  return true;
}

async function pickCard(card, token) {
  const slot = slotById.get(card.dataset.cardId);
  card.classList.add("is-dragging");
  card.style.zIndex = "8";

  const cardAnimation = trackAnimation(
    card.animate(
      [
        { transform: cardTransform(slot, { scale: 0.96 }) },
        { transform: cardTransform(slot, { lift: CARD_LIFT }) },
      ],
      {
        duration: TIMING.pick,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "forwards",
      },
    ),
  );
  const cursorAnimation = trackAnimation(
    cursorImage.animate(
      [
        { transform: "translate3d(0, 0, 0) scale(1)" },
        { transform: "translate3d(2px, 2px, 0) scale(0.82)" },
      ],
      {
        duration: TIMING.pick,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "forwards",
      },
    ),
  );

  const done = await Promise.all([
    animationFinished(cardAnimation, token),
    animationFinished(cursorAnimation, token),
  ]);
  if (done.some((value) => !value)) return false;

  card.style.transform = cardTransform(slot, { lift: CARD_LIFT });
  cursorImage.style.transform = "translate3d(2px, 2px, 0) scale(0.82)";
  cardAnimation.cancel();
  cursorAnimation.cancel();
  return true;
}

async function releaseCard(card, token) {
  const slot = slotById.get(card.dataset.cardId);
  const cardAnimation = trackAnimation(
    card.animate(
      [
        { transform: cardTransform(slot, { lift: CARD_LIFT }) },
        { transform: cardTransform(slot) },
      ],
      { duration: TIMING.release, easing: "ease-out", fill: "forwards" },
    ),
  );
  const cursorAnimation = trackAnimation(
    cursorImage.animate(
      [
        { transform: "translate3d(2px, 2px, 0) scale(0.82)" },
        { transform: "translate3d(0, 0, 0) scale(1.05)" },
        { transform: "translate3d(0, 0, 0) scale(1)" },
      ],
      { duration: TIMING.release, easing: "ease-out", fill: "forwards" },
    ),
  );

  const done = await Promise.all([
    animationFinished(cardAnimation, token),
    animationFinished(cursorAnimation, token),
  ]);
  if (done.some((value) => !value)) return false;

  card.style.transform = cardTransform(slot);
  cursorImage.style.transform = "translate3d(0, 0, 0) scale(1)";
  cardAnimation.cancel();
  cursorAnimation.cancel();
  card.classList.remove("is-dragging");
  card.style.zIndex = "2";
  return true;
}

async function dragAndSwap(cardId, targetId, token) {
  const card = cardsById.get(cardId);
  const targetCard = cardsById.get(targetId);
  const sourceSlot = slotById.get(cardId);
  const targetSlot = slotById.get(targetId);

  const cardAnimation = trackAnimation(
    card.animate(
      [
        { transform: cardTransform(sourceSlot, { lift: CARD_LIFT }) },
        { transform: cardTransform(targetSlot, { lift: CARD_LIFT }) },
      ],
      { duration: TIMING.drag, easing: "ease-in-out", fill: "forwards" },
    ),
  );
  const swapAnimation = trackAnimation(
    targetCard.animate(
      [
        { transform: cardTransform(targetSlot) },
        { transform: cardTransform(sourceSlot) },
      ],
      {
        duration: TIMING.swap,
        delay: TIMING.drag - TIMING.swap,
        easing: "ease-in-out",
        fill: "both",
      },
    ),
  );

  const done = await Promise.all([
    animationFinished(cardAnimation, token),
    animationFinished(swapAnimation, token),
    moveCursorTo(pointForSlot(targetSlot), TIMING.drag, token),
  ]);
  if (done.some((value) => !value)) return false;

  setCardSlot(targetCard, sourceSlot);
  setCardSlot(card, targetSlot, { lift: CARD_LIFT });
  cardAnimation.cancel();
  swapAnimation.cancel();
  return releaseCard(card, token);
}

function currentOrder() {
  return [...slotById.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
}

function isCorrectOrder() {
  return currentOrder().every((id, index) => id === GAME.correctOrder[index]);
}

async function correctFeedback(token) {
  const cards = GAME.correctOrder.map((id) => cardsById.get(id));
  cards.forEach((card) => card.classList.add("is-correct"));
  if (!(await sleep(TIMING.feedbackFill, token))) return false;

  cards.forEach((card, index) => {
    card.style.setProperty(
      "--correct-wave-delay",
      `${index * TIMING.correctStagger}ms`,
    );
    card.classList.add("is-correct-wave");
  });

  return sleep(
    TIMING.correctWave + (cards.length - 1) * TIMING.correctStagger,
    token,
  );
}

function resetScene({ immediate = false } = {}) {
  cancelActiveAnimations();
  if (immediate) scene.classList.add("is-resetting");

  GAME.mixedOrder.forEach((id, slot) => {
    const card = cardsById.get(id);
    card.classList.remove("is-correct", "is-correct-wave", "is-dragging");
    card.style.removeProperty("--correct-wave-delay");
    card.style.zIndex = "2";
    setCardSlot(card, slot);
  });

  currentCursorPoint = CURSOR.home;
  cursorOffset = cursorPointOffset(CURSOR.home);
  cursor.style.transform = cursorTransform();
  cursorImage.style.transform = "translate3d(0, 0, 0) scale(1)";

  if (immediate) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scene.classList.remove("is-resetting"));
    });
  }
}

async function playLoop() {
  const token = ++loopToken;
  resetScene({ immediate: true });

  while (token === loopToken && !reducedMotion.matches) {
    if (!(await sleep(TIMING.presentationHold, token))) return;

    for (const move of GAME.moves) {
      const cardSlot = slotById.get(move.cardId);
      if (!(await moveCursorTo(pointForSlot(cardSlot), TIMING.cursorMove, token))) {
        return;
      }
      if (!(await pickCard(cardsById.get(move.cardId), token))) return;
      if (!(await dragAndSwap(move.cardId, move.targetId, token))) return;
      if (!(await sleep(TIMING.betweenMoves, token))) return;
    }

    if (!isCorrectOrder()) throw new Error("고정 이동 시퀀스가 정답 순서와 어긋났습니다.");
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

renderCards();
fitSceneToViewport();

startButton.addEventListener("click", () => {
  loopToken += 1;
  cancelActiveAnimations();
  window.location.href = "game.html?v=20261005-4";
});

const fontsReady = document.fonts?.ready ?? Promise.resolve();
fontsReady.then(handleMotionPreference);
reducedMotion.addEventListener("change", handleMotionPreference);
window.addEventListener("resize", fitSceneToViewport, { passive: true });
