// Registered functions — invoked via `el.call('name', ...)` with `this`
// bound to the calling element. Each entry is a thin wrapper over the engine
// in globalScope.js: the bare engine* references below are resolved by frank
// to `__scope.engine*` (el.scope -> context.globalScope), which is the
// supported way for call-invoked sections to reach shared code.
//
// These names are the state contract v2's function surface. Keep them.

/** Root page onRender. Idempotent. */
export const startEngine = function () {
  return engineStart(this)
}

export const stopEngine = function () {
  return engineStop()
}

/** GamePicker → el.call('selectGame', slug) */
export const selectGame = function (slug) {
  return engineSelectGame(slug)
}

export const backToPicker = function () {
  return engineBackToPicker()
}

/** BetPanel slider/chips → el.call('setGuess', n). Clamped to the game range. */
export const setGuess = function (n) {
  return engineSetGuess(n)
}

/** BetPanel PLACE BET → el.call('submitBet', guess). Rejections land in state.error. */
export const submitBet = function (guess) {
  return engineSubmitBet(guess)
}

/**
 * VideoSurface onRender → el.call('registerVideo'). `this` is the DOMQL
 * element; `this.node` is the <video>. The engine owns playback from here.
 */
export const registerVideo = function () {
  return engineRegisterVideo(this)
}
