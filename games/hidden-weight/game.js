const GAME_SETTINGS = Object.freeze({
  MAX_FREE_WRONG_ATTEMPTS: 2,
  PAN_CAPACITY: 3,
  DRAG_THRESHOLD_PX: 10,
  BALANCE: Object.freeze({
    degreesPerWeightUnit: 1.6,
    maxDegrees: 8.5,
  }),
  LEVELS: Object.freeze({
    1: Object.freeze({
      answer: 1,
      minimumMeasurements: 2,
      homeLefts: Object.freeze([618, 794, 970, 1146]),
      balls: Object.freeze([
        Object.freeze({ id: 1, weight: 8 }),
        Object.freeze({ id: 2, weight: 3 }),
        Object.freeze({ id: 3, weight: 5 }),
        Object.freeze({ id: 4, weight: 6 }),
      ]),
    }),
    2: Object.freeze({
      answer: 4,
      minimumMeasurements: 2,
      homeLefts: Object.freeze([442, 618, 794, 970, 1146, 1322]),
      balls: Object.freeze([
        Object.freeze({ id: 1, weight: 4 }),
        Object.freeze({ id: 2, weight: 7 }),
        Object.freeze({ id: 3, weight: 2 }),
        Object.freeze({ id: 4, weight: 9 }),
        Object.freeze({ id: 5, weight: 5 }),
        Object.freeze({ id: 6, weight: 6 }),
      ]),
    }),
    3: Object.freeze({
      answer: 7,
      minimumMeasurements: 2,
      homeLefts: Object.freeze([266, 442, 618, 794, 970, 1146, 1322, 1498]),
      balls: Object.freeze([
        Object.freeze({ id: 1, weight: 5 }),
        Object.freeze({ id: 2, weight: 9 }),
        Object.freeze({ id: 3, weight: 3 }),
        Object.freeze({ id: 4, weight: 7 }),
        Object.freeze({ id: 5, weight: 8 }),
        Object.freeze({ id: 6, weight: 4 }),
        Object.freeze({ id: 7, weight: 10 }),
        Object.freeze({ id: 8, weight: 6 }),
      ]),
    }),
  }),
});

const RESULT_STORAGE_KEY = "rebut.hidden-weight.result.v1";

const TIMINGS = Object.freeze({
  PICKUP_PRESS_MS: 100,
  BALL_MOVE_MS: 260,
  GHOST_FADE_MS: 150,
  SCALE_TILT_MS: 500,
  WRONG_SHAKE_MS: 200,
  WRONG_ANSWER_PAUSE_MS: 180,
  ANSWER_REVEAL_MS: 900,
  CORRECT_LOGO_WAVE_MS: 1000,
  LOGO_WAVE_LETTER_MS: 660,
  LOGO_WAVE_STAGGER_MS: 85,
  HELP_VISIBLE_MS: 5000,
  LEVEL_BLOCK_COUNT: 8,
  LEVEL_BLOCK_DURATION: 760,
  LEVEL_BLOCK_STAGGER: 70,
  LEVEL_TITLE_COVER_OVERLAP: 160,
  LEVEL_TITLE_ASSEMBLE: 1800,
  LEVEL_TITLE_STAGGER: 14,
  LEVEL_TITLE_HOLD: 180,
  LEVEL_TITLE_SHAKE: 1050,
  LEVEL_TITLE_FADE_OUT: 500,
  LEVEL_REVEAL_DURATION: 720,
  LEVEL_REVEAL_STAGGER: 70,
});

const LAYOUT = Object.freeze({
  STAGE_WIDTH: 1920,
  STAGE_HEIGHT: 1080,
  TOP_FIXED_END_Y: 133,
  BALL_TOP: 176,
  BALL_SIZE: 156,
  SCALE_TOP: 527.96,
  SCALE_LEFT: 235.2405,
  SCALE_WIDTH: 1449.759,
  ARM_PIVOT_X: 960.12,
  ARM_PIVOT_Y_IN_SCENE: 151.96,
  LEFT_PAN_CENTER_X: 443.3945,
  RIGHT_PAN_CENTER_X: 1466.6545,
  PAN_BALL_CENTER_Y_IN_SCENE: 1,
  PAN_SLOT_SPACING: 152,
});

