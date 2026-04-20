// ============================================================
// DARK / LIGHT MODE TOGGLE
// Manages theme switching with localStorage persistence
// ============================================================

(function () {
  const toggle = document.querySelector("[data-theme-toggle]");
  const root = document.documentElement;

  // Initialize theme: respect saved preference, otherwise always default to light
  let currentTheme = localStorage.getItem("theme") || "light";

  root.setAttribute("data-theme", currentTheme);

  function updateToggleIcon(theme) {
    if (!toggle) return;

    if (theme === "dark") {
      toggle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
      toggle.setAttribute("aria-label", "Activer le mode clair");
    } else {
      toggle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      toggle.setAttribute("aria-label", "Activer le mode sombre");
    }
  }

  updateToggleIcon(currentTheme);

  toggle &&
    toggle.addEventListener("click", () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", currentTheme);
      localStorage.setItem("theme", currentTheme);
      updateToggleIcon(currentTheme);
    });
})();
