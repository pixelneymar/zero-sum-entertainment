// symbols/globalScope.js
//
// The entire runtime data layer, reshaped from the former symbols/lib/*
// (supabase.js, clock.js, round.js, api.js, realtime.js, engine.js) into the
// one place frank actually ships: globalScope.
//
// Why this file exists in this shape — frank does NOT bundle the project. It
// serializes it to JSON (toJSON): every function below is stringified and
// revived in the browser inside ONE shared closure where every other
// globalScope key is in scope. Consequences, all load-bearing:
//
//   - NAMED exports only; the values must be stringifiable (functions) or
//     JSON-able (constants, plain objects).
//   - No module-scope `import` of npm packages — a static import becomes a
//     stub phantom in the serialized output. The ONLY supported way to reach
//     @supabase/supabase-js is `await import('@supabase/supabase-js')` inside
//     a function body (frank's rewriteDynamicImportsInString preserves it;
//     dependencies.js provides the importmap entry that resolves it at
//     runtime). See FRANKABILITY FA206/FA209.
//   - No module-scope `let`/side effects — mutable runtime state lives inside
//     the exported `engineData` object, whose properties are mutated at
//     runtime (initial value serializes as plain JSON).
//   - Functions here call each other by bare name — the revival closure
//     provides peers. Functions in other sections (functions/, components)
//     reference these names bare too; frank rewrites those to `__scope.X`
//     where `el.scope` resolves to `context.globalScope`.
//
// Division of authority is unchanged from the reviewed lib/ code
// (docs/integrity.md §1): the client renders, it never asserts. Every error
// is surfaced into state.error — never swallowed.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SUPABASE_URL = 'https://xgvuavikubqwsdhoadyw.supabase.co'

// Public anon key for project ref xgvuavikubqwsdhoadyw. The anon key is
// DESIGNED to be public — RLS on the server is the security boundary, not
// secrecy of this key. The `service_role` key must NEVER appear under
// symbols/.
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndnVhdmlrdWJxd3NkaG9hZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTQ0MTYsImV4cCI6MjEwMzMzMDQxNn0.GDOlD5NQF50uXUyKqQXXDbpJpJh6FKyLKjy1R8qatak'

export const TICK_MS = 250
export const STATS_POLL_MS = 1500
export const LOCKED_MS = 5000
export const PHASES = ['preview', 'betting', 'locked', 'reveal', 'results']

// ---------------------------------------------------------------------------
// Mutable runtime state (FA201 — lives in globalScope so writes survive)
// ---------------------------------------------------------------------------

export const engineData = {
  client: null,        // the Supabase client, once created
  clientPromise: null, // in-flight client creation
  authPromise: null,   // in-flight/settled auth bootstrap
  userId: null,        // signed-in anonymous user id
  clockOffset: 0,      // serverNow() = Date.now() + clockOffset
  clockPromise: null,  // in-flight/settled first clock measurement
  timer: null,         // setInterval id for the 250ms tick
  advancing: false,    // advanceRound() re-entrancy guard
  lastStatsPollAt: 0,  // last aggregate poll, in server-now ms
  channels: {},        // key -> live realtime channel
  rootState: null      // the root DOMQL state — the engine's one write target
}

// ---------------------------------------------------------------------------
// State access — the engine is the only writer of root state
// ---------------------------------------------------------------------------

export const updateState = (patch) => {
  const s = engineData.rootState
  if (s && typeof s.update === 'function') s.update(patch)
}

export const describeError = (err) => {
  if (!err) return 'Something went wrong. Please try again.'
  return err.message || String(err)
}

// ---------------------------------------------------------------------------
// Supabase client + anonymous auth (former lib/supabase.js)
// ---------------------------------------------------------------------------

export const getSupabase = async () => {
  if (engineData.client) return engineData.client
  if (!engineData.clientPromise) {
    engineData.clientPromise = (async () => {
      // Dynamic import is the ONLY frank-safe way to load an npm package at
      // runtime; it resolves through the importmap built from dependencies.js.
      const mod = await import('@supabase/supabase-js')
      const createClient =
        mod.createClient || (mod.default && mod.default.createClient)
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      })
      client.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) engineData.userId = session.user.id
      })
      engineData.client = client
      return client
    })()
  }
  return engineData.clientPromise
}

/** Signed-in user's id once auth has settled, else null. */
export const getUserId = () => engineData.userId

/**
 * Signs in anonymously (once) and ensures a `profiles` row exists via the
 * idempotent `ensure_profile` RPC. Every data call awaits this first; a
 * failure here (e.g. schema not applied yet) rejects for every caller and
 * surfaces into state.error — never silently.
 */