const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  Object.freeze({ selector: ".help-button", y: 159 }),
  Object.freeze({ selector: ".paper-speck", y: 926 }),
  Object.freeze({ selector: ".game-actions", y: 944 }),
  Object.freeze({ selector: ".back-control", y: 977.87 }),
  Object.freeze({ selector: ".restart-control", y: 253.6 }),
]);

const stage = document.querySelector("#game-stage");
const weightGame = document.querySelector("#weight-game");
const ballsLayer = document.querySelector("#balls-layer");
const scaleScene = document.querySelector("#scale-scene");
const scaleArm = document.querySelector("#scale-arm");
const gameActions = document.querySelector("#game-actions");
const targetButton = document.querySelector("#target-button");
const measureButton = document.querySelector("#measure-button");
const clearButton = document.querySelector("#clear-button");
const levelNumber = document.querySelector("#level-number");
const roundNumber = document.querySelector("#round-number");
const helpButton = document.querySelector("#help-button");
const gameLogo = document.querySelector(".game-logo");
const gameLogoLetters = [...gameLogo.querySelectorAll("img")];
const restartControl = document.querySelector("#restart-control");
const backControl = document.querySelector("#back-control");
const status = document.querySelector("#game-status");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  level: 1,
  selectedBallId: null,
  wrongAttempts: 0,
  measurements: 0,
  currentAngle: 0,
  stageScale: 1,
  verticalExtra: 0,
  locked: true,
  balls: [],
  drag: null,
  actionToken: 0,
  session: {
    startedAt: 0,
    elapsedMs: 0,
    correctGuesses: 0,
    totalGuesses: 0,
    efficiencyScores: [],
  },
};


document.documentElement.style.setProperty("--wrong-shake", `${TIMINGS.WRONG_SHAKE_MS}ms`);
document.documentElement.style.setProperty(
  "--logo-wave-letter-duration",
  `${TIMINGS.LOGO_WAVE_LETTER_MS}ms`,
);
document.documentElement.style.setProperty("--ball-move-duration", `${TIMINGS.BALL_MOVE_MS}ms`);
document.documentElement.style.setProperty("--ghost-fade-duration", `${TIMINGS.GHOST_FADE_MS}ms`);
document.documentElement.style.setProperty("--scale-tilt-duration", `${TIMINGS.SCALE_TILT_MS}ms`);
document.documentElement.style.setProperty("--step-block-duration", `${TIMINGS.LEVEL_BLOCK_DURATION}ms`);
document.documentElement.style.setProperty("--step-block-stagger", `${TIMINGS.LEVEL_BLOCK_STAGGER}ms`);
document.documentElement.style.setProperty("--step-title-duration", `${TIMINGS.LEVEL_TITLE_ASSEMBLE}ms`);
document.documentElement.style.setProperty("--step-title-stagger", `${TIMINGS.LEVEL_TITLE_STAGGER}ms`);
document.documentElement.style.setProperty("--step-title-fade", `${TIMINGS.LEVEL_TITLE_FADE_OUT}ms`);
document.documentElement.style.setProperty("--step-reveal-duration", `${TIMINGS.LEVEL_REVEAL_DURATION}ms`);
document.documentElement.style.setProperty("--step-reveal-stagger", `${TIMINGS.LEVEL_REVEAL_STAGGER}ms`);

gameLogoLetters.forEach((letter, index) => {
  letter.style.setProperty("--logo-wave-delay", `${index * TIMINGS.LOGO_WAVE_STAGGER_MS}ms`);
});

function delay(milliseconds) {
  return new Promise((resolve) => (window.RebutGameClock || window).setTimeout(resolve, milliseconds));
}

function motionDelay(milliseconds) {
  return prefersReducedMotion.matches ? Math.min(milliseconds, 40) : milliseconds;
}

