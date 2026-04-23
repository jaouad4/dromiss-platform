/**
 * form.js - Gestion du formulaire de contact dromiss
 *
 * Responsabilités :
 * - Pré-remplir le champ "secteur" depuis ?secteur= dans l'URL
 * - Afficher le badge du secteur sélectionné
 * - Valider les champs en temps réel (on blur) et à la soumission
 * - Appeler submitLead() depuis odoo-api.js
 * - Gérer les états visuels : chargement, succès, erreur + retry
 */

import { submitLead, getSecteurs } from './odoo-api.js';

// ─────────────────────────────────────────────────────────────────
// Initialisation au chargement du DOM
// ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initSecteurFromUrl();
  initFormValidation();
  initFormSubmit();
});

// ─────────────────────────────────────────────────────────────────
// 1. Pré-remplissage secteur depuis l'URL
// ─────────────────────────────────────────────────────────────────

function initSecteurFromUrl() {
  const params  = new URLSearchParams(window.location.search);
  const secteur = params.get('secteur') || '';

  if (!secteur) return;

  // Pré-remplir le <select>
  const select = document.getElementById('field-sector');
  if (select) {
    const option = select.querySelector(`option[value="${secteur}"]`);
    if (option) {
      select.value = secteur;
    }
  }

  // Afficher le badge secteur dans le hero
  const badge     = document.getElementById('secteur-badge');
  const badgeText = document.getElementById('secteur-badge-text');

  if (badge && badgeText) {
    const secteurs = getSecteurs();
    const found    = secteurs.find(s => s.value === secteur);
    if (found) {
      badgeText.textContent = found.label;
      badge.hidden = false;
    }
  }

  // Mettre à jour le titre de la page si un secteur est détecté
  const heroTitle = document.getElementById('contact-hero-title');
  if (heroTitle) {
    const secteurs = getSecteurs();
    const found    = secteurs.find(s => s.value === secteur);
    if (found) {
      heroTitle.innerHTML = `Demander une démo<br><span>${found.label}</span>`;
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. Validation champ par champ
// ─────────────────────────────────────────────────────────────────

/**
 * Règles de validation par champ.
 * Chaque règle : { test: fn => bool, message: string }
 */
const VALIDATION_RULES = {
  'field-name': [
    {
      test:    v => v.trim().length >= 2,
      message: 'Le nom doit contenir au moins 2 caractères.',
    },
  ],
  'field-email': [
    {
      test:    v => v.trim().length > 0,
      message: 'L\'email est obligatoire.',
    },
    {
      test:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: 'Veuillez saisir un email valide.',
    },
  ],
  'field-phone': [
    {
      test:    v => v.trim() === '' || /^[\d\s+\-().]{7,20}$/.test(v.trim()),
      message: 'Numéro de téléphone invalide.',
    },
  ],
};

function validateConsent() {
  const checkbox = document.getElementById('field-consent');
  const errorEl  = document.getElementById('field-consent-error');
  if (!checkbox) return true;

  if (!checkbox.checked) {
    checkbox.setAttribute('aria-invalid', 'true');
    if (errorEl) { errorEl.textContent = 'Vous devez accepter la politique de confidentialité.'; errorEl.classList.add('visible'); }
    return false;
  }
  checkbox.removeAttribute('aria-invalid');
  if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
  return true;
}

/**
 * Valide un champ unique et met à jour son état visuel.
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field
 * @returns {boolean} true si valide
 */
function validateField(field) {
  const rules = VALIDATION_RULES[field.id];
  if (!rules) return true; // Champ optionnel sans règle

  const value   = field.value;
  const errorEl = document.getElementById(`${field.id}-error`);

  for (const rule of rules) {
    if (!rule.test(value)) {
      setFieldError(field, errorEl, rule.message);
      return false;
    }
  }

  setFieldValid(field, errorEl);
  return true;
}

function setFieldError(field, errorEl, message) {
  field.setAttribute('aria-invalid', 'true');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

function setFieldValid(field, errorEl) {
  field.removeAttribute('aria-invalid');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
}

/**
 * Valide tous les champs obligatoires du formulaire.
 * @returns {boolean} true si tous les champs sont valides
 */
function validateForm() {
  const fieldsToValidate = ['field-name', 'field-email', 'field-phone'];
  let allValid = true;

  for (const id of fieldsToValidate) {
    const field = document.getElementById(id);
    if (field) {
      const valid = validateField(field);
      if (!valid) allValid = false;
    }
  }

  return allValid;
}

function initFormValidation() {
  const fieldsToValidate = ['field-name', 'field-email', 'field-phone'];

  for (const id of fieldsToValidate) {
    const field = document.getElementById(id);
    if (!field) continue;

    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  }

  const consent = document.getElementById('field-consent');
  if (consent) {
    consent.addEventListener('change', () => validateConsent());
  }
}

// ─────────────────────────────────────────────────────────────────
// 3. Soumission du formulaire
// ─────────────────────────────────────────────────────────────────

function initFormSubmit() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSubmit(form);
  });

  // Bouton retry dans le message d'erreur
  const retryBtn = document.getElementById('form-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      hideMessage();
      const submitBtn = document.getElementById('btn-submit');
      if (submitBtn) submitBtn.disabled = false;
    });
  }
}

