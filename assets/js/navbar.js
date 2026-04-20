// ============================================================
// NAVBAR SCROLL BEHAVIOR & MOBILE MENU
// Handles navbar background on scroll and hamburger menu toggle
// ============================================================

// Navbar scroll effect
const navbar = document.getElementById("navbar");
if (navbar) {
  window.addEventListener(
    "scroll",
    () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    },
    { passive: true },
  );
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
    // Close mobile menu if open
    closeMobileMenu();
  });
});

// Hamburger mobile menu
const hamburger = document.getElementById("hamburger-btn");
const mobileNav = document.getElementById("mobile-menu");
let mobileOpen = false;

function closeMobileMenu() {
  mobileOpen = false;
  mobileNav?.classList.remove("open");
  mobileNav?.setAttribute("aria-hidden", "true");
  hamburger?.setAttribute("aria-expanded", "false");
  if (hamburger) {
    hamburger.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  }
}

hamburger &&
  hamburger.addEventListener("click", () => {
    mobileOpen = !mobileOpen;
    mobileNav.classList.toggle("open", mobileOpen);
    mobileNav.setAttribute("aria-hidden", String(!mobileOpen));
    hamburger.setAttribute("aria-expanded", String(mobileOpen));
    hamburger.innerHTML = mobileOpen
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  });