function responsiveY(y) {
  const progress = Math.min(
    1,
    Math.max(0, (y - LAYOUT.TOP_FIXED_END_Y) / (LAYOUT.STAGE_HEIGHT - LAYOUT.TOP_FIXED_END_Y)),
  );
  return y + state.verticalExtra * progress;
}

function currentBallTop() {
  return responsiveY(LAYOUT.BALL_TOP);
}

function currentScaleTop() {
  return responsiveY(LAYOUT.SCALE_TOP);
}

function currentArmPivot() {
  return {
    x: LAYOUT.ARM_PIVOT_X,
    y: currentScaleTop() + LAYOUT.ARM_PIVOT_Y_IN_SCENE,
  };
}

function fitStageToViewport() {
  const scale = Math.min(
    window.innerWidth / LAYOUT.STAGE_WIDTH,
    window.innerHeight / LAYOUT.STAGE_HEIGHT,
  );
  const verticalExtra = Math.max(0, window.innerHeight / scale - LAYOUT.STAGE_HEIGHT);

  state.stageScale = scale;
  state.verticalExtra = verticalExtra;
  stage.style.setProperty("--game-scale", String(scale));
  stage.style.height = `${LAYOUT.STAGE_HEIGHT + verticalExtra}px`;

  RESPONSIVE_VERTICAL_ANCHORS.forEach(({ selector, y }) => {
    document.querySelector(selector).style.top = `${responsiveY(y)}px`;
  });

  scaleScene.style.top = `${currentScaleTop()}px`;
  state.balls.forEach((ball) => {
    ball.element.style.top = `${currentBallTop()}px`;
    ball.ghost.style.top = `${currentBallTop()}px`;
  });
  renderBallPositions(0);
}

function updateProgress() {
  levelNumber.src = `../sequence-memory/assets/round-digit-${state.level}.png`;
  levelNumber.alt = String(state.level);
  roundNumber.src = "../sequence-memory/assets/round-digit-1.png";
  roundNumber.alt = "1";
  levelNumber.parentElement.setAttribute("aria-label", `현재 진행 ${state.level}-1`);
}

function setLocked(locked) {
  state.locked = locked;
  ballsLayer.classList.toggle("is-locked", locked);
  state.balls.forEach(updateGhostAvailability);
  targetButton.disabled = locked;
  measureButton.disabled = locked;
  clearButton.disabled = locked;
}

function clearCandidate() {
  state.selectedBallId = null;
  syncCandidateClasses();
}

function syncCandidateClasses() {
  state.balls.forEach((ball) => {
    const selected = state.selectedBallId === ball.id;
    ball.element.classList.toggle("is-candidate", selected && ball.side === "home");
    ball.ghost.classList.toggle("is-candidate", selected && ball.side !== "home");
  });
}

function updateGhostAvailability(ball) {
  const visible = ball.side !== "home";
  ball.ghost.classList.toggle("is-visible", visible);
  ball.ghost.disabled = state.locked || ball.side === "home" || ball.side === "dragging";
  ball.ghost.setAttribute("aria-hidden", String(!visible));
}

function selectCandidate(ball) {
  if (state.locked) return;
  state.selectedBallId = ball.id;
  syncCandidateClasses();
  status.textContent = `${ball.id}번 공을 선택했습니다. 지목 버튼을 누르면 판정합니다.`;
}

function validateLevel(level) {
  const config = GAME_SETTINGS.LEVELS[level];
  const calculated = config.balls.reduce((best, ball) =>
    ball.weight > best.weight ? ball : best,
  );
  if (calculated.id !== config.answer) {
    throw new Error(`${level}단계의 공 무게와 정답이 일치하지 않습니다.`);
  }
}

