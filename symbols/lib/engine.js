// symbols/lib/engine.js
//
// The loop that drives `state`. This is the only writer of symbols/state.js
// at runtime; UI components read state and call the action functions
// exported here (selectGame, submitBet, backToPicker) — they never write
// state fields directly except the purely-local `myGuess` selection, and
// they never call symbols/lib/api.js on their own for anything that affects
// shared state, so there is exactly one place that reconciles server truth
// into the UI.
//
// Nothing here decides a round's phase, a winner, or a payout — it only
// derives a DISPLAY phase from server timestamps (round.js) and copies
// across whatever the server already decided (api.js). Per
// docs/integrity.md §1, the client renders; it never asserts.
import * as api from './api.js'
import { authReady, getUserId } from './supabase.js'
import { serverNow, clockReady } from './clock.js'
import { phaseOf, secondsLeft as computeSecondsLeft } from './round.js'
import {
  subscribeRoundAggregates,
  subscribeOwnBet,
  unsubscribeAll
} from './realtime.js'

const TICK_MS = 250
const STATS_POLL_MS = 1500

let timer = null
let advancing = false
let lastStatsPollAt = 0

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * Starts the drive loop. Safe to call once at app bootstrap; loads the
 * balance immediately (BalanceChip is visible on every screen, per
 * docs/architecture.md §2.1) even before a game is picked.
 *
 * Returns a stop function; calling startEngine again while already running
 * is a no-op that just returns the same stop function.
 */
export function startEngine(state) {
  if (timer) return stopEngine

  bootstrap(state)
  timer = setInterval(() => tick(state), TICK_MS)
  return stopEngine
}

/** Stops the drive loop and tears down any open realtime channels. */
export function stopEngine() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  unsubscribeAll()
}

async function bootstrap(state) {
  try {
    await authReady
    await clockReady()
    state.balance = await api.balance()
  } catch (err) {
    state.error = describeError(err)
  }
}

// ---------------------------------------------------------------------------
// Actions — called by UI
// ---------------------------------------------------------------------------

/** GamePicker calls this when the player picks a game. */
export async function selectGame(state, slug) {
  state.error = null
  try {
    await authReady

    const game = await api.getGame(slug)
    if (!game) {
      state.error = `Game "${slug}" was not found.`
      return
    }

    state.game = game
    state.screen = 'playing'
    state.history = await api.history(slug, 8)

    const round = await api.currentRound(slug)
    if (!round) {
      state.round = null
      state.error = 'No upcoming round for this game right now. Try again shortly.'
      return
    }

    await loadRound(state, round)
  } catch (err) {
    state.error = describeError(err)
  }
}

/** Returns to the GamePicker screen and tears down the current round. */
export function backToPicker(state) {
  unsubscribeAll()
  state.screen = 'picker'
  state.game = null
  state.round = null
  state.phase = 'preview'
  state.secondsLeft = 0
  state.playerCount = 0
  state.pot = 0
  state.frozen = null
  state.myGuess = null
  state.myBet = null
  state.result = null
  state.settlement = null
  state.error = null
}

/**
 * BetPanel's single PLACE BET button calls this. A rejection (late bet,
 * duplicate bet, insufficient balance) is the database's lock doing its
 * job (docs/integrity.md §3) — it is surfaced via state.error, never
 * swallowed, and myBet/myGuess are left untouched so the UI can tell the
 * bet did NOT go through.
 */
export async function submitBet(state, guess) {
  if (!state.round) {
    state.error = 'There is no active round to bet on.'
    return
  }

  state.error = null
  try {
    await api.placeBet(state.round.id, guess)

    // Re-read from the server rather than assuming the stake — the client
    // never invents a number the server is supposed to own.
    const confirmed = await api.myBet(state.round.id)
    if (confirmed) {
      state.myBet = confirmed
      state.myGuess = confirmed.guess
    }

    state.balance = await api.balance()
  } catch (err) {
    state.error = describeError(err)
  }
}

// ---------------------------------------------------------------------------
// Round loading
// ---------------------------------------------------------------------------

async function loadRound(state, round) {
  unsubscribeAll()
  lastStatsPollAt = 0

  state.round = round
  state.myGuess = null
  state.myBet = null
  state.result = null
  state.settlement = null
  state.frozen = null

  const now = serverNow()
  state.phase = phaseOf(round, now)
  state.secondsLeft = computeSecondsLeft(round, now)

  try {
    const [stats, existingBet] = await Promise.all([
      api.roundStats(round.id),
      api.myBet(round.id)
    ])

    if (!state.round || state.round.id !== round.id) return // superseded meanwhile

    state.playerCount = stats.playerCount
    state.pot = stats.pot

    if (existingBet) {
      state.myBet = existingBet
      state.myGuess = existingBet.guess
    }

    // Rejoining mid-round (e.g. page refresh after lock): the freeze can't
    // be caught live, so seed it from the current — now immutable — stats.
    if (state.phase !== 'preview' && state.phase !== 'betting') {
      state.frozen = { playerCount: stats.playerCount, pot: stats.pot }
    }

    if (state.phase === 'reveal' || state.phase === 'results') {
      const result = await api.roundResult(round.id)
      if (result) {
        state.result = { value: result.value, unit: state.game ? state.game.resultUnit : '' }
      }
    }

    if (state.phase === 'results') {
      const info = await api.settlement(round.id)
      if (info) state.settlement = info
    }
  } catch (err) {
    state.error = describeError(err)
  }

  const roundId = round.id
  subscribeRoundAggregates(roundId, ({ playerCount, pot }) => {
    if (!state.round || state.round.id !== roundId) return
    if (state.phase !== 'preview' && state.phase !== 'betting') return // frozen — ignore
    state.playerCount = playerCount
    state.pot = pot
  })

  const userId = getUserId()
  if (userId) {
    subscribeOwnBet(roundId, userId, ({ guess, stake }) => {
      if (!state.round || state.round.id !== roundId) return
      state.myBet = { guess, stake }
      state.myGuess = guess
    })
  }
}

