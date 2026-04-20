// ============================================================
// ODOO CONFIGURATION
// Uses window.__ENV__ for environment variables (no bundler needed)
// ============================================================
//
// SETUP:
// Add a <script> block in index.html BEFORE module imports:
//
//   <script>
//     window.__ENV__ = {
//       ODOO_URL: 'http://localhost:8069',
//       ODOO_DB: 'odoo',
//       ODOO_USER: 'api@dromiss.ma',
//       ODOO_PASSWORD: 'your_password_here',
//       ODOO_API_KEY: 'your_api_key_here'  // Optional, for Odoo 16+
//     };
//   </script>
//
// SECURITY WARNING:
// - Never commit real credentials to git
// - For production, use a backend proxy or serverless function
// - API keys/passwords exposed in frontend are visible to users
// ============================================================

export const ODOO_CONFIG = {
  // Odoo server URL
  url: window.__ENV__?.ODOO_URL || "http://localhost:8069",
  
  // Database name
  db: window.__ENV__?.ODOO_DB || "odoo",
  
  // API user credentials
  user: window.__ENV__?.ODOO_USER || "api@dromiss.ma",
  password: window.__ENV__?.ODOO_PASSWORD || "CHANGE_ME_AFTER_PHASE2",
  
  // Optional: API Key for Odoo 16+ (preferred over password)
  apiKey: window.__ENV__?.ODOO_API_KEY || null
};
