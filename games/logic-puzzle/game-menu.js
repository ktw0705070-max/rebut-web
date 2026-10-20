(function initializeGameMenu() {
  "use strict";

  const layer = document.querySelector("#game-menu");
  const trigger = document.querySelector(".menu-control");

  if (!layer || !trigger) return;

  const closeButton = layer.querySelector(".game-menu-close");
  const categories = [...layer.querySelectorAll(".game-menu-category")];
  const currentGame = layer.querySelector("[data-current-game]");
  const linkedGames = [...layer.querySelectorAll("a.game-menu-game[href], [data-game-link]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let focusTimer = null;

  function openMenu() {
    window.clearTimeout(focusTimer);
    window.REBUT?.game.setMenuOpen(true);
    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");

    window.requestAnimationFrame(() => {
      closeButton.focus({ preventScroll: true });
    });
  }

  function closeMenu({ restoreFocus = true } = {}) {
    layer.classList.remove("is-open");
    layer.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");
    window.REBUT?.game.setMenuOpen(false);

    if (!restoreFocus) return;

    const delay = reducedMotion.matches ? 0 : 440;
    focusTimer = window.setTimeout(() => {
      trigger.focus({ preventScroll: true });
    }, delay);
  }

  function setExpandedCategory(nextCategory) {
    categories.forEach((category) => {
      const isExpanded = category === nextCategory;
      const toggle = category.querySelector(".game-menu-category__toggle");
      const games = category.querySelector(".game-menu-games");

      category.classList.toggle("is-expanded", isExpanded);
      toggle.setAttribute("aria-expanded", String(isExpanded));
      games.setAttribute("aria-hidden", String(!isExpanded));
    });
  }

  trigger.addEventListener("click", openMenu);
  closeButton.addEventListener("click", () => closeMenu());

  categories.forEach((category) => {
    const toggle = category.querySelector(".game-menu-category__toggle");
    toggle.addEventListener("click", () => {
      setExpandedCategory(
        category.classList.contains("is-expanded") ? null : category,
      );
    });
  });

  if (currentGame) {
    currentGame.addEventListener("click", (event) => {
      event.preventDefault();
    });
  }

  linkedGames.forEach((game) => {
    const destination = new URL(game.dataset.gameLink || game.getAttribute("href"), window.location.href);
    if (destination.pathname.endsWith("/")) destination.pathname += "index.html";
    if (game.tagName === "A") {
      game.href = destination.href;
      game.target = "_self";
    }
    game.addEventListener("click", (event) => {
      event.preventDefault();
      // Navigate in this web tab instead of handing a relative folder to the host app.
      if (!/^https?:$/.test(destination.protocol) || destination.origin !== window.location.origin) return;
      window.location.assign(destination.href);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && layer.classList.contains("is-open")) {
      event.preventDefault();
      closeMenu();
    }
  });
})();