async function handleSubmit(form) {
  // ── 1. Validation ─────────────────────────────────────────────
  const isFormValid    = validateForm();
  const isConsentValid = validateConsent();
  if (!isFormValid || !isConsentValid) {
    const firstError = form.querySelector('[aria-invalid="true"]');
    if (firstError) firstError.focus();
    return;
  }

  // ── 2. État chargement ────────────────────────────────────────
  setLoadingState(true);
  hideMessage();

  // ── 3. Collecter les données ──────────────────────────────────
  const leadData = {
    name:    document.getElementById('field-name')?.value.trim()    || '',
    email:   document.getElementById('field-email')?.value.trim()   || '',
    phone:   document.getElementById('field-phone')?.value.trim()   || '',
    secteur: document.getElementById('field-sector')?.value         || '',
    message: document.getElementById('field-message')?.value.trim() || '',
    consent: document.getElementById('field-consent')?.checked      ?? false,
  };

  // ── 4. Appel API ──────────────────────────────────────────────
  const result = await submitLead(leadData);

  // ── 5. Gérer la réponse ───────────────────────────────────────
  setLoadingState(false);

  if (result.success) {
    showSuccess();
  } else {
    showError(result.error || 'Une erreur est survenue. Veuillez réessayer.');
  }
}

// ─────────────────────────────────────────────────────────────────
// 4. États visuels
// ─────────────────────────────────────────────────────────────────

function setLoadingState(loading) {
  const submitBtn  = document.getElementById('btn-submit');
  const btnText    = document.getElementById('btn-submit-text');
  const spinner    = document.getElementById('btn-spinner');

  if (!submitBtn) return;

  submitBtn.disabled = loading;

  if (btnText) btnText.textContent = loading ? 'Envoi en cours…' : 'Envoyer ma demande';
  if (spinner) spinner.hidden = !loading;
}

function showSuccess() {
  const form        = document.getElementById('contact-form');
  const successEl   = document.getElementById('form-success');

  if (form)      form.hidden = true;
  if (successEl) successEl.classList.add('visible');

  // Scroll vers le message de succès
  successEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showError(message) {
  const errorEl  = document.getElementById('form-error-message');
  const errorMsg = document.getElementById('form-error-text');

  if (errorMsg) errorMsg.textContent = message;
  if (errorEl)  errorEl.style.display = 'flex';

  // Scroll vers le message d'erreur
  errorEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideMessage() {
  const errorEl   = document.getElementById('form-error-message');
  const successEl = document.getElementById('form-success');

  if (errorEl)  errorEl.style.display = 'none';
  if (successEl) successEl.classList.remove('visible');
}
