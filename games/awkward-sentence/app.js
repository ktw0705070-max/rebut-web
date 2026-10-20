const TIMINGS = Object.freeze({
  READ_HOLD: 2000,
  CURSOR_MOVE: 460,
  HOVER_HOLD: 400,
  HOVER_GAP: 120,
  ANSWER_PRE_CLICK: 260,
  CLICK_PRESS: 100,
  ERASE: 500,
  COMPLETE_HOLD: 1000,
  CURSOR_RETURN: 420,
  RESET_GAP: 120,
});

const GAME_CONTENT = Object.freeze({
  answerIndex: 4,
  hoverOrder: [0, 3],
  cursorOrigin: { x: 576, y: 444 },
  cursorTargets: Object.freeze({
    0: { x: 459, y: 178 },
    3: { x: 468, y: 296 },
    4: { x: 490, y: 327 },
  }),
  lines: Object.freeze([
    [{ sentence: 0, text: '주말 아침에 느지막이 일어나 창문을' }],
    [
      { sentence: 0, text: '활짝 열었다. ' },
      { sentence: 1, text: '오늘은 오랜만에 동네 도서' },
    ],
    [
      { sentence: 1, text: '관에 가기로 한 날이었다. ' },
      { sentence: 2, text: '나는 읽고 싶던' },
    ],
    [
      { sentence: 2, text: '책 목록을 수첩에 적어 두었다. ' },
      { sentence: 3, text: '가방을' },
    ],
    [{ sentence: 3, text: '챙겨 집을 나서니 골목에 고양이가 앉아' }],
    [
      { sentence: 3, text: '있었다. ' },
      { sentence: 4, text: '고래는 물속에서 숨을 쉬려고' },
    ],
    [
      { sentence: 4, text: '수면 위로 올라온다. ' },
      { sentence: 5, text: '도서관에 들어서자' },
    ],
    [{ sentence: 5, text: '조용하고 서늘한 공기가 느껴졌다.' }],
    [{ sentence: 6, text: '빌리고 싶던 책을 찾아 창가 자리에 앉았' }],
    [
      { sentence: 6, text: '다. ' },
      { sentence: 7, text: '한참을 읽다 보니 어느새 점심때가' },
    ],
    [
      { sentence: 7, text: '되었다. ' },
      { sentence: 8, text: '나는 책 두 권을 빌려 도서관을' },
    ],
    [{ sentence: 8, text: '나섰다.' }],
  ]),
});

const STAGE_SIZE = Object.freeze({ width: 1920, height: 1080 });
const scene = document.querySelector('.stage');
const paragraph = document.querySelector('#paragraph');
const cursor = document.querySelector('#demo-cursor');
const liveStatus = document.querySelector('#live-status');

let sceneScale = 1;
let verticalExtra = 0;
let currentCursorPoint = GAME_CONTENT.cursorOrigin;

function positionCursor(target, duration) {
  cursor.style.setProperty('--cursor-duration', `${duration}ms`);
  cursor.style.setProperty('--cursor-x', `${target.x}px`);
  cursor.style.setProperty(
    '--cursor-y',
    `${target.y}px`,
  );
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

  scene.style.setProperty('--scene-scale', sceneScale);
  scene.style.height = `${STAGE_SIZE.height + verticalExtra}px`;

  positionCursor(currentCursorPoint, 0);
}

function renderParagraph() {
  const fragment = document.createDocumentFragment();

  GAME_CONTENT.lines.forEach((line, lineIndex) => {
    const lineElement = document.createElement('div');
    lineElement.className = 'paragraph-line';
    lineElement.style.setProperty('--line-index', lineIndex);

    line.forEach((part) => {
      const span = document.createElement('span');
      span.className = 'sentence-fragment';
      span.dataset.sentence = String(part.sentence);
      span.textContent = part.text;
      lineElement.appendChild(span);
    });

    fragment.appendChild(lineElement);
  });

  paragraph.replaceChildren(fragment);
}

