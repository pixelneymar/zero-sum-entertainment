// symbols/state.js
//
// The root reactive state — STATE CONTRACT v2. UI components are built
// against exactly these fields. Do not rename, remove, or nest them without
// updating every consumer.
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

  // { slug, title, objectiveLine, guessMin, guessMax, guessStep, resultUnit, videoSrc }
  game: null,

  // { id, index, count, betOpenAt, revealAt, pauseAt } — video seconds
  round: null,

  // 'intro' | 'preview' | 'betting' | 'locked' | 'reveal' | 'results' | 'ended'
  phase: 'intro',

  // Whole seconds left in preview/betting/locked/results. 0 otherwise.
  secondsLeft: 0,

  // Live player count for the current round (ticks until LOCK).
  playerCount: 0,

  // Live pot for the current round (ticks until LOCK).
  pot: 0,

  // { playerCount, pot } snapshot taken the instant the phase becomes
  // 'locked'. null before that. The UI renders THIS from locked onward —
  // once set, nothing changes it. That is the product.
  frozen: null,

  // Last ~6 crowd arrivals, NAMES ONLY. Guesses stay hidden until reveal.
  arrivals: [],

  // The guess currently selected in BetPanel, before it is submitted.
  myGuess: null,

  // { guess, stake } once the caller's bet for this round is confirmed.
  myBet: null,

  // { value, unit, readings: [string] } — set when the footage reaches
  // reveal_at. null before that. readings = what the scale(s) showed.
  result: null,

  // { winnerCount, multiplier, payout, iWon, myPayout, distribution:
  //   [{ guess, count }] } — set at reveal (demo) / results (server).
  settlement: null,

  // Current chip balance.
  balance: 0,

  // [{ gameSlug, roundIndex, value, unit }] newest first.
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
