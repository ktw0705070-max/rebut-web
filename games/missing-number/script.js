// ─────────────────────────────────────────────────────────────────────────────
// Demo data: the answer always derives from this single source of truth.
// ─────────────────────────────────────────────────────────────────────────────
const DEMO = Object.freeze({
  originalNumbers: Object.freeze([3, 32, 11, 7, 21, 16]),
  replacement: Object.freeze({ index: 2, value: 8 }),
});

// All motion timings are collected here for quick exhibition tuning.
const TIMING = Object.freeze({
  memorizeHold: 2000,
  coverFill: 300,
  coveredHold: 500,
  revealFill: 300,
  problemHold: 800,
  cursorMove: 600,
  clickRelease: 100,
  cursorPressTransition: 50,
  answerFill: 150,
  completedHold: 1000,
  cursorReturn: 350,
  popupFadeOut: 300,
});

const ASSET = "./assets/";
const LIGHT_OUTLINE = `${ASSET}outline-white.png`;
const DARK_OUTLINE = `${ASSET}outline-covered.png`;

// Figma stores each tile as a slightly different hand-drawn construction.
// These are the original per-tile assets and fractional positions from the
// three supplied frames (light, covered, and selected), kept at native scale.
const CARD_VISUALS = Object.freeze([
  {
    position: { left: -2.002, top: 0 },
    light: {
      bottom: { src: "card-bottom.svg", left: -0.04, top: 141.83, width: 165.541, height: 11.457 },
      face: { left: -0.04, top: -0.19, width: 155.843, height: 142.024, color: "#fff" },
      side: { src: "card-side.svg", left: 155.84, top: -0.77, thickness: 9.98, length: 153.267 },
      outline: { left: -1, top: -1.6, width: 168, height: 155.736 },
    },
    covered: {
      bottom: { src: "covered-bottom.svg", left: -0.04, top: 141.83, width: 166.041, height: 11.563 },
      face: { src: "covered-face.svg", left: -0.04, top: -0.34, width: 157.041, height: 142.169 },
      side: { src: "covered-side.svg", left: 155.84, top: -0.77, thickness: 9.98, length: 153.267 },
      outline: { left: -1, top: -1.6, width: 168.284, height: 156 },
    },
  },
  {
    position: { left: 157.998, top: 0 },
    light: {
      bottom: { src: "light-bottom-1.svg", left: -0.04, top: 141.83, width: 164.712, height: 11.457 },
      face: { left: -0.04, top: -0.19, width: 155.843, height: 142.024, color: "#fff" },
      side: { src: "light-side-common.svg", left: 155.84, top: -0.77, thickness: 9.98, length: 153.54 },
      outline: { left: -1.518, top: -1.6, width: 168, height: 155.736 },
    },
    covered: {
      bottom: { src: "covered-bottom-1.svg", left: -0.04, top: 141.83, width: 164.712, height: 11.064 },
      face: { src: "covered-face-1.svg", left: -0.04, top: -0.19, width: 156.262, height: 142.088 },
      side: { src: "covered-side-1.svg", left: 155.84, top: -0.77, thickness: 9.641, length: 153.54 },
      outline: { left: -1.518, top: -1.6, width: 168.284, height: 156 },
    },
  },
  {
    position: { left: 317.998, top: 0 },
    light: {
      bottom: { src: "light-bottom-2.svg", left: -0.04, top: 141.83, width: 164.712, height: 11.064 },
      face: { left: -0.04, top: -0.19, width: 155.843, height: 142.024, color: "#fff" },
      side: { src: "light-side-common.svg", left: 155.84, top: -0.77, thickness: 9.98, length: 153.54 },
      outline: { left: -1.038, top: -1.6, width: 168, height: 155.736 },
    },
    covered: {
      bottom: { src: "covered-bottom-2.svg", left: -0.04, top: 141.83, width: 164.712, height: 11.064 },
      face: { src: "covered-face-2.svg", left: -0.04, top: -0.19, width: 156.977, height: 142.024 },
      side: { src: "covered-side-2.svg", left: 156.46, top: -0.77, thickness: 9.358, length: 153.54 },
      outline: { left: -1.038, top: -1.6, width: 168.284, height: 156 },
    },
    selected: {
      bottom: { src: "selected-bottom.svg", left: -0.04, top: 141.83, width: 164.712, height: 11.064 },
      face: { left: -0.04, top: -0.19, width: 155.843, height: 142.024, color: "#010101" },
      side: { src: "selected-side.svg", left: 155.84, top: -0.77, thickness: 9.98, length: 153.54 },
      outline: { left: -1.038, top: -1.6, width: 168.284, height: 156 },
    },
  },
  {
    position: { left: -0.002, top: 147.2 },
    light: {
      bottom: { src: "light-bottom-3.svg", left: -0.04, top: 141.83, width: 164.712, height: 11.516 },
      face: { left: -0.04, top: -0.19, width: 155.843, height: 142.713, color: "#fff" },
      side: { src: "light-side-common.svg", left: 155.84, top: -0.77, thickness: 9.98, length: 153.54 },
      outline: { left: -0.998, top: -1.14, width: 168, height: 155.736 },
    },
    covered: {
      bottom: { src: "covered-bottom-3.svg", left: -0.29, top: 141.35, width: 164.79, height: 11 },
      face: { src: "covered-face-3.svg", left: -0.04, top: -0.38, width: 155.843, height: 142.234 },
      side: { src: "covered-side-3.svg", left: 155.75, top: -0.77, thickness: 9.248, length: 152.622 },
      outline: { left: -1.998, top: -2.14, width: 168.284, height: 156 },
    },
  },
  {
    position: { left: 159.998, top: 147.2 },
    light: {
      bottom: { src: "light-bottom-4.svg", left: -0.04, top: 142.35, width: 165.073, height: 10.995 },
      face: { left: -0.04, top: -0.19, width: 155.843, height: 142.545, color: "#fff" },
      side: { src: "light-side-common.svg", left: 155.84, top: -0.77, thickness: 9.98, length: 153.54 },
      outline: { left: -1.518, top: -1.14, width: 168, height: 155.736 },
    },
    covered: {
      bottom: { src: "covered-bottom-4.svg", left: -0.02, top: 141.35, width: 165.5, height: 11 },
      face: { src: "covered-face-4.svg", left: -0.04, top: -0.65, width: 156.65, height: 142.499 },
      side: { src: "covered-side-4.svg", left: 155.84, top: -0.77, thickness: 9.64, length: 152.122 },
      outline: { left: -1.518, top: -2.14, width: 168.284, height: 156 },
    },
  },
  {
    position: { left: 319.998, top: 147.2 },
    light: {
      bottom: { src: "light-bottom-5.svg", left: -0.04, top: 142.35, width: 165.505, height: 11.845 },
      face: { left: -0.04, top: -0.19, width: 155.843, height: 142.863, color: "#fff" },
      side: { src: "light-side-5.svg", left: 156.01, top: -0.15, thickness: 9.813, length: 152.917 },
      outline: { left: -1.038, top: -1.14, width: 168, height: 155.736 },
    },
    covered: {
      bottom: { src: "covered-bottom-5.svg", left: -0.04, top: 141.35, width: 165.506, height: 11 },
      face: { src: "covered-face-5.svg", left: -0.04, top: -0.78, width: 156, height: 142.635 },
      side: { src: "covered-side-5.svg", left: 155.31, top: -1.15, thickness: 9.65, length: 153 },
      outline: { left: -2.038, top: -2.14, width: 168.284, height: 156 },
    },
  },
]);

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const RESPONSIVE_VERTICAL_ANCHORS = Object.freeze([
  { selector: ".tutorial-background-timer", y: 209, progress: 0.1 },
  { selector: ".tutorial-background-grid", y: 296, progress: 0.5 },
  { selector: ".tutorial-panel", y: 104, progress: 0.5 },
  { selector: ".tutorial-back-guide", y: 977.87, progress: 1 },
]);

