"use strict";

(() => {
  const { makeCard, unit, translate } = window.RebutTutorial;

  class LogicGame {
    constructor() {
      this.screen = document.querySelector("#game-screen");
      this.stage = document.querySelector(".stage");
      this.board = document.querySelector(".game-board");
      this.conditions = document.querySelector("#game-conditions");
      this.direction = document.querySelector(".game-direction");
      this.tray = document.querySelector("#game-cards");
      this.slots = document.querySelector("#game-slots");
      this.status = document.querySelector("#game-status");
      this.logo = document.querySelector(".game-logo");
      this.metrics = new window.RebutLogicResults.RunMetrics();
      this.menuOpen = false;
      this.cards = new Map();
      this.positions = new Map();
      this.placements = new Map();
      this.slotElements = [];
      this.index = 0;
      this.selected = null;
      this.drag = null;
      this.phase = "preview";
      this.newRun();
      this.renderRound(0);
      this.setPhase("preview");
      window.addEventListener("blur", () => this.cancelDrag());
      window.addEventListener("resize", () => this.cancelDrag());
      document.addEventListener("visibilitychange", () => this.syncTimer());
    }

    get round() { return GAME_ROUNDS[this.index]; }
    get state() {
      return { index: this.index, id: this.round.id, level: this.round.level, round: this.round.round, phase: this.phase, placements: Object.fromEntries(this.placements) };
    }

    newRun() {
      this.controller?.abort();
      this.controller = new AbortController();
      this.cancelDrag();
      this.board.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      this.logo.classList.remove("is-waving");
      return this.controller.signal;
    }

    wait(milliseconds, signal) {
      return new Promise((resolve) => {
        if (signal.aborted) return resolve(false);
        const finish = (active) => { (window.RebutGameClock || globalThis).clearTimeout(timer); signal.removeEventListener("abort", abort); resolve(active); };
        const abort = () => finish(false);
        const timer = (window.RebutGameClock || globalThis).setTimeout(() => finish(true), milliseconds);
        signal.addEventListener("abort", abort, { once: true });
      });
    }

    setPhase(phase) {
      this.phase = phase;
      this.stage.dataset.gamePhase = phase;
      this.syncInput();
      this.syncTimer();
    }

    syncInput() {
      this.board.inert = this.menuOpen || this.phase !== "playing";
      this.screen.inert = this.menuOpen || !["playing", "feedback", "wrong"].includes(this.phase);
    }

    syncTimer() {
      this.metrics.setActive(this.phase === "playing" && !this.menuOpen && !document.hidden);
    }

    setMenuOpen(open) {
      this.menuOpen = open;
      if (open) this.cancelDrag();
      this.syncInput();
      this.syncTimer();
    }

    trayPosition(label) {
      const { width, pitch, top } = GAME_DISPLAY.card;
      const count = this.round.cards.length;
      const rowWidth = width + (count - 1) * pitch;
      return { x: (DISPLAY.width - rowWidth) / 2 + this.round.cards.indexOf(label) * pitch, y: top };
    }

    slotPosition(index) {
      const { width, pitch } = GAME_DISPLAY.card;
      const count = this.round.cards.length;
      const rowWidth = width + (count - 1) * pitch;
      return { x: (DISPLAY.width - rowWidth) / 2 + index * pitch, y: GAME_DISPLAY.slot.top };
    }

    put(label, point, animate = false) {
      const card = this.cards.get(label);
      const old = getComputedStyle(card);
      const before = { transform: old.transform };
      card.getAnimations().forEach((animation) => animation.cancel());
      // 트레이·드래그·슬롯 배치 모두 같은 크기. 배치 시에는 위치만 바뀝니다.
      card.style.width = unit(GAME_DISPLAY.card.width);
      card.style.height = unit(GAME_DISPLAY.card.height);
      card.style.setProperty("--card-font-size", unit(GAME_DISPLAY.card.fontSize));
      // 왼쪽 카드의 옆면/그림자가 오른쪽 앞면 위로 올라오지 않도록,
      // 알파벳 생성 순서 대신 현재 놓인 열을 기준으로 그립니다.
      const column = this.placements.get(label) ?? this.round.cards.indexOf(label);
      card.style.setProperty("--card-layer", String(column + 1));
      card.style.transform = translate(point);
      this.positions.set(label, point);
      if (animate) card.animate([before, { transform: card.style.transform }], { duration: GAME_TIMING.PLACE, easing: "ease-in-out" });
    }

    select(label) {
      this.selected = label;
      this.cards.forEach((card, id) => {
        card.classList.toggle("is-selected", id === label);
        card.setAttribute("aria-pressed", String(id === label));
      });
    }

    refreshSlots() {
      this.slotElements.forEach((slot, index) => {
        const label = [...this.placements].find(([, place]) => place === index)?.[0];
        slot.classList.toggle("is-occupied", Boolean(label));
        slot.setAttribute("aria-label", `${index + 1}번째 자리${label ? `, 카드 ${label}` : ""}`);
      });
    }

    renderRound(index) {
      this.cancelDrag();
      this.index = index;
      this.metrics.enterRound(this.round.id);
      this.cards.clear();
      this.positions.clear();
      this.placements.clear();
      this.slotElements = [];
      this.selected = null;
      this.conditions.replaceChildren();
      this.slots.replaceChildren();
      this.tray.replaceChildren();
      this.board.classList.remove("is-wrong");
      this.direction.textContent = "(큰 순서대로 왼→오)";
      this.stage.dataset.round = this.round.id;
      this.board.dataset.figmaNode = this.round.node;
      document.querySelector("#level-progress-digit").src = PROGRESS_DIGITS[this.round.level];
      document.querySelector("#round-progress-digit").src = PROGRESS_DIGITS[this.round.round];
      document.querySelector(".round-progress").setAttribute("aria-label", `현재 진행 ${this.round.id}`);
      this.round.conditions.forEach((text) => {
        const box = document.createElement("div");
        box.className = "game-condition";
        const frame = document.createElement("img");
        frame.src = ASSETS.conditionFrame;
        frame.alt = "";
        const label = document.createElement("span");
        label.textContent = text;
        box.append(frame, label);
        this.conditions.append(box);
      });
      this.round.cards.forEach((label, index) => {
        const slot = document.createElement("button");
        slot.className = "game-slot";
        slot.type = "button";
        slot.dataset.slot = String(index);
        const image = document.createElement("img");
        image.src = ASSETS.slotOutline;
        image.alt = "";
        // 바깥 놓기 영역은 카드 크기, 안쪽 빈 스트로크 그림은 Figma 원래 위치입니다.
        const count = this.round.cards.length;
        const { width, gap, centerX } = GAME_DISPLAY.slot;
        const imageLeft = centerX - (count * width + (count - 1) * gap) / 2 + index * (width + gap);
        image.style.left = unit(imageLeft - this.slotPosition(index).x);
        slot.append(image);
        slot.addEventListener("click", () => { if (this.selected) this.placeInSlot(this.selected, index); });
        this.slotElements.push(slot);
        this.slots.append(slot);
        const card = makeCard(label, { shadow: ASSETS.gameCardShadow, shadowOffset: index === 0 ? -.04 : index === 1 ? .32 : -.32 });
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `카드 ${label}. 선택 후 자리를 선택하세요.`);
        card.setAttribute("aria-pressed", "false");
        card.tabIndex = 0;
        card.addEventListener("keydown", (event) => {
          if (this.phase !== "playing") return;
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.select(this.selected === label ? null : label); }
          if (event.key === "Escape") this.select(null);
        });
        card.addEventListener("pointerdown", (event) => this.grab(event, label));
        card.addEventListener("pointermove", (event) => this.movePointer(event, label));
        card.addEventListener("pointerup", (event) => this.release(event, label));
        card.addEventListener("pointercancel", () => this.cancelDrag());
        card.addEventListener("lostpointercapture", () => this.cancelDrag());
        this.cards.set(label, card);
        this.tray.append(card);
        this.put(label, this.trayPosition(label));
      });
      this.refreshSlots();
    }

    grab(event, label) {
      if (this.phase !== "playing" || event.button !== 0 || this.drag) return;
      event.preventDefault();
      const card = this.cards.get(label);
      card.getAnimations().forEach((animation) => animation.cancel());
      const rect = this.board.getBoundingClientRect();
      const scale = DISPLAY.width / rect.width;
      const point = this.positions.get(label);
      this.select(label);
      this.drag = { label, pointerId: event.pointerId, originX: event.clientX, originY: event.clientY, offsetX: (event.clientX - rect.left) * scale - point.x, offsetY: (event.clientY - rect.top) * scale - point.y, moved: false };
      card.setPointerCapture(event.pointerId);
      card.classList.add("is-dragging");
    }

    movePointer(event, label) {
      if (!this.drag || this.drag.label !== label || event.pointerId !== this.drag.pointerId) return;
      const rect = this.board.getBoundingClientRect();
      const scale = DISPLAY.width / rect.width;
      this.drag.moved ||= Math.hypot(event.clientX - this.drag.originX, event.clientY - this.drag.originY) > 4;
      this.cards.get(label).style.transform = translate({ x: (event.clientX - rect.left) * scale - this.drag.offsetX, y: (event.clientY - rect.top) * scale - this.drag.offsetY });
      this.slotElements.forEach((slot) => slot.classList.toggle("is-target", this.containsPoint(slot, event)));
    }

    containsPoint(element, event) {
      const r = element.getBoundingClientRect();
      return event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    }

    release(event, label) {
      if (!this.drag || this.drag.label !== label || event.pointerId !== this.drag.pointerId) return;
      const moved = this.drag.moved;
      const index = this.slotElements.findIndex((slot) => this.containsPoint(slot, event));
      this.clearDrag();
      if (moved && index >= 0) this.placeInSlot(label, index);
      else if (moved) {
        this.placements.delete(label);
        this.put(label, this.trayPosition(label), true);
        this.select(null);
        this.refreshSlots();
      }
    }

    clearDrag() {
      const drag = this.drag;
      this.drag = null;
      if (drag) {
        const card = this.cards.get(drag.label);
        card?.classList.remove("is-dragging");
        if (card?.hasPointerCapture(drag.pointerId)) card.releasePointerCapture(drag.pointerId);
      }
      this.slotElements.forEach((slot) => slot.classList.remove("is-target"));
    }

    cancelDrag() {
      if (!this.drag) return;
      const { label } = this.drag;
      this.clearDrag();
      const slot = this.placements.get(label);
      this.put(label, slot === undefined ? this.trayPosition(label) : this.slotPosition(slot));
    }

    placeInSlot(label, index) {
      if (this.phase !== "playing") return;
      const previous = this.placements.get(label);
      const occupied = [...this.placements].find(([id, place]) => id !== label && place === index)?.[0];
      if (occupied) {
        if (previous === undefined) { this.placements.delete(occupied); this.put(occupied, this.trayPosition(occupied), true); }
        else { this.placements.set(occupied, previous); this.put(occupied, this.slotPosition(previous), true); }
      }
      this.placements.set(label, index);
      this.put(label, this.slotPosition(index), true);
      this.select(null);
      this.refreshSlots();
      this.direction.textContent = "(큰 순서대로 왼→오)";
      this.status.textContent = `${label}를 ${index + 1}번째 자리에 놓았습니다.`;
      if (this.placements.size === this.round.cards.length) void this.checkAnswer();
    }

    async checkAnswer() {
      const signal = this.controller.signal;
      const correct = this.round.answer.every((label, index) => this.placements.get(label) === index);
      const order = [...this.placements].sort((a, b) => a[1] - b[1]).map(([label]) => label);
      this.metrics.recordAnswer(order, correct);
      if (!correct) {
        this.setPhase("wrong");
        this.direction.textContent = "조건을 다시 살펴보세요.";
        this.status.textContent = "순서가 맞지 않습니다. 조건을 보고 카드 위치를 바꿔보세요.";
        this.board.classList.add("is-wrong");
        if (!await this.wait(GAME_TIMING.WRONG_SHAKE, signal)) return;
        this.board.classList.remove("is-wrong");
        this.setPhase("playing");
        return;
      }
      this.setPhase("feedback");
      this.status.textContent = `${this.round.id} 정답입니다.`;
      if (!await this.wait(GAME_TIMING.PLACE, signal)) return;
      this.cards.forEach((card) => card.classList.add("is-correct"));
      if (!await this.wait(TIMING.CORRECT_INVERT, signal)) return;
      this.round.answer.forEach((label, index) => {
        const card = this.cards.get(label);
        card.style.setProperty("--wave-delay", `${TIMING.WAVE_DELAY * index}ms`);
        card.classList.add("is-waving");
      });
      this.logo.classList.add("is-waving");
      const waveTime = Math.max(TIMING.WAVE + TIMING.WAVE_DELAY * (this.cards.size - 1), GAME_TIMING.LOGO_WAVE + GAME_TIMING.LOGO_STAGGER * 4);
      if (!await this.wait(waveTime + GAME_TIMING.CORRECT_HOLD, signal)) return;
      this.logo.classList.remove("is-waving");
      if (this.index === GAME_ROUNDS.length - 1) return this.finish();
      const next = this.index + 1;
      const newLevel = GAME_ROUNDS[next].level !== this.round.level;
      this.renderRound(next);
      if (newLevel && !await this.showLevelTransition(this.round.level, signal)) return;
      await this.beginRound(signal);
    }

    async showLevelTransition(level, signal) {
      this.setPhase("intro");
      this.status.textContent = `스텝 ${level}을 시작합니다.`;
      return window.RebutStepTransition.show(level, { signal });
    }

    hideTransition() {
      window.RebutStepTransition.hide();
    }

    async beginRound(signal) {
      this.setPhase("between");
      if (!await this.wait(GAME_TIMING.ROUND_START, signal)) return;
      this.setPhase("playing");
      this.status.textContent = `${this.round.level}단계 ${this.round.round}라운드. 조건을 읽고 큰 순서대로 배치하세요.`;
      this.cards.get(this.round.cards[0]).focus({ preventScroll: true });
    }

    async start() {
      const signal = this.newRun();
      window.RebutLogicResults.clear();
      this.metrics = new window.RebutLogicResults.RunMetrics();
      this.renderRound(0);
      if (await this.showLevelTransition(1, signal)) await this.beginRound(signal);
    }

    resetRound() {
      if (this.menuOpen || !["playing", "wrong"].includes(this.phase)) return;
      const signal = this.newRun();
      this.renderRound(this.index);
      return this.beginRound(signal);
    }

    pause() {
      if (this.phase !== "playing") return false;
      this.newRun();
      this.select(null);
      this.setPhase("paused");
      return true;
    }

    resume() {
      if (this.phase === "paused") this.setPhase("playing");
      else this.syncInput();
    }

    preview() {
      this.newRun();
      this.hideTransition();
      this.renderRound(0);
      this.setPhase("preview");
    }

    finish() {
      this.setPhase("complete");
      window.RebutLogicResults.save(this.metrics.snapshot());
      window.location.href = "./result.html";
    }
  }

  window.RebutLogicGame = LogicGame;
})();