export const authReady = () => {
  if (!engineData.authPromise) {
    engineData.authPromise = (async () => {
      const supabase = await getSupabase()
      const { data: sessionData } = await supabase.auth.getSession()
      let session = sessionData ? sessionData.session : null

      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) throw error
        session = data ? data.session : null
      }

      engineData.userId = session && session.user ? session.user.id : null

      const { error: profileError } = await supabase.rpc('ensure_profile')
      if (profileError) throw profileError

      return engineData.userId
    })()

    // A failed bootstrap must not poison the session: clear the cache so the
    // next user action retries sign-in instead of replaying a stale error.
    engineData.authPromise.catch(() => {
      engineData.authPromise = null
    })
  }
  return engineData.authPromise
}

// ---------------------------------------------------------------------------
// Server clock (former lib/clock.js) — display honesty only, never gates a
// write; the server's RLS WITH CHECK is the real judge.
// ---------------------------------------------------------------------------

export const measureClock = async () => {
  const supabase = await getSupabase()
  const t0 = Date.now()
  const { data, error } = await supabase.rpc('server_now')
  const rtt = Date.now() - t0

  if (error) {
    // Display-only degradation: keep the previous offset. A stale offset only
    // makes the countdown slightly less honest, never unsafe.
    console.error('[clock] server_now failed, keeping previous offset', error)
    return engineData.clockOffset
  }

  engineData.clockOffset = new Date(data).getTime() - (t0 + rtt / 2)
  return engineData.clockOffset
}

export const serverNow = () => Date.now() + engineData.clockOffset

export const clockReady = () => {
  if (!engineData.clockPromise) engineData.clockPromise = measureClock()
  return engineData.clockPromise
}

export const remeasureClock = () => {
  engineData.clockPromise = measureClock()
  return engineData.clockPromise
}

// ---------------------------------------------------------------------------
// Phase derivation (former lib/round.js) — pure functions of now() vs the
// round schedule. Round state is never a stored column (docs/integrity.md §2).
// ---------------------------------------------------------------------------

export const phaseOf = (round, now) => {
  if (!round) return 'preview'

  const opens = new Date(round.bettingOpensAt).getTime()
  const closes = new Date(round.bettingClosesAt).getTime()
  const visible = new Date(round.resultVisibleAt).getTime()
  const ends = new Date(round.resultsEndAt).getTime()

  if (now < opens) return 'preview'
  if (now < closes) return 'betting'
  if (now < Math.min(closes + LOCKED_MS, visible)) return 'locked'
  if (now < visible) return 'reveal'
  if (now < ends) return 'results'
  return 'results'
}

export const phaseSecondsLeft = (round, now) => {
  if (!round) return 0

  const phase = phaseOf(round, now)
  let target
  if (phase === 'preview') target = round.bettingOpensAt
  else if (phase === 'betting') target = round.bettingClosesAt
  else if (phase === 'locked') target = round.resultVisibleAt
  else if (phase === 'reveal') target = round.resultsEndAt
  else return 0

  const ms = new Date(target).getTime() - now
  return ms > 0 ? Math.ceil(ms / 1000) : 0
}

// ---------------------------------------------------------------------------
// API — thin wrappers over PostgREST/RPC (former lib/api.js). No authority:
// the server accepts or rejects every write; nothing here computes a result,
// a winner, or a balance.
// ---------------------------------------------------------------------------

