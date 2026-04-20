/**
 * ui.js — Interactions globales dromiss
 *
 * Responsabilités :
 * - Dark mode toggle (avec persistance via variable en mémoire)
 * - Navbar scroll (effet glassmorphism au scroll)
 * - Menu mobile (hamburger open/close + trap focus)
 * - Animations au scroll (IntersectionObserver)
 * - Fermeture menu mobile sur resize
 */

// ─────────────────────────────────────────────────────────────────
// 1. DARK MODE
// ─────────────────────────────────────────────────────────────────

(function initTheme() {
  const root   = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');

  // Lire la préférence système
  let currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

  root.setAttribute('data-theme', currentTheme);
  updateToggleIcon(currentTheme);

  if (toggle) {
    toggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', currentTheme);
      updateToggleIcon(currentTheme);
    });
  }

  // Écouter les changements de préférence système
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    currentTheme = e.matches ? 'dark' : 'light';
    root.setAttribute('data-theme', currentTheme);
    updateToggleIcon(currentTheme);
  });

  function updateToggleIcon(theme) {
    if (!toggle) return;
    if (theme === 'dark') {
      toggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>`;
      toggle.setAttribute('aria-label', 'Activer le mode clair');
    } else {
      toggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>`;
      toggle.setAttribute('aria-label', 'Activer le mode sombre');
    }
  }
})();

// ─────────────────────────────────────────────────────────────────
// 2. NAVBAR SCROLL
// ─────────────────────────────────────────────────────────────────

(function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Appliquer l'état initial
})();

// ─────────────────────────────────────────────────────────────────
// 3. MENU MOBILE
// ─────────────────────────────────────────────────────────────────

(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-menu');
  const body      = document.body;

  if (!hamburger || !mobileNav) return;

  let isOpen = false;

  // Tous les éléments focusables du menu mobile
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

    // Changer l'icône hamburger → croix
    hamburger.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>`;

    // Focus sur le premier lien du menu
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

    // Restaurer l'icône hamburger
    hamburger.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>`;

    hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    isOpen ? closeMenu() : openMenu();
  });

  // Fermer avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });

  // Trap focus dans le menu mobile
  mobileNav.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = getFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Fermer quand on clique sur un lien du menu
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Fermer si la fenêtre est redimensionnée au-dessus du breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && isOpen) closeMenu();
  });
})();

// ─────────────────────────────────────────────────────────────────
// 4. ANIMATIONS AU SCROLL (IntersectionObserver)
// ─────────────────────────────────────────────────────────────────

(function initScrollAnimations() {
  // Respecter prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Rendre tous les éléments visibles immédiatement
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Désobserver après animation pour les performances
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
})();

// ─────────────────────────────────────────────────────────────────
// 5. LIENS ACTIFS NAVBAR (highlight page courante)
// ─────────────────────────────────────────────────────────────────

(function initActiveNavLinks() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.navbar__nav a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkPath = href.split('/').pop().split('#')[0] || 'index.html';

    if (linkPath === currentPath && !href.includes('#')) {
      link.setAttribute('aria-current', 'page');
    }
  });
})();