function makeBall(ballData, homeLeft) {
  const button = document.createElement("button");
  button.className = "number-ball";
  button.type = "button";
  button.dataset.ballId = String(ballData.id);
  button.setAttribute("aria-label", `${ballData.id}번 공`);
  button.style.left = `${homeLeft}px`;
  button.style.top = `${currentBallTop()}px`;

  const visual = document.createElement("span");
  visual.className = "ball-visual";

  const outline = document.createElement("img");
  outline.className = "ball-outline";
  outline.src = "./assets/ball-frame.png";
  outline.alt = "";
  outline.draggable = false;

  const selectedFill = document.createElement("img");
  selectedFill.className = "ball-selected-fill";
  selectedFill.src = "./assets/selected-outline.svg";
  selectedFill.alt = "";
  selectedFill.draggable = false;

  const label = document.createElement("span");
  label.className = "ball-label";
  label.textContent = String(ballData.id);

  visual.append(outline, selectedFill, label);
  button.append(visual);
  return button;
}

function buildLevelBalls(level) {
  const config = GAME_SETTINGS.LEVELS[level];
  ballsLayer.replaceChildren();
  state.balls = config.balls.map((ballData, index) => {
    const element = makeBall(ballData, config.homeLefts[index]);
    const ghost = document.createElement("button");
    ghost.className = "home-ball-ghost";
    ghost.type = "button";
    ghost.disabled = true;
    ghost.setAttribute("aria-hidden", "true");
    ghost.setAttribute("aria-label", `${ballData.id}번 공 지목`);
    ghost.style.left = `${config.homeLefts[index]}px`;
    ghost.style.top = `${currentBallTop()}px`;
    ghost.append(element.querySelector(".ball-visual").cloneNode(true));
    const ball = {
      ...ballData,
      homeLeft: config.homeLefts[index],
      side: "home",
      element,
      ghost,
    };

    element.addEventListener("pointerdown", (event) => handleBallPointerDown(event, ball));
    element.addEventListener("pointermove", handleBallPointerMove);
    element.addEventListener("pointerup", handleBallPointerUp);
    element.addEventListener("pointercancel", handleBallPointerCancel);
    element.addEventListener("click", (event) => {
      if (event.detail === 0 && ball.side === "home") selectCandidate(ball);
    });
    ghost.addEventListener("click", () => {
      if (ball.side === "left" || ball.side === "right") {
        pressBall(ball, ghost);
        selectCandidate(ball);
      }
    });
    ballsLayer.append(ghost, element);
    return ball;
  });
}

