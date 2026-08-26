// Explicit bundle entry. frank falls back to a synthetic context built from
// CONTEXT_MODULES when this file is absent, and warns that synthesized entries
// "silently change shape when the module set evolves". Shipping it explicitly
// keeps the entry stable as modules are added or removed.
import * as components from './components/index.js'
import * as functions from './functions/index.js'
import designSystem from './designSystem/index.js'
import pages from './pages/index.js'
import state from './state.js'
import config from './config.js'


export default {
  ...config,
  state,
  components,
  functions,
  pages,
  designSystem
}