export const mapGame = (row) => {
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

export const mapRound = (row) => {
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

export const apiListGames = async () => {
  await authReady()
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('games')
    .select('slug, title, objective_line, guess_min, guess_max, guess_step, result_unit, is_active')
    .eq('is_active', true)
    .order('title', { ascending: true })
  if (error) throw error
  return (data || []).map(mapGame)
}

export const apiGetGame = async (slug) => {
  await authReady()
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('games')
    .select('slug, title, objective_line, guess_min, guess_max, guess_step, result_unit, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return mapGame(data)
}

export const apiCurrentRound = async (slug) => {
  await authReady()
  const supabase = await getSupabase()

  const { data: gameRow, error: gameError } = await supabase
    .from('games')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (gameError) throw gameError
  if (!gameRow) return null

  const nowIso = new Date(serverNow()).toISOString()
  const { data, error } = await supabase
    .from('rounds')
    .select('id, round_index, betting_opens_at, betting_closes_at, result_visible_at, results_end_at, video_bet_open_s, video_reveal_s, video_pause_s')
    .eq('game_id', gameRow.id)
    .gt('results_end_at', nowIso)
    .order('betting_opens_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return mapRound(data)
}

/**
 * Places a bet via the `place_bet` RPC — never a direct insert. A rejection
 * (late, duplicate, insufficient balance) is the server's lock doing its job;
 * callers surface error.message via state.error.
 */
export const apiPlaceBet = async (roundId, guess) => {
  await authReady()
  const supabase = await getSupabase()
  const { data, error } = await supabase.rpc('place_bet', {
    p_round_id: roundId,
    p_guess: guess
  })
  if (error) throw error
  return data
}

export const apiMyBet = async (roundId) => {
  await authReady()
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('bets')
    .select('guess, stake')
    .eq('round_id', roundId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { guess: data.guess, stake: data.stake }
}

/** Public aggregate: player count and pot. Never carries a single guess. */
export const apiRoundStats = async (roundId) => {
  await authReady()
  const supabase = await getSupabase()
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

/** Null before result_visible_at — RLS returns zero rows until then. */
export const apiRoundResult = async (roundId) => {
  await authReady()
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('round_results')
    .select('result_value, recorded_at')
    .eq('round_id', roundId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { value: data.result_value, recordedAt: data.recorded_at }
}

export const apiSettlement = async (roundId) => {
  await authReady()
  const supabase = await getSupabase()

  const { data: roundRow, error: roundError } = await supabase
    .from('rounds')
    .select('settled_at')
    .eq('id', roundId)
    .maybeSingle()
  if (roundError) throw roundError
  if (!roundRow || !roundRow.settled_at) return null

  const stats = await apiRoundStats(roundId)
  const { data: ledgerRow, error: ledgerError } = await supabase
    .from('chip_ledger')
    .select('amount')
    .eq('round_id', roundId)
    .eq('kind', 'payout')
    .maybeSingle()
  if (ledgerError) throw ledgerError

  const myPayout = ledgerRow ? Number(ledgerRow.amount) : 0
  return {
    playerCount: stats.playerCount,
    iWon: myPayout > 0,
    myPayout,
    winnerCount: null,
    multiplier: null,
    payout: myPayout
  }
}

/** Caller's current chip balance, from the ledger-backed `balances` cache. */
export const apiBalance = async () => {
  await authReady()
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('balances')
    .select('balance')
    .maybeSingle()
  if (error) throw error
  return data ? Number(data.balance) : 0
}

/** Last `limit` revealed results for a game, newest first. */
export const apiHistory = async (slug, limit) => {
  await authReady()
  const supabase = await getSupabase()

  const { data: gameRow, error: gameError } = await supabase
    .from('games')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (gameError) throw gameError
  if (!gameRow) return []

  const { data, error } = await supabase
    .from('rounds')
    .select('id, round_index, result_visible_at, round_results(result_value, recorded_at)')
    .eq('game_id', gameRow.id)
    .order('round_index', { ascending: false })
    .limit(limit || 8)
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

// ---------------------------------------------------------------------------
// Realtime (former lib/realtime.js) — a latency optimisation, never a source
// of truth. NEVER subscribe to `bets` without a user_id filter.
// ---------------------------------------------------------------------------

export const rtTeardown = (key) => {
  const channel = engineData.channels[key]
  if (channel && engineData.client) {
    engineData.client.removeChannel(channel)
  }
  delete engineData.channels[key]
}

export const unsubscribeAll = () => {
  const keys = Object.keys(engineData.channels)
  for (const key of keys) rtTeardown(key)
}

export const subscribeRoundAggregates = async (roundId, onChange) => {
  const supabase = await getSupabase()
  const key = `aggregates:${roundId}`
  rtTeardown(key)

  const channel = supabase
    .channel(`round-stats-${roundId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'round_stats', filter: `round_id=eq.${roundId}` },
      (payload) => {
        const row = payload.new || payload.old
        if (!row) return
        onChange({
          playerCount: Number(row.player_count) || 0,
          pot: Number(row.pot) || 0
        })
      }
    )
    .subscribe((status) => {
      // Re-measure the clock offset on (re)connect — cheap and idempotent.
      if (status === 'SUBSCRIBED') remeasureClock()
    })

  engineData.channels[key] = channel
}

export const subscribeOwnBet = async (roundId, userId, onBet) => {
  const supabase = await getSupabase()
  const key = `own-bet:${roundId}:${userId}`
  rtTeardown(key)

  const channel = supabase
    .channel(`own-bet-${roundId}-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bets', filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.new
        if (!row || row.round_id !== roundId) return
        onBet({ guess: row.guess, stake: row.stake })
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') remeasureClock()
    })

  engineData.channels[key] = channel
}

// ---------------------------------------------------------------------------
// Engine (former lib/engine.js) — the only writer of root state at runtime.
// Derives DISPLAY phase from server timestamps and copies across whatever the
// server already decided. The client renders; it never asserts.
// ---------------------------------------------------------------------------

/**
 * App bootstrap. Called once from pages/main.js onRender via
 * el.call('startEngine'). Captures the root state as the engine's single
 * write target, kicks off auth + clock + balance, and starts the 250ms tick.
 */
export const engineStart = (el) => {
  if (engineData.timer) return
  engineData.rootState =
    el && typeof el.getRootState === 'function' ? el.getRootState() : el ? el.state : null

  engineBootstrap()
  engineData.timer = setInterval(() => {
    engineTick()
  }, TICK_MS)
}

export const engineStop = () => {
  if (engineData.timer) {
    clearInterval(engineData.timer)
    engineData.timer = null
  }
  unsubscribeAll()
}

export const engineBootstrap = async () => {
  try {
    await authReady()
    await clockReady()
    const balance = await apiBalance()
    updateState({ balance })
  } catch (err) {
    updateState({ error: describeError(err) })
  }
}

/** GamePicker calls this (via el.call('selectGame', slug)). */
export const engineSelectGame = async (slug) => {
  updateState({ error: null })
  try {
    await authReady()

    const game = await apiGetGame(slug)
    if (!game) {
      updateState({ error: `Game "${slug}" was not found.` })
      return
    }

    updateState({ game, screen: 'playing' })
    updateState({ history: await apiHistory(slug, 8) })

    const round = await apiCurrentRound(slug)
    if (!round) {
      updateState({
        round: null,
        error: 'No upcoming round for this game right now. Try again shortly.'
      })
      return
    }

    await engineLoadRound(round)
  } catch (err) {
    updateState({ error: describeError(err) })
  }
}

/** Returns to the GamePicker and tears down the current round. */
export const engineBackToPicker = () => {
  unsubscribeAll()
  updateState({
    screen: 'picker',
    game: null,
    round: null,
    phase: 'preview',
    secondsLeft: 0,
    playerCount: 0,
    pot: 0,
    frozen: null,
    myGuess: null,
    myBet: null,
    result: null,
    settlement: null,
    error: null
  })
}

/**
 * BetPanel's PLACE BET calls this (via el.call('submitBet', guess)). A
 * rejection is the database's lock doing its job — surfaced via state.error,
 * with myBet/myGuess left untouched so the UI shows the bet did NOT go
 * through.
 */
export const engineSubmitBet = async (guess) => {
  const s = engineData.rootState
  if (!s || !s.round) {
    updateState({ error: 'There is no active round to bet on.' })
    return
  }

  updateState({ error: null })
  try {
    const roundId = s.round.id
    await apiPlaceBet(roundId, guess)

    // Re-read from the server rather than assuming the stake — the client
    // never invents a number the server owns.
    const confirmed = await apiMyBet(roundId)
    if (confirmed) {
      updateState({ myBet: confirmed, myGuess: confirmed.guess })
    }

    updateState({ balance: await apiBalance() })
  } catch (err) {
    updateState({ error: describeError(err) })
  }
}

export const engineLoadRound = async (round) => {
  unsubscribeAll()
  engineData.lastStatsPollAt = 0

  const now = serverNow()
  const phase = phaseOf(round, now)
  updateState({
    round,
    myGuess: null,
    myBet: null,
    result: null,
    settlement: null,
    frozen: null,
    phase,
    secondsLeft: phaseSecondsLeft(round, now)
  })

  const s = engineData.rootState
  const isCurrent = () => !!(s && s.round && s.round.id === round.id)

  try {
    const stats = await apiRoundStats(round.id)
    const existingBet = await apiMyBet(round.id)
    if (!isCurrent()) return // superseded meanwhile

    const patch = { playerCount: stats.playerCount, pot: stats.pot }
    if (existingBet) {
      patch.myBet = existingBet
      patch.myGuess = existingBet.guess
    }
    // Rejoining mid-round (refresh after lock): the freeze can't be caught
    // live, so seed it from the current — now immutable — stats.
    if (phase !== 'preview' && phase !== 'betting') {
      patch.frozen = { playerCount: stats.playerCount, pot: stats.pot }
    }
    updateState(patch)

    if (phase === 'reveal' || phase === 'results') {
      const result = await apiRoundResult(round.id)
      if (result && isCurrent()) {
        updateState({
          result: { value: result.value, unit: s.game ? s.game.resultUnit : '' }
        })
      }
    }

    if (phase === 'results') {
      const info = await apiSettlement(round.id)
      if (info && isCurrent()) updateState({ settlement: info })
    }
  } catch (err) {
    updateState({ error: describeError(err) })
  }

  await subscribeRoundAggregates(round.id, (agg) => {
    if (!isCurrent()) return
    if (s.phase !== 'preview' && s.phase !== 'betting') return // frozen
    updateState({ playerCount: agg.playerCount, pot: agg.pot })
  })

  const userId = getUserId()
  if (userId) {
    await subscribeOwnBet(round.id, userId, (bet) => {
      if (!isCurrent()) return
      updateState({ myBet: { guess: bet.guess, stake: bet.stake }, myGuess: bet.guess })
    })
  }
}

export const engineAdvanceRound = async () => {
  const s = engineData.rootState
  if (engineData.advancing || !s || !s.game) return
  engineData.advancing = true
  try {
    const nextRound = await apiCurrentRound(s.game.slug)
    if (nextRound && (!s.round || nextRound.id !== s.round.id)) {
      await engineLoadRound(nextRound)
      updateState({ history: await apiHistory(s.game.slug, 8) })
    }
    // No next round yet: pg_cron's sweep hasn't run — retry next tick.
  } catch (err) {
    updateState({ error: describeError(err) })
  } finally {
    engineData.advancing = false
  }
}

/** The 250ms tick — derives display phase/countdown from server time. */
export const engineTick = () => {
  const s = engineData.rootState
  if (!s || !s.round) return

  const now = serverNow()
  const prevPhase = s.phase
  const nextPhase = phaseOf(s.round, now)
  const nextSeconds = phaseSecondsLeft(s.round, now)

  const patch = {}
  if (nextSeconds !== s.secondsLeft) patch.secondsLeft = nextSeconds
  if (nextPhase !== prevPhase) {
    patch.phase = nextPhase
    if (nextPhase === 'locked') {
      // THE freeze. Exact, synchronous, from whatever is on screen at this
      // instant — nothing can slip between "phase becomes locked" and
      // "counters stop moving" (docs/spec.md §3).
      patch.frozen = { playerCount: s.playerCount, pot: s.pot }
    }
  }
  if (Object.keys(patch).length > 0) updateState(patch)

  if (nextPhase !== prevPhase) {
    engineReconcile(nextPhase)
  } else if (
    (nextPhase === 'preview' || nextPhase === 'betting') &&
    now - engineData.lastStatsPollAt >= STATS_POLL_MS
  ) {
    // Realtime is a latency optimisation — poll the safe aggregate too, so
    // the crowd counter keeps ticking even if realtime drops a message.
    engineData.lastStatsPollAt = now
    enginePollStats()
  }

  if (nextPhase === 'results' && now >= new Date(s.round.resultsEndAt).getTime()) {
    engineAdvanceRound()
  }
}

/** Reconcile with a fetch at every phase change. */
export const engineReconcile = async (phase) => {
  const s = engineData.rootState
  const round = s ? s.round : null
  if (!round) return
  const isCurrent = () => !!(s.round && s.round.id === round.id)

  try {
    if (phase === 'preview' || phase === 'betting') {
      const stats = await apiRoundStats(round.id)
      if (isCurrent()) updateState({ playerCount: stats.playerCount, pot: stats.pot })
    } else if (phase === 'locked') {
      // Re-confirms the freeze against the server — after the lock nothing
      // can change those numbers again, so this can only correct drift.
      const stats = await apiRoundStats(round.id)
      if (isCurrent()) {
        updateState({
          frozen: { playerCount: stats.playerCount, pot: stats.pot },
          playerCount: stats.playerCount,
          pot: stats.pot
        })
      }
    } else if (phase === 'reveal') {
      const result = await apiRoundResult(round.id)
      if (result && isCurrent()) {
        updateState({
          result: { value: result.value, unit: s.game ? s.game.resultUnit : '' }
        })
      }
    } else if (phase === 'results') {
      const info = await apiSettlement(round.id)
      const freshBalance = await apiBalance()
      if (isCurrent()) {
        const patch = { balance: freshBalance }
        if (info) patch.settlement = info
        updateState(patch)
      }
    }
  } catch (err) {
    updateState({ error: describeError(err) })
  }
}

export const enginePollStats = async () => {
  const s = engineData.rootState
  const round = s ? s.round : null
  if (!round) return
  try {
    const stats = await apiRoundStats(round.id)
    if (
      s.round && s.round.id === round.id &&
      (s.phase === 'preview' || s.phase === 'betting')
    ) {
      updateState({ playerCount: stats.playerCount, pot: stats.pot })
    }
  } catch (err) {
    // Non-fatal — a missed poll leaves the counter a beat stale; the next
    // poll or a realtime message catches it up.
  }
}