function setupLevel(level) {
  validateLevel(level);
  state.actionToken += 1;
  state.level = level;
  state.selectedBallId = null;
  state.wrongAttempts = 0;
  state.measurements = 0;
  state.currentAngle = 0;
  state.drag = null;
  scaleArm.style.transition = "none";
  scaleArm.style.transform = "rotate(0deg)";
  buildLevelBalls(level);
  updateProgress();
  renderBallPositions(0);
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

function panCenters(side, count) {
  const centerX = side === "left" ? LAYOUT.LEFT_PAN_CENTER_X : LAYOUT.RIGHT_PAN_CENTER_X;
  const centerY = currentScaleTop() + LAYOUT.PAN_BALL_CENTER_Y_IN_SCENE;
  if (count === 1) return [{ x: centerX, y: centerY }];
  if (count === 2) {
    return [
      { x: centerX - LAYOUT.PAN_SLOT_SPACING / 2, y: centerY },
      { x: centerX + LAYOUT.PAN_SLOT_SPACING / 2, y: centerY },
    ];
  }
  return [
    { x: centerX - LAYOUT.PAN_SLOT_SPACING, y: centerY },
    { x: centerX, y: centerY },
    { x: centerX + LAYOUT.PAN_SLOT_SPACING, y: centerY },
  ];
}

function createPanPositionMap() {
  const map = new Map();
  ["left", "right"].forEach((side) => {
    const sideBalls = state.balls.filter((ball) => ball.side === side);
    const centers = panCenters(side, sideBalls.length);
    sideBalls.forEach((ball, index) => map.set(ball.id, centers[index]));
  });
  return map;
}

function homeCenter(ball) {
  return {
    x: ball.homeLeft + LAYOUT.BALL_SIZE / 2,
    y: currentBallTop() + LAYOUT.BALL_SIZE / 2,
  };
}

function desiredPose(ball, panPositions) {
  if (ball.side === "home" || ball.side === "dragging") {
    return { center: homeCenter(ball), rotation: 0 };
  }

  const flatCenter = panPositions.get(ball.id);
  if (!flatCenter) return { center: homeCenter(ball), rotation: 0 };
  if (state.currentAngle === 0) return { center: flatCenter, rotation: 0 };

  return {
    center: rotatePoint(flatCenter, currentArmPivot(), state.currentAngle),
    rotation: state.currentAngle,
  };
}

function transformForPose(ball, pose) {
  const home = homeCenter(ball);
  return `translate3d(${pose.center.x - home.x}px, ${pose.center.y - home.y}px, 0) rotate(${pose.rotation}deg)`;
}

function applyBallPose(ball, pose, duration) {
  ball.element.style.transition = duration > 0
    ? `transform ${motionDelay(duration)}ms cubic-bezier(0.42, 0, 0.58, 1)`
    : "none";
  ball.element.style.transform = transformForPose(ball, pose);
}

function renderBallPositions(duration = TIMINGS.BALL_MOVE_MS) {
  const panPositions = createPanPositionMap();
  state.balls.forEach((ball) => {
    updateGhostAvailability(ball);
    if (ball.side !== "dragging") {
      applyBallPose(ball, desiredPose(ball, panPositions), duration);
    }
  });
  syncCandidateClasses();
}

function stagePoint(event) {
  const rect = stage.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / state.stageScale,
    y: (event.clientY - rect.top) / state.stageScale,
  };
}

function pressBall(ball, target = ball.element) {
  const visual = target.querySelector(".ball-visual");
  visual.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(0.96)", offset: 0.5 },
      { transform: "scale(1)" },
    ],
    {
      duration: motionDelay(TIMINGS.PICKUP_PRESS_MS),
      easing: "ease-out",
    },
  );
}

function flattenScaleImmediately() {
  if (state.currentAngle === 0) return;
  state.currentAngle = 0;
  scaleArm.style.transition = "none";
  scaleArm.style.transform = "rotate(0deg)";
  renderBallPositions(0);
}

function handleBallPointerDown(event, ball) {
  if (state.locked || event.button !== 0) return;
  event.preventDefault();
  pressBall(ball);

  const panPositions = createPanPositionMap();
  const startPose = desiredPose(ball, panPositions);
  const pointer = stagePoint(event);
  const originalSide = ball.side;

  state.drag = {
    ball,
    pointerId: event.pointerId,
    originalSide,
    started: false,
    startPointer: pointer,
    startCenter: startPose.center,
    currentCenter: startPose.center,
  };

  ball.element.setPointerCapture(event.pointerId);
}

function handleBallPointerMove(event) {
  const drag = state.drag;
  if (!drag || drag.pointerId !== event.pointerId) return;

  const pointer = stagePoint(event);
  if (!drag.started) {
    const distance = Math.hypot(
      pointer.x - drag.startPointer.x,
      pointer.y - drag.startPointer.y,
    );
    if (distance < GAME_SETTINGS.DRAG_THRESHOLD_PX) return;

    flattenScaleImmediately();
    drag.startCenter = desiredPose(drag.ball, createPanPositionMap()).center;
    drag.started = true;
    drag.ball.side = "dragging";
    if (state.selectedBallId === drag.ball.id) clearCandidate();
    drag.ball.element.style.zIndex = "40";
    drag.ball.element.style.transition = "none";
    renderBallPositions(TIMINGS.BALL_MOVE_MS);
    status.textContent = `${drag.ball.id}번 공을 저울 접시로 옮기세요.`;
  }

  const center = {
    x: Math.min(
      LAYOUT.STAGE_WIDTH - LAYOUT.BALL_SIZE / 2,
      Math.max(LAYOUT.BALL_SIZE / 2, drag.startCenter.x + pointer.x - drag.startPointer.x),
    ),
    y: Math.min(
      responsiveY(920),
      Math.max(145, drag.startCenter.y + pointer.y - drag.startPointer.y),
    ),
  };

  drag.currentCenter = center;
  applyBallPose(drag.ball, { center, rotation: 0 }, 0);
}

