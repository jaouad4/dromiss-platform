/**
 * odoo-api.js - Module d'intégration CRM dromiss
 * Envoie les leads vers le proxy PHP sécurisé côté serveur.
 */

const ODOO_ENDPOINT = '/api/submit-lead';
const TIMEOUT_MS    = 15000;

/**
 * Retourne la liste des secteurs disponibles.
 */
export function getSecteurs() {
  return [
    { value: 'sante',        label: 'Santé & Pharmacie'        },
    { value: 'hotellerie',   label: 'Hôtellerie & Restauration' },
    { value: 'immobilier',   label: 'Immobilier & Promotion'    },
    { value: 'distribution', label: 'Commerce & Distribution'   },
    { value: 'industrie',    label: 'Industrie & Fabrication'   },
    { value: 'services',     label: 'Services & Conseil'        },
  ];
}

/**
 * Soumet un lead au CRM Odoo via le proxy PHP.
 * @param {Object} leadData
 * @returns {{ success: boolean, lead_id?: number, error?: string }}
 */
export async function submitLead(leadData) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ODOO_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(leadData),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return { success: false, error: 'Réponse inattendue du serveur. Veuillez réessayer.' };
    }

    if (!response.ok) {
      return { success: false, error: data.error || `Erreur serveur (${response.status}). Veuillez réessayer.` };
    }

    return data;

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      return { success: false, error: 'Le serveur met trop de temps à répondre. Veuillez réessayer.' };
    }

    return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion.' };
  }
}
