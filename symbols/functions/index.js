// Registered functions — invoked via `el.call('name', ...)` with `this`
// bound to the calling element. Each entry is a thin, self-contained wrapper
// over the engine in globalScope.js: the bare engine* references below are
// resolved by frank to `__scope.engine*` (el.scope -> context.globalScope),
// which is the supported way for call-invoked sections to reach shared code.
// Anything fancier (re-exports from a lib/ directory, module-scope reads)
// does NOT survive frank's serialization.

export const startEngine = function () {
  return engineStart(this)
}

export const stopEngine = function () {
  return engineStop()
}

export const selectGame = function (slug) {
  return engineSelectGame(slug)
}

export const submitBet = function (guess) {
  return engineSubmitBet(guess)
}

export const backToPicker = function () {
  return engineBackToPicker()
}
