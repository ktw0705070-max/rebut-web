const TIMING = Object.freeze({
  initialHold: 1000,
  cursorMove: 500,
  pickupPress: 100,
  drag: 600,
  betweenDrags: 160,
  scaleTilt: 500,
  afterTiltHold: 320,
  selectionMove: 500,
  selectionPress: 100,
  selectionColor: 150,
  completeHold: 1000,
  cursorReset: 500,
  sceneReset: 500,
  loopGap: 80,
});

const GAME_CONFIG = Object.freeze({
  balls: Object.freeze([
    Object.freeze({ id: 1, weight: 4 }),
    Object.freeze({ id: 2, weight: 2 }),
    Object.freeze({ id: 3, weight: 1 }),
    Object.freeze({ id: 4, weight: 3 }),
  ]),
  answer: 1,
  weighing: Object.freeze({ left: 1, right: 2 }),
  balance: Object.freeze({ degreesPerWeightUnit: 3.79, maxDegrees: 7.58 }),
});

const LAYOUT = Object.freeze({
  reference: Object.freeze({ width: 1920, height: 1080 }),
  ballSize: 75.076,
  homeCenters: Object.freeze({
    1: Object.freeze({ x: 231.762, y: 230.458 }),
    2: Object.freeze({ x: 319.762, y: 229.298 }),
    3: Object.freeze({ x: 408.072, y: 230.458 }),
    4: Object.freeze({ x: 496.232, y: 230.458 }),
  }),
  flatPanCenters: Object.freeze({
    left: Object.freeze({ x: 142.9905, y: 357.76 }),
    right: Object.freeze({ x: 584.7705, y: 357.76 }),
  }),
  armPivot: Object.freeze({ x: 363.88, y: 438.13 }),
  cursorHome: Object.freeze({ x: 566, y: 287 }),
  selectionCursor: Object.freeze({ x: 231.1, y: 251.4 }),
});

const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  Object.freeze({ selector: ".backdrop-scale", y: 509, progress: 0.5 }),
  Object.freeze({ selector: ".backdrop-actions", y: 944, progress: 1 }),
  Object.freeze({ selector: ".game-back", y: 977.87, progress: 1 }),
  Object.freeze({ selector: ".tutorial-panel", y: 103.5, progress: 0.5 }),
]);

const EASING = Object.freeze({
  move: "cubic-bezier(0.42, 0, 0.58, 1)",
  drag: "cubic-bezier(0.42, 0, 0.58, 1)",
  press: "cubic-bezier(0.2, 0, 0.2, 1)",
});

const stageShell = document.querySelector("#stage-shell");
const stage = document.querySelector("#stage");
const ballOptions = document.querySelector("#ball-options");
const balanceArm = document.querySelector("#balance-arm");
const demoCursor = document.querySelector("#demo-cursor");
const demoStatus = document.querySelector("#demo-status");
const startButton = document.querySelector("#start-button");

const byId = new Map(GAME_CONFIG.balls.map((ball) => [ball.id, ball]));
const heaviest = GAME_CONFIG.balls.reduce((best, ball) =>
  ball.weight > best.weight ? ball : best,
);

if (heaviest.id !== GAME_CONFIG.answer) {
  throw new Error("GAME_CONFIG의 정답과 공 무게가 일치하지 않습니다.");
}

const leftWeight = byId.get(GAME_CONFIG.weighing.left).weight;
const rightWeight = byId.get(GAME_CONFIG.weighing.right).weight;
const weightDelta = leftWeight - rightWeight;
const tiltMagnitude = Math.min(
  Math.abs(weightDelta) * GAME_CONFIG.balance.degreesPerWeightUnit,
  GAME_CONFIG.balance.maxDegrees,
);
const tiltDegrees = weightDelta === 0 ? 0 : -Math.sign(weightDelta) * tiltMagnitude;

const ballState = new Map(
  GAME_CONFIG.balls.map((ball) => [ball.id, { x: 0, y: 0, rotation: 0, scale: 1 }]),
);
let cursorState = { ...LAYOUT.cursorHome, scale: 1 };

function createBallArt(id, selected = false) {
  const art = document.createElement("div");
  art.className = selected ? "ball-art ball-art--selected" : "ball-art";

  const surface = document.createElement("img");
  surface.className = selected ? "ball-black" : "ball-white";
  surface.src = selected ? "./assets/ball-black.png" : "./assets/tutorial-ball-outline.svg";
  surface.alt = "";
  art.append(surface);

  if (selected) {
    const outline = document.createElement("img");
    outline.className = "selected-outline";
    outline.src = "./assets/selected-outline.svg";
    outline.alt = "";
    art.append(outline);
  }

  const number = document.createElement("span");
  number.className = "ball-number";
  number.textContent = String(id);
  art.append(number);
  return art;
}

