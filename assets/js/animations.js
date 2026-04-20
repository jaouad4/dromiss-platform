// ============================================================
// INTERSECTION OBSERVER ANIMATIONS
// Reveals elements with .animate-on-scroll class as they enter viewport
// ============================================================

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  },
);

document.querySelectorAll(".animate-on-scroll").forEach((el) => {
  observer.observe(el);
});
