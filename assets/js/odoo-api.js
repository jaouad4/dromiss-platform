/**
 * odoo-api.js — Module d'intégration CRM dromiss
 * Envoie les leads vers le module proxy Odoo via fetch.
 */

const ODOO_ENDPOINT = 'http://localhost:8069/dromiss/submit-lead';
const TIMEOUT_MS    = 15000;

/**
 * Retourne la liste des secteurs disponibles.
 */
export function getSecteurs() {
  return [
    { value: 'sante',        label: 'Santé & Pharmacie'       },
    { value: 'hotellerie',   label: 'Hôtellerie & Restauration'},
    { value: 'immobilier',   label: 'Immobilier & Promotion'   },
    { value: 'distribution', label: 'Commerce & Distribution'  },
    { value: 'industrie',    label: 'Industrie & Fabrication'  },
    { value: 'services',     label: 'Services & Conseil'       },
  ];
}

/**
 * Soumet un lead au CRM Odoo.
 * @param {Object} leadData
 * @returns {{ success: boolean, lead_id?: number, error?: string }}
 */
export async function submitLead(leadData) {
  // AbortController pour le timeout
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log('📤 Envoi vers Odoo :', leadData);

    const response = await fetch(ODOO_ENDPOINT, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin':       window.location.origin,
      },
      body:   JSON.stringify(leadData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📥 Statut HTTP :', response.status);

    // Lire le corps de la réponse en texte brut d'abord
    const rawText = await response.text();
    console.log('📥 Réponse brute :', rawText);

    // Parser le JSON
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('❌ Réponse non-JSON reçue :', rawText);
      return {
        success: false,
        error:   'Réponse inattendue du serveur. Veuillez réessayer.',
      };
    }

    // Vérifier le statut HTTP
    if (!response.ok) {
      console.warn('⚠️  Erreur HTTP', response.status, data);
      return {
        success: false,
        error:   data.error || `Erreur serveur (${response.status}). Veuillez réessayer.`,
      };
    }

    console.log('✅ Lead créé :', data);
    return data;

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      console.error('❌ Timeout — Odoo ne répond pas dans les', TIMEOUT_MS, 'ms');
      return {
        success: false,
        error:   'Le serveur met trop de temps à répondre. Vérifiez qu\'Odoo est bien lancé.',
      };
    }

    console.error('❌ Erreur réseau :', err);
    return {
      success: false,
      error:   'Impossible de contacter le serveur. Vérifiez votre connexion.',
    };
  }
}