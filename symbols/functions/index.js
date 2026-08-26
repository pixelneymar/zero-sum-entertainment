// frank only bundles its discovery slots (components, functions, globalScope,
// designSystem, pages, state, config). A bare `lib/` directory is stripped from
// the bundle entirely — verified: startEngine was absent from the served output.
// Re-exporting through this slot is what pulls the data layer in.
export { startEngine, stopEngine, selectGame, backToPicker, submitBet } from '../lib/engine.js'
export { serverNow } from '../lib/clock.js'
export { phaseOf, secondsLeft } from '../lib/round.js'