const stage = document.querySelector("#tutorial-stage");
const panel = document.querySelector("#tutorial-panel");
const overlay = document.querySelector("#tutorial-overlay");
const backgroundGrid = document.querySelector("#background-number-grid");
const grid = document.querySelector("#tutorial-grid");
const cards = [...grid.querySelectorAll(".demo-number-card")];
const cursor = document.querySelector(".demo-cursor");
const startButton = document.querySelector("#start-button");
const status = document.querySelector("#demo-status");
const answerCard = cards[DEMO.replacement.index];
let running = true;
let closing = false;

const sleep = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const nextFrame = () =>
  new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

function createImage(className, source) {
  const image = document.createElement("img");
  image.className = className;
  image.src = source;
  image.alt = "";
  image.draggable = false;
  image.setAttribute("aria-hidden", "true");
  return image;
}

function setRect(element, rectangle) {
  element.style.left = `${rectangle.left}px`;
  element.style.top = `${rectangle.top}px`;
  element.style.width = `${rectangle.width}px`;
  element.style.height = `${rectangle.height}px`;
}

function createStateLayer(stateName, visual) {
  const layer = document.createElement("span");
  layer.className = `demo-card-state demo-surface--${stateName}`;
  layer.setAttribute("aria-hidden", "true");

  const bottom = createImage("demo-card-bottom", `${ASSET}${visual.bottom.src}`);
  setRect(bottom, visual.bottom);

  const face = visual.face.src
    ? createImage("demo-card-face", `${ASSET}${visual.face.src}`)
    : document.createElement("span");
  face.classList.add("demo-card-face");
  setRect(face, visual.face);
  if (visual.face.color) face.style.background = visual.face.color;

  const side = document.createElement("span");
  side.className = "demo-card-side";
  side.style.left = `${visual.side.left}px`;
  side.style.top = `${visual.side.top}px`;
  side.style.width = `${visual.side.thickness}px`;
  side.style.height = `${visual.side.length}px`;

  const sideImage = createImage("", `${ASSET}${visual.side.src}`);
  sideImage.style.width = `${visual.side.length}px`;
  sideImage.style.height = `${visual.side.thickness}px`;
  side.append(sideImage);

  const outline = createImage(
    "demo-card-outline",
    stateName === "light" ? LIGHT_OUTLINE : DARK_OUTLINE,
  );
  setRect(outline, visual.outline);

  layer.append(bottom, face, side, outline);
  return layer;
}

