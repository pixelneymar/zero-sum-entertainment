// symbols/lib/api.js
//
// Thin wrappers over PostgREST/RPC. This file holds no authority and makes
// no decisions (docs/integrity.md §1) — it fetches what the server allows
// this user to see under RLS, and it lets the server accept or reject every
// write. Nothing here computes a result, a winner, or a balance; it only
// reads what `round_results`, `bets`, `chip_ledger`/`balances`, and
// `settle_round()` already decided.
//
// Table/RPC names and shapes follow docs/data-model.md and docs/game-rules.md.
import { supabase, authReady } from './supabase.js'
import { serverNow } from './clock.js'

// ---------------------------------------------------------------------------
// Mapping helpers — DB snake_case -> the fixed state contract's camelCase.
// ---------------------------------------------------------------------------

function mapGame(row) {
  if (!row) return null
  return {
    slug: row.slug,
    title: row.title,
    objectiveLine: row.objective_line,
    guessMin: row.guess_min,
    guessMax: row.guess_max,
    guessStep: row.guess_step,
    resultUnit: row.result_unit
  }
}

function mapRound(row) {
  if (!row) return null
  return {
    id: row.id,
    roundIndex: row.round_index,
    bettingOpensAt: row.betting_opens_at,
    bettingClosesAt: row.betting_closes_at,
    resultVisibleAt: row.result_visible_at,
    resultsEndAt: row.results_end_at,
    videoBetOpenS: Number(row.video_bet_open_s),
    videoRevealS: Number(row.video_reveal_s),
    videoPauseS: Number(row.video_pause_s)
  }
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

/** Active games, for the GamePicker. */
export async function listGames() {
  await authReady
  const { data, error } = await supabase
    .from('games')
    .select(
      'slug, title, objective_line, guess_min, guess_max, guess_step, result_unit, is_active'
    )
    .eq('is_active', true)
    .order('title', { ascending: true })

  if (error) throw error
  return (data || []).map(mapGame)
}

/** One game by slug. Returns null if not found or inactive. */
export async function getGame(slug) {
  await authReady
  const { data, error } = await supabase
    .from('games')
    .select(
      'slug, title, objective_line, guess_min, guess_max, guess_step, result_unit, is_active'
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return mapGame(data)
}

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------

/**
 * The round a player should be looking at right now for this game: the
 * earliest round whose RESULTS phase hasn't ended yet. This is a display
 * convenience only — every phase boundary is re-derived from the returned
 * timestamps by round.js, never trusted as-is.
 */
export async function currentRound(gameId) {
  await authReady

  // `gameId` here is the game's slug — resolved to its row id first, since
  // `rounds.game_id` is a foreign key, not the slug.
  const { data: gameRow, error: gameError } = await supabase
    .from('games')
    .select('id')
    .eq('slug', gameId)
    .maybeSingle()
  if (gameError) throw gameError
  if (!gameRow) return null

  const nowIso = new Date(serverNow()).toISOString()

  const { data, error } = await supabase
    .from('rounds')
    .select(
      'id, round_index, betting_opens_at, betting_closes_at, result_visible_at, results_end_at, video_bet_open_s, video_reveal_s, video_pause_s'
    )
    .eq('game_id', gameRow.id)
    .gt('results_end_at', nowIso)
    .order('betting_opens_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return mapRound(data)
}

// ---------------------------------------------------------------------------
// Betting
// ---------------------------------------------------------------------------

/**
 * Places a bet via the `place_bet` RPC. NEVER inserts into `bets` directly —
 * the RPC is the one call site, matching docs/data-model.md §6's "one place
 * to audit" argument, and it lets the server's RLS `WITH CHECK` (the actual
 * lock, docs/integrity.md §3) be the sole judge of "is betting still open".
 *
 * A rejection here (late bet, duplicate bet, insufficient balance) is
 * EXPECTED behaviour, not a bug — it is the proof the lock works. Callers
 * must surface `error.message` to the user, never swallow it.
 */
export async function placeBet(roundId, guess) {
  await authReady
  const { data, error } = await supabase.rpc('place_bet', {
    p_round_id: roundId,
    p_guess: guess
  })
  if (error) throw error
  return data
}

/** The caller's own bet for a round, or null if they haven't bet. */
export async function myBet(roundId) {
  await authReady
  const { data, error } = await supabase
    .from('bets')
    .select('guess, stake')
    .eq('round_id', roundId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return { guess: data.guess, stake: data.stake }
}

// ---------------------------------------------------------------------------
// Aggregates / results
// ---------------------------------------------------------------------------

/** Public aggregate: player count and pot. Never carries a single guess. */
export async function roundStats(roundId) {
  await authReady
  const { data, error } = await supabase
    .from('round_stats')
    .select('player_count, pot')
    .eq('round_id', roundId)
    .maybeSingle()

  if (error) throw error
  return {
    playerCount: data ? Number(data.player_count) || 0 : 0,
    pot: data ? Number(data.pot) || 0 : 0
  }
}

/**
 * The round's result. Returns null before `result_visible_at` — RLS simply returns
 * zero rows until then (docs/integrity.md §5.1), so an empty result here is
 * expected, not an error.
 */
export async function roundResult(roundId) {
  await authReady
  const { data, error } = await supabase
    .from('round_results')
    .select('result_value, recorded_at')
    .eq('round_id', roundId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return { value: data.result_value, recordedAt: data.recorded_at }
}

/**
 * Settlement info for the caller, derived from their own `chip_ledger`
 * `payout` row for this round (if any) plus the round's aggregate stats.
 * Returns null if the round has not been settled yet — settlement is a
 * server-side sweep (docs/architecture.md §5) and can lag `result_visible_at`.
 */
export async function settlement(roundId) {
  await authReady

  const { data: roundRow, error: roundError } = await supabase
    .from('rounds')
    .select('settled_at')
    .eq('id', roundId)
    .maybeSingle()
  if (roundError) throw roundError
  if (!roundRow || !roundRow.settled_at) return null

  const [{ playerCount }, ledgerResult] = await Promise.all([
    roundStats(roundId),
    supabase
      .from('chip_ledger')
      .select('amount')
      .eq('round_id', roundId)
      .eq('kind', 'payout')
      .maybeSingle()
  ])

  if (ledgerResult.error) throw ledgerResult.error

  const myPayout = ledgerResult.data ? Number(ledgerResult.data.amount) : 0
  const iWon = myPayout > 0

  return {
    playerCount,
    iWon,
    myPayout,
    // winnerCount/multiplier are not exposed by a dedicated read path yet —
    // see the ambiguity note in the final report. Left null rather than
    // guessed at.
    winnerCount: null,
    multiplier: null,
    payout: myPayout
  }
}

// ---------------------------------------------------------------------------
// Chips / history
// ---------------------------------------------------------------------------

/** The caller's current chip balance, from the `balances` cache. */
export async function balance() {
  await authReady
  const { data, error } = await supabase
    .from('balances')
    .select('balance')
    .maybeSingle()

  if (error) throw error
  return data ? Number(data.balance) : 0
}

/**
 * Last `limit` results for a game, newest first — for HistoryPanel
 * (docs/spec.md §7). Only rounds whose result is currently readable come
 * back, which RLS already guarantees is only rounds past `result_visible_at`.
 */
export async function history(gameId, limit = 8) {
  await authReady

  const { data: gameRow, error: gameError } = await supabase
    .from('games')
    .select('id')
    .eq('slug', gameId)
    .maybeSingle()
  if (gameError) throw gameError
  if (!gameRow) return []

  const { data, error } = await supabase
    .from('rounds')
    .select('id, round_index, result_visible_at, round_results(result_value, recorded_at)')
    .eq('game_id', gameRow.id)
    .order('round_index', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || [])
    .filter((row) => row.round_results && row.round_results.result_value != null)
    .map((row) => ({
      roundId: row.id,
      roundIndex: row.round_index,
      value: row.round_results.result_value,
      revealedAt: row.round_results.recorded_at
    }))
}
