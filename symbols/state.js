// symbols/state.js
//
// The root reactive state — STATE CONTRACT v3 (duels). UI components are
// built against exactly these fields. Do not rename, remove, or nest them
// without updating every consumer.
//
// Written ONLY by the engine in globalScope.js / functions/. The client
// renders; it never decides (docs/integrity.md §1). In server mode every
// field is a copy of what the server returned or a display prediction from
// its timestamps. In demo mode the crowd is simulated and settlement runs
// locally with the formula in docs/game-rules.md §3–§4 — and state.mode says
// so, because the UI MUST show it.
export default {
  // 'demo' | 'server' | null (null until bootstrap has decided)
  mode: null,

  // 'picker' — GamePicker is shown. 'playing' — the video stage is shown.
  screen: 'picker',

  // { slug, title, objectiveLine, targetLine, resultUnit, videoSrc,
  //   challengers: [{ side, name, line, poster }] }
  game: null,

  // { id, index, count, lockAt, revealAt: [s1, s2], endAt } — video seconds.
  // Betting runs from frame 0 to lockAt; attempt k is read at revealAt[k].
  round: null,

  // 'preview' | 'betting' | 'locked' | 'reveal' | 'results' | 'ended'
  phase: 'preview',

  // Whole seconds left in preview/betting/locked/results. 0 otherwise.
  // During 'betting' this is footage seconds to the lock frame.
  secondsLeft: 0,

  // Live player count for the current duel (ticks until LOCK).
  playerCount: 0,

  // Live pot for the current duel (ticks until LOCK).
  pot: 0,

  // { playerCount, pot } snapshot taken the instant the phase becomes
  // 'locked'. null before that. The UI renders THIS from locked onward —
  // once set, nothing changes it. That is the product.
  frozen: null,

  // Last ~6 crowd arrivals, NAMES ONLY. Sides stay hidden until reveal.
  arrivals: [],

  // The challenger (1 or 2) currently selected in BetPanel, before submit.
  mySide: null,

  // { side, stake } once the caller's bet for this duel is confirmed.
  myBet: null,

  // { unit, attempts: [a1, a2], winner } — attempts fill in as the footage
  // reaches each reveal frame; an unrevealed attempt is null. Each attempt
  // is { side, offset, readings: [string] }. winner is null until the second
  // attempt is read, then 1, 2, or 0 for a dead heat.
  result: null,

  // { winnerCount, multiplier, payout, iWon, myPayout, voided,
  //   sides: [{ side, count }] } — set at reveal (demo) / results (server).
  //   voided = no market (dead heat or nobody backed the winner); every
  //   stake was refunded and the house took nothing.
  settlement: null,

  // Current chip balance.
  balance: 0,

  // Sound cues (lock, bet, win, loss) on or off. Persisted as zse_sound.
  sound: true,

  // [{ gameSlug, roundIndex, winner, offsets: [o1, o2], unit }] newest first.
  history: [],

  // Human-readable message for the last failed action (most importantly: a
  // rejected bet). null when there is nothing to show. Never swallowed.
  error: null,

  // The engine mirrors the <video> element here every tick.
  video: { currentTime: 0, duration: 0, playing: false },

  // [{ slug, title, active }] — the game catalogue with its active flag.
  // The picker may grey out inactive games; the engine refuses them anyway.
  games: [],

  // Workspace dashboard state — WS_CONTRACT.md. Written only by the wk*
  // functions in globalScope.js via wkCommit(); the UI reads it.
  ws: {
    view: 'overview',
    source: null,
    me: null,
    loading: false,
    error: null,
    lastRefresh: null,
    overview: {
      rounds: 0, bets: 0, staked: 0, paidOut: 0, houseTake: 0, players: 0,
      avgMultiplier: null, bestMultiplier: null, conservationOk: true, breaches: 0
    },
    series: { potByRound: [], multiplierByRound: [], playersByRound: [] },
    live: [],
    rounds: [],
    selectedRoundId: null,
    roundDetail: null,
    bets: [],
    betsFilter: { gameSlug: null, roundId: null, playerId: null, won: null },
    players: [],
    ledger: [],
    ledgerFilter: { kind: null, playerId: null, roundId: null },
    ledgerAudit: { rows: [], allOk: true },
    games: [],
    integrity: []
  }
}