function installCardStateSurfaces() {
  cards.forEach((card, index) => {
    const visual = CARD_VISUALS[index];
    const number = card.querySelector(".demo-card-number");

    card.replaceChildren();
    card.style.left = `${visual.position.left}px`;
    card.style.top = `${visual.position.top}px`;
    card.append(
      createStateLayer("light", visual.light),
      createStateLayer("covered", visual.covered),
    );

    if (visual.selected) {
      card.append(createStateLayer("selected", visual.selected));
    }

    card.append(number);
  });
}

function fitStageToViewport() {
  const scale = Math.min(
    window.innerWidth / STAGE_SIZE.width,
    window.innerHeight / STAGE_SIZE.height,
  );
  const verticalExtra = Math.max(
    0,
    window.innerHeight / scale - STAGE_SIZE.height,
  );

  stage.style.setProperty("--game-scale", scale);
  stage.style.height = `${STAGE_SIZE.height + verticalExtra}px`;

  RESPONSIVE_VERTICAL_ANCHORS.forEach(({ selector, y, progress }) => {
    const element = stage.querySelector(selector);
    element.style.top = `${y + verticalExtra * progress}px`;
  });

  window.requestAnimationFrame(() => resetCursor(false));
}

function problemNumbers() {
  return DEMO.originalNumbers.map((number, index) =>
    index === DEMO.replacement.index ? DEMO.replacement.value : number,
  );
}

function showNumbers(numbers) {
  cards.forEach((card, index) => {
    card.querySelector(".demo-card-number").textContent = numbers[index];
  });
}

const BACKGROUND_NUMBERS = Object.freeze([1, 23, 5, 7, 12, 14]);
const LIGHT_BOTTOM_ASSETS = Object.freeze([
  "card-bottom.svg",
  "light-bottom-1.svg",
  "light-bottom-2.svg",
  "light-bottom-3.svg",
  "light-bottom-4.svg",
  "light-bottom-5.svg",
]);
const DARK_BOTTOM_ASSETS = Object.freeze([
  "covered-bottom.svg",
  "covered-bottom-1.svg",
  "covered-bottom-2.svg",
  "covered-bottom-3.svg",
  "covered-bottom-4.svg",
  "covered-bottom-5.svg",
]);
const LIGHT_SIDE_ASSETS = Object.freeze([
  "card-side.svg",
  "light-side-common.svg",
  "light-side-common.svg",
  "light-side-common.svg",
  "light-side-common.svg",
  "light-side-5.svg",
]);
const DARK_SIDE_ASSETS = Object.freeze([
  "covered-side.svg",
  "covered-side-1.svg",
  "covered-side-2.svg",
  "covered-side-3.svg",
  "covered-side-4.svg",
  "covered-side-5.svg",
]);

function createBackgroundSurface(surfaceName, index) {
  const surface = document.createElement("span");
  surface.className = `card-state surface--${surfaceName}`;
  surface.setAttribute("aria-hidden", "true");
  const isDark = surfaceName === "dark";

  const face = document.createElement("span");
  face.className = "card-face";
  const bottom = createImage(
    "card-bottom",
    `${ASSET}${(isDark ? DARK_BOTTOM_ASSETS : LIGHT_BOTTOM_ASSETS)[index]}`,
  );
  const side = document.createElement("span");
  side.className = "card-side";
  side.append(
    createImage(
      "",
      `${ASSET}${(isDark ? DARK_SIDE_ASSETS : LIGHT_SIDE_ASSETS)[index]}`,
    ),
  );
  const outline = createImage(
    "card-outline",
    `${ASSET}${isDark ? "outline-covered.png" : "card-outline.png"}`,
  );

  surface.append(bottom, face, side, outline);
  return surface;
}

