// symbols/state.js
//
// The root reactive state. This shape is a fixed contract — UI components
// are built against exactly these fields. Do not rename, remove, or nest
// them without updating every consumer.
//
// This object holds no authority of its own (docs/integrity.md §1): every
// field here is either a display prediction (phase, secondsLeft) derived
// from server timestamps, or a direct copy of the last value the server
// actually returned (round, result, settlement, balance, myBet). Nothing in
// this file is ever computed by guessing a winner or a payout — that math
// lives only in `settle_round()` on the server (docs/game-rules.md §7).
//
// The engine in symbols/globalScope.js is what drives these values over
// time; UI reads them, the engine acts as the only writer.
export default {
  // 'picker' — GamePicker is shown. 'playing' — BettingStage is shown.
  screen: 'picker',

  // { slug, title, objectiveLine, guessMin, guessMax, guessStep, resultUnit }
  game: null,

  // { id, roundIndex, bettingOpensAt, bettingClosesAt, revealAt,
  //   resultsEndAt, videoBetOpenS, videoRevealS, videoPauseS }
  round: null,

  // 'preview' | 'betting' | 'locked' | 'reveal' | 'results'
  phase: 'preview',

  // Countdown for the current phase, in whole seconds.
  secondsLeft: 0,

  // Live player count for the current round (pre-lock: ticking; post-lock:
  // equal to state.frozen.playerCount).
  playerCount: 0,

  // Live pot for the current round (pre-lock: ticking; post-lock: equal to
  // state.frozen.pot).
  pot: 0,

  // { playerCount, pot } snapshot taken the instant phase first becomes
  // 'locked'. null before that moment. This freeze is the product's core
  // demonstration — once set, playerCount/pot stop changing on screen.
  frozen: null,

  // The guess currently selected in BetPanel, before it is submitted.
  myGuess: null,

  // { guess, stake } once the caller's bet for this round is confirmed by
  // the server. null until then.
  myBet: null,

  // { value, unit } — set once the round enters 'reveal'. null before that.
  result: null,

  // { winnerCount, multiplier, payout, iWon, myPayout } — set once the
  // round enters 'results' and settlement has been fetched. null before
  // that.
  settlement: null,

  // Current chip balance, from the ledger-backed `balances` cache.
  balance: 0,

  // Last N results for the current game, newest first.
  history: [],

  // Human-readable message for the last failed action (most importantly: a
  // bet the server rejected). null when there is nothing to show. Never
  // swallowed — see docs/integrity.md §3's acceptance test.
  error: null
}