function sentenceFragments(sentenceIndex) {
  return Array.from(document.querySelectorAll(`[data-sentence="${sentenceIndex}"]`));
}

function setSentenceState(sentenceIndex, state, enabled = true) {
  sentenceFragments(sentenceIndex).forEach((node) => {
    node.classList.toggle(state, enabled);
  });
}

function setCursor(target, duration = TIMINGS.CURSOR_MOVE) {
  currentCursorPoint = target;
  positionCursor(target, duration);
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function previewSentence(sentenceIndex) {
  setCursor(GAME_CONTENT.cursorTargets[sentenceIndex]);
  await wait(TIMINGS.CURSOR_MOVE);
  setSentenceState(sentenceIndex, 'is-hovered', true);
  await wait(TIMINGS.HOVER_HOLD);
  setSentenceState(sentenceIndex, 'is-hovered', false);
  await wait(TIMINGS.HOVER_GAP);
}

async function clickAnswer() {
  const answer = GAME_CONTENT.answerIndex;
  setCursor(GAME_CONTENT.cursorTargets[answer]);
  await wait(TIMINGS.CURSOR_MOVE);

  setSentenceState(answer, 'is-selected', true);
  liveStatus.textContent = '어색한 문장을 찾았습니다.';
  await wait(TIMINGS.ANSWER_PRE_CLICK);

  cursor.classList.add('is-clicking');
  setSentenceState(answer, 'is-pressed', true);
  await wait(TIMINGS.CLICK_PRESS);
  cursor.classList.remove('is-clicking');
  setSentenceState(answer, 'is-pressed', false);
}

async function eraseAnswer() {
  const fragments = sentenceFragments(GAME_CONTENT.answerIndex);
  const secondFragmentDelay = Math.round(TIMINGS.ERASE * 0.38);
  const fragmentDuration = TIMINGS.ERASE - secondFragmentDelay;

  fragments.forEach((node, index) => {
    node.classList.remove('is-selected');
    node.style.setProperty('--erase-fragment-duration', `${fragmentDuration}ms`);
    node.style.setProperty('--erase-delay', `${index * secondFragmentDelay}ms`);
    node.classList.add('is-erasing');
  });

  liveStatus.textContent = '어색한 문장을 지우고 있습니다.';
  await wait(TIMINGS.ERASE);
  fragments.forEach((node) => node.classList.add('is-erased'));
  liveStatus.textContent = '어색한 문장을 지웠습니다.';
}

function restoreParagraph() {
  document.querySelectorAll('.sentence-fragment').forEach((node) => {
    node.className = 'sentence-fragment';
    node.style.removeProperty('--erase-fragment-duration');
    node.style.removeProperty('--erase-delay');
  });
  liveStatus.textContent = '문단이 처음 상태로 돌아왔습니다.';
}

async function runTutorialLoop() {
  while (true) {
    liveStatus.textContent = '글을 천천히 읽어 보세요.';
    await wait(TIMINGS.READ_HOLD);

    for (const sentenceIndex of GAME_CONTENT.hoverOrder) {
      await previewSentence(sentenceIndex);
    }

    await clickAnswer();
    await eraseAnswer();
    await wait(TIMINGS.COMPLETE_HOLD);

    setCursor(GAME_CONTENT.cursorOrigin, TIMINGS.CURSOR_RETURN);
    await wait(TIMINGS.CURSOR_RETURN);
    restoreParagraph();
    await wait(TIMINGS.RESET_GAP);
  }
}

renderParagraph();
fitSceneToViewport();
setCursor(GAME_CONTENT.cursorOrigin, 0);
runTutorialLoop();

window.addEventListener('resize', fitSceneToViewport, { passive: true });

document.querySelector('#start-button')?.addEventListener('click', () => {
  window.location.href = 'game.html?v=20261005-4';
});
