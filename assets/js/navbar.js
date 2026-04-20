// Navbar — scroll effect, accessible mobile menu (focus trap + aria), active link highlight.

(function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-menu');
  const body      = document.body;

  if (!hamburger || !mobileNav) return;

  let isOpen = false;

  function getFocusableElements() {
    return Array.from(
      mobileNav.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')
    );
  }

  function openMenu() {
    isOpen = true;
    mobileNav.classList.add('open');
    mobileNav.removeAttribute('aria-hidden');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Fermer le menu');
    body.style.overflow = 'hidden';
    hamburger.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>`;
    setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length) focusable[0].focus();
    }, 50);
  }

  function closeMenu() {
    isOpen = false;
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Ouvrir le menu');
    body.style.overflow = '';
    hamburger.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>`;
    hamburger.focus();
  }

  hamburger.addEventListener('click', () => { isOpen ? closeMenu() : openMenu(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });

  mobileNav.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = getFocusableElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && isOpen) closeMenu();
  });
})();

(function initActiveNavLinks() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.navbar__nav a, .mobile-nav a').forEach(link => {
    const href     = link.getAttribute('href') || '';
    const linkPath = href.split('/').pop().split('#')[0] || 'index.html';
    if (linkPath === currentPath && !href.includes('#')) {
      link.setAttribute('aria-current', 'page');
    }
  });
})();
