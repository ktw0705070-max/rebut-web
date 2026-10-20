"use strict";

// 모든 시간은 ms. 레벨에 관계없이 공통 시퀀스가 이 값만 참조합니다.
const TIMING = Object.freeze({
  INITIAL_HOLD: 1500,
  CURSOR_MOVE: 500,
  BUTTON_PRESS: 100,
  DRAG: 700,
  BETWEEN_CARDS: 300,
  COMPLETE_HOLD: 600,
  CORRECT_INVERT: 150,
  WAVE_DELAY: 90,
  WAVE: 450,
  LOOP_PAUSE: 1000,
  CURSOR_RESET: 250,
  POPUP_FADE_OUT: 300,
  WRONG_SHAKE: 300,
});

// 1920×1080 Figma 좌표. 순서 암기와 같은 확대율로 표시하고 남는 높이는 배경으로 채웁니다.
const DISPLAY = Object.freeze({
  width: 1920,
  height: 1080,
  dimColor: "0, 0, 0",
  dimOpacity: 0.36,
  popup: Object.freeze({ left: 596, top: 104, width: 728, height: 873 }),
  card: Object.freeze({ width: 150.5, height: 162.219, gap: 0 }),
  slotTop: 234,
  // 빈 스트로크 이미지는 카드 전체 영역 안에 위치합니다. 이미지 사이 간격 16px.
  slotImage: Object.freeze({ width: 134.363, height: 150.883, gap: 16, top: 237.955, centerOffset: 2.222 }),
  trayTop: 412,
  maxRowWidth: 550,
  cursor: Object.freeze({
    rest: Object.freeze({ x: 560, y: 502 }),
    released: Object.freeze({ x: 550, y: 416 }),
    grip: Object.freeze({ x: 125, y: 95 }),
  }),
  wave: Object.freeze({ up: -12, down: 3.2, settle: -1.2 }),
});

// 조건·목록·초기 배치·정답은 반드시 한 세트에서 관리합니다.
// 레벨 2·3 추가 시 TutorialOverlay/TutorialSequence를 그대로 사용합니다.
const LEVEL_1 = Object.freeze({
  level: 1,
  title: "논리 배치 퍼즐",
  conditions: Object.freeze(["A는 B보다 크다"]),
  cards: Object.freeze(["A", "B"]),
  initialOrder: Object.freeze(["A", "B"]),
  answer: Object.freeze(["A", "B"]),
});

// 게임의 모든 전환 시간(ms). 단계 전환은 검은 블록 와이프 → 스텝 조립 → 역방향 와이프입니다.
const GAME_TIMING = Object.freeze({
  ROUND_START: 350,
  PLACE: 180,
  WRONG_SHAKE: 420,
  CORRECT_HOLD: 600,
  LOGO_WAVE: 660,
  LOGO_STAGGER: 85,
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

// 아홉 Figma 화면에서 공통으로 사용하는 실제 게임 보드 좌표.
const GAME_DISPLAY = Object.freeze({
  condition: Object.freeze({ top: 214, width: 245, height: 58, gap: 16 }),
  slot: Object.freeze({ top: 407, width: 211, height: 245, gap: 26, centerX: 959.5 }),
  card: Object.freeze({ top: 687, width: 240.638, pitch: 237.5, height: 259.376, fontSize: 86.548 }),
});

const PROGRESS_DIGITS = Object.freeze({
  1: "assets/round-digit-1.png", 2: "assets/round-digit-2.png", 3: "assets/round-digit-3.png",
});
// 문장·카드·정답을 라운드 하나의 데이터로 관리합니다. 정답은 사용자 지정값입니다.
const GAME_ROUNDS = Object.freeze([
  { id: "1-1", node: "642:34140", conditions: ["A는 B보다 크다", "C는 B보다 작다"], answer: ["A", "B", "C"] },
  { id: "1-2", node: "1011:5986", conditions: ["A는 B보다 작다", "B는 C보다 작다"], answer: ["C", "B", "A"] },
  { id: "1-3", node: "1011:6092", conditions: ["C는 A보다 크다", "A는 B보다 크다"], answer: ["C", "A", "B"] },
  { id: "2-1", node: "1011:6200", conditions: ["C는 A보다 크다", "A는 B보다 크다", "D는 B보다 작다"], answer: ["C", "A", "B", "D"] },
  { id: "2-2", node: "1011:6320", conditions: ["B는 D보다 크다", "D는 A보다 크다", "A는 C보다 크다"], answer: ["B", "D", "A", "C"] },
  { id: "2-3", node: "1011:6603", conditions: ["A는 C보다 작다", "C는 B보다 작다", "B는 D보다 작다"], answer: ["D", "B", "C", "A"] },
  { id: "3-1", node: "1011:6728", conditions: ["D는 A보다 크다", "A는 B보다 크다", "B는 C보다 크다", "C는 E보다 크다"], answer: ["D", "A", "B", "C", "E"] },
  { id: "3-2", node: "1011:6955", conditions: ["E는 B보다 크다", "B는 A보다 크다", "A는 D보다 크다", "D는 C보다 크다"], answer: ["E", "B", "A", "D", "C"] },
  { id: "3-3", node: "1011:7103", conditions: ["C는 A보다 작다", "A는 E보다 작다", "E는 B보다 작다", "B는 D보다 작다"], answer: ["D", "B", "E", "A", "C"] },
].map((round) => Object.freeze({
  ...round,
  level: Number(round.id[0]), round: Number(round.id[2]),
  cards: Object.freeze([...round.answer].sort()),
  conditions: Object.freeze(round.conditions), answer: Object.freeze(round.answer),
})));

const ASSETS = Object.freeze({
  slotOutline: "assets/1d6af.png",
  conditionFrame: "assets/1e011.png",
  cardOutline: "assets/58877.png",
  correctOutline: "assets/0759a.png",
  cardShadow: "assets/b4d33.svg",
  cardBottom: "assets/3deb9.svg",
  cardSide: "assets/c450c.svg",
  correctBottom: "assets/e3a83.svg",
  correctSide: "assets/381f8.svg",
  gameCardShadow: "assets/b6111.svg",
  gameCardBottom: "assets/589e2.svg",
  gameCardSide: "assets/b8089.svg",
});