function dropSideForCenter(center) {
  const top = currentScaleTop() - 130;
  const bottom = currentScaleTop() + 205;
  if (center.y < top || center.y > bottom) return null;
  if (center.x >= 120 && center.x <= 685) return "left";
  if (center.x >= 1235 && center.x <= 1800) return "right";
  return null;
}

function finishDrag(event, cancelled = false) {
  const drag = state.drag;
  if (!drag || drag.pointerId !== event.pointerId) return;

  if (!drag.started) {
    if (drag.ball.element.hasPointerCapture(event.pointerId)) {
      drag.ball.element.releasePointerCapture(event.pointerId);
    }
    state.drag = null;
    if (!cancelled && drag.originalSide === "home") {
      selectCandidate(drag.ball);
    } else if (!cancelled) {
      status.textContent = "지목할 공은 위쪽 줄에서 클릭하세요.";
    }
    return;
  }

  let nextSide = cancelled ? drag.originalSide : dropSideForCenter(drag.currentCenter);
  if (!nextSide) nextSide = "home";

  if (nextSide !== "home") {
    const occupancy = state.balls.filter((ball) => ball.side === nextSide).length;
    if (occupancy >= GAME_SETTINGS.PAN_CAPACITY) {
      nextSide = drag.originalSide === "dragging" ? "home" : drag.originalSide;
      status.textContent = "한 접시에는 공을 세 개까지 올릴 수 있습니다.";
    }
  }

  drag.ball.side = nextSide;
  drag.ball.element.style.zIndex = "12";
  if (drag.ball.element.hasPointerCapture(event.pointerId)) {
    drag.ball.element.releasePointerCapture(event.pointerId);
  }
  state.drag = null;
  renderBallPositions(TIMINGS.BALL_MOVE_MS);

  if (nextSide === "home") {
    status.textContent = `${drag.ball.id}번 공을 원위치로 돌렸습니다.`;
  } else {
    status.textContent = `${drag.ball.id}번 공을 ${nextSide === "left" ? "왼쪽" : "오른쪽"} 접시에 올렸습니다.`;
  }
}

function handleBallPointerUp(event) {
  finishDrag(event, false);
}

function handleBallPointerCancel(event) {
  finishDrag(event, true);
}

function sideWeight(side) {
  return state.balls
    .filter((ball) => ball.side === side)
    .reduce((sum, ball) => sum + ball.weight, 0);
}

function calculateTilt(leftWeight, rightWeight) {
  const difference = leftWeight - rightWeight;
  if (difference === 0) return 0;
  const magnitude = Math.min(
    Math.abs(difference) * GAME_SETTINGS.BALANCE.degreesPerWeightUnit,
    GAME_SETTINGS.BALANCE.maxDegrees,
  );
  return -Math.sign(difference) * magnitude;
}

async function setBalanceAngle(angle, duration = TIMINGS.SCALE_TILT_MS) {
  state.currentAngle = angle;
  scaleArm.style.transition = duration > 0
    ? `transform ${motionDelay(duration)}ms cubic-bezier(0.42, 0, 0.58, 1)`
    : "none";
  scaleArm.style.transform = `rotate(${angle}deg)`;
  renderBallPositions(duration);
  await delay(motionDelay(duration));
}

