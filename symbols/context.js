// Explicit bundle entry. frank falls back to a synthetic context built from
// CONTEXT_MODULES when this file is absent, and warns that synthesized entries
// "silently change shape when the module set evolves". Shipping it explicitly
// keeps the entry stable as modules are added or removed.
import * as components from './components/index.js'
import * as functions from './functions/index.js'
import * as globalScope from './globalScope.js'
import designSystem from './designSystem/index.js'
import pages from './pages/index.js'
import state from './state.js'
import config from './config.js'
import dependencies from './dependencies.js'


export default {
  ...config,
  state,
  components,
  functions,
  globalScope,
  pages,
  designSystem,
  // The runtime importmap — without this key in the emitted project JSON the
  // served page gets NO <script type="importmap">, and the data layer's
  // `await import('@supabase/supabase-js')` cannot resolve in the browser.
  dependencies
}
