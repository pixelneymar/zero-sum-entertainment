// symbols/globalScope.js
//
// The entire runtime data layer in the one place frank actually ships:
// globalScope. frank does NOT bundle the project — it serializes it (toJSON):
// every function below is stringified and revived in the browser inside ONE
// shared closure where every other globalScope key is in scope. Consequences,
// all load-bearing:
//
//   - NAMED exports only; values must be stringifiable (functions) or
//     JSON-able (constants, plain objects).
//   - No module-scope `import` of npm packages. The ONLY supported way to
//     reach @supabase/supabase-js is `await import('@supabase/supabase-js')`
//     inside a function body (dependencies.js supplies the importmap entry).
//   - No module-scope `let`/side effects — mutable runtime state lives inside
//     the exported `engineData` object (initial value serializes as JSON).
//   - Functions call each other by bare name; frank rewrites references from
//     functions/ and components to `__scope.X`.
//
// THE VIDEO IS THE GAME. Rounds are driven by the video timeline
// (docs/rounds.md). Betting overlays the video. The outcome on screen is what
// pays. Per round:
//
//   intro    video PLAYS from previous pause_at (or 0) to bet_open_at
//   preview  5 s   video PAUSED at bet_open_at
//   betting  25 s  video PAUSED at bet_open_at   crowd arrives, user bets once
//   locked   5 s   video PLAYS from bet_open_at  playerCount/pot FROZEN
//   reveal         video PLAYS until reveal_at   result not known yet
//   results  8 s   video PAUSED at pause_at      result, settlement, credit
//   ... next round's intro; after the last round -> 'ended'
//
// Two backends, one engine. `demo` simulates the crowd and settles locally
// with EXACTLY the formula in docs/game-rules.md §3–§4. `server` uses
// Supabase for rounds/bets/results and never computes a winner or a balance.
// The product's one claim — nothing changes after LOCKED — is enforced
// structurally in demo mode: the arrival plan is emptied and the book closed
// in the same synchronous step that takes the frozen snapshot.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SUPABASE_URL = 'https://xgvuavikubqwsdhoadyw.supabase.co'

// Public anon key for project ref xgvuavikubqwsdhoadyw. The anon key is
// DESIGNED to be public — RLS on the server is the security boundary. The
// `service_role` key must NEVER appear under symbols/.
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndnVhdmlrdWJxd3NkaG9hZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTQ0MTYsImV4cCI6MjEwMzMzMDQxNn0.GDOlD5NQF50uXUyKqQXXDbpJpJh6FKyLKjy1R8qatak'

// Payout constants — docs/game-rules.md §2. tests/payout.test.mjs is the
// reference implementation; demoSettle() below must match it exactly.
export const STAKE = 20
export const RAKE = 0.05
export const WINNER_FRACTION = 0.10
export const START_BALANCE = 200

// Timeline — docs/spec.md §3 / docs/rounds.md.
export const TICK_MS = 250
export const PREVIEW_MS = 5000
export const BETTING_MS = 25000
export const LOCKED_MS = 5000
export const RESULTS_MS = 8000
export const STATS_POLL_MS = 1500
export const BOOT_TIMEOUT_MS = 6000
export const ERROR_FLASH_MS = 4000
// If the <video> stops advancing for this long during a video-driven phase,
// the engine re-derives: it seeks to the target mark and moves on.
export const VIDEO_STALL_GRACE_MS = 4000

export const PHASES = ['intro', 'preview', 'betting', 'locked', 'reveal', 'results', 'ended']

// Video hosting. Primary is Supabase Storage (public bucket `videos`, honours
// Range requests so seeking works). One line to change.
export const VIDEO_BASE = 'https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos'
// Local fallback, tried once if the <video> element errors on the Storage URL.
export const VIDEO_FALLBACK_BASE = '/assets/videos'

// Demo game catalogue — mirrors the `games` rows (docs/rounds.md ranges).
export const DEMO_GAMES = {
  banana_cut: {
    slug: 'banana_cut',
    title: 'Banana Cut',
    objectiveLine: 'One cut, exactly in half. Bet on how many grams off the cut lands.',
    guessMin: -20,
    guessMax: 20,
    guessStep: 1,
    resultUnit: 'g',
    videoFile: 'banana'
  },
  water_200g: {
    slug: 'water_200g',
    title: 'Water Pour',
    objectiveLine: 'One pour, exactly 200 g. Bet on how many grams off the pour lands.',
    guessMin: -50,
    guessMax: 50,
    guessStep: 1,
    resultUnit: 'g',
    videoFile: 'water'
  }
}

// Round scripts — ground truth from the footage (docs/rounds.md). Times are
// video seconds. `result` was read off the scale display in the actual frame.
export const ROUND_SCRIPTS = {
  banana_cut: [
    { id: 'banana_01', betOpenAt: 20, revealAt: 36, pauseAt: 37, readings: ['82 g', '95 g'], result: -13 },
    { id: 'banana_02', betOpenAt: 38, revealAt: 54, pauseAt: 55, readings: ['79 g', '94 g'], result: -15 }
  ],
  water_200g: [
    { id: 'water_01', betOpenAt: 17, revealAt: 30, pauseAt: 31, readings: ['161 g'], result: -39 },
    { id: 'water_02', betOpenAt: 32, revealAt: 48, pauseAt: 49, readings: ['174 g'], result: -26 }
  ]
}

