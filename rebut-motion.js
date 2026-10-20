(() => {
  const svg = document.querySelector("#rebut-logo-motion");
  if (!svg) return;

  const SVG_NS = "http://www.w3.org/2000/svg";

  // Figma의 `부드러운 외곽`(39:7536) 벡터와 Texture 효과를 1:1로 이식했다.
  const RAW_RECTS = [
    { x: 1.70459, y: 1.95605, w: 29.036, h: 189.204 },
    { x: 144.316, y: 1.96069, w: 28.9894, h: 107.127, transform: "rotate(90 144.316 1.96069)" },
    { x: 138.152, y: 87.4292, w: 28.9894, h: 100.963, transform: "rotate(90 138.152 87.4292)" },
    { x: 176.715, y: 164.934, w: 29.036, h: 137.339, transform: "rotate(107.461 176.715 164.934)" },
    { x: 173.305, y: 96.4263, w: 28.9894, h: 58.9784, transform: "rotate(-180 173.305 96.4263)" },
    { x: 201.967, y: 10.0796, w: 29.036, h: 147.329 },
    { x: 378.918, y: 163.954, w: 29.036, h: 168.899, transform: "rotate(90 378.918 163.954)" },
    { x: 377.318, y: 1.9624, w: 29.036, h: 131.553, transform: "rotate(90 377.318 1.9624)" },
    { x: 368.209, y: 56.8662, w: 29.036, h: 132.864, transform: "rotate(71.6803 368.209 56.8662)" },
    { x: 402.936, y: 10.0793, w: 29.036, h: 147.329 },
    { x: 579.886, y: 163.953, w: 29.036, h: 168.899, transform: "rotate(90 579.886 163.953)" },
    { x: 578.286, y: 1.9624, w: 29.036, h: 131.553, transform: "rotate(90 578.286 1.9624)" },
    { x: 572.861, y: 35.6738, w: 29.036, h: 134.425, transform: "rotate(77.9979 572.861 35.6738)" },
    { w: 29.036, h: 134.459, transform: "matrix(0.231299 -0.972883 -0.972883 -0.231299 572.241 157.419)" },
    { x: 603.939, y: 1.96069, w: 29.2464, h: 155.211 },
    { x: 750.757, y: 1.96069, w: 29.2464, h: 155.211 },
    { w: 28.9894, h: 140.615, transform: "matrix(-4.37114e-08 -1 -1 4.37114e-08 762.348 192.391)" },
    { x: 878.506, y: 37.281, w: 28.9894, h: 155.11 },
    { w: 29.0356, h: 175.544, transform: "matrix(-4.37114e-08 -1 -1 4.37114e-08 979.57 30.7402)" },
  ];

  const FILTER_BOUNDS = [
    [0.000084, 0.251549, 32.4451, 192.613],
    [35.484, 0.256188, 110.536, 32.3983],
    [35.4845, 85.7247, 104.372, 32.3983],
    [35.2877, 122.02, 143.132, 72.3165],
    [142.611, 35.7435, 32.3983, 62.3873],
    [200.262, 8.37508, 32.4451, 150.738],
    [208.315, 162.249, 172.308, 32.4449],
    [244.061, 0.257897, 134.962, 32.4449],
    [240.374, 55.1617, 138.666, 72.7352],
    [401.231, 8.37484, 32.4449, 150.738],
    [409.282, 162.249, 172.308, 32.4449],
    [445.028, 0.257897, 134.962, 32.4449],
    [439.67, 33.9693, 140.933, 59.7635],
    [439.724, 96.3658, 140.938, 62.7579],
    [602.235, 0.256188, 32.6553, 158.62],
    [749.052, 0.256188, 32.6553, 158.62],
    [620.028, 161.697, 144.024, 32.3983],
    [876.801, 35.5765, 32.3983, 158.519],
    [802.321, 0.000084, 178.953, 32.4447],
  ];

  const rects = RAW_RECTS;

  const computeVisualCenter = (rect) => {
    const localX = (rect.x || 0) + rect.w / 2;
    const localY = (rect.y || 0) + rect.h / 2;

    if (!rect.transform) return { cx: localX, cy: localY };

    const matrixMatch = rect.transform.match(
      /matrix\(\s*([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s*\)/,
    );

    if (matrixMatch) {
      const [, a, b, c, d, e, f] = matrixMatch.map(Number);
      return {
        cx: a * localX + c * localY + e,
        cy: b * localX + d * localY + f,
      };
    }

    const rotateMatch = rect.transform.match(
      /rotate\(\s*([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s*\)/,
    );

    if (rotateMatch) {
      const angle = Number(rotateMatch[1]) * Math.PI / 180;
      const pivotX = Number(rotateMatch[2]);
      const pivotY = Number(rotateMatch[3]);
      const dx = localX - pivotX;
      const dy = localY - pivotY;
      return {
        cx: pivotX + dx * Math.cos(angle) - dy * Math.sin(angle),
        cy: pivotY + dx * Math.sin(angle) + dy * Math.cos(angle),
      };
    }

    return { cx: localX, cy: localY };
  };

  const centers = rects.map(computeVisualCenter);

  const setAttributes = (node, attributes) => {
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
    return node;
  };

  const defs = svg.querySelector("defs") || svg.insertBefore(
    document.createElementNS(SVG_NS, "defs"),
    svg.firstChild,
  );

  FILTER_BOUNDS.forEach(([x, y, width, height], index) => {
    const filter = setAttributes(document.createElementNS(SVG_NS, "filter"), {
      id: `rebut-logo-texture-${index}`,
      x,
      y,
      width,
      height,
      filterUnits: "userSpaceOnUse",
      "color-interpolation-filters": "sRGB",
    });

    filter.append(
      setAttributes(document.createElementNS(SVG_NS, "feFlood"), {
        "flood-opacity": "0",
        result: "BackgroundImageFix",
      }),
      setAttributes(document.createElementNS(SVG_NS, "feBlend"), {
        mode: "normal",
        in: "SourceGraphic",
        in2: "BackgroundImageFix",
        result: "shape",
      }),
      setAttributes(document.createElementNS(SVG_NS, "feTurbulence"), {
        type: "fractalNoise",
        baseFrequency: "0.014441362582147121 0.014441362582147121",
        numOctaves: "3",
        seed: "5177",
        result: "textureNoise",
      }),
      setAttributes(document.createElementNS(SVG_NS, "feDisplacementMap"), {
        in: "shape",
        in2: "textureNoise",
        scale: "3.4090113639831543",
        xChannelSelector: "R",
        yChannelSelector: "G",
        result: "displacedImage",
        width: "100%",
        height: "100%",
      }),
    );

    const merge = setAttributes(document.createElementNS(SVG_NS, "feMerge"), {
      result: "textureEffect",
    });
    merge.append(setAttributes(document.createElementNS(SVG_NS, "feMergeNode"), {
      in: "displacedImage",
    }));
    filter.append(merge);
    defs.append(filter);
  });

  const seededRandom = (seed) => {
    let state = seed;
    return () => {
      state = state * 16807 % 2147483647;
      return (state - 1) / 2147483646;
    };
  };

  const generateScatterPositions = () => {
    const random = seededRandom(77);
    const viewBoxWidth = 982;
    const viewBoxHeight = 195;
    const viewBoxCenterX = viewBoxWidth / 2;
    const viewBoxCenterY = viewBoxHeight / 2;

    const raw = rects.map((_, index) => {
      const center = centers[index];
      const angle = random() * Math.PI * 2;
      const distance = 212 + random() * 425;
      return {
        offsetX: Math.cos(angle) * distance,
        offsetY: Math.sin(angle) * distance,
        rotation: -180 + random() * 360,
        cx: center.cx,
        cy: center.cy,
      };
    });

    const averageX = raw.reduce((sum, item) => sum + item.cx + item.offsetX, 0) / raw.length;
    const averageY = raw.reduce((sum, item) => sum + item.cy + item.offsetY, 0) / raw.length;
    const shiftX = viewBoxCenterX - averageX;
    const shiftY = viewBoxCenterY - averageY;

    return raw.map((item) => ({
      offsetX: item.offsetX + shiftX,
      offsetY: item.offsetY + shiftY,
      rotation: item.rotation,
    }));
  };

  const scatterPositions = generateScatterPositions();
  const barWraps = rects.map((rect, index) => {
    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("logo-bar-wrap");

    const textureGroup = document.createElementNS(SVG_NS, "g");
    textureGroup.classList.add("logo-bar-texture");
    textureGroup.setAttribute("filter", `url(#rebut-logo-texture-${index})`);

    const bar = document.createElementNS(SVG_NS, "rect");
    bar.classList.add("logo-bar");
    bar.dataset.bar = String(index);
    if (rect.x !== undefined) bar.setAttribute("x", rect.x);
    if (rect.y !== undefined) bar.setAttribute("y", rect.y);
    bar.setAttribute("width", rect.w);
    bar.setAttribute("height", rect.h);
    if (rect.transform) bar.setAttribute("transform", rect.transform);

    textureGroup.append(bar);
    group.append(textureGroup);
    svg.append(group);
    return group;
  });

  const revealPage = () => {
    document.body.classList.remove("intro-pending");
    document.body.classList.add("intro-settled");
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    svg.classList.add("is-ready");
    revealPage();
    return;
  }

  scatterPositions.forEach((position, index) => {
    const center = centers[index];
    barWraps[index].setAttribute(
      "transform",
      `translate(${position.offsetX.toFixed(1)}, ${position.offsetY.toFixed(1)}) rotate(${position.rotation.toFixed(1)}, ${center.cx}, ${center.cy})`,
    );
  });

  svg.classList.add("is-ready");

  const ASSEMBLE_DURATION = 1800;
  const ASSEMBLE_DELAY = 300;
  const JITTER_CYCLE = 2000;
  const startTime = performance.now();
  let phase = "assemble";
  let jitterStartTime = 0;
  let jitterBars = null;
  let revealed = false;

  const easeOutCubic = (progress) => 1 - (1 - progress) ** 3;
  const randomRange = (min, max) => min + Math.random() * (max - min);

  const createJitterBars = () => barWraps.map((element, index) => ({
    element,
    cx: centers[index].cx,
    cy: centers[index].cy,
    duration: randomRange(650, 950),
    offset: randomRange(0, 100),
    amplitudeRotation: randomRange(4, 7) * (Math.random() > 0.5 ? 1 : -1),
    amplitudeX: randomRange(0.55, 1.05) * (Math.random() > 0.5 ? 1 : -1),
    amplitudeY: randomRange(0.55, 1.05) * (Math.random() > 0.5 ? 1 : -1),
    phaseRotation: Math.random() * Math.PI * 2,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    settled: false,
  }));

  const tick = (now) => {
    if (phase === "assemble") {
      const elapsed = now - startTime;
      const activeTime = Math.max(0, elapsed - ASSEMBLE_DELAY);
      const progress = Math.min(activeTime / ASSEMBLE_DURATION, 1);

      barWraps.forEach((element, index) => {
        const position = scatterPositions[index];
        const center = centers[index];
        const stagger = index / barWraps.length * 200;
        const barTime = Math.max(0, activeTime - stagger);
        const barProgress = Math.min(barTime / ASSEMBLE_DURATION, 1);
        const eased = easeOutCubic(barProgress);
        const x = position.offsetX * (1 - eased);
        const y = position.offsetY * (1 - eased);
        const rotation = position.rotation * (1 - eased);

        if (barProgress >= 1) {
          element.removeAttribute("transform");
        } else {
          element.setAttribute(
            "transform",
            `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${rotation.toFixed(2)}, ${center.cx}, ${center.cy})`,
          );
        }
      });

      if (progress >= 1) {
        barWraps.forEach((element) => element.removeAttribute("transform"));
        phase = "jitter";
        jitterStartTime = now;
        jitterBars = createJitterBars();
      }
    } else {
      let elapsed = now - jitterStartTime;
      if (elapsed >= JITTER_CYCLE) {
        jitterStartTime = now;
        elapsed = 0;
        jitterBars = createJitterBars();
      }

      let settledCount = 0;
      jitterBars.forEach((bar) => {
        if (bar.settled) {
          settledCount += 1;
          return;
        }

        const activeTime = elapsed - bar.offset;
        if (activeTime < 0) {
          bar.element.setAttribute(
            "transform",
            `rotate(${(bar.amplitudeRotation * 0.8).toFixed(2)}, ${bar.cx}, ${bar.cy})`,
          );
          return;
        }

        const progress = Math.min(activeTime / bar.duration, 1);
        if (progress >= 1) {
          bar.element.removeAttribute("transform");
          bar.settled = true;
          settledCount += 1;
          return;
        }

        const damping = (1 - progress) ** 2;
        const cycles = 4.5;
        const rotation = Math.sin(progress * Math.PI * cycles + bar.phaseRotation) * bar.amplitudeRotation * damping;
        const x = Math.sin(progress * Math.PI * cycles + bar.phaseX) * bar.amplitudeX * damping;
        const y = Math.cos(progress * Math.PI * cycles + bar.phaseY) * bar.amplitudeY * damping;
        bar.element.setAttribute(
          "transform",
          `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${rotation.toFixed(2)}, ${bar.cx}, ${bar.cy})`,
        );
      });

      if (!revealed && settledCount >= jitterBars.length) {
        revealed = true;
        revealPage();
      }
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
})();