function buildBackgroundGrid() {
  backgroundGrid.style.setProperty("--grid-columns", 3);
  backgroundGrid.style.setProperty("--grid-width", "890px");
  const fragment = document.createDocumentFragment();

  BACKGROUND_NUMBERS.forEach((number, index) => {
    const card = document.createElement("div");
    card.className = "number-card";
    if (index === 2) card.classList.add("is-selected");

    const copy = document.createElement("span");
    copy.className = "card-number";
    copy.textContent = String(number);
    card.append(
      createBackgroundSurface("light", index),
      createBackgroundSurface("dark", index),
      copy,
    );
    fragment.append(card);
  });

  backgroundGrid.replaceChildren(fragment);
}

function rectInPanel(element) {
  const stageRect = stage.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const scale = stageRect.width / stage.offsetWidth;

  return {
    x: (elementRect.left - panelRect.left) / scale,
    y: (elementRect.top - panelRect.top) / scale,
    width: elementRect.width / scale,
    height: elementRect.height / scale,
  };
}

function setCursorPosition(x, y, duration) {
  cursor.style.transition = duration > 0
    ? `transform ${duration}ms ease-in-out`
    : "none";
  cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function resetCursor(animate = false) {
  const board = rectInPanel(grid);
  setCursorPosition(
    board.x + board.width + 15,
    board.y + board.height * 0.42,
    animate ? TIMING.cursorReturn : 0,
  );
}

function placeCursorOnAnswer() {
  const card = rectInPanel(answerCard);
  setCursorPosition(
    card.x + card.width * 0.72,
    card.y + card.height * 0.92,
    TIMING.cursorMove,
  );
}

async function coverCards(duration) {
  grid.style.setProperty("--cover-duration", `${duration}ms`);
  await nextFrame();
  grid.classList.add("is-covered");
  await sleep(duration);
}

async function revealCards(duration) {
  grid.style.setProperty("--cover-duration", `${duration}ms`);
  await nextFrame();
  grid.classList.remove("is-covered");
  await sleep(duration);
}

async function moveCursorToAnswer() {
  placeCursorOnAnswer();
  await sleep(TIMING.cursorMove);
}

async function clickAnswer() {
  cursor.classList.add("is-clicking");
  grid.style.setProperty("--answer-duration", `${TIMING.answerFill}ms`);
  answerCard.classList.add("is-answer");

  answerCard.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(0.96)", offset: 0.5 },
      { transform: "scale(1)" },
    ],
    {
      duration: TIMING.clickRelease,
      easing: "ease-out",
    },
  );

  await sleep(TIMING.clickRelease);
  cursor.classList.remove("is-clicking");
  await sleep(Math.max(0, TIMING.answerFill - TIMING.clickRelease));
}

async function resetForNextLoop() {
  resetCursor(true);

  // Keep the selected 8 visible while the cursor returns. Once it reaches its
  // starting point, restore the original set directly—there is no black-cover
  // transition between tutorial cycles.
  await sleep(TIMING.cursorReturn);
  showNumbers(DEMO.originalNumbers);
  answerCard.classList.remove("is-answer");
}

async function playTutorialForever() {
  showNumbers(DEMO.originalNumbers);

  while (running) {
    status.textContent = "화면에 나온 숫자들을 기억하세요.";
    // STEP 1 — remember the six fixed numbers.
    await sleep(TIMING.memorizeHold);

    // STEP 2 — smoothly cover every card, then pause briefly.
    await coverCards(TIMING.coverFill);
    await sleep(TIMING.coveredHold);

    // STEP 3 — replace one fixed position while the cards are covered.
    showNumbers(problemNumbers());
    await revealCards(TIMING.revealFill);
    status.textContent = "처음에 없던 숫자를 찾아 누르세요.";
    await sleep(TIMING.problemHold);

    // STEP 4 — move, click, and invert the answer card.
    await moveCursorToAnswer();
    await clickAnswer();
    await sleep(TIMING.completedHold);

    // STEP 5 — return the cursor and restore the original set under cover.
    await resetForNextLoop();
  }
}

async function closeTutorial() {
  if (closing) return;
  closing = true;
  running = false;
  startButton.disabled = true;
  overlay.classList.add("is-closing");
  await sleep(TIMING.popupFadeOut);
  window.location.href = "./game.html?v=20261005-4";
}

window.addEventListener("resize", fitStageToViewport, { passive: true });
startButton.addEventListener("click", () => void closeTutorial());
document.documentElement.style.setProperty(
  "--cursor-press-duration",
  `${TIMING.cursorPressTransition}ms`,
);
buildBackgroundGrid();
installCardStateSurfaces();
fitStageToViewport();
resetCursor(false);
void playTutorialForever();
