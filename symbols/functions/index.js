// Registered functions — invoked via `el.call('name', ...)` with `this`
// bound to the calling element. Each entry is a thin wrapper over the engine
// in globalScope.js: the bare engine* references below are resolved by frank
// to `__scope.engine*` (el.scope -> context.globalScope), which is the
// supported way for call-invoked sections to reach shared code.
//
// These names are the state contract v3's function surface. Keep them.

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

/** SoundToggle → el.call('toggleSound'). Persists the preference. */
export const toggleSound = function () {
  return engineToggleSound()
}

export const backToPicker = function () {
  return engineBackToPicker()
}

/** ChallengerCard → el.call('setSide', 1 | 2). Anything else is ignored. */
export const setSide = function (n) {
  return engineSetSide(n)
}

/** BetPanel PLACE BET → el.call('submitBet', side). Rejections land in state.error. */
export const submitBet = function (side) {
  return engineSubmitBet(side)
}

/**
 * VideoSurface onRender → el.call('registerVideo'). `this` is the DOMQL
 * element; `this.node` is the <video>. The engine owns playback from here.
 */
export const registerVideo = function () {
  return engineRegisterVideo(this)
}

// ---- workspace (/workspace) — scratchpad WS_CONTRACT.md ---------------------
// Each is a thin wrapper over the wk* functions in globalScope.js.

/** Workspace page onRender. Selects the source, loads the view, starts the 1s live ticker. */
export const wsBoot = function () {
  return wkBoot(this)
}

/** Stops the live ticker. Call from the workspace page onRemove if it has one. */
export const wsStop = function () {
  return wkStop()
}

export const wsOpen = function (view) {
  return wkOpen(view)
}

export const wsRefresh = function () {
  return wkRefresh()
}

export const wsSelectRound = function (roundId) {
  return wkSelectRound(roundId)
}

export const wsSetBetsFilter = function (partial) {
  return wkSetBetsFilter(partial)
}

export const wsSetLedgerFilter = function (partial) {
  return wkSetLedgerFilter(partial)
}

export const wsSetGameActive = function (slug, active) {
  return wkSetGameActive(slug, active)
}

export const wsVoidRound = function (roundId) {
  return wkVoidRound(roundId)
}

export const wsScheduleRound = function (slug) {
  return wkScheduleRound(slug)
}

export const wsResetDemo = function () {
  return wkResetDemo()
}

export const wsExportCsv = function (view) {
  return wkExportCsv(view)
}

export const wsBackToGame = function () {
  return wkBackToGame(this)
}