async function measureScale() {
  if (state.locked || state.drag) return;
  const leftBalls = state.balls.filter((ball) => ball.side === "left");
  const rightBalls = state.balls.filter((ball) => ball.side === "right");

  if (leftBalls.length === 0 || rightBalls.length === 0) {
    gameActions.classList.remove("is-shaking");
    void gameActions.offsetWidth;
    gameActions.classList.add("is-shaking");
    (window.RebutGameClock || window).setTimeout(() => gameActions.classList.remove("is-shaking"), TIMINGS.WRONG_SHAKE_MS);
    status.textContent = "양쪽 접시에 공을 하나 이상 올려주세요.";
    return;
  }

  const token = ++state.actionToken;
  setLocked(true);
  const leftWeight = sideWeight("left");
  const rightWeight = sideWeight("right");
  const angle = calculateTilt(leftWeight, rightWeight);
  await setBalanceAngle(angle);
  if (token !== state.actionToken) return;

  state.measurements += 1;
  if (angle === 0) {
    status.textContent = "양쪽 접시의 무게가 같습니다.";
  } else if (angle < 0) {
    status.textContent = "왼쪽 접시가 더 무겁습니다.";
  } else {
    status.textContent = "오른쪽 접시가 더 무겁습니다.";
  }
  setLocked(false);
}

function clearScale() {
  if (state.locked) return;
  state.actionToken += 1;
  state.currentAngle = 0;
  clearCandidate();
  scaleArm.style.transition = `transform ${motionDelay(TIMINGS.SCALE_TILT_MS)}ms cubic-bezier(0.42, 0, 0.58, 1)`;
  scaleArm.style.transform = "rotate(0deg)";
  state.balls.forEach((ball) => {
    ball.side = "home";
  });
  renderBallPositions(TIMINGS.SCALE_TILT_MS);
  status.textContent = "저울을 비우고 공을 원위치로 돌렸습니다.";
}

function resetProblem() {
  state.actionToken += 1;
  state.drag = null;
  state.currentAngle = 0;
  scaleArm.style.transition = "none";
  scaleArm.style.transform = "rotate(0deg)";
  clearCandidate();
  state.balls.forEach((ball) => {
    ball.side = "home";
    ball.element.style.zIndex = "12";
  });
  renderBallPositions(TIMINGS.BALL_MOVE_MS);
  setLocked(false);
  status.textContent = "문제를 처음 상태로 다시 보여줍니다.";
}

async function playCorrectLogoWave() {
  gameLogo.classList.remove("is-waving");
  void gameLogo.offsetWidth;
  gameLogo.classList.add("is-waving");
  await delay(motionDelay(TIMINGS.CORRECT_LOGO_WAVE_MS));
  gameLogo.classList.remove("is-waving");
}

async function handleGuess(ball) {
  if (state.locked || state.selectedBallId !== ball.id) return;
  const token = ++state.actionToken;
  setLocked(true);
  pressBall(ball, ball.side === "home" ? ball.element : ball.ghost);

  const answer = GAME_SETTINGS.LEVELS[state.level].answer;
  state.session.totalGuesses += 1;
  if (ball.id === answer) {
    state.session.correctGuesses += 1;
    status.textContent = "정답입니다.";
    await playCorrectLogoWave();
    if (token !== state.actionToken) return;
    await completeLevel();
    return;
  }

  state.wrongAttempts += 1;
  weightGame.classList.remove("is-shaking");
  void weightGame.offsetWidth;
  weightGame.classList.add("is-shaking");
  status.textContent = "가장 무거운 공이 아닙니다. 다시 생각해보세요.";
  await delay(motionDelay(TIMINGS.WRONG_SHAKE_MS));
  weightGame.classList.remove("is-shaking");
  await delay(TIMINGS.WRONG_ANSWER_PAUSE_MS);
  if (token !== state.actionToken) return;

  clearCandidate();
  if (state.wrongAttempts > GAME_SETTINGS.MAX_FREE_WRONG_ATTEMPTS) {
    const answerBall = state.balls.find((item) => item.id === answer);
    state.selectedBallId = answerBall.id;
    syncCandidateClasses();
    status.textContent = `정답은 ${answer}번 공입니다.`;
    await delay(TIMINGS.ANSWER_REVEAL_MS);
    if (token !== state.actionToken) return;
    await completeLevel();
    return;
  }

  setLocked(false);
}


