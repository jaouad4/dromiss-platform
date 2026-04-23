// Resolves the root path relative to the current page's depth.
// e.g. /index.html -> "./"  |  /domaines/sante.html -> "../"
const _segments = window.location.pathname.split('/').filter(Boolean);
const ROOT = _segments.length > 1 ? '../'.repeat(_segments.length - 1) : './';

async function _inject(placeholderId, file) {
  const el = document.getElementById(placeholderId);
  if (!el) return;
  const res = await fetch(`${ROOT}assets/components/${file}`);
  if (!res.ok) return;
  const html = (await res.text()).replace(/\{\{ROOT\}\}/g, ROOT);
  el.outerHTML = html;
}

export async function loadComponents() {
  await Promise.all([
    _inject('navbar-placeholder', 'navbar.html'),
    _inject('footer-placeholder', 'footer.html'),
  ]);
}
