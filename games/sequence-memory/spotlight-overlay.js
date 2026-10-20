// Reusable for any automatic demo: pass a stage and a series of {target, text} steps.
window.SpotlightOverlay = class SpotlightOverlay {
  constructor(stage, config) {
    this.stage = stage;
    this.config = config;
    this.target = null;
    this.step = null;
    this.lastGeometry = "";

    this.root = document.createElement("div");
    this.root.className = "spotlight-overlay";
    this.root.setAttribute("aria-hidden", "true");
    this.root.style.setProperty("--spotlight-dim", config.dimColor);
    this.root.style.setProperty("--spotlight-fade", `${config.fadeMs}ms`);
    this.root.style.setProperty("--spotlight-radius", `${config.cornerRadius}px`);
    this.root.style.setProperty("--bubble-width", `${config.bubble.width}px`);
    this.root.style.setProperty("--bubble-height", `${config.bubble.height}px`);
    this.root.style.setProperty("--bubble-tail", `${config.bubble.tailSize}px`);

    this.cutout = document.createElement("div");
    this.cutout.className = "spotlight-cutout";
    this.bubble = document.createElement("aside");
    this.bubble.className = "spotlight-bubble";
    const icon = document.createElement("span");
    icon.className = "spotlight-bubble-icon";
    icon.textContent = "›";
    this.text = document.createElement("p");
    this.text.className = "spotlight-bubble-text";
    this.bubble.append(icon, this.text);
    this.root.append(this.cutout, this.bubble);
    stage.append(this.root);

    this.refresh = this.refresh.bind(this);
    this.refresh();
  }

  show(step, target) {
    if (!target) return;
    const messageChanged = this.step?.text !== step.text;
    this.step = step;
    this.target = target;
    this.root.dataset.step = step.id;
    this.text.textContent = step.text;
    this.lastGeometry = "";
    this.position();
    this.root.classList.add("is-visible");

    if (messageChanged) {
      this.text.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: this.config.fadeMs,
        easing: "ease-out",
      });
    }
  }

  hide() {
    this.root.classList.remove("is-visible");
    this.target = null;
    this.step = null;
  }

  refresh() {
    if (this.target && this.target.isConnected) this.position();
    window.requestAnimationFrame(this.refresh);
  }

  position() {
    const stageRect = this.stage.getBoundingClientRect();
    const targetRect = this.target.getBoundingClientRect();
    const scale = stageRect.width / this.stage.offsetWidth;
    const padding = this.step.padding ?? this.config.padding;
    const stageWidth = this.stage.offsetWidth;
    const stageHeight = this.stage.offsetHeight;
    const hole = {
      left: (targetRect.left - stageRect.left) / scale - padding,
      top: (targetRect.top - stageRect.top) / scale - padding,
      width: targetRect.width / scale + 2 * padding,
      height: targetRect.height / scale + 2 * padding,
    };

    hole.left = Math.max(0, hole.left);
    hole.top = Math.max(0, hole.top);
    hole.width = Math.min(hole.width, stageWidth - hole.left);
    hole.height = Math.min(hole.height, stageHeight - hole.top);

    const bubble = this.config.bubble;
    const margin = bubble.edgeMargin;
    const gap = bubble.gap;
    const preferred = this.step.placement ?? "right";
    const right = hole.left + hole.width;
    const bottom = hole.top + hole.height;
    const room = {
      right: stageWidth - right - gap - margin,
      left: hole.left - gap - margin,
      bottom: stageHeight - bottom - gap - margin,
      top: hole.top - gap - margin,
    };
    const sides = [preferred, "right", "left", "bottom", "top"];
    const side = sides.find((candidate) =>
      ["right", "left"].includes(candidate)
        ? room[candidate] >= bubble.width
        : room[candidate] >= bubble.height,
    ) ?? "right";

    let bubbleLeft;
    let bubbleTop;
    let tailPosition;
    if (side === "right" || side === "left") {
      bubbleLeft = side === "right" ? right + gap : hole.left - gap - bubble.width;
      bubbleTop = hole.top + hole.height / 2 - bubble.height / 2 + (this.step.bubbleOffsetY ?? 0);
      bubbleTop = Math.max(margin, Math.min(bubbleTop, stageHeight - margin - bubble.height));
      tailPosition = hole.top + hole.height / 2 - bubbleTop - 15;
      tailPosition = Math.max(15, Math.min(tailPosition, bubble.height - 45));
    } else {
      bubbleLeft = hole.left + hole.width / 2 - bubble.width / 2;
      bubbleLeft = Math.max(margin, Math.min(bubbleLeft, stageWidth - margin - bubble.width));
      bubbleTop = side === "bottom" ? bottom + gap : hole.top - gap - bubble.height;
      tailPosition = hole.left + hole.width / 2 - bubbleLeft - 15;
      tailPosition = Math.max(15, Math.min(tailPosition, bubble.width - 45));
    }

    const geometry = [hole.left, hole.top, hole.width, hole.height, bubbleLeft, bubbleTop, tailPosition, side]
      .map((value) => (typeof value === "number" ? value.toFixed(2) : value))
      .join("|");
    if (geometry === this.lastGeometry) return;
    this.lastGeometry = geometry;

    this.cutout.style.left = `${hole.left}px`;
    this.cutout.style.top = `${hole.top}px`;
    this.cutout.style.width = `${hole.width}px`;
    this.cutout.style.height = `${hole.height}px`;
    this.bubble.style.left = `${bubbleLeft}px`;
    this.bubble.style.top = `${bubbleTop}px`;
    this.bubble.style.setProperty("--bubble-tail-position", `${tailPosition}px`);
    this.bubble.className = `spotlight-bubble is-${side}`;
  }
};