async function showLevelTransition(level) {
  status.textContent = `스텝 ${level}을 시작합니다.`;
  await window.RebutStepTransition.show(level);
}

async function completeLevel() {
  if (state.session.startedAt > 0) {
    state.session.elapsedMs += (window.RebutGameClock?.now() ?? performance.now()) - state.session.startedAt;
    state.session.startedAt = 0;
  }
  const levelConfig = GAME_SETTINGS.LEVELS[state.level];
  const efficiency = state.measurements === 0
    ? 0
    : Math.min(100, (levelConfig.minimumMeasurements / state.measurements) * 100);
  state.session.efficiencyScores.push(efficiency);

  if (state.level < Object.keys(GAME_SETTINGS.LEVELS).length) {
    const nextLevel = state.level + 1;
    setupLevel(nextLevel);
    setLocked(true);
    await showLevelTransition(nextLevel);
    setLocked(false);
    state.session.startedAt = (window.RebutGameClock?.now() ?? performance.now());
    status.textContent = `${nextLevel}단계입니다. 저울질을 시작하세요.`;
    return;
  }

  status.textContent = "진단 결과로 이동합니다.";
  const elapsedSeconds = Math.max(0, state.session.elapsedMs / 1000);
  const accuracy = state.session.totalGuesses === 0
    ? 0
    : (state.session.correctGuesses / state.session.totalGuesses) * 100;
  const inferenceEfficiency = state.session.efficiencyScores.length === 0
    ? 0
    : state.session.efficiencyScores.reduce((sum, value) => sum + value, 0)
      / state.session.efficiencyScores.length;

  sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({
    accuracy: Math.round(accuracy * 10) / 10,
    time: Math.round(elapsedSeconds * 10) / 10,
    efficiency: Math.round(inferenceEfficiency * 10) / 10,
  }));
  window.location.href = "./result.html";
}


async function startGame() {
  sessionStorage.removeItem(RESULT_STORAGE_KEY);
  state.session.startedAt = 0;
  state.session.elapsedMs = 0;
  state.session.correctGuesses = 0;
  state.session.totalGuesses = 0;
  state.session.efficiencyScores = [];
  setupLevel(1);
  fitStageToViewport();
  setLocked(true);
  await showLevelTransition(1);
  setLocked(false);
  state.session.startedAt = (window.RebutGameClock?.now() ?? performance.now());
  status.textContent = "공을 양쪽 접시에 올려 무게를 비교하세요.";
}

targetButton.addEventListener("click", (event) => {
  if (event.detail > 0) targetButton.blur();
  if (state.locked) return;
  const candidate = state.balls.find((ball) => ball.id === state.selectedBallId);
  if (!candidate) {
    gameActions.classList.remove("is-shaking");
    void gameActions.offsetWidth;
    gameActions.classList.add("is-shaking");
    (window.RebutGameClock || window).setTimeout(() => gameActions.classList.remove("is-shaking"), TIMINGS.WRONG_SHAKE_MS);
    status.textContent = "가장 무겁다고 생각하는 공을 먼저 클릭하세요.";
    return;
  }
  void handleGuess(candidate);
});

measureButton.addEventListener("click", (event) => {
  if (event.detail > 0) measureButton.blur();
  void measureScale();
});

clearButton.addEventListener("click", (event) => {
  if (event.detail > 0) clearButton.blur();
  clearScale();
});

helpButton.addEventListener("click", () => { window.RebutBookTutorial.open(); });
restartControl.addEventListener("click", resetProblem);
backControl.addEventListener("click", () => {
  window.location.href = "../../?rehab=judgment";
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") resetProblem();
});
window.addEventListener("resize", fitStageToViewport, { passive: true });

window.REBUT_WEIGHT_GAME = Object.freeze({
  settings: GAME_SETTINGS,
  timings: TIMINGS,
});

const fontsReady = document.fonts?.ready ?? Promise.resolve();
fontsReady.then(() => void startGame());
