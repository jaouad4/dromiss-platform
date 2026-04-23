// ui.js - global UI orchestrator. Imports all site-wide behaviour modules.

import { loadComponents } from './components.js';
import './theme.js';

try {
  await loadComponents();
} catch (e) {
  console.error('Component load failed:', e);
}

await Promise.all([
  import('./navbar.js'),
  import('./animations.js'),
]);
