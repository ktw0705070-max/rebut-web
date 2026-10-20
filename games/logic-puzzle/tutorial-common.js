"use strict";

// 기존 편향 문장 판정 TutorialOverlay, pressControl, animateTransform을
// 콘텐츠와 분리하고 중단/재시작 처리를 더한 공통 컴포넌트입니다.
(() => {
  const unit = (value) => `${value / DISPLAY.width * 100}cqw`;
  const translate = ({ x, y }) => `translate3d(${unit(x)}, ${unit(y)}, 0)`;
  const cancelled = () => new DOMException("Sequence stopped", "AbortError");

  function makeCard(label, { shadow = ASSETS.cardShadow, shadowOffset = 0 } = {}) {
    const card = document.createElement("div");
    card.className = "logic-card";
    card.dataset.card = label;
    card.innerHTML = '<div class="card-motion"><div class="card-visual"><img class="card-shadow" alt="" draggable="false"><span class="card-bottom"></span><span class="card-bottom card-bottom--correct"></span><span class="card-front"></span><span class="card-side"></span><span class="card-side card-side--correct"></span><span class="card-outline"></span><span class="card-outline card-outline--correct"></span><span class="card-label"></span></div></div>';
    const shadowImage = card.querySelector(".card-shadow");
    shadowImage.src = shadow;
    shadowImage.style.left = unit(shadowOffset);
    card.querySelector(".card-label").textContent = label;
    return card;
  }

  function validateLevel(level) {
    const sameCards = (order) => order.length === level.cards.length && new Set(order).size === order.length && order.every((id) => level.cards.includes(id));
    if (!level.conditions.length || !sameCards(level.answer) || !sameCards(level.initialOrder)) {
      throw new Error("조건, 카드 목록, 초기 순서, 정답을 같은 레벨 세트로 설정하세요.");
    }
  }

  class TutorialSequence {
    constructor(panel, level) {
      validateLevel(level);
      this.panel = panel;
      this.level = level;
      this.cursor = panel.querySelector(".tutorial-cursor");
      this.cards = new Map();
      this.positions = new Map();
      this.animations = new Set();
      this.running = false;
      this.cycle = 0;
      const count = level.cards.length;
      const scale = Math.min(1, DISPLAY.maxRowWidth / (count * DISPLAY.card.width + (count - 1) * DISPLAY.card.gap));
      this.cardWidth = DISPLAY.card.width * scale;
      this.cardHeight = DISPLAY.card.height * scale;
      this.pitch = this.cardWidth + DISPLAY.card.gap * scale;
      this.rowLeft = (DISPLAY.popup.width - (count * this.cardWidth + (count - 1) * DISPLAY.card.gap * scale)) / 2;
      const slotImage = DISPLAY.slotImage;
      const slotPitch = (slotImage.width + slotImage.gap) * scale;
      const slotRowLeft = (DISPLAY.popup.width - (count * slotImage.width + (count - 1) * slotImage.gap) * scale) / 2 + slotImage.centerOffset * scale;
      this.grip = { x: DISPLAY.cursor.grip.x * scale, y: DISPLAY.cursor.grip.y * scale };
      const slots = panel.querySelector("#tutorial-slots");
      const cards = panel.querySelector("#tutorial-cards");
      slots.replaceChildren();
      cards.replaceChildren();
      level.answer.forEach((label, index) => {
        const slot = document.createElement("div");
        slot.className = "tutorial-slot";
        slot.dataset.slot = String(index);
        slot.style.cssText = `left:${unit(this.rowLeft + index * this.pitch)};top:${unit(DISPLAY.slotTop)};width:${unit(this.cardWidth)};height:${unit(this.cardHeight)}`;
        const outline = document.createElement("img");
        outline.className = "tutorial-slot__outline";
        outline.src = ASSETS.slotOutline;
        outline.alt = "";
        outline.draggable = false;
        outline.dataset.figmaAsset = index === 0 ? "막이2 3" : "막이2 1";
        outline.style.cssText = `left:${unit(slotRowLeft + index * slotPitch - (this.rowLeft + index * this.pitch))};top:${unit(slotImage.top - DISPLAY.slotTop)};width:${unit(slotImage.width * scale)};height:${unit(slotImage.height * scale)}`;
        slot.append(outline);
        slots.append(slot);
      });
      level.cards.forEach((label, index) => {
        const card = makeCard(label, { shadowOffset: (index === 0 ? -.03 : .2) * scale });
        card.style.width = unit(this.cardWidth);
        card.style.height = unit(this.cardHeight);
        card.style.setProperty("--card-font-size", unit(54.129 * scale));
        card.style.setProperty("--card-scale", scale);
        card.setAttribute("aria-hidden", "true");
        cards.append(card);
        this.cards.set(label, card);
      });
      this.reset();
    }

    phase(name) { this.panel.dataset.phase = name; }
    slotPosition(label) { return { x: this.rowLeft + this.level.answer.indexOf(label) * this.pitch, y: DISPLAY.slotTop }; }
    cursorAt(point) { return { x: point.x + this.grip.x, y: point.y + this.grip.y }; }
    place(element, point) { element.style.transform = translate(point); this.positions.set(element, point); }

    reset() {
      this.panel.classList.add("is-resetting");
      this.level.initialOrder.forEach((label, index) => {
        const card = this.cards.get(label);
        card.classList.remove("is-correct", "is-waving", "is-pressed");
        card.style.zIndex = "2";
        card.style.removeProperty("--wave-delay");
        this.place(card, { x: this.rowLeft + index * this.pitch, y: DISPLAY.trayTop });
      });
      this.cursor.classList.remove("is-clicking");
      this.place(this.cursor, DISPLAY.cursor.rest);
      this.phase("initial");
      this.panel.dataset.activeCard = "";
      this.panel.querySelectorAll(".tutorial-slot").forEach((slot) => slot.classList.remove("is-occupied"));
      void this.panel.offsetWidth;
      this.panel.classList.remove("is-resetting");
    }

    wait(duration, signal = this.controller.signal) {
      return new Promise((resolve, reject) => {
        if (signal.aborted) return reject(cancelled());
        const abort = () => { clearTimeout(timer); reject(cancelled()); };
        const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, duration);
        signal.addEventListener("abort", abort, { once: true });
      });
    }

    // 편향 문장 판정의 animateTransform: 네이티브 Web Animations, ease-in-out.
    async animateTransform(element, from, to, duration, signal = this.controller.signal) {
      if (signal.aborted) throw cancelled();
      const animation = element.animate([{ transform: from }, { transform: to }], { duration, easing: "ease-in-out", fill: "forwards" });
      this.animations.add(animation);
      const abort = () => animation.cancel();
      signal.addEventListener("abort", abort, { once: true });
      try {
        await animation.finished;
        if (signal.aborted) throw cancelled();
        element.style.transform = to;
      } finally {
        signal.removeEventListener("abort", abort);
        this.animations.delete(animation);
        animation.cancel();
      }
    }

    async move(element, point, duration) {
      const signal = this.controller.signal;
      await this.animateTransform(element, translate(this.positions.get(element)), translate(point), duration, signal);
      if (!signal.aborted) this.positions.set(element, point);
    }

    // 기존 pressControl의 class toggle 구조를 그대로 공유.
    async pressControl(control, cursor = null) {
      cursor?.classList.add("is-clicking");
      control.classList.add("is-pressed");
      await this.wait(TIMING.BUTTON_PRESS);
      cursor?.classList.remove("is-clicking");
      control.classList.remove("is-pressed");
    }

    async playCycle() {
      this.reset();
      this.panel.dataset.cycle = String(++this.cycle);
      await this.wait(TIMING.INITIAL_HOLD);
      // 정답 배열 순서대로 모든 카드를 커서가 한 장씩 직접 집어 옮깁니다.
      for (const [index, label] of this.level.answer.entries()) {
        const picked = this.cards.get(label);
        this.panel.dataset.activeCard = label;
        this.phase("approach");
        await this.move(this.cursor, this.cursorAt(this.positions.get(picked)), TIMING.CURSOR_MOVE);
        this.phase("press");
        await this.pressControl(picked, this.cursor);
        this.phase("drag");
        picked.style.zIndex = "5";
        const target = this.slotPosition(label);
        // 동일 시작점, 종료점, duration/easing으로 커서와 카드 간 상대 위치 고정.
        await Promise.all([
          this.move(picked, target, TIMING.DRAG),
          this.move(this.cursor, this.cursorAt(target), TIMING.DRAG),
        ]);
        picked.style.zIndex = "2";
        this.panel.querySelector(`[data-slot="${index}"]`).classList.add("is-occupied");
        this.phase("drop");
        if (index < this.level.answer.length - 1) await this.wait(TIMING.BETWEEN_CARDS);
      }
      this.panel.dataset.activeCard = "";
      this.phase("complete");
      await Promise.all([
        this.wait(TIMING.COMPLETE_HOLD),
        this.move(this.cursor, DISPLAY.cursor.released, TIMING.CURSOR_MOVE),
      ]);
      this.phase("invert");
      this.cards.forEach((card) => card.classList.add("is-correct"));
      await this.wait(TIMING.CORRECT_INVERT);
      this.phase("wave");
      this.level.answer.forEach((id, index) => {
        const card = this.cards.get(id);
        card.style.setProperty("--wave-delay", `${index * TIMING.WAVE_DELAY}ms`);
        card.classList.add("is-waving");
      });
      await this.wait(TIMING.WAVE + (this.level.cards.length - 1) * TIMING.WAVE_DELAY);
      this.cards.forEach((card) => card.classList.remove("is-waving"));
      this.phase("hold");
      await this.wait(TIMING.LOOP_PAUSE);
      this.phase("return");
      await this.move(this.cursor, DISPLAY.cursor.rest, TIMING.CURSOR_RESET);
    }

    start() {
      if (this.running) return;
      this.running = true;
      const controller = new AbortController();
      this.controller = controller;
      this.done = (async () => {
        try { while (!controller.signal.aborted) await this.playCycle(); }
        catch (error) { if (error.name !== "AbortError") { this.running = false; console.error(error); } }
      })();
    }

    stop() {
      this.running = false;
      this.controller?.abort();
      this.animations.forEach((animation) => animation.cancel());
      this.animations.clear();
    }
  }

  class TutorialOverlay {
    constructor(overlay, level, onComplete, onCloseStart) {
      this.overlay = overlay;
      this.panel = overlay.querySelector(".tutorial-panel");
      this.onComplete = onComplete;
      this.onCloseStart = onCloseStart;
      this.closing = false;
      this.panel.querySelector(".tutorial-title").textContent = level.title;
      this.panel.querySelector("#tutorial-condition").replaceChildren(...level.conditions.map((condition) => {
        const span = document.createElement("span"); span.textContent = condition; return span;
      }));
      this.sequence = new TutorialSequence(this.panel, level);
      this.startButton = overlay.querySelector(".tutorial-start");
      this.startButton.addEventListener("click", () => this.close());
      overlay.addEventListener("keydown", (event) => {
        if (event.key === "Tab") { event.preventDefault(); this.startButton.focus({ preventScroll: true }); }
      });
      this.visibilityHandler = () => {
        if (document.hidden) this.sequence.stop();
        else if (!overlay.hidden && !this.closing) this.sequence.start();
      };
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }
    open({ focus = true } = {}) {
      clearTimeout(this.closeTimer);
      this.closing = false;
      this.overlay.hidden = false;
      this.overlay.classList.remove("is-closing");
      this.overlay.inert = false;
      document.querySelector("#game-screen").inert = true;
      this.sequence.stop();
      this.sequence.reset();
      if (!document.hidden) this.sequence.start();
      if (focus) this.startButton.focus({ preventScroll: true });
    }
    close() {
      if (this.closing || this.overlay.hidden) return;
      this.closing = true;
      this.sequence.stop();
      this.onCloseStart?.();
      this.overlay.classList.add("is-closing");
      this.overlay.inert = true;
      this.closeTimer = setTimeout(() => {
        this.overlay.hidden = true;
        this.closing = false;
        document.querySelector("#game-screen").inert = false;
        this.onComplete?.();
      }, TIMING.POPUP_FADE_OUT);
    }
    destroy() {
      clearTimeout(this.closeTimer);
      this.sequence.stop();
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
  }

  window.RebutTutorial = Object.freeze({ TutorialOverlay, TutorialSequence, makeCard, unit, translate });
})();