// Fake crowd usernames — short, varied, no real brands.
export const BOT_NAME_STEMS = [
  'kip', 'juno', 'tam', 'rook', 'pip', 'ziv', 'nox', 'bex', 'sol', 'ivy',
  'ash', 'remy', 'odie', 'fenn', 'wren', 'mika', 'zed', 'lulu', 'ozzy', 'bram',
  'dax', 'eli', 'fig', 'gus', 'hux', 'iggy', 'jax', 'kai', 'lark', 'moss',
  'nell', 'otto', 'pax', 'quin', 'rue', 'sky', 'tao', 'uma', 'vic', 'wes',
  'yui', 'zola', 'bo', 'cleo', 'dov', 'esme', 'flo', 'gil', 'hedy', 'ike',
  'jem', 'kit', 'lou', 'mo', 'nia', 'oz', 'pim', 'rio', 'sid', 'tess'
]
export const BOT_NAME_TAILS = ['', '', '', '_x', '99', '7', '_gg', '22', 'zz', '_fx', '01', '_k', '88', '3', '_v']

// ---------------------------------------------------------------------------
// Mutable runtime state — lives in globalScope so writes survive
// ---------------------------------------------------------------------------

export const engineData = {
  // shared
  rootState: null,      // the root DOMQL state — the engine's one write target
  mode: null,           // 'demo' | 'server' once bootstrap has decided
  bootPromise: null,    // in-flight/settled bootstrap
  timer: null,          // setInterval id for the 250ms tick
  errorTimer: null,     // setTimeout id for a flashed state.error
  history: [],          // [{ gameSlug, roundIndex, value, unit }] newest first
  sessionSeq: 0,        // bumps per selectGame so demo round ids stay unique

  // video
  videoNode: null,      // the <video> element handed over by registerVideo
  videoSrcWanted: null, // what node.src should be right now
  videoFallbackTried: false,
  pendingSeek: null,    // seconds to apply once metadata is loaded
  lastPlayAttemptAt: 0,
  playBlocked: null,    // last play() rejection message, if any
  pauseTimer: null,     // precise pause at pause_at during results

  // demo backend
  demo: {
    balance: 200,
    scripts: [],
    roundIdx: -1,
    script: null,
    phaseEndsAt: 0,     // wall-clock ms — timed phases (preview/betting/locked/results)
    phaseStartedAt: 0,
    startCt: 0,         // video currentTime when the current video-driven phase began
    lastCt: -1,
    lastProgressAt: 0,
    bettingOpenedAt: 0,
    plan: [],           // pending arrivals [{ name, guess, at }] sorted by `at`
    book: null,         // { open, bets: [{ name, guess }] } — closed at LOCK
    userBet: null       // { guess, stake }
  },

  // server backend
  client: null,
  clientPromise: null,
  authPromise: null,
  userId: null,
  clockOffset: 0,
  clockPromise: null,
  advancing: false,
  lastStatsPollAt: 0,
  channels: {}
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

/** Shows an error, then clears it after ERROR_FLASH_MS unless replaced. */
export const flashError = (message) => {
  updateState({ error: message })
  if (engineData.errorTimer) clearTimeout(engineData.errorTimer)
  engineData.errorTimer = setTimeout(() => {
    const s = engineData.rootState
    if (s && s.error === message) updateState({ error: null })
  }, ERROR_FLASH_MS)
}

export const withTimeout = (promise, ms, label) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label || 'operation'} timed out after ${ms} ms`)), ms)
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) }
    )
  })

export const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1))

export const clampGuess = (game, n) => {
  if (!game) return n
  const step = game.guessStep || 1
  let v = Math.round(Number(n) / step) * step
  if (v < game.guessMin) v = game.guessMin
  if (v > game.guessMax) v = game.guessMax
  return v
}

export const videoSrcFor = (file, fallback) =>
  `${fallback ? VIDEO_FALLBACK_BASE : VIDEO_BASE}/${file}.mp4`

// ---------------------------------------------------------------------------
// Video control — the engine owns playback; the UI owns the element
// ---------------------------------------------------------------------------

/** VideoSurface's onRender calls el.call('registerVideo'); `el` is that element. */
export const engineRegisterVideo = (el) => {
  const node = el && el.node
  if (!node || typeof node.play !== 'function') {
    flashError('registerVideo: the calling element is not a <video>.')
    return
  }
  if (engineData.videoNode === node) return
  engineData.videoNode = node
  node.muted = true
  node.defaultMuted = true
  node.playsInline = true
  node.setAttribute('playsinline', '')
  node.setAttribute('muted', '')
  if (!node.getAttribute('preload')) node.preload = 'auto'

  node.addEventListener('loadedmetadata', () => {
    if (engineData.pendingSeek != null) {
      const t = engineData.pendingSeek
      engineData.pendingSeek = null
      videoSeek(t)
    }
  })
  node.addEventListener('error', () => {
    videoOnError()
  })

  videoEnsureSrc()
}

export const videoEnsureSrc = () => {
  const node = engineData.videoNode
  const wanted = engineData.videoSrcWanted
  if (!node || !wanted) return
  if ((node.getAttribute('src') || '') !== wanted) {
    node.setAttribute('src', wanted)
    node.load()
  }
}

/** Storage URL failed: swap to the local copy once, say so, keep going. */
export const videoOnError = () => {
  const node = engineData.videoNode
  const s = engineData.rootState
  const src = node ? (node.currentSrc || node.getAttribute('src') || '') : ''
  if (!s || !s.game || !src || src.indexOf(VIDEO_BASE) !== 0) return
  if (engineData.videoFallbackTried) {
    flashError('Video failed to load from both the stream and the local copy.')
    return
  }
  engineData.videoFallbackTried = true
  const file = s.game.slug === 'water_200g' ? 'water' : 'banana'
  const local = videoSrcFor(file, true)
  const resumeAt = node.currentTime || 0
  engineData.videoSrcWanted = local
  engineData.pendingSeek = resumeAt
  updateState({ game: Object.assign({}, s.game, { videoSrc: local }) })
  videoEnsureSrc()
  flashError('Video stream unavailable — switched to the local copy.')
}

export const videoPlay = () => {
  const node = engineData.videoNode
  if (!node) return
  if (!node.paused && !node.ended) return
  const now = Date.now()
  if (now - engineData.lastPlayAttemptAt < 500) return
  engineData.lastPlayAttemptAt = now
  const p = node.play()
  if (p && typeof p.catch === 'function') {
    p.then(() => { engineData.playBlocked = null }).catch((err) => {
      engineData.playBlocked = describeError(err)
    })
  }
}

export const videoPause = () => {
  const node = engineData.videoNode
  if (node && !node.paused) node.pause()
}

export const videoSeek = (t) => {
  const node = engineData.videoNode
  if (!node) return
  if (node.readyState >= 1) {
    if (Math.abs(node.currentTime - t) > 0.05) node.currentTime = t
    engineData.pendingSeek = null
  } else {
    engineData.pendingSeek = t
  }
}

/** Paused at exactly `t` — the frame the phase is staged on. */
export const videoHoldAt = (t) => {
  if (engineData.pauseTimer) {
    clearTimeout(engineData.pauseTimer)
    engineData.pauseTimer = null
  }
  videoPause()
  videoSeek(t)
}

export const videoCurrentTime = () => {
  const node = engineData.videoNode
  return node ? node.currentTime || 0 : 0
}

/** Mirror the element into state.video (only when something changed). */
export const mirrorVideo = () => {
  const s = engineData.rootState
  const node = engineData.videoNode
  if (!s || !node) return
  const next = {
    currentTime: Math.round((node.currentTime || 0) * 100) / 100,
    duration: Math.round((isFinite(node.duration) ? node.duration : 0) * 100) / 100,
    playing: !node.paused && !node.ended
  }
  const cur = s.video || {}
  if (
    cur.currentTime !== next.currentTime ||
    cur.duration !== next.duration ||
    cur.playing !== next.playing
  ) {
    updateState({ video: next })
  }
}

/**
 * Has playback reached `target` (video seconds) for the current video-driven
 * phase? Also the drift corrector: with no element, wall-clock stands in; if
 * the element stops advancing for VIDEO_STALL_GRACE_MS, seek and move on.
 */
export const videoReached = (target, now) => {
  const d = engineData.demo
  const node = engineData.videoNode
  if (!node) {
    return now >= d.phaseStartedAt + Math.max(0, target - d.startCt) * 1000
  }
  const ct = node.currentTime || 0
  if (ct >= target - 0.05) return true
  // Still buffering (readyState < 3) gets a longer leash than a true stall.
  const grace = node.readyState >= 3 ? VIDEO_STALL_GRACE_MS : VIDEO_STALL_GRACE_MS * 4
  if (ct !== d.lastCt) {
    d.lastCt = ct
    d.lastProgressAt = now
  } else if (now - d.lastProgressAt > grace) {
    // Stalled (buffering, blocked autoplay, throttled tab) — re-derive.
    videoSeek(target)
    d.lastCt = target
    d.lastProgressAt = now
    return true
  }
  return false
}

/** nominalCt is where the footage nominally is; used when no element exists. */
export const beginVideoPhase = (now, nominalCt) => {
  const d = engineData.demo
  d.phaseStartedAt = now
  d.startCt = engineData.videoNode ? videoCurrentTime() : nominalCt || 0
  d.lastCt = -1
  d.lastProgressAt = now
}

// ---------------------------------------------------------------------------
// Bootstrap — decide the backend once, fall back to demo cleanly
// ---------------------------------------------------------------------------

/**
 * App bootstrap. Called once from the root page's onRender via
 * el.call('startEngine'). Captures the root state as the engine's single
 * write target, probes the server, and starts the 250ms tick.
 */
export const engineStart = (el) => {
  if (engineData.timer) return
  engineData.rootState =
    el && typeof el.getRootState === 'function' ? el.getRootState() : el ? el.state : null
  if (typeof globalThis !== 'undefined') globalThis.__zse = engineData

  engineBoot()
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

export const serverProbe = async () => {
  await authReady()
  await clockReady()
  const games = await apiListGames()
  if (!games.length) throw new Error('the games table returned no rows')
  const balance = await apiBalance()
  return { games, balance }
}

export const engineBoot = () => {
  if (engineData.bootPromise) return engineData.bootPromise
  engineData.bootPromise = (async () => {
    try {
      const probe = await withTimeout(serverProbe(), BOOT_TIMEOUT_MS, 'server bootstrap')
      engineData.mode = 'server'
      updateState({ mode: 'server', balance: probe.balance })
    } catch (err) {
      engineData.mode = 'demo'
      updateState({ mode: 'demo', balance: engineData.demo.balance })
      flashError(`Server unavailable (${describeError(err)}). Running in demo mode.`)
    }
    return engineData.mode
  })()
  return engineData.bootPromise
}

// ---------------------------------------------------------------------------
// Public engine entry points (wrapped by functions/index.js)
// ---------------------------------------------------------------------------

export const engineSelectGame = async (slug) => {
  updateState({ error: null })
  const mode = await engineBoot()
  if (mode === 'server') {
    try {
      await serverSelectGame(slug)
      return
    } catch (err) {
      engineData.mode = 'demo'
      updateState({ mode: 'demo', balance: engineData.demo.balance })
      flashError(`Server round unavailable (${describeError(err)}). Running in demo mode.`)
    }
  }
  demoSelectGame(slug)
}

export const engineBackToPicker = () => {
  unsubscribeAll()
  if (engineData.pauseTimer) {
    clearTimeout(engineData.pauseTimer)
    engineData.pauseTimer = null
  }
  videoPause()
  const d = engineData.demo
  d.scripts = []
  d.roundIdx = -1
  d.script = null
  d.plan = []
  d.book = null
  d.userBet = null
  engineData.videoSrcWanted = null
  updateState({
    screen: 'picker',
    game: null,
    round: null,
    phase: 'intro',
    secondsLeft: 0,
    playerCount: 0,
    pot: 0,
    frozen: null,
    arrivals: [],
    myGuess: null,
    myBet: null,
    result: null,
    settlement: null,
    error: null
  })
}

export const engineSetGuess = (n) => {
  const s = engineData.rootState
  if (!s || !s.game) return
  const v = Number(n)
  if (!isFinite(v)) return
  updateState({ myGuess: clampGuess(s.game, v) })
}

/**
 * One bet per user per round, only while 'betting'. In demo mode the local
 * book is the judge; in server mode `place_bet` is, and its rejection is
 * surfaced verbatim. Either way a refusal is VISIBLE in state.error.
 */
export const engineSubmitBet = async (guessIn) => {
  const s = engineData.rootState
  if (!s || !s.round || !s.game) {
    flashError('There is no active round to bet on.')
    return
  }
  const guess = Number(guessIn != null ? guessIn : s.myGuess)
  if (!isFinite(guess)) {
    flashError('Pick a guess first.')
    return
  }
  if (s.phase !== 'betting') {
    flashError(s.phase === 'preview' ? 'Bets are not open yet.' : 'Betting is closed for this round.')
    return
  }
  if (s.myBet) {
    flashError('You already placed a bet this round.')
    return
  }
  if (guess < s.game.guessMin || guess > s.game.guessMax) {
    flashError(`Guess must be between ${s.game.guessMin} and ${s.game.guessMax}.`)
    return
  }
  if (engineData.mode === 'server') {
    await serverSubmitBet(guess)
    return
  }
  demoSubmitBet(guess)
}

// ---------------------------------------------------------------------------
// The 250ms tick
// ---------------------------------------------------------------------------

export const engineTick = () => {
  const s = engineData.rootState
  if (!s) return
  videoEnsureSrc()
  if (s.screen === 'playing' && s.round) {
    if (engineData.mode === 'server') serverTick(Date.now())
    else demoTick(Date.now())
  }
  mirrorVideo()
}

export const secondsLeftUntil = (endsAt, now) => {
  const ms = endsAt - now
  return ms > 0 ? Math.ceil(ms / 1000) : 0
}

// ---------------------------------------------------------------------------
// DEMO backend — scripted rounds, simulated crowd, local settlement
// ---------------------------------------------------------------------------

export const demoSelectGame = (slug) => {
  const g = DEMO_GAMES[slug]
  const scripts = ROUND_SCRIPTS[slug]
  if (!g || !scripts || !scripts.length) {
    flashError(`Game "${slug}" was not found.`)
    return
  }
  engineData.sessionSeq += 1
  engineData.videoFallbackTried = false
  const game = {
    slug: g.slug,
    title: g.title,
    objectiveLine: g.objectiveLine,
    guessMin: g.guessMin,
    guessMax: g.guessMax,
    guessStep: g.guessStep,
    resultUnit: g.resultUnit,
    videoSrc: videoSrcFor(g.videoFile, false)
  }
  engineData.videoSrcWanted = game.videoSrc
  const d = engineData.demo
  d.scripts = scripts
  d.roundIdx = -1
  updateState({
    mode: 'demo',
    game,
    screen: 'playing',
    balance: d.balance,
    history: engineData.history.slice(),
    error: null
  })
  videoEnsureSrc()
  // A fresh game starts its cold open from the top of the footage.
  videoHoldAt(0)
  demoLoadRound(0, Date.now())
}

export const demoLoadRound = (i, now) => {
  const s = engineData.rootState
  const d = engineData.demo
  const script = d.scripts[i]
  if (!s || !s.game || !script) return
  d.roundIdx = i
  d.script = script
  d.plan = []
  d.book = null
  d.userBet = null
  d.phaseEndsAt = 0
  const round = {
    id: `demo:${s.game.slug}:${script.id}:${engineData.sessionSeq}`,
    index: i + 1,
    count: d.scripts.length,
    betOpenAt: script.betOpenAt,
    revealAt: script.revealAt,
    pauseAt: script.pauseAt
  }
  updateState({
    round,
    phase: 'intro',
    secondsLeft: 0,
    playerCount: 0,
    pot: 0,
    frozen: null,
    arrivals: [],
    myGuess: null,
    myBet: null,
    result: null,
    settlement: null
  })
  // Cold open: play from wherever the footage is (previous pause_at, or 0).
  const prev = i > 0 ? d.scripts[i - 1].pauseAt : 0
  beginVideoPhase(now, prev)
  videoPlay()
}

export const demoEnterTimed = (phase, ms, now, extra) => {
  const d = engineData.demo
  d.phaseEndsAt = now + ms
  d.phaseStartedAt = now
  const patch = Object.assign({ phase, secondsLeft: Math.ceil(ms / 1000) }, extra || {})
  updateState(patch)
}

export const demoTick = (now) => {
  const s = engineData.rootState
  const d = engineData.demo
  const script = d.script
  if (!s || !script) return
  const phase = s.phase
  const patch = {}

  if (phase === 'intro') {
    videoPlay()
    if (videoReached(script.betOpenAt, now)) {
      videoHoldAt(script.betOpenAt)
      demoEnterTimed('preview', PREVIEW_MS, now)
    }
    return
  }

  if (phase === 'preview') {
    videoHoldAt(script.betOpenAt)
    if (now >= d.phaseEndsAt) {
      demoOpenBetting(now)
      return
    }
    patch.secondsLeft = secondsLeftUntil(d.phaseEndsAt, now)
  } else if (phase === 'betting') {
    videoHoldAt(script.betOpenAt)
    demoReleaseArrivals(now)
    if (now >= d.phaseEndsAt) {
      demoLock(now)
      return
    }
    patch.secondsLeft = secondsLeftUntil(d.phaseEndsAt, now)
  } else if (phase === 'locked') {
    videoPlay()
    if (videoReached(script.revealAt, now)) {
      demoReveal(now)
      return
    }
    if (now >= d.phaseEndsAt) {
      updateState({ phase: 'reveal', secondsLeft: 0 })
      return
    }
    patch.secondsLeft = secondsLeftUntil(d.phaseEndsAt, now)
  } else if (phase === 'reveal') {
    videoPlay()
    if (videoReached(script.revealAt, now)) {
      demoReveal(now)
      return
    }
  } else if (phase === 'results') {
    const node = engineData.videoNode
    if (node && !node.paused && (node.currentTime || 0) >= script.pauseAt - 0.05) {
      videoHoldAt(script.pauseAt)
    }
    if (now >= d.phaseEndsAt) {
      demoNextRound(now)
      return
    }
    patch.secondsLeft = secondsLeftUntil(d.phaseEndsAt, now)
  } else {
    return // 'ended'
  }

  if (patch.secondsLeft !== undefined && patch.secondsLeft === s.secondsLeft) delete patch.secondsLeft
  if (Object.keys(patch).length) updateState(patch)
}

export const demoOpenBetting = (now) => {
  const s = engineData.rootState
  const d = engineData.demo
  d.bettingOpenedAt = now
  d.plan = demoPlanCrowd(s.game)
  d.book = { open: true, bets: [] }
  demoEnterTimed('betting', BETTING_MS, now)
}

/**
 * Admit every planned arrival whose offset has elapsed. Structural guard:
 * runs only while the book is open AND the phase is 'betting', and the clock
 * it reads is capped at BETTING_MS, so a throttled tab can never admit an
 * arrival stamped after the window.
 */
export const demoReleaseArrivals = (now) => {
  const s = engineData.rootState
  const d = engineData.demo
  if (!s || !d.book || !d.book.open || s.phase !== 'betting') return
  const elapsed = Math.min(now - d.bettingOpenedAt, BETTING_MS)
  let admitted = 0
  while (d.plan.length && d.plan[0].at <= elapsed) {
    d.book.bets.push(d.plan.shift())
    admitted += 1
  }
  if (!admitted) return
  const bets = d.book.bets
  const playerCount = bets.length + (d.userBet ? 1 : 0)
  updateState({
    arrivals: bets.slice(-6).map((b) => ({ name: b.name })),
    playerCount,
    pot: playerCount * STAKE
  })
}

/** THE freeze. Synchronous: admit, close the book, snapshot, discard the rest. */
export const demoLock = (now) => {
  const s = engineData.rootState
  const d = engineData.demo
  demoReleaseArrivals(now)
  if (d.book) d.book.open = false
  d.plan = [] // nothing is left that could arrive, whatever the clock does
  const frozen = { playerCount: s.playerCount, pot: s.pot }
  demoEnterTimed('locked', LOCKED_MS, now, { frozen })
  beginVideoPhase(now, d.script.betOpenAt)
  const ct = videoCurrentTime()
  if (Math.abs(ct - d.script.betOpenAt) > 0.5) videoSeek(d.script.betOpenAt)
  videoPlay()
}

export const demoSubmitBet = (guess) => {
  const s = engineData.rootState
  const d = engineData.demo
  if (!d.book || !d.book.open || s.phase !== 'betting') {
    flashError('Betting is closed for this round.')
    return
  }
  if (d.userBet) {
    flashError('You already placed a bet this round.')
    return
  }
  if (d.balance < STAKE) {
    flashError(`Not enough chips — a bet costs ${STAKE}.`)
    return
  }
  d.balance -= STAKE
  d.userBet = { guess, stake: STAKE }
  const playerCount = d.book.bets.length + 1
  updateState({
    myBet: { guess, stake: STAKE },
    myGuess: guess,
    balance: d.balance,
    playerCount,
    pot: playerCount * STAKE,
    error: null
  })
}

/** The footage reached reveal_at: the result is now known. Settle, credit. */
export const demoReveal = (now) => {
  const s = engineData.rootState
  const d = engineData.demo
  const script = d.script
  const result = { value: script.result, unit: s.game.resultUnit, readings: script.readings.slice() }
  const settlement = demoSettle(d.book ? d.book.bets : [], d.userBet, script.result)
  if (settlement.conserved === false) {
    flashError('Settlement failed conservation — chips would be created or destroyed.')
  }
  d.balance += settlement.myPayout
  engineData.history.unshift({
    gameSlug: s.game.slug,
    roundIndex: s.round.index,
    value: result.value,
    unit: result.unit
  })
  engineData.history = engineData.history.slice(0, 8)
  demoEnterTimed('results', RESULTS_MS, now, {
    result,
    settlement,
    balance: d.balance,
    history: engineData.history.slice()
  })
  // Keep playing to pause_at, then hold that frame. The tick also checks.
  const node = engineData.videoNode
  if (engineData.pauseTimer) clearTimeout(engineData.pauseTimer)
  if (node) {
    const ms = Math.max(0, (script.pauseAt - (node.currentTime || 0)) * 1000)
    engineData.pauseTimer = setTimeout(() => {
      engineData.pauseTimer = null
      videoHoldAt(script.pauseAt)
    }, ms)
  }
}

export const demoNextRound = (now) => {
  const d = engineData.demo
  const next = d.roundIdx + 1
  if (next < d.scripts.length) {
    demoLoadRound(next, now)
    return
  }
  videoHoldAt(d.script.pauseAt)
  updateState({ phase: 'ended', secondsLeft: 0 })
}

// ---- crowd simulation (docs/spec.md §8.5, archive/spec-v0.1.md §6) --------

/**
 * Arrival CDF over the 25 s window: ~30% front-loaded in the first 6 s, a
 * steady trickle, then ~40% in the last 8 s (the late rush).
 */
export const arrivalCdf = (tSec) => {
  const t = Math.max(0, Math.min(25, tSec))
  if (t <= 6) return 0.30 * Math.pow(t / 6, 0.7)
  if (t <= 17) return 0.30 + 0.30 * ((t - 6) / 11)
  return 0.60 + 0.40 * Math.pow((t - 17) / 8, 1.3)
}

/** Inverse-CDF sample, in ms, strictly inside the betting window. */
export const demoArrivalOffset = () => {
  const u = Math.random()
  let lo = 0
  let hi = 25
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (arrivalCdf(mid) < u) lo = mid
    else hi = mid
  }
  return Math.min(Math.round(hi * 1000), BETTING_MS - 250)
}

export const gaussian = () => {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Normal-ish around 0, stddev = range/5 (8 for ±20), clamped, a few outliers. */
export const demoGuess = (game) => {
  if (Math.random() < 0.06) return clampGuess(game, rint(game.guessMin, game.guessMax))
  const sd = (game.guessMax - game.guessMin) / 5
  return clampGuess(game, gaussian() * sd)
}

export const demoNames = (count) => {
  const used = {}
  const out = []
  while (out.length < count) {
    const stem = BOT_NAME_STEMS[rint(0, BOT_NAME_STEMS.length - 1)]
    const tail = BOT_NAME_TAILS[rint(0, BOT_NAME_TAILS.length - 1)]
    let name = stem + tail
    if (Math.random() < 0.2) name = name.charAt(0).toUpperCase() + name.slice(1)
    if (used[name]) name = `${stem}${rint(10, 99)}`
    if (used[name]) continue
    used[name] = true
    out.push(name)
  }
  return out
}

/** 35–80 players, each with a name, a hidden guess and an arrival offset. */
export const demoPlanCrowd = (game) => {
  const total = rint(35, 80)
  const names = demoNames(total)
  const plan = []
  for (let i = 0; i < total; i++) {
    plan.push({ name: names[i], guess: demoGuess(game), at: demoArrivalOffset() })
  }
  plan.sort((a, b) => a.at - b.at)
  return plan
}

// ---- settlement (docs/game-rules.md §3–§4; matches tests/payout.test.mjs) --

export const demoSettle = (botBets, userBet, resultValue) => {
  const all = botBets.map((b) => ({ guess: b.guess, mine: false }))
  if (userBet) all.push({ guess: userBet.guess, mine: true })
  const players = all.length

  // Distribution is drawn after reveal — every guess, including the user's.
  const counts = {}
  for (const b of all) counts[b.guess] = (counts[b.guess] || 0) + 1
  const distribution = Object.keys(counts)
    .map((k) => ({ guess: Number(k), count: counts[k] }))
    .sort((a, b) => a.guess - b.guess)

  if (players === 0) {
    return {
      winnerCount: 0, multiplier: null, payout: 0, iWon: false, myPayout: 0,
      distribution, playerCount: 0, pot: 0, prize: 0, dust: 0, houseTake: 0,
      targetWinners: 0, conserved: true
    }
  }

  // §3 — nearest, RANK (ties at the cut-off are all in).
  const N = Math.max(1, Math.ceil(players * WINNER_FRACTION))
  const dist = all.map((b) => Math.abs(b.guess - resultValue))
  const winners = []
  for (let i = 0; i < players; i++) {
    let rank = 1
    for (let j = 0; j < players; j++) if (dist[j] < dist[i]) rank += 1
    if (rank <= N) winners.push(all[i])
  }
  const winnerCount = winners.length

  // §4 / §4.1 — integer chips, floor, dust to the house, post-floor multiplier.
  const pot = players * STAKE
  const prize = Math.trunc(pot * (1 - RAKE))
  const payout = Math.floor(prize / winnerCount)
  const dust = prize - payout * winnerCount
  const houseTake = (pot - prize) + dust
  const multiplier = Number((payout / STAKE).toFixed(2))
  const conserved = payout * winnerCount + houseTake === pot // §4.2

  const iWon = winners.some((w) => w.mine)
  return {
    winnerCount,
    multiplier,
    payout,
    iWon,
    myPayout: iWon ? payout : 0,
    distribution,
    playerCount: players,
    pot,
    prize,
    dust,
    houseTake,
    targetWinners: N,
    conserved
  }
}

// ---------------------------------------------------------------------------
// SERVER backend — Supabase client + anonymous auth
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
    engineData.clientPromise.catch(() => {
      engineData.clientPromise = null
    })
  }
  return engineData.clientPromise
}

export const getUserId = () => engineData.userId

/**
 * Signs in anonymously (once) and ensures a `profiles` row exists via the
 * idempotent `ensure_profile` RPC.
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

    engineData.authPromise.catch(() => {
      engineData.authPromise = null
    })
  }
  return engineData.authPromise
}

// ---- server clock — display honesty only, never gates a write --------------

export const measureClock = async () => {
  const supabase = await getSupabase()
  const t0 = Date.now()
  const { data, error } = await supabase.rpc('server_now')
  const rtt = Date.now() - t0
  if (error) {
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

// ---- phase derivation from server timestamps (docs/integrity.md §2) --------

export const phaseOf = (round, now) => {
  if (!round) return 'preview'
  const opens = new Date(round.bettingOpensAt).getTime()
  const closes = new Date(round.bettingClosesAt).getTime()
  const visible = new Date(round.resultVisibleAt).getTime()
  if (now < opens) return 'preview'
  if (now < closes) return 'betting'
  if (now < Math.min(closes + LOCKED_MS, visible)) return 'locked'
  if (now < visible) return 'reveal'
  return 'results'
}

export const phaseSecondsLeft = (round, now) => {
  if (!round) return 0
  const phase = phaseOf(round, now)
  let target
  if (phase === 'preview') target = round.bettingOpensAt
  else if (phase === 'betting') target = round.bettingClosesAt
  else if (phase === 'locked') target = new Date(round.bettingClosesAt).getTime() + LOCKED_MS
  else if (phase === 'results') target = round.resultsEndAt
  else return 0
  return secondsLeftUntil(new Date(target).getTime(), now)
}

// ---- API — thin wrappers over PostgREST/RPC. No authority. -----------------

export const mapGame = (row) => {
  if (!row) return null
  const file = row.slug === 'water_200g' ? 'water' : 'banana'
  return {
    slug: row.slug,
    title: row.title,
    objectiveLine: row.objective_line,
    guessMin: row.guess_min,
    guessMax: row.guess_max,
    guessStep: row.guess_step,
    resultUnit: row.result_unit,
    videoSrc: videoSrcFor(file, false)
  }
}

/** Contract shape + the server timestamps phaseOf() needs. */
export const mapRound = (row) => {
  if (!row) return null
  return {
    id: row.id,
    index: row.round_index,
    count: null,
    betOpenAt: Number(row.video_bet_open_s),
    revealAt: Number(row.video_reveal_s),
    pauseAt: Number(row.video_pause_s),
    bettingOpensAt: row.betting_opens_at,
    bettingClosesAt: row.betting_closes_at,
    resultVisibleAt: row.result_visible_at,
    resultsEndAt: row.results_end_at
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

/** Places a bet via the `place_bet` RPC — never a direct insert. */
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

  const { data: ledgerRow, error: ledgerError } = await supabase
    .from('chip_ledger')
    .select('amount')
    .eq('round_id', roundId)
    .eq('kind', 'payout')
    .maybeSingle()
  if (ledgerError) throw ledgerError

  const myPayout = ledgerRow ? Number(ledgerRow.amount) : 0
  return {
    winnerCount: null,
    multiplier: null,
    payout: myPayout,
    iWon: myPayout > 0,
    myPayout,
    distribution: []
  }
}

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

export const apiHistory = async (slug, limit) => {
  await authReady()
  const supabase = await getSupabase()
  const { data: gameRow, error: gameError } = await supabase
    .from('games')
    .select('id, result_unit')
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
      gameSlug: slug,
      roundIndex: row.round_index,
      value: row.round_results.result_value,
      unit: gameRow.result_unit
    }))
}

// ---- realtime — a latency optimisation, never a source of truth -----------

export const rtTeardown = (key) => {
  const channel = engineData.channels[key]
  if (channel && engineData.client) engineData.client.removeChannel(channel)
  delete engineData.channels[key]
}

export const unsubscribeAll = () => {
  for (const key of Object.keys(engineData.channels)) rtTeardown(key)
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
        onChange({ playerCount: Number(row.player_count) || 0, pot: Number(row.pot) || 0 })
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') remeasureClock()
    })
  engineData.channels[key] = channel
}

/** NEVER subscribe to `bets` without a user_id filter. */
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

// ---- server engine — display phase from server timestamps -----------------

export const serverSelectGame = async (slug) => {
  await authReady()
  const game = await apiGetGame(slug)
  if (!game) throw new Error(`game "${slug}" was not found`)
  engineData.videoFallbackTried = false
  engineData.videoSrcWanted = game.videoSrc
  updateState({ mode: 'server', game, screen: 'playing' })
  videoEnsureSrc()
  updateState({ history: await apiHistory(slug, 8) })
  const round = await apiCurrentRound(slug)
  if (!round) throw new Error('no upcoming round for this game right now')
  await serverLoadRound(round)
}

export const serverSubmitBet = async (guess) => {
  const s = engineData.rootState
  try {
    const roundId = s.round.id
    await apiPlaceBet(roundId, guess)
    // Re-read from the server rather than assuming — the client never
    // invents a number the server owns.
    const confirmed = await apiMyBet(roundId)
    if (confirmed) updateState({ myBet: confirmed, myGuess: confirmed.guess, error: null })
    updateState({ balance: await apiBalance() })
  } catch (err) {
    flashError(describeError(err))
  }
}

export const serverLoadRound = async (round) => {
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
    arrivals: [],
    playerCount: 0,
    pot: 0,
    phase,
    secondsLeft: phaseSecondsLeft(round, now)
  })
  serverDriveVideo(phase, now, true)

  const s = engineData.rootState
  const isCurrent = () => !!(s && s.round && s.round.id === round.id)

  try {
    const stats = await apiRoundStats(round.id)
    const existingBet = await apiMyBet(round.id)
    if (!isCurrent()) return
    const patch = { playerCount: stats.playerCount, pot: stats.pot }
    if (existingBet) {
      patch.myBet = existingBet
      patch.myGuess = existingBet.guess
    }
    // Rejoining after the lock: seed the freeze from the now-immutable stats.
    if (phase !== 'preview' && phase !== 'betting') {
      patch.frozen = { playerCount: stats.playerCount, pot: stats.pot }
    }
    updateState(patch)

    if (phase === 'reveal' || phase === 'results') {
      const result = await apiRoundResult(round.id)
      if (result && isCurrent()) {
        updateState({ result: { value: result.value, unit: s.game ? s.game.resultUnit : '', readings: [] } })
      }
    }
    if (phase === 'results') {
      const info = await apiSettlement(round.id)
      if (info && isCurrent()) updateState({ settlement: info })
    }
  } catch (err) {
    flashError(describeError(err))
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

export const serverAdvanceRound = async () => {
  const s = engineData.rootState
  if (engineData.advancing || !s || !s.game) return
  engineData.advancing = true
  try {
    const nextRound = await apiCurrentRound(s.game.slug)
    if (nextRound && (!s.round || nextRound.id !== s.round.id)) {
      await serverLoadRound(nextRound)
      updateState({ history: await apiHistory(s.game.slug, 8) })
    }
  } catch (err) {
    flashError(describeError(err))
  } finally {
    engineData.advancing = false
  }
}

/** Keep the footage where the server timeline says it should be. */
export const serverDriveVideo = (phase, now, force) => {
  const s = engineData.rootState
  const node = engineData.videoNode
  const round = s ? s.round : null
  if (!node || !round) return
  if (phase === 'preview' || phase === 'betting') {
    videoHoldAt(round.betOpenAt)
  } else if (phase === 'locked' || phase === 'reveal') {
    const closes = new Date(round.bettingClosesAt).getTime()
    const expected = round.betOpenAt + Math.max(0, now - closes) / 1000
    if (force || Math.abs((node.currentTime || 0) - expected) > 1) videoSeek(expected)
    videoPlay()
  } else if (phase === 'results') {
    if ((node.currentTime || 0) >= round.pauseAt - 0.05 || node.paused) videoHoldAt(round.pauseAt)
  }
}

export const serverTick = (now) => {
  const s = engineData.rootState
  if (!s || !s.round) return
  const snow = serverNow()
  const prevPhase = s.phase
  const nextPhase = phaseOf(s.round, snow)
  const nextSeconds = phaseSecondsLeft(s.round, snow)

  const patch = {}
  if (nextSeconds !== s.secondsLeft) patch.secondsLeft = nextSeconds
  if (nextPhase !== prevPhase) {
    patch.phase = nextPhase
    if (nextPhase === 'locked') {
      // THE freeze — synchronous, from what is on screen this instant.
      patch.frozen = { playerCount: s.playerCount, pot: s.pot }
    }
  }
  if (Object.keys(patch).length) updateState(patch)
  serverDriveVideo(nextPhase, snow, nextPhase !== prevPhase)

  if (nextPhase !== prevPhase) {
    serverReconcile(nextPhase)
  } else if (
    (nextPhase === 'preview' || nextPhase === 'betting') &&
    snow - engineData.lastStatsPollAt >= STATS_POLL_MS
  ) {
    engineData.lastStatsPollAt = snow
    serverPollStats()
  }

  if (nextPhase === 'results' && snow >= new Date(s.round.resultsEndAt).getTime()) {
    serverAdvanceRound()
  }
}

export const serverReconcile = async (phase) => {
  const s = engineData.rootState
  const round = s ? s.round : null
  if (!round) return
  const isCurrent = () => !!(s.round && s.round.id === round.id)
  try {
    if (phase === 'preview' || phase === 'betting') {
      const stats = await apiRoundStats(round.id)
      if (isCurrent()) updateState({ playerCount: stats.playerCount, pot: stats.pot })
    } else if (phase === 'locked') {
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
        updateState({ result: { value: result.value, unit: s.game ? s.game.resultUnit : '', readings: [] } })
      }
    } else if (phase === 'results') {
      if (!s.result) {
        const result = await apiRoundResult(round.id)
        if (result && isCurrent()) {
          updateState({ result: { value: result.value, unit: s.game ? s.game.resultUnit : '', readings: [] } })
        }
      }
      const info = await apiSettlement(round.id)
      const freshBalance = await apiBalance()
      if (isCurrent()) {
        const patch = { balance: freshBalance }
        if (info) patch.settlement = info
        updateState(patch)
      }
    }
  } catch (err) {
    flashError(describeError(err))
  }
}

export const serverPollStats = async () => {
  const s = engineData.rootState
  const round = s ? s.round : null
  if (!round) return
  try {
    const stats = await apiRoundStats(round.id)
    if (s.round && s.round.id === round.id && (s.phase === 'preview' || s.phase === 'betting')) {
      updateState({ playerCount: stats.playerCount, pot: stats.pot })
    }
  } catch (err) {
    // Non-fatal — the next poll or a realtime message catches it up.
  }
}