function buildBalls() {
  const fragment = document.createDocumentFragment();

  GAME_CONFIG.balls.forEach(({ id }) => {
    const slot = document.createElement("div");
    slot.className = "ball-slot";
    slot.dataset.ballId = String(id);
    slot.setAttribute("aria-label", `${id}번 공`);

    const ghost = document.createElement("div");
    ghost.className = "ball-ghost";
    ghost.append(createBallArt(id));

    const ball = document.createElement("div");
    ball.className = "ball";
    ball.append(createBallArt(id));

    const choice = document.createElement("div");
    choice.className = "ball-choice";
    choice.append(createBallArt(id, true));

    slot.append(ghost, ball, choice);
    fragment.append(slot);
  });

  ballOptions.append(fragment);
}

function fitStage() {
  const scale = Math.min(
    window.innerWidth / LAYOUT.reference.width,
    window.innerHeight / LAYOUT.reference.height,
  );
  const verticalExtra = Math.max(
    0,
    window.innerHeight / scale - LAYOUT.reference.height,
  );

  stage.style.setProperty("--stage-scale", String(scale));
  stage.style.height = `${LAYOUT.reference.height + verticalExtra}px`;

  RESPONSIVE_VERTICAL_ANCHORS.forEach(({ selector, y, progress }) => {
    const element = stage.querySelector(selector);
    element.style.top = `${y + verticalExtra * progress}px`;
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function ballElements(id) {
  const slot = document.querySelector(`.ball-slot[data-ball-id="${id}"]`);
  return {
    slot,
    ball: slot.querySelector(".ball"),
    ghost: slot.querySelector(".ball-ghost"),
    choice: slot.querySelector(".ball-choice"),
  };
}

function ballTransform({ x, y, rotation, scale }) {
  return `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
}

function cursorTransform({ x, y, scale }) {
  return `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
}

async function animateTo(element, keyframes, options, finalStyles) {
  const animation = element.animate(keyframes, { fill: "forwards", ...options });
  try {
    await animation.finished;
  } finally {
    Object.assign(element.style, finalStyles);
    animation.cancel();
  }
}

async function moveCursor(point, duration = TIMING.cursorMove) {
  const next = { x: point.x, y: point.y, scale: 1 };
  await animateTo(
    demoCursor,
    [
      { transform: cursorTransform(cursorState) },
      { transform: cursorTransform(next) },
    ],
    { duration, easing: EASING.move },
    { transform: cursorTransform(next) },
  );
  cursorState = next;
}

async function pressCursorAndBall(id) {
  const { ball } = ballElements(id);
  const current = ballState.get(id);
  const pressedBall = { ...current, scale: 0.96 };
  const pressedCursor = { ...cursorState, scale: 0.96 };

  await Promise.all([
    animateTo(
      ball,
      [
        { transform: ballTransform(current), offset: 0 },
        { transform: ballTransform(pressedBall), offset: 0.5 },
        { transform: ballTransform(current), offset: 1 },
      ],
      { duration: TIMING.pickupPress, easing: EASING.press },
      { transform: ballTransform(current) },
    ),
    animateTo(
      demoCursor,
      [
        { transform: cursorTransform(cursorState), offset: 0 },
        { transform: cursorTransform(pressedCursor), offset: 0.5 },
        { transform: cursorTransform(cursorState), offset: 1 },
      ],
      { duration: TIMING.pickupPress, easing: EASING.press },
      { transform: cursorTransform(cursorState) },
    ),
  ]);
}

async function moveBall(id, absoluteCenter, duration, rotation = 0) {
  const { ball } = ballElements(id);
  const home = LAYOUT.homeCenters[id];
  const current = ballState.get(id);
  const next = {
    x: absoluteCenter.x - home.x,
    y: absoluteCenter.y - home.y,
    rotation,
    scale: 1,
  };

  await animateTo(
    ball,
    [
      { transform: ballTransform(current) },
      { transform: ballTransform(next) },
    ],
    { duration, easing: EASING.drag },
    { transform: ballTransform(next) },
  );
  ballState.set(id, next);
}

function cursorAtCenter(center) {
  return { x: center.x - 1.5, y: center.y - 1.5 };
}

async function dragBallToPan(id, side) {
  const home = LAYOUT.homeCenters[id];
  const destination = LAYOUT.flatPanCenters[side];
  const { slot } = ballElements(id);

  demoStatus.textContent = `${id}번 공을 ${side === "left" ? "왼쪽" : "오른쪽"} 접시로 옮깁니다.`;
  await moveCursor(cursorAtCenter(home));
  await pressCursorAndBall(id);
  slot.classList.add("is-vacant");
  await Promise.all([
    moveCursor(cursorAtCenter(destination), TIMING.drag),
    moveBall(id, destination, TIMING.drag),
  ]);
}

function rotatePoint(point, pivot, degrees) {
  const radians = (degrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + dx * cosine - dy * sine,
    y: pivot.y + dx * sine + dy * cosine,
  };
}

async function tiltScale() {
  const leftId = GAME_CONFIG.weighing.left;
  const rightId = GAME_CONFIG.weighing.right;
  const tiltedLeft = rotatePoint(LAYOUT.flatPanCenters.left, LAYOUT.armPivot, tiltDegrees);
  const tiltedRight = rotatePoint(LAYOUT.flatPanCenters.right, LAYOUT.armPivot, tiltDegrees);

  demoStatus.textContent =
    weightDelta > 0
      ? `${leftId}번 공이 더 무거워 왼쪽 접시가 내려갑니다.`
      : `${rightId}번 공이 더 무거워 오른쪽 접시가 내려갑니다.`;

  await Promise.all([
    animateTo(
      balanceArm,
      [
        { transform: "rotate(0deg)" },
        { transform: `rotate(${tiltDegrees}deg)` },
      ],
      { duration: TIMING.scaleTilt, easing: EASING.move },
      { transform: `rotate(${tiltDegrees}deg)` },
    ),
    moveBall(leftId, tiltedLeft, TIMING.scaleTilt, tiltDegrees),
    moveBall(rightId, tiltedRight, TIMING.scaleTilt, tiltDegrees),
  ]);
}

async function selectAnswer() {
  const { ghost, choice } = ballElements(GAME_CONFIG.answer);
  demoStatus.textContent = `${GAME_CONFIG.answer}번 공을 가장 무거운 공으로 선택합니다.`;

  await moveCursor(LAYOUT.selectionCursor, TIMING.selectionMove);

  await Promise.all([
    animateTo(
      ghost,
      [
        { transform: "scale(1)", offset: 0 },
        { transform: "scale(0.96)", offset: 0.5 },
        { transform: "scale(1)", offset: 1 },
      ],
      { duration: TIMING.selectionPress, easing: EASING.press },
      { transform: "scale(1)" },
    ),
    animateTo(
      demoCursor,
      [
        { transform: cursorTransform(cursorState), offset: 0 },
        { transform: cursorTransform({ ...cursorState, scale: 0.96 }), offset: 0.5 },
        { transform: cursorTransform(cursorState), offset: 1 },
      ],
      { duration: TIMING.selectionPress, easing: EASING.press },
      { transform: cursorTransform(cursorState) },
    ),
  ]);

  await animateTo(
    choice,
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: TIMING.selectionColor, easing: "linear" },
    { opacity: "1" },
  );
  demoStatus.textContent = `정답은 ${GAME_CONFIG.answer}번 공입니다.`;
}

async function resetScene() {
  const leftId = GAME_CONFIG.weighing.left;
  const rightId = GAME_CONFIG.weighing.right;
  const answerChoice = ballElements(GAME_CONFIG.answer).choice;

  await moveCursor(LAYOUT.cursorHome, TIMING.cursorReset);
  demoStatus.textContent = "처음 상태로 돌아갑니다.";

  await Promise.all([
    animateTo(
      balanceArm,
      [
        { transform: `rotate(${tiltDegrees}deg)` },
        { transform: "rotate(0deg)" },
      ],
      { duration: TIMING.sceneReset, easing: EASING.move },
      { transform: "rotate(0deg)" },
    ),
    moveBall(leftId, LAYOUT.homeCenters[leftId], TIMING.sceneReset),
    moveBall(rightId, LAYOUT.homeCenters[rightId], TIMING.sceneReset),
    animateTo(
      answerChoice,
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: TIMING.selectionColor, easing: "linear" },
      { opacity: "0" },
    ),
  ]);

  ballElements(leftId).slot.classList.remove("is-vacant");
  ballElements(rightId).slot.classList.remove("is-vacant");
}

async function runDemo() {
  while (true) {
    demoStatus.textContent = "저울은 수평이고 숫자 공 네 개가 놓여 있습니다.";
    await wait(TIMING.initialHold);

    await dragBallToPan(GAME_CONFIG.weighing.left, "left");
    await wait(TIMING.betweenDrags);
    await dragBallToPan(GAME_CONFIG.weighing.right, "right");
    await tiltScale();
    await wait(TIMING.afterTiltHold);

    await selectAnswer();
    await wait(TIMING.completeHold);

    await resetScene();
    await wait(TIMING.loopGap);
  }
}

async function start() {
  buildBalls();
  fitStage();
  new ResizeObserver(fitStage).observe(stageShell);

  const images = [...document.images];
  await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
  requestAnimationFrame(() => requestAnimationFrame(runDemo));
}

window.REBUT_DEMO = Object.freeze({
  timing: TIMING,
  game: GAME_CONFIG,
  derived: Object.freeze({ heaviestId: heaviest.id, tiltDegrees }),
});

startButton.addEventListener("click", () => {
  window.location.href = "./game.html?v=20261005-4";
});

start();
