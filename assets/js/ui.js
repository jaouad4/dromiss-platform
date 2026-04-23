// ui.js - global UI orchestrator. Imports all site-wide behaviour modules.

import { loadComponents } from './components.js';
import './theme.js';

await loadComponents();

await Promise.all([
  import('./navbar.js'),
  import('./animations.js'),
]);
