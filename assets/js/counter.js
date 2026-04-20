// ============================================================
// STAT COUNTER ANIMATION
// Counts up numbers when they enter the viewport
// ============================================================

function formatNumber(value, format) {
  if (format === "space") {
    // "12 000" style with non-breaking space
    return value.toLocaleString("fr-FR").replace(/\s/g, "\u00a0");
  }
  return String(value);
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || "";
  const format = el.dataset.format || "";
  const duration = 1800;
  const startTime = performance.now();

  // Easing: easeOutExpo
  function ease(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.round(ease(progress) * target);

    el.innerHTML = formatNumber(current, format) + suffix;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.innerHTML = formatNumber(target, format) + suffix;
    }
  }

  requestAnimationFrame(tick);
}

// Fire when the stats banner enters the viewport
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target
        .querySelectorAll("[data-count]")
        .forEach((el) => animateCounter(el));
      counterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.4 }
);

document.querySelectorAll(".why-odoo-wrap, .ai-stats").forEach((el) => {
  counterObserver.observe(el);
});