async function advanceRound(state) {
  if (advancing || !state.game) return
  advancing = true
  try {
    const nextRound = await api.currentRound(state.game.slug)
    if (nextRound && (!state.round || nextRound.id !== state.round.id)) {
      await loadRound(state, nextRound)
      state.history = await api.history(state.game.slug, 8)
    }
    // If there's no next round yet, do nothing — pg_cron's round-creation
    // sweep (docs/architecture.md §5) hasn't run yet. We just retry on the
    // next tick; nothing here is on any correctness path.
  } catch (err) {
    state.error = describeError(err)
  } finally {
    advancing = false
  }
}

// ---------------------------------------------------------------------------
// The tick
// ---------------------------------------------------------------------------

function tick(state) {
  if (!state.round) return

  const now = serverNow()
  const nextPhase = phaseOf(state.round, now)
  state.secondsLeft = computeSecondsLeft(state.round, now)

  if (nextPhase !== state.phase) {
    const prevPhase = state.phase
    state.phase = nextPhase
    onPhaseChange(state, prevPhase, nextPhase)
  } else if (
    (nextPhase === 'preview' || nextPhase === 'betting') &&
    now - lastStatsPollAt >= STATS_POLL_MS
  ) {
    // Realtime is a latency optimisation, not a source of truth
    // (architecture.md §3) — poll the safe aggregate too, so the crowd
    // counter keeps visibly ticking even if a realtime message is dropped
    // or the round_stats channel never delivers one at all.
    lastStatsPollAt = now
    pollStats(state)
  }

  if (
    nextPhase === 'results' &&
    now >= new Date(state.round.resultsEndAt).getTime()
  ) {
    advanceRound(state)
  }
}

function onPhaseChange(state, from, to) {
  if (to === 'locked' && from !== 'locked') {
    // THE freeze. Exact, synchronous, from whatever is on screen at this
    // instant — never awaited, so nothing can slip in between "phase
    // becomes locked" and "counters stop moving". docs/spec.md §3: "at the
    // instant LOCKED begins, the bet list, the player count and the pot
    // are final."
    state.frozen = { playerCount: state.playerCount, pot: state.pot }
  }

  // Reconcile with a fetch at every phase change (architecture.md §3).
  // For 'locked' this also re-confirms state.frozen against the server —
  // safe, because after the lock nothing can change those numbers again,
  // so a fetch can only correct drift from a missed realtime message, never
  // show a moving target.
  reconcile(state, to)
}

async function reconcile(state, phase) {
  const round = state.round
  if (!round) return

  try {
    if (phase === 'preview' || phase === 'betting') {
      const stats = await api.roundStats(round.id)
      if (isCurrent(state, round)) {
        state.playerCount = stats.playerCount
        state.pot = stats.pot
      }
    } else if (phase === 'locked') {
      const stats = await api.roundStats(round.id)
      if (isCurrent(state, round)) {
        state.frozen = { playerCount: stats.playerCount, pot: stats.pot }
        state.playerCount = stats.playerCount
        state.pot = stats.pot
      }
    } else if (phase === 'reveal') {
      const result = await api.roundResult(round.id)
      if (result && isCurrent(state, round)) {
        state.result = { value: result.value, unit: state.game ? state.game.resultUnit : '' }
      }
    } else if (phase === 'results') {
      const [info, freshBalance] = await Promise.all([
        api.settlement(round.id),
        api.balance()
      ])
      if (isCurrent(state, round)) {
        if (info) state.settlement = info
        state.balance = freshBalance
      }
    }
  } catch (err) {
    state.error = describeError(err)
  }
}

async function pollStats(state) {
  const round = state.round
  if (!round) return
  try {
    const stats = await api.roundStats(round.id)
    if (
      isCurrent(state, round) &&
      (state.phase === 'preview' || state.phase === 'betting')
    ) {
      state.playerCount = stats.playerCount
      state.pot = stats.pot
    }
  } catch (err) {
    // Non-fatal — a missed poll just leaves the counter a beat stale. The
    // next poll or a realtime message will catch it up.
  }
}

function isCurrent(state, round) {
  return !!state.round && state.round.id === round.id
}

function describeError(err) {
  if (!err) return 'Something went wrong. Please try again.'
  return err.message || String(err)
}
