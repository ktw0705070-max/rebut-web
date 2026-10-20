// The tutorial and the playable game use the same Figma cell artwork and DOM layers.
window.MemoryGrid = Object.freeze({
  build(container, onSelect = null) {
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < 9; index += 1) {
      const button = document.createElement("button");
      button.className = "game-cell";
      button.type = "button";
      button.dataset.index = String(index);
      button.setAttribute("aria-label", `${index + 1}번 칸`);

      const layers = [
        ["game-cell-fill-idle", "./assets/game-cell-fill.svg"],
        ["game-cell-fill-active", "./assets/game-cell-active-fill.svg"],
        ["game-cell-outline-idle", "./assets/cell-outline-hires.png"],
        ["game-cell-outline-active", "./assets/cell-outline-active-hires.png"],
      ];

      layers.forEach(([className, source]) => {
        const image = document.createElement("img");
        image.className = `game-cell-face ${className}`;
        image.src = source;
        image.alt = "";
        image.draggable = false;
        button.append(image);
      });

      if (onSelect) {
        button.addEventListener("click", (event) => {
          if (event.detail > 0) button.blur();
          onSelect(index);
        });
      }

      fragment.append(button);
    }

    container.replaceChildren(fragment);
    return [...container.querySelectorAll(".game-cell")];
  },
});
