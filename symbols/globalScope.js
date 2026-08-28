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
// THE VIDEO IS THE GAME. One video is one duel: two challengers attempt the
// same task in turn, and the crowd bets on WHICH ONE lands closer to the
// target (docs/rounds.md). The video plays from its first frame and NEVER
// pauses — betting runs over the hosts' stand-up intro, and the lock lands on
// the frame where the first challenger starts. Per duel:
//
//   preview        (server only) video HELD at 0 until betting_opens_at
//   betting        video PLAYS 0 → lock_at     crowd arrives, user picks 1 or 2
//   locked   5 s   video PLAYS                 playerCount/pot FROZEN
//   reveal         video PLAYS                 attempt 1 shows at reveal_at[0]
//   results  8 s   video PLAYS to its end      attempt 2 at reveal_at[1] decides
//                                              the winner; settlement, credit
//   ended          summary
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

// Timeline — docs/spec.md §3 / docs/rounds.md. The betting window has no
// constant: it is the length of the footage before lock_at (17–20 s).
export const TICK_MS = 250
export const LOCKED_MS = 5000
export const RESULTS_MS = 8000
export const STATS_POLL_MS = 1500
export const BOOT_TIMEOUT_MS = 6000
export const ERROR_FLASH_MS = 4000
// If the <video> stops advancing for this long during a video-driven phase,
// the engine re-derives: it seeks to the target mark and moves on.
export const VIDEO_STALL_GRACE_MS = 4000

export const PHASES = ['preview', 'betting', 'locked', 'reveal', 'results', 'ended']

// The two sides of every duel. `side` is what a bet records; the name is what
// the UI shows. Per-game lines and portraits are attached in gameChallengers().
export const CHALLENGERS = [
  { side: 1, name: 'Challenger 1' },
  { side: 2, name: 'Challenger 2' }
]

// Video hosting. Primary is Supabase Storage (public bucket `videos`, honours
// Range requests so seeking works). One line to change.
export const VIDEO_BASE = 'https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos'
// Local fallback, tried once if the <video> element errors on the Storage URL.
export const VIDEO_FALLBACK_BASE = '/assets/videos'

// Demo game catalogue — mirrors the `games` rows (docs/rounds.md).
export const DEMO_GAMES = {
  banana_cut: {
    slug: 'banana_cut',
    title: 'Banana Cut',
    objectiveLine: 'One banana, one cut each.',
    targetLine: 'Closest to an even split wins',
    resultUnit: 'g',
    videoFile: 'banana',
    challengerLines: ['Green jacket · cuts first', 'Navy tee · cuts second']
  },
  water_200g: {
    slug: 'water_200g',
    title: 'Water Pour',
    objectiveLine: 'One pour each, 200 g target.',
    targetLine: 'Closest to 200 g wins',
    resultUnit: 'g',
    videoFile: 'water',
    challengerLines: ['Green jacket · pours first', 'Navy tee · pours second']
  }
}

// Duel scripts — ground truth from the footage (docs/rounds.md). Times are
// video seconds. `offset` is how far each attempt landed from the target,
// read off the scale display in the actual frame. Betting runs 0 → lockAt.
export const ROUND_SCRIPTS = {
  banana_cut: [
    {
      id: 'banana_duel',
      lockAt: 20,
      revealAt: [36, 54],
      endAt: 55.1,
      attempts: [
        { side: 1, offset: -13, readings: ['82 g', '95 g'] },
        { side: 2, offset: -15, readings: ['79 g', '94 g'] }
      ]
    }
  ],
  water_200g: [
    {
      id: 'water_duel',
      lockAt: 17,
      revealAt: [30, 48],
      endAt: 49.8,
      attempts: [
        { side: 1, offset: -39, readings: ['161 g'] },
        { side: 2, offset: -26, readings: ['174 g'] }
      ]
    }
  ]
}

/** docs/game-rules.md §3 — the smaller absolute offset wins; equal is a tie (0). */
export const duelWinner = (attempts) => {
  const a = attempts[0]
  const b = attempts[1]
  if (!a || !b) return null
  const da = Math.abs(a.offset)
  const db = Math.abs(b.offset)
  if (da === db) return 0
  return da < db ? a.side : b.side
}

/** The state-contract challenger list for a game: names, lines, portraits. */
export const gameChallengers = (g) =>
  CHALLENGERS.map((c, i) => ({
    side: c.side,
    name: c.name,
    line: (g.challengerLines && g.challengerLines[i]) || '',
    poster: `/assets/posters/${g.videoFile}-c${c.side}.jpg`
  }))

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
  history: [],          // [{ gameSlug, roundIndex, winner, offsets, unit }] newest first
  sessionSeq: 0,        // bumps per selectGame
  sessionToken: '',     // time-stamped per selectGame so demo round ids stay unique across page loads (the store persists)

  // video
  videoNode: null,      // the <video> element handed over by registerVideo
  videoSrcWanted: null, // what node.src should be right now
  videoFallbackTried: false,
  pendingSeek: null,    // seconds to apply once metadata is loaded
  lastPlayAttemptAt: 0,
  playBlocked: null,    // last play() rejection message, if any

  // demo backend
  demo: {
    balance: 200,
    scripts: [],
    roundIdx: -1,
    script: null,
    phaseEndsAt: 0,     // wall-clock ms — timed phases (locked/results)
    phaseStartedAt: 0,
    startCt: 0,         // video currentTime when the current video-driven phase began
    lastCt: -1,
    lastProgressAt: 0,
    bettingOpenedAt: 0,
    windowMs: 0,        // length of the betting window (lockAt seconds, in ms)
    lean: 0.5,          // this duel's crowd lean toward side 1
    plan: [],           // pending arrivals [{ name, side, at }] sorted by `at`
    book: null,         // { open, bets: [{ name, side }] } — closed at LOCK
    userBet: null       // { side, stake }
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
  channels: {},

  // demo persistence (localStorage['zse_demo_store'])
  store: null,          // the in-memory store; flushed lazily to localStorage
  storeDirty: false,
  storeFlushedAt: 0,
  storeBooted: false,
  storeUnloadHooked: false,
  demoPlayerId: null,
  demoRoundRow: null,   // the store row for the demo round in progress
  demoGameFlags: null,  // { slug: boolean } — active flags set from the workspace
  idSeq: 0,

  // workspace data layer (state.ws)
  ws: {
    ticker: null,
    source: null,       // 'demo' | 'server' — may differ from mode after a fallback
    data: null,         // the canonical plain state.ws object (committed by wkCommit)
    loadSeq: 0
  }
}

// ---------------------------------------------------------------------------
// State access — the engine is the only writer of root state
// ---------------------------------------------------------------------------

export const updateState = (patch) => {
  const s = engineData.rootState
  if (!s || typeof s.update !== 'function') return
  audioOnPatch(s, patch)
  s.update(patch)
  stateNudge(s)
}

// The runtime applies function-driven style props (background, color, theme)
// one update late: they read the state as it was before the patch. One extra
// empty update on the next frame makes the visual follow the click at once
// instead of on the next engine tick. Throttled to one per frame.
export const stateNudge = (s) => {
  if (engineData.nudgeFrame) return
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 16)
  engineData.nudgeFrame = raf(() => {
    engineData.nudgeFrame = 0
    try {
      s.update({})
    } catch {}
  })
}

// ---------------------------------------------------------------------------
// Sound cues — Web Audio, synthesised, no assets. Short (<= 0.5 s) feedback
// for lock, bet placed, win, loss and dead heat. Unlocked by the first user
// gesture (selectGame) and muted by the SoundToggle; the preference persists
// in localStorage under zse_sound. Never decides anything: it only listens to
// the state patches the engine already writes.
// ---------------------------------------------------------------------------

export const AUDIO_STORAGE_KEY = 'zse_sound'

export const audioData = { ctx: null }

export const audioPrefRead = () => {
  try {
    return localStorage.getItem(AUDIO_STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

export const audioPrefWrite = (on) => {
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, on ? '1' : '0')
  } catch {}
}

/** Creates or resumes the AudioContext. Call from a user gesture. */
export const audioUnlock = () => {
  try {
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext
    if (!Ctx) return null
    if (!audioData.ctx) audioData.ctx = new Ctx()
    if (audioData.ctx.state === 'suspended') audioData.ctx.resume()
    return audioData.ctx
  } catch {
    return null
  }
}

/** One note: frequency, start offset, duration (s), wave, peak gain. */
export const audioNote = (ctx, freq, at, dur, type, peak) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + at)
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + at)
  gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + at + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime + at)
  osc.stop(ctx.currentTime + at + dur + 0.02)
}

export const AUDIO_CUES = {
  // tick: a bet is in
  bet: [[880, 0, 0.06, 'sine', 0.12]],
  // thud + click: the lock frame
  lock: [[110, 0, 0.16, 'triangle', 0.18], [1760, 0, 0.03, 'square', 0.05]],
  // rising major arpeggio: you won
  win: [[523.25, 0, 0.1, 'triangle', 0.14], [659.25, 0.1, 0.1, 'triangle', 0.14], [783.99, 0.2, 0.22, 'triangle', 0.16]],
  // falling minor third: not this time
  loss: [[329.63, 0, 0.16, 'sine', 0.12], [246.94, 0.16, 0.28, 'sine', 0.1]],
  // one flat tone: dead heat / no bet
  neutral: [[440, 0, 0.14, 'sine', 0.1]]
}

export const audioCue = (name) => {
  const s = engineData.rootState
  if (s && s.sound === false) return
  const ctx = audioData.ctx
  const notes = AUDIO_CUES[name]
  if (!ctx || !notes || ctx.state !== 'running') return
  try {
    notes.forEach((n) => audioNote(ctx, n[0], n[1], n[2], n[3], n[4]))
  } catch {}
}

/** Reads a state patch before it is applied and plays the matching cue. */
export const audioOnPatch = (s, patch) => {
  if (!patch) return
  if (patch.phase === 'locked' && s.phase !== 'locked') audioCue('lock')
  if (patch.myBet && !s.myBet) audioCue('bet')
  if (patch.settlement && patch.settlement !== s.settlement) {
    const bet = patch.myBet !== undefined ? patch.myBet : s.myBet
    if (patch.settlement.voided || !bet) audioCue('neutral')
    else audioCue(patch.settlement.iWon ? 'win' : 'loss')
  }
}

export const engineToggleSound = () => {
  const s = engineData.rootState
  const next = !(s && s.sound !== false)
  audioPrefWrite(next)
  updateState({ sound: next })
  if (next) {
    audioUnlock()
    audioCue('bet')
  }
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

/** 1 or 2, or null for anything else. A bet is a side and nothing more. */
export const normalizeSide = (n) => {
  const v = Number(n)
  return v === 1 || v === 2 ? v : null
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
  flashError('Video stream unavailable, switched to the local copy.')
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

/**
 * Paused at exactly `t`. The only frame ever held is 0 — the first frame,
 * before a duel starts. Once the footage runs, nothing stops it.
 */
export const videoHoldAt = (t) => {
  videoPause()
  videoSeek(t)
}

export const videoCurrentTime = () => {
  const node = engineData.videoNode
  return node ? node.currentTime || 0 : 0
}

/**
 * Whole seconds of footage left before `target`. The betting countdown reads
 * the VIDEO, not the wall clock: bets close on a frame, so the number on
 * screen must be the distance to that frame. Wall clock stands in only when
 * there is no element at all.
 */
export const videoSecondsUntil = (target, now) => {
  const d = engineData.demo
  const node = engineData.videoNode
  const ct = node ? node.currentTime || 0 : d.startCt + Math.max(0, now - d.phaseStartedAt) / 1000
  return Math.max(0, Math.ceil(target - ct))
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
  if (typeof globalThis !== 'undefined') {
    globalThis.__zse = engineData
    globalThis.__zseAudio = audioData
  }

  updateState({ sound: audioPrefRead() })
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
      updateState({
        mode: 'server',
        balance: probe.balance,
        games: probe.games.map((g) => ({ slug: g.slug, title: g.title, active: true }))
      })
    } catch (err) {
      engineData.mode = 'demo'
      demoStoreBoot()
      updateState({ mode: 'demo', balance: engineData.demo.balance, games: demoGameList() })
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
  audioUnlock()
  updateState({ error: null })
  const mode = await engineBoot()
  if (mode === 'server') {
    try {
      await serverSelectGame(slug)
      return
    } catch (err) {
      engineData.mode = 'demo'
      demoStoreBoot()
      updateState({ mode: 'demo', balance: engineData.demo.balance, games: demoGameList() })
      flashError(`Server round unavailable (${describeError(err)}). Running in demo mode.`)
    }
  }
  demoSelectGame(slug)
}

export const engineBackToPicker = () => {
  unsubscribeAll()
  videoPause()
  storeAbandonCurrent(Date.now())
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
    phase: 'preview',
    secondsLeft: 0,
    playerCount: 0,
    pot: 0,
    frozen: null,
    arrivals: [],
    mySide: null,
    myBet: null,
    result: null,
    settlement: null,
    error: null
  })
}

export const engineSetSide = (n) => {
  const s = engineData.rootState
  if (!s || !s.game) return
  const side = normalizeSide(n)
  if (side == null) return
  updateState({ mySide: side })
}

/**
 * One bet per user per duel, only while 'betting'. In demo mode the local
 * book is the judge; in server mode `place_bet` is, and its rejection is
 * surfaced verbatim. Either way a refusal is VISIBLE in state.error.
 */
export const engineSubmitBet = async (sideIn) => {
  const s = engineData.rootState
  if (!s || !s.round || !s.game) {
    flashError('There is no active duel to bet on.')
    return
  }
  const side = normalizeSide(sideIn != null ? sideIn : s.mySide)
  if (side == null) {
    flashError('Pick a challenger first.')
    return
  }
  if (s.phase !== 'betting') {
    flashError(s.phase === 'preview' ? 'Bets are not open yet.' : 'Betting is closed for this duel.')
    return
  }
  if (s.myBet) {
    flashError('You already placed a bet on this duel.')
    return
  }
  if (engineData.mode === 'server') {
    await serverSubmitBet(side)
    return
  }
  demoSubmitBet(side)
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
  storeFlushIfDue(Date.now())
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
  if (!demoGameActive(slug)) {
    flashError(`${g.title} is not active right now.`)
    return
  }
  demoStoreBoot()
  engineData.sessionSeq += 1
  engineData.sessionToken = `${Date.now().toString(36)}${engineData.sessionSeq}`
  engineData.videoFallbackTried = false
  const game = {
    slug: g.slug,
    title: g.title,
    objectiveLine: g.objectiveLine,
    targetLine: g.targetLine,
    resultUnit: g.resultUnit,
    videoSrc: videoSrcFor(g.videoFile, false),
    challengers: gameChallengers(g)
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
  // Every duel starts from the first frame of its footage.
  videoHoldAt(0)
  demoLoadRound(0, Date.now())
}

/**
 * Opens a duel: the book opens, the crowd plan is drawn, and the footage
 * starts from 0. Betting is live from the first frame — the hosts' intro IS
 * the betting window — and closes on the frame at script.lockAt.
 */
export const demoLoadRound = (i, now) => {
  const s = engineData.rootState
  const d = engineData.demo
  const script = d.scripts[i]
  if (!s || !s.game || !script) return
  d.roundIdx = i
  d.script = script
  d.userBet = null
  d.phaseEndsAt = 0
  d.windowMs = Math.round(script.lockAt * 1000)
  d.bettingOpenedAt = now
  d.lean = 0.3 + Math.random() * 0.4
  d.plan = demoPlanCrowd(d.windowMs, d.lean)
  d.book = { open: true, bets: [] }
  const round = {
    id: `demo:${s.game.slug}:${script.id}:${engineData.sessionToken}`,
    index: i + 1,
    count: d.scripts.length,
    lockAt: script.lockAt,
    revealAt: script.revealAt.slice(),
    endAt: script.endAt
  }
  updateState({
    round,
    phase: 'betting',
    secondsLeft: Math.ceil(script.lockAt),
    playerCount: 0,
    pot: 0,
    frozen: null,
    arrivals: [],
    mySide: null,
    myBet: null,
    result: null,
    settlement: null
  })
  storeRoundOpen(s.game, round, now)
  storeRoundPhase('betting', now)
  beginVideoPhase(now, 0)
  videoSeek(0)
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

  if (phase === 'betting') {
    videoPlay()
    demoReleaseArrivals(now)
    if (videoReached(script.lockAt, now)) {
      demoLock(now)
      return
    }
    patch.secondsLeft = videoSecondsUntil(script.lockAt, now)
  } else if (phase === 'locked') {
    videoPlay()
    if (demoCheckReveals(now)) return
    if (now >= d.phaseEndsAt) {
      updateState({ phase: 'reveal', secondsLeft: 0 })
      return
    }
    patch.secondsLeft = secondsLeftUntil(d.phaseEndsAt, now)
  } else if (phase === 'reveal') {
    videoPlay()
    if (demoCheckReveals(now)) return
  } else if (phase === 'results') {
    // The footage runs to its own last frame; nothing holds it.
    if (now >= d.phaseEndsAt) {
      demoNextRound(now)
      return
    }
    patch.secondsLeft = secondsLeftUntil(d.phaseEndsAt, now)
  } else {
    return // 'preview' (never in demo) or 'ended'
  }

  if (patch.secondsLeft !== undefined && patch.secondsLeft === s.secondsLeft) delete patch.secondsLeft
  if (Object.keys(patch).length) updateState(patch)
}

/**
 * Has the footage reached the next unrevealed attempt? Reveals it and
 * returns true if so. The second reveal decides the duel and settles.
 */
export const demoCheckReveals = (now) => {
  const s = engineData.rootState
  const d = engineData.demo
  const script = d.script
  const shown = s.result && s.result.attempts ? s.result.attempts : []
  const next = shown[0] ? 1 : 0
  if (next >= script.attempts.length) return false
  if (!videoReached(script.revealAt[next], now)) return false
  demoRevealAttempt(next, now)
  return true
}

/**
 * Admit every planned arrival whose offset has elapsed. Structural guard:
 * runs only while the book is open AND the phase is 'betting', and the clock
 * it reads is capped at the window length, so a throttled tab can never
 * admit an arrival stamped after the window.
 */
export const demoReleaseArrivals = (now) => {
  const s = engineData.rootState
  const d = engineData.demo
  if (!s || !d.book || !d.book.open || s.phase !== 'betting') return
  const elapsed = Math.min(now - d.bettingOpenedAt, d.windowMs)
  let admitted = 0
  while (d.plan.length && d.plan[0].at <= elapsed) {
    const arrival = d.plan.shift()
    d.book.bets.push(arrival)
    storeBet(botPlayerId(arrival.name), arrival.name, true, arrival.side, now)
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
  storeRoundLock(frozen, now)
  demoEnterTimed('locked', LOCKED_MS, now, { frozen })
  // The footage does not stop or jump at the lock — it is already playing.
  videoPlay()
}

export const demoSubmitBet = (side) => {
  const s = engineData.rootState
  const d = engineData.demo
  if (!d.book || !d.book.open || s.phase !== 'betting') {
    flashError('Betting is closed for this duel.')
    return
  }
  if (d.userBet) {
    flashError('You already placed a bet on this duel.')
    return
  }
  if (d.balance < STAKE) {
    flashError(`Not enough chips: a bet costs ${STAKE}.`)
    return
  }
  d.balance -= STAKE
  d.userBet = { side, stake: STAKE }
  const human = storeBet(demoPlayerId(), DEMO_PLAYER_NAME, false, side, Date.now())
  if (human) d.balance = human.balance
  const playerCount = d.book.bets.length + 1
  updateState({
    myBet: { side, stake: STAKE },
    mySide: side,
    balance: d.balance,
    playerCount,
    pot: playerCount * STAKE,
    error: null
  })
}

/**
 * The footage reached attempt `i`'s scale reading. The first reveal only
 * shows the number; the second decides the duel — settle, credit, results.
 */
export const demoRevealAttempt = (i, now) => {
  const s = engineData.rootState
  const d = engineData.demo
  const script = d.script
  const attempt = script.attempts[i]
  const prev = s.result && s.result.attempts ? s.result.attempts : []
  const attempts = script.attempts.map((a, k) => (k < i ? prev[k] || null : null))
  attempts[i] = { side: attempt.side, offset: attempt.offset, readings: attempt.readings.slice() }
  const unit = s.game.resultUnit

  if (i < script.attempts.length - 1) {
    updateState({ result: { unit, attempts, winner: null } })
    return
  }

  const winner = duelWinner(script.attempts)
  const result = { unit, attempts, winner }
  const settlement = demoSettle(d.book ? d.book.bets : [], d.userBet, winner)
  if (settlement.conserved === false) {
    flashError('Settlement failed conservation: chips would be created or destroyed.')
  }
  d.balance += settlement.voided && d.userBet ? d.userBet.stake : settlement.myPayout
  const human = storeRoundSettle(script, winner, settlement, now)
  if (human) d.balance = human.balance
  engineData.history.unshift({
    gameSlug: s.game.slug,
    roundIndex: s.round.index,
    winner,
    offsets: attempts.map((a) => a.offset),
    unit
  })
  engineData.history = engineData.history.slice(0, 8)
  demoEnterTimed('results', RESULTS_MS, now, {
    result,
    settlement,
    balance: d.balance,
    history: engineData.history.slice()
  })
}

export const demoNextRound = (now) => {
  const d = engineData.demo
  const next = d.roundIdx + 1
  if (next < d.scripts.length) {
    demoLoadRound(next, now)
    return
  }
  updateState({ phase: 'ended', secondsLeft: 0 })
}

// ---- crowd simulation (docs/spec.md §8.5, archive/spec-v0.1.md §6) --------

/**
 * Arrival CDF over the betting window, as a fraction 0..1 of its length:
 * ~30% front-loaded in the first quarter, a steady trickle, then ~40% in the
 * last third (the late rush). Same shape as v0.1's 25 s curve, stretched to
 * whatever the footage gives us.
 */
export const arrivalCdf = (f) => {
  const t = Math.max(0, Math.min(1, f))
  if (t <= 0.24) return 0.30 * Math.pow(t / 0.24, 0.7)
  if (t <= 0.68) return 0.30 + 0.30 * ((t - 0.24) / 0.44)
  return 0.60 + 0.40 * Math.pow((t - 0.68) / 0.32, 1.3)
}

/** Inverse-CDF sample, in ms, strictly inside a window of `windowMs`. */
export const demoArrivalOffset = (windowMs) => {
  const u = Math.random()
  let lo = 0
  let hi = 1
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (arrivalCdf(mid) < u) lo = mid
    else hi = mid
  }
  return Math.min(Math.round(hi * windowMs), windowMs - 250)
}

/** Each bot backs side 1 with probability `lean` — the crowd herds a little. */
export const demoSide = (lean) => (Math.random() < lean ? 1 : 2)

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

/** 35–80 players, each with a name, a hidden side and an arrival offset. */
export const demoPlanCrowd = (windowMs, lean) => {
  const total = rint(35, 80)
  const names = demoNames(total)
  const plan = []
  for (let i = 0; i < total; i++) {
    plan.push({ name: names[i], side: demoSide(lean), at: demoArrivalOffset(windowMs) })
  }
  plan.sort((a, b) => a.at - b.at)
  return plan
}

// ---- settlement (docs/game-rules.md §3–§4; matches tests/payout.test.mjs) --

/**
 * Duel settlement. `winner` is 1, 2, or 0 for a dead heat. Winners are every
 * bet on the winning side; they split the prize equally. A duel with no
 * winning bet — a dead heat, or nobody backed the winner — has no market and
 * refunds every stake (§3.2). The payout maths is the shared §4 engine.
 */
export const demoSettle = (botBets, userBet, winner) => {
  const all = botBets.map((b) => ({ side: b.side, mine: false, name: b.name }))
  if (userBet) all.push({ side: userBet.side, mine: true, name: null })
  const players = all.length

  // The split is drawn after reveal — every pick, including the user's.
  const counts = { 1: 0, 2: 0 }
  for (const b of all) counts[b.side] = (counts[b.side] || 0) + 1
  const sides = [{ side: 1, count: counts[1] }, { side: 2, count: counts[2] }]

  if (players === 0) {
    return {
      winnerCount: 0, multiplier: null, payout: 0, iWon: false, myPayout: 0,
      sides, winner, playerCount: 0, pot: 0, prize: 0, dust: 0, houseTake: 0,
      voided: false, conserved: true, entries: []
    }
  }

  // §3 — the winning side. Every bet on it wins; nothing else does.
  const winners = winner === 1 || winner === 2 ? all.filter((b) => b.side === winner) : []
  const winnerCount = winners.length
  const pot = players * STAKE

  // §3.2 — no market. Every stake goes back; the house takes nothing.
  if (winnerCount === 0) {
    return {
      winnerCount: 0, multiplier: null, payout: 0, iWon: false, myPayout: 0,
      sides, winner, playerCount: players, pot, prize: 0, dust: 0, houseTake: 0,
      voided: true, conserved: true,
      entries: all.map((b) => ({ name: b.name, mine: b.mine, side: b.side, won: false, refunded: true }))
    }
  }

  // §4 / §4.1 — integer chips, floor, dust to the house, post-floor multiplier.
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
    sides,
    winner,
    playerCount: players,
    pot,
    prize,
    dust,
    houseTake,
    voided: false,
    conserved,
    // Per-bet outcome, in input order — consumed by the demo store only.
    entries: all.map((b) => ({ name: b.name, mine: b.mine, side: b.side, won: winners.indexOf(b) >= 0, refunded: false }))
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
  const local = DEMO_GAMES[row.slug] || DEMO_GAMES.banana_cut
  return {
    slug: row.slug,
    title: row.title,
    objectiveLine: row.objective_line,
    targetLine: local.targetLine,
    resultUnit: row.result_unit,
    videoSrc: videoSrcFor(local.videoFile, false),
    challengers: gameChallengers(local)
  }
}

/**
 * Contract shape + the server timestamps phaseOf() needs. `video_bet_open_s`
 * is the LOCK frame in the duel schema: betting runs from video 0 (at
 * betting_opens_at) to that frame (at betting_closes_at).
 */
export const mapRound = (row) => {
  if (!row) return null
  const lockAt = Number(row.video_bet_open_s)
  const reveal2 = Number(row.video_reveal_s)
  const reveal1 = row.video_reveal_1_s == null ? reveal2 : Number(row.video_reveal_1_s)
  return {
    id: row.id,
    index: row.round_index,
    count: null,
    lockAt,
    revealAt: [reveal1, reveal2],
    endAt: Number(row.video_pause_s),
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
    .select('slug, title, objective_line, result_unit, is_active')
    .eq('is_active', true)
    .order('title', { ascending: true })
  if (error) throw error
  return (data || []).map((x) => mapGame(x))
}

export const apiGetGame = async (slug) => {
  await authReady()
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('games')
    .select('slug, title, objective_line, result_unit, is_active')
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
    .select('id, round_index, betting_opens_at, betting_closes_at, result_visible_at, results_end_at, video_bet_open_s, video_reveal_1_s, video_reveal_s, video_pause_s')
    .eq('game_id', gameRow.id)
    .gt('results_end_at', nowIso)
    .order('betting_opens_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return mapRound(data)
}

/**
 * Places a bet via the `place_bet` RPC — never a direct insert. The side
 * travels in `bets.guess` (1 or 2); the schema's range check is the guard.
 */
export const apiPlaceBet = async (roundId, side) => {
  await authReady()
  const supabase = await getSupabase()
  const { data, error } = await supabase.rpc('place_bet', {
    p_round_id: roundId,
    p_guess: side
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
  return { side: data.guess, stake: data.stake }
}

/**
 * Each attempt's reading, from `round_attempts`. RLS gates every row on its
 * own `visible_at`, so the first challenger's number arrives mid-duel and the
 * second's at result_visible_at. Missing rows stay null — never guessed at.
 */
export const apiRoundAttempts = async (roundId) => {
  await authReady()
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('round_attempts')
    .select('side, offset_value, readings')
    .eq('round_id', roundId)
  if (error) throw error
  const out = [null, null]
  for (const row of data || []) {
    const side = normalizeSide(row.side)
    if (side) out[side - 1] = { side, offset: Number(row.offset_value), readings: row.readings || [] }
  }
  return out
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
  // result_value is the winning side for a duel: 1, 2, or 0 for a dead heat.
  return { winner: Number(data.result_value), recordedAt: data.recorded_at }
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

  const { data: ledgerRows, error: ledgerError } = await supabase
    .from('chip_ledger')
    .select('kind, amount')
    .eq('round_id', roundId)
    .in('kind', ['payout', 'refund'])
  if (ledgerError) throw ledgerError

  let myPayout = 0
  let voided = false
  for (const row of ledgerRows || []) {
    if (row.kind === 'payout') myPayout += Number(row.amount)
    if (row.kind === 'refund') voided = true
  }
  return {
    winnerCount: null,
    multiplier: null,
    payout: myPayout,
    iWon: myPayout > 0,
    myPayout,
    sides: [],
    voided
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
    .select('id, round_index, result_visible_at, round_results(result_value, recorded_at), round_attempts(side, offset_value)')
    .eq('game_id', gameRow.id)
    .order('round_index', { ascending: false })
    .limit(limit || 8)
  if (error) throw error

  return (data || [])
    .filter((row) => row.round_results && row.round_results.result_value != null)
    .map((row) => {
      const offsets = [null, null]
      for (const a of row.round_attempts || []) {
        const side = normalizeSide(a.side)
        if (side) offsets[side - 1] = Number(a.offset_value)
      }
      return {
        gameSlug: slug,
        roundIndex: row.round_index,
        winner: Number(row.round_results.result_value),
        offsets,
        unit: gameRow.result_unit
      }
    })
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
        onBet({ side: row.guess, stake: row.stake })
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

export const serverSubmitBet = async (side) => {
  const s = engineData.rootState
  try {
    const roundId = s.round.id
    await apiPlaceBet(roundId, side)
    // Re-read from the server rather than assuming — the client never
    // invents a number the server owns.
    const confirmed = await apiMyBet(roundId)
    if (confirmed) updateState({ myBet: confirmed, mySide: confirmed.side, error: null })
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
    mySide: null,
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
      patch.mySide = existingBet.side
    }
    // Rejoining after the lock: seed the freeze from the now-immutable stats.
    if (phase !== 'preview' && phase !== 'betting') {
      patch.frozen = { playerCount: stats.playerCount, pot: stats.pot }
    }
    updateState(patch)

    if (phase === 'locked' || phase === 'reveal' || phase === 'results') {
      await serverRefreshResult(round.id, isCurrent)
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
      updateState({ myBet: { side: bet.side, stake: bet.stake }, mySide: bet.side })
    })
  }
}

/**
 * Reads whatever the server will show right now: each attempt's reading as
 * its own gate opens, and the winner once result_visible_at has passed.
 * Nothing here is predicted — a row that RLS withholds stays null.
 */
export const serverRefreshResult = async (roundId, isCurrent) => {
  const s = engineData.rootState
  const attempts = await apiRoundAttempts(roundId)
  const result = await apiRoundResult(roundId)
  if (!isCurrent()) return
  if (!attempts[0] && !attempts[1] && !result) return
  updateState({
    result: {
      unit: s.game ? s.game.resultUnit : '',
      attempts,
      winner: result ? result.winner : null
    }
  })
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

/**
 * Keep the footage where the server timeline says it should be. The video
 * position is derived from ONE anchor — the lock frame sits at
 * betting_closes_at — so betting plays 0 → lock_at and everything after runs
 * on continuously. Nothing is ever held except the first frame in preview.
 */
export const serverDriveVideo = (phase, now, force) => {
  const s = engineData.rootState
  const node = engineData.videoNode
  const round = s ? s.round : null
  if (!node || !round) return
  const closes = new Date(round.bettingClosesAt).getTime()
  const expected = Math.max(0, round.lockAt + (now - closes) / 1000)
  if (phase === 'preview') {
    videoHoldAt(0)
    return
  }
  if (node.ended) return
  if (force || Math.abs((node.currentTime || 0) - expected) > 1) videoSeek(expected)
  videoPlay()
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
  } else if (
    (nextPhase === 'locked' || nextPhase === 'reveal') &&
    !(s.result && s.result.attempts && s.result.attempts[0]) &&
    snow - engineData.lastStatsPollAt >= STATS_POLL_MS
  ) {
    // The first challenger's reading unseals mid-duel, on its own gate.
    engineData.lastStatsPollAt = snow
    serverPollAttempts()
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
      await serverRefreshResult(round.id, isCurrent)
    } else if (phase === 'results') {
      await serverRefreshResult(round.id, isCurrent)
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

export const serverPollAttempts = async () => {
  const s = engineData.rootState
  const round = s ? s.round : null
  if (!round) return
  try {
    await serverRefreshResult(round.id, () => !!(s.round && s.round.id === round.id))
  } catch (err) {
    // Non-fatal — the next poll or the phase change catches it up.
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

// ---------------------------------------------------------------------------
// DEMO STORE — localStorage['zse_demo_store'] (docs/workspace.md "Demo source")
//
// The demo engine records what a real server would: every round, every bet
// (human and bot), and a chip ledger whose rows sum to zero per settled
// round. The workspace reads this store. Guesses are stored in the clear
// here — the ADAPTER seals them until the round has revealed (wkDemoBets).
// The store lives in memory and is flushed to localStorage at most every
// DEMO_STORE_FLUSH_MS, plus immediately on settlement and on pagehide.
// ---------------------------------------------------------------------------

export const DEMO_STORE_KEY = 'zse_demo_store'
export const DEMO_PLAYER_KEY = 'zse_demo_player_id'
export const DEMO_GAMES_KEY = 'zse_demo_games'
export const DEMO_STORE_VERSION = 1
export const DEMO_STORE_MAX_ROUNDS = 120
export const DEMO_STORE_FLUSH_MS = 400
export const DEMO_PLAYER_NAME = 'You'
export const HOUSE_PLAYER_ID = 'house'
export const HOUSE_PLAYER_NAME = 'House'

export const lsGet = (key) => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key)
  } catch (err) {
    return null
  }
}

export const lsSet = (key, value) => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    return false
  }
}

export const lsRemove = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (err) {
    // ignore — storage may be unavailable
  }
}

export const isoAt = (ms) => new Date(ms).toISOString()

export const nextId = (prefix) => {
  engineData.idSeq += 1
  return `${prefix}_${Date.now().toString(36)}_${engineData.idSeq}`
}

export const storeFresh = () => ({ v: DEMO_STORE_VERSION, rounds: [], bets: [], ledger: [], players: [] })

export const storeIsValid = (obj) =>
  !!obj && obj.v === DEMO_STORE_VERSION &&
  Array.isArray(obj.rounds) && Array.isArray(obj.bets) &&
  Array.isArray(obj.ledger) && Array.isArray(obj.players)

/** The in-memory store, loaded from localStorage once. Never throws. */
export const storeLoad = () => {
  if (engineData.store) return engineData.store
  let parsed = null
  try {
    const raw = lsGet(DEMO_STORE_KEY)
    parsed = raw ? JSON.parse(raw) : null
  } catch (err) {
    parsed = null
  }
  engineData.store = storeIsValid(parsed) ? parsed : storeFresh()
  return engineData.store
}

export const storeMark = () => {
  engineData.storeDirty = true
}

export const storeFlush = () => {
  if (!engineData.store || !engineData.storeDirty) return
  engineData.storeDirty = false
  engineData.storeFlushedAt = Date.now()
  let json = ''
  try {
    json = JSON.stringify(engineData.store)
  } catch (err) {
    return
  }
  if (!lsSet(DEMO_STORE_KEY, json)) {
    // Quota: drop the oldest half of the rounds and try once more.
    storePrune(engineData.store, Math.floor(engineData.store.rounds.length / 2), Date.now())
    try {
      lsSet(DEMO_STORE_KEY, JSON.stringify(engineData.store))
    } catch (err) {
      // give up quietly; the next flush retries
    }
  }
}

export const storeFlushIfDue = (now) => {
  if (!engineData.storeDirty) return
  if (now - engineData.storeFlushedAt >= DEMO_STORE_FLUSH_MS) storeFlush()
}

/** Stable id for the human demo player, generated once per browser. */
export const demoPlayerId = () => {
  if (engineData.demoPlayerId) return engineData.demoPlayerId
  let id = lsGet(DEMO_PLAYER_KEY)
  if (!id) {
    id = `p_${Math.random().toString(36).slice(2, 12)}`
    lsSet(DEMO_PLAYER_KEY, id)
  }
  engineData.demoPlayerId = id
  return id
}

export const botPlayerId = (name) => `bot:${name}`

export const storePlayer = (store, id, name, isBot, isHouse) => {
  let p = null
  for (let i = 0; i < store.players.length; i++) {
    if (store.players[i].id === id) {
      p = store.players[i]
      break
    }
  }
  if (!p) {
    p = {
      id,
      name,
      isBot: !!isBot,
      isHouse: !!isHouse,
      balance: 0,
      bets: 0,
      wins: 0,
      staked: 0,
      paidOut: 0,
      net: 0,
      granted: 0
    }
    store.players.push(p)
  }
  return p
}

/** Appends a ledger row and moves the player's running totals. */
export const storeEntry = (store, player, kind, amount, roundId, now) => {
  const entry = {
    id: nextId('e'),
    at: isoAt(now),
    playerId: player.id,
    playerName: player.name,
    kind,
    amount,
    roundId: roundId || null
  }
  store.ledger.push(entry)
  player.balance += amount
  if (kind === 'grant' || kind === 'carry') player.granted += amount
  if (kind === 'stake') {
    player.staked += -amount
    player.bets += 1
  }
  if (kind === 'refund') {
    player.staked -= amount
    player.bets -= 1
  }
  if (kind === 'payout') {
    player.paidOut += amount
    player.wins += 1
  }
  player.net = player.balance - player.granted
  storeMark()
  return entry
}

/**
 * Keeps the store bounded. Dropped rounds take their bets and ledger rows
 * with them; each player's dropped ledger amounts collapse into one carry
 * row so the sum of the ledger still equals every balance.
 */
export const storePrune = (store, dropCount, now) => {
  const excess = dropCount != null ? dropCount : store.rounds.length - DEMO_STORE_MAX_ROUNDS
  if (excess <= 0) return
  const dropped = store.rounds.splice(0, excess)
  const ids = {}
  for (const r of dropped) ids[r.id] = true
  store.bets = store.bets.filter((b) => !ids[b.roundId])
  const carry = {}
  const names = {}
  store.ledger = store.ledger.filter((e) => {
    if (e.roundId && ids[e.roundId]) {
      carry[e.playerId] = (carry[e.playerId] || 0) + e.amount
      names[e.playerId] = e.playerName
      return false
    }
    return true
  })
  for (const pid of Object.keys(carry)) {
    if (carry[pid] === 0) continue
    store.ledger.push({
      id: nextId('e'),
      at: isoAt(now),
      playerId: pid,
      playerName: names[pid],
      kind: 'carry',
      amount: carry[pid],
      roundId: null
    })
  }
  storeMark()
}

export const storeFindRound = (store, roundId) => {
  for (let i = store.rounds.length - 1; i >= 0; i--) {
    if (store.rounds[i].id === roundId) return store.rounds[i]
  }
  return null
}

export const storeRoundIsOpen = (row) => !!row && row.phase !== 'ended' && row.phase !== 'voided'

/**
 * Refunds every stake of a round that never settled (page closed, game
 * exited) and marks it voided, so the ledger stays at zero per round.
 */
export const storeVoidRound = (store, row, now) => {
  if (!storeRoundIsOpen(row)) return
  for (const b of store.bets) {
    if (b.roundId !== row.id) continue
    const player = storePlayer(store, b.playerId, b.playerName, b.isBot, false)
    storeEntry(store, player, 'refund', STAKE, row.id, now)
  }
  row.phase = 'voided'
  row.settledAt = isoAt(now)
  row.winners = 0
  row.payout = 0
  row.house = 0
  row.prize = 0
  row.multiplier = null
  row.conservationOk = true
  storeMark()
}

export const storeAbandonCurrent = (now) => {
  const row = engineData.demoRoundRow
  engineData.demoRoundRow = null
  if (!row || !engineData.store) return
  storeVoidRound(engineData.store, row, now)
  const human = storePlayer(engineData.store, demoPlayerId(), DEMO_PLAYER_NAME, false, false)
  engineData.demo.balance = human.balance
  // The refund is visible immediately — the balance is what the ledger says.
  updateState({ balance: human.balance })
  storeFlush()
}

/**
 * Demo persistence boot. Idempotent. Voids orphaned rounds from a previous
 * page, grants the human 200 chips once (per stable player id), and adopts
 * the persisted balance.
 */
export const demoStoreBoot = () => {
  if (engineData.storeBooted) return
  engineData.storeBooted = true
  const store = storeLoad()
  const now = Date.now()
  for (const row of store.rounds) storeVoidRound(store, row, now)
  const id = demoPlayerId()
  let human = null
  for (const p of store.players) if (p.id === id) human = p
  if (!human) {
    human = storePlayer(store, id, DEMO_PLAYER_NAME, false, false)
    storeEntry(store, human, 'grant', START_BALANCE, null, now)
  } else if (human.balance < STAKE) {
    // Demo courtesy: a busted human gets a fresh 200 on the next visit.
    storeEntry(store, human, 'grant', START_BALANCE, null, now)
  }
  storePlayer(store, HOUSE_PLAYER_ID, HOUSE_PLAYER_NAME, false, true)
  engineData.demo.balance = human.balance
  storeMark()
  storeFlush()
  if (!engineData.storeUnloadHooked && typeof addEventListener === 'function') {
    engineData.storeUnloadHooked = true
    addEventListener('pagehide', () => {
      storeFlush()
    })
  }
}

export const storeRoundOpen = (game, round, now) => {
  const store = storeLoad()
  if (engineData.demoRoundRow && storeRoundIsOpen(engineData.demoRoundRow)) {
    storeVoidRound(store, engineData.demoRoundRow, now)
  }
  const row = {
    id: round.id,
    gameSlug: game.slug,
    gameTitle: game.title,
    roundIndex: round.index,
    startedAt: isoAt(now),
    settledAt: null,
    phase: 'preview',
    winner: null,
    offsets: [],
    unit: game.resultUnit,
    readings: [],
    players: 0,
    pot: 0,
    prize: null,
    winners: null,
    payout: null,
    multiplier: null,
    house: null,
    conservationOk: null,
    sealed: true,
    lockedAt: null,
    revealedAt: null,
    frozen: null,
    stake: STAKE
  }
  store.rounds.push(row)
  engineData.demoRoundRow = row
  storePrune(store, null, now)
  storeMark()
  return row
}

export const storeRoundPhase = (phase, now) => {
  const row = engineData.demoRoundRow
  if (!row) return
  row.phase = phase
  storeMark()
}

/** A bet row plus its stake row. Returns the player (with the new balance). */
export const storeBet = (playerId, name, isBot, side, now) => {
  const store = storeLoad()
  const row = engineData.demoRoundRow
  if (!row || !storeRoundIsOpen(row)) return null
  const player = storePlayer(store, playerId, name, isBot, false)
  if (isBot && player.balance < STAKE) storeEntry(store, player, 'grant', START_BALANCE, null, now)
  store.bets.push({
    id: `${row.id}:${playerId}`,
    roundId: row.id,
    playerId,
    playerName: name,
    isBot: !!isBot,
    side,
    won: null,
    payout: null,
    placedAt: isoAt(now)
  })
  storeEntry(store, player, 'stake', -STAKE, row.id, now)
  row.players += 1
  row.pot += STAKE
  storeMark()
  return player
}

export const storeRoundLock = (frozen, now) => {
  const row = engineData.demoRoundRow
  if (!row) return
  row.phase = 'locked'
  row.lockedAt = isoAt(now)
  row.frozen = { playerCount: frozen.playerCount, pot: frozen.pot }
  storeMark()
  storeFlush()
}

/**
 * Settlement persisted: the round row, per-bet outcomes, payout rows for the
 * winners and ONE rake row to the house for pot minus payouts. The ledger for
 * the round therefore sums to zero. A voided duel (§3.2 — dead heat, or no
 * bet on the winner) writes a refund row per bet instead and no rake row;
 * the round still nets to zero. Returns the human player row.
 */
export const storeRoundSettle = (script, winner, settlement, now) => {
  const store = storeLoad()
  const row = engineData.demoRoundRow
  if (!row) return null
  const at = isoAt(now)
  row.phase = settlement.voided ? 'voided' : 'ended'
  row.winner = winner
  row.offsets = script.attempts.map((a) => a.offset)
  row.readings = script.attempts.map((a) => a.readings.join(' / '))
  row.players = settlement.playerCount
  row.pot = settlement.pot
  row.prize = settlement.prize
  row.winners = settlement.winnerCount
  row.payout = settlement.payout
  row.multiplier = settlement.multiplier
  row.house = settlement.houseTake
  row.sealed = false
  row.revealedAt = at
  row.settledAt = at

  const byPlayer = {}
  for (const b of store.bets) if (b.roundId === row.id) byPlayer[b.playerId] = b
  let paid = 0
  for (const e of settlement.entries || []) {
    const pid = e.mine ? demoPlayerId() : botPlayerId(e.name)
    const bet = byPlayer[pid]
    if (!bet) continue
    bet.won = settlement.voided ? null : !!e.won
    bet.refunded = !!e.refunded
    bet.payout = e.won ? settlement.payout : 0
    if (e.refunded) {
      const player = storePlayer(store, pid, bet.playerName, bet.isBot, false)
      storeEntry(store, player, 'refund', STAKE, row.id, now)
    } else if (e.won) {
      const player = storePlayer(store, pid, bet.playerName, bet.isBot, false)
      storeEntry(store, player, 'payout', settlement.payout, row.id, now)
      paid += settlement.payout
    }
  }
  if (!settlement.voided) {
    const rake = row.pot - paid
    if (row.pot > 0) {
      const house = storePlayer(store, HOUSE_PLAYER_ID, HOUSE_PLAYER_NAME, false, true)
      storeEntry(store, house, 'rake', rake, row.id, now)
    }
    row.conservationOk = settlement.conserved === true && rake === settlement.houseTake
  } else {
    row.conservationOk = settlement.conserved === true
  }
  engineData.demoRoundRow = null
  storeMark()
  storeFlush()
  return storePlayer(store, demoPlayerId(), DEMO_PLAYER_NAME, false, false)
}

// ---- game active flags (demo management) ----------------------------------

export const demoGameFlags = () => {
  if (engineData.demoGameFlags) return engineData.demoGameFlags
  let flags = null
  try {
    const raw = lsGet(DEMO_GAMES_KEY)
    flags = raw ? JSON.parse(raw) : null
  } catch (err) {
    flags = null
  }
  engineData.demoGameFlags = flags && typeof flags === 'object' ? flags : {}
  return engineData.demoGameFlags
}

export const demoGameActive = (slug) => {
  const flags = demoGameFlags()
  return flags[slug] !== false
}

export const demoSetGameActive = (slug, active) => {
  const flags = demoGameFlags()
  flags[slug] = !!active
  lsSet(DEMO_GAMES_KEY, JSON.stringify(flags))
  updateState({ games: demoGameList() })
}

/** What the picker gets: [{ slug, title, active }]. */
export const demoGameList = () =>
  Object.keys(DEMO_GAMES).map((slug) => ({
    slug,
    title: DEMO_GAMES[slug].title,
    active: demoGameActive(slug)
  }))

// ---------------------------------------------------------------------------
// WORKSPACE data layer — state.ws (scratchpad WS_CONTRACT.md, docs/workspace.md)
//
// Two adapters behind one loader. demo reads the store above plus the live
// engine state; server calls the ws_* RPCs. Neither computes a payout: the
// dashboard renders what the source recorded. The functions/index.js
// wrappers (wsBoot, wsOpen, ...) call the wk* functions here.
// ---------------------------------------------------------------------------

export const WS_VIEWS = ['overview', 'live', 'rounds', 'round', 'bets', 'players', 'ledger', 'games', 'integrity']
export const WS_LIVE_TICK_MS = 1000
export const WS_SERIES_LIMIT = 40
export const WS_ROWS_LIMIT = 2000
export const WS_ROUNDS_LIMIT = 200
export const WS_PATH = '/workspace'

export const wsDefault = () => ({
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
})

export const wkData = () => {
  if (!engineData.ws.data) engineData.ws.data = wsDefault()
  return engineData.ws.data
}

/** Pushes the canonical ws object into root state (a fresh shallow copy). */
export const wkCommit = () => {
  updateState({ ws: Object.assign({}, wkData()) })
}

export const wkSetError = (message) => {
  wkData().error = message
  wkCommit()
}

// ---- helpers ----------------------------------------------------------------

export const camelKey = (k) => k.replace(/_([a-z0-9])/g, (m, c) => c.toUpperCase())

/** snake_case → camelCase, deep. Server rows arrive either way. */
export const camelize = (value) => {
  if (Array.isArray(value)) return value.map((x) => camelize(x))
  if (value && typeof value === 'object') {
    const out = {}
    for (const k of Object.keys(value)) out[camelKey(k)] = camelize(value[k])
    return out
  }
  return value
}

export const numOr = (v, fallback) => {
  if (v == null || v === '') return fallback
  const n = Number(v)
  return isFinite(n) ? n : fallback
}

export const round2 = (n) => Math.round(n * 100) / 100

export const isMissingRpc = (err) => {
  const code = err && err.code
  const msg = String((err && err.message) || '')
  return code === 'PGRST202' || code === '42883' || /could not find the function|does not exist/i.test(msg)
}

// ---- live (engine state, no network) ---------------------------------------

export const wkLiveNow = () => {
  const s = engineData.rootState
  if (!s || s.screen !== 'playing' || !s.round || !s.game) return []
  return [{
    gameSlug: s.game.slug,
    gameTitle: s.game.title,
    roundIndex: s.round.index,
    phase: s.phase,
    lockAt: s.round.lockAt,
    secondsLeft: s.secondsLeft || 0,
    playerCount: s.playerCount || 0,
    pot: s.pot || 0,
    frozen: s.frozen ? { playerCount: s.frozen.playerCount, pot: s.frozen.pot } : null
  }]
}

export const wkLiveTick = () => {
  if (typeof location !== 'undefined' && location.pathname.indexOf(WS_PATH) !== 0) {
    wkStop()
    return
  }
  const data = wkData()
  const next = wkLiveNow()
  if (JSON.stringify(next) === JSON.stringify(data.live)) return
  data.live = next
  wkCommit()
}

export const wkStartTicker = () => {
  wkStop()
  engineData.ws.ticker = setInterval(() => {
    wkLiveTick()
  }, WS_LIVE_TICK_MS)
}

export const wkStop = () => {
  if (engineData.ws.ticker) {
    clearInterval(engineData.ws.ticker)
    engineData.ws.ticker = null
  }
}

// ---- demo adapter -----------------------------------------------------------

export const wkDemoRoundOut = (row) => ({
  id: row.id,
  gameSlug: row.gameSlug,
  gameTitle: row.gameTitle,
  roundIndex: row.roundIndex,
  startedAt: row.startedAt,
  settledAt: row.settledAt,
  phase: row.phase,
  result: row.sealed ? null : (row.winner == null ? null : row.winner),
  offsets: row.sealed ? [] : (row.offsets || []).slice(),
  unit: row.unit,
  readings: row.sealed ? [] : (row.readings || []).slice(),
  players: row.players,
  pot: row.pot,
  prize: row.prize,
  winners: row.winners,
  payout: row.payout,
  multiplier: row.multiplier,
  house: row.house,
  conservationOk: row.conservationOk,
  sealed: row.sealed !== false,
  lockedAt: row.lockedAt || null,
  revealedAt: row.revealedAt || null,
  frozen: row.frozen ? { playerCount: row.frozen.playerCount, pot: row.frozen.pot } : null
})

/** Sealed rows carry no side, outcome or payout (integrity.md §5.2). */
export const wkDemoBetOut = (bet, sealed) => ({
  id: bet.id,
  roundId: bet.roundId,
  playerId: bet.playerId,
  playerName: bet.playerName,
  isBot: !!bet.isBot,
  side: sealed ? null : bet.side,
  won: sealed ? null : bet.won,
  refunded: sealed ? null : !!bet.refunded,
  payout: sealed ? null : bet.payout,
  placedAt: bet.placedAt
})

export const wkDemoSealedMap = (store) => {
  const map = {}
  for (const r of store.rounds) map[r.id] = r.sealed !== false
  return map
}

export const wkDemoRounds = () => {
  const store = storeLoad()
  return store.rounds.slice().reverse().map((x) => wkDemoRoundOut(x))
}

export const wkDemoBets = (filter) => {
  const store = storeLoad()
  const f = filter || {}
  const sealed = wkDemoSealedMap(store)
  const slugOf = {}
  for (const r of store.rounds) slugOf[r.id] = r.gameSlug
  const out = []
  for (let i = store.bets.length - 1; i >= 0 && out.length < WS_ROWS_LIMIT; i--) {
    const b = store.bets[i]
    if (f.roundId && b.roundId !== f.roundId) continue
    if (f.playerId && b.playerId !== f.playerId) continue
    if (f.gameSlug && slugOf[b.roundId] !== f.gameSlug) continue
    const isSealed = sealed[b.roundId] !== false
    if (f.won === true && (isSealed || b.won !== true)) continue
    if (f.won === false && (isSealed || b.won !== false)) continue
    out.push(wkDemoBetOut(b, isSealed))
  }
  return out
}

export const wkDemoPlayers = () => {
  const store = storeLoad()
  return store.players
    .map((p) => ({
      id: p.id,
      name: p.name,
      isBot: !!p.isBot,
      isHouse: !!p.isHouse,
      balance: p.balance,
      bets: p.bets,
      wins: p.wins,
      staked: p.staked,
      paidOut: p.paidOut,
      net: p.net
    }))
    .sort((a, b) => b.balance - a.balance)
}

export const wkDemoLedger = (filter) => {
  const store = storeLoad()
  const f = filter || {}
  const out = []
  for (let i = store.ledger.length - 1; i >= 0 && out.length < WS_ROWS_LIMIT; i--) {
    const e = store.ledger[i]
    if (f.kind && e.kind !== f.kind) continue
    if (f.playerId && e.playerId !== f.playerId) continue
    if (f.roundId && e.roundId !== f.roundId) continue
    out.push({
      id: e.id,
      at: e.at,
      playerId: e.playerId,
      playerName: e.playerName,
      kind: e.kind,
      amount: e.amount,
      roundId: e.roundId
    })
  }
  return out
}

/** Σ ledger per player vs the player's running balance. */
export const wkDemoLedgerAudit = () => {
  const store = storeLoad()
  const sums = {}
  for (const e of store.ledger) sums[e.playerId] = (sums[e.playerId] || 0) + e.amount
  const rows = store.players.map((p) => {
    const ledgerSum = sums[p.id] || 0
    return { playerId: p.id, playerName: p.name, ledgerSum, balance: p.balance, ok: ledgerSum === p.balance }
  })
  for (const pid of Object.keys(sums)) {
    if (!store.players.some((p) => p.id === pid)) {
      rows.push({ playerId: pid, playerName: pid, ledgerSum: sums[pid], balance: null, ok: false })
    }
  }
  return { rows, allOk: rows.every((r) => r.ok) }
}

/** Per-round conservation FROM THE LEDGER: stakes + payouts + rake (+ refunds) = 0. */
export const wkDemoConservation = () => {
  const store = storeLoad()
  const sums = {}
  const paid = {}
  for (const e of store.ledger) {
    if (!e.roundId) continue
    sums[e.roundId] = (sums[e.roundId] || 0) + e.amount
    if (e.kind === 'payout' || e.kind === 'rake') paid[e.roundId] = (paid[e.roundId] || 0) + e.amount
  }
  const rows = []
  for (const r of store.rounds) {
    if (storeRoundIsOpen(r)) continue
    const sum = sums[r.id] || 0
    const out = paid[r.id] || 0
    const ok = sum === 0 && (r.phase === 'voided' ? true : out === r.pot)
    rows.push({ roundId: r.id, phase: r.phase, ledgerSum: sum, pot: r.pot, paidPlusRake: out, ok })
  }
  return rows
}

export const wkDemoOverview = () => {
  const store = storeLoad()
  const ended = store.rounds.filter((r) => r.phase === 'ended')
  let staked = 0
  let paidOut = 0
  let houseTake = 0
  for (const e of store.ledger) {
    if (e.kind === 'stake') staked += -e.amount
    else if (e.kind === 'refund') staked -= e.amount // a voided round's stakes went back
    else if (e.kind === 'payout') paidOut += e.amount
    else if (e.kind === 'rake') houseTake += e.amount
  }
  const mults = ended.map((r) => r.multiplier).filter((m) => m != null)
  const conservation = wkDemoConservation()
  const breaches = conservation.filter((c) => !c.ok).length
  return {
    rounds: ended.length,
    bets: store.bets.length,
    staked,
    paidOut,
    houseTake,
    players: store.players.filter((p) => !p.isHouse).length,
    avgMultiplier: mults.length ? round2(mults.reduce((a, b) => a + b, 0) / mults.length) : null,
    bestMultiplier: mults.length ? Math.max.apply(null, mults) : null,
    conservationOk: breaches === 0,
    breaches
  }
}

export const wkSeriesLabel = (r, seq) => `${String(r.gameTitle || r.gameSlug || '?').charAt(0)}${r.roundIndex}·${seq}`

export const wkDemoSeries = () => {
  const store = storeLoad()
  const ended = store.rounds.filter((r) => r.phase === 'ended')
  const start = Math.max(0, ended.length - WS_SERIES_LIMIT)
  const potByRound = []
  const multiplierByRound = []
  const playersByRound = []
  for (let i = start; i < ended.length; i++) {
    const r = ended[i]
    const label = wkSeriesLabel(r, i + 1)
    potByRound.push({ label, value: r.pot, roundId: r.id })
    multiplierByRound.push({ label, value: r.multiplier == null ? 0 : r.multiplier, roundId: r.id })
    playersByRound.push({ label, value: r.players, roundId: r.id })
  }
  return { potByRound, multiplierByRound, playersByRound }
}

export const wkDemoRoundDetail = (roundId) => {
  const store = storeLoad()
  const row = storeFindRound(store, roundId)
  if (!row) return null
  const sealed = row.sealed !== false
  const bets = []
  const counts = { 1: 0, 2: 0 }
  for (const b of store.bets) {
    if (b.roundId !== roundId) continue
    bets.push(wkDemoBetOut(b, sealed))
    if (!sealed && (b.side === 1 || b.side === 2)) counts[b.side] += 1
  }
  // Sealed: no split at all. Unsealed: both sides, even when one is empty.
  const sides = sealed ? [] : [{ side: 1, count: counts[1] }, { side: 2, count: counts[2] }]
  return { round: wkDemoRoundOut(row), sides, bets }
}

/** A duel script in the workspace's shape (WsScriptTimeline child state). */
export const wkScriptOut = (sc) => ({
  id: sc.id,
  lockAt: sc.lockAt,
  reveal1At: sc.revealAt[0],
  reveal2At: sc.revealAt[1],
  endAt: sc.endAt,
  winner: duelWinner(sc.attempts),
  attempts: sc.attempts.map((a) => ({ side: a.side, offset: a.offset, readings: a.readings.slice() }))
})

export const wkDemoGames = () =>
  Object.keys(DEMO_GAMES).map((slug) => {
    const g = DEMO_GAMES[slug]
    return {
      slug,
      title: g.title,
      active: demoGameActive(slug),
      sides: CHALLENGERS.length,
      unit: g.resultUnit,
      videoSrc: videoSrcFor(g.videoFile, false),
      scripts: (ROUND_SCRIPTS[slug] || []).map((x) => wkScriptOut(x))
    }
  })

export const wkDemoIntegrity = () => {
  const store = storeLoad()
  const checks = []

  checks.push({
    id: 'result_hidden',
    label: 'Result hidden pre-reveal',
    status: 'na',
    detail: 'Demo mode settles locally from a scripted result. There is no RLS-gated round_results row to test; the adapter seals guesses and results until the round reveals, but that is a client courtesy, not a guarantee.'
  })

  const locked = store.rounds.filter((r) => r.lockedAt)
  if (!locked.length) {
    checks.push({ id: 'no_late_bets', label: 'No bet after lock', status: 'na', detail: 'No round has locked yet.' })
  } else {
    const lockAt = {}
    for (const r of locked) lockAt[r.id] = Date.parse(r.lockedAt)
    let late = 0
    let checked = 0
    for (const b of store.bets) {
      if (lockAt[b.roundId] == null) continue
      checked += 1
      if (Date.parse(b.placedAt) > lockAt[b.roundId]) late += 1
    }
    checks.push({
      id: 'no_late_bets',
      label: 'No bet after lock',
      status: late ? 'fail' : 'pass',
      detail: late
        ? `${late} of ${checked} bets were stamped after their round's lock time.`
        : `${checked} bets across ${locked.length} locked rounds, none stamped after the lock.`
    })
  }

  const cons = wkDemoConservation()
  if (!cons.length) {
    checks.push({ id: 'conservation', label: 'Conservation per round', status: 'na', detail: 'No round has settled yet.' })
  } else {
    const bad = cons.filter((c) => !c.ok)
    checks.push({
      id: 'conservation',
      label: 'Conservation per round',
      status: bad.length ? 'fail' : 'pass',
      detail: bad.length
        ? `${bad.length} of ${cons.length} settled rounds do not sum to zero in the ledger: ${bad.map((c) => c.roundId).slice(0, 3).join(', ')}`
        : `${cons.length} settled rounds; stakes + payouts + rake = 0 in the ledger for every one, and payouts + rake = pot.`
    })
  }

  const audit = wkDemoLedgerAudit()
  const badRows = audit.rows.filter((r) => !r.ok)
  checks.push({
    id: 'ledger_balances',
    label: 'Ledger = balances',
    status: audit.rows.length ? (audit.allOk ? 'pass' : 'fail') : 'na',
    detail: audit.rows.length
      ? (audit.allOk
        ? `Σ ledger equals the running balance for all ${audit.rows.length} players.`
        : `${badRows.length} players differ: ${badRows.map((r) => `${r.playerName} (${r.ledgerSum} vs ${r.balance})`).slice(0, 3).join(', ')}`)
      : 'No players recorded yet.'
  })

  checks.push({
    id: 'settle_idempotent',
    label: 'Settlement idempotent',
    status: 'na',
    detail: 'Demo settles each round exactly once in memory when the footage reveals the result. There is no settle_round RPC to call twice; the server check runs in tests/integrity.sh.'
  })

  return checks
}

// ---- server adapter ---------------------------------------------------------

export const wkRpcArgs = (args, prefixed) => {
  const out = {}
  for (const k of Object.keys(args || {})) out[prefixed ? `p_${k}` : k] = args[k]
  return out
}

/**
 * Calls a ws_* RPC. Tries the p_-prefixed argument names this schema uses
 * for its other RPCs first, then the bare names from docs/workspace.md.
 */
export const wkRpc = async (name, args) => {
  await authReady()
  const supabase = await getSupabase()
  const hasArgs = args && Object.keys(args).length > 0
  let res = await supabase.rpc(name, hasArgs ? wkRpcArgs(args, true) : {})
  if (res.error && hasArgs && isMissingRpc(res.error)) {
    res = await supabase.rpc(name, wkRpcArgs(args, false))
  }
  if (res.error) throw res.error
  return camelize(res.data)
}

export const wkServerMe = async () => {
  const me = await wkRpc('ws_me', {})
  return { userId: me ? me.userId : null, isStaff: !!(me && me.isStaff), isAdmin: !!(me && me.isAdmin) }
}

/** The server keeps the side in `guess` (1 or 2). Sealed rows have it null. */
export const wkServerBetOut = (b) => {
  const sealed = b.guess == null
  return {
    id: b.id,
    roundId: b.roundId,
    playerId: b.playerId,
    playerName: b.playerName,
    isBot: !!b.isBot,
    side: sealed ? null : normalizeSide(b.guess),
    won: sealed ? null : (b.won == null ? null : b.won),
    refunded: sealed ? null : !!b.refunded,
    payout: sealed ? null : (b.payout == null ? null : b.payout),
    placedAt: b.placedAt
  }
}

export const wkServerRoundOut = (r) => ({
  id: r.id,
  gameSlug: r.gameSlug,
  gameTitle: r.gameTitle,
  roundIndex: r.roundIndex,
  startedAt: r.startedAt || null,
  settledAt: r.settledAt || null,
  phase: r.phase,
  // result_value is the winning side for a duel: 1, 2, or 0 for a dead heat.
  result: r.result == null ? null : numOr(r.result, null),
  offsets: Array.isArray(r.offsets) ? r.offsets : [],
  unit: r.unit,
  readings: Array.isArray(r.readings) ? r.readings : [],
  players: numOr(r.players, 0),
  pot: numOr(r.pot, 0),
  prize: r.prize == null ? null : numOr(r.prize, null),
  winners: r.winners == null ? null : numOr(r.winners, null),
  payout: r.payout == null ? null : numOr(r.payout, null),
  multiplier: r.multiplier == null ? null : numOr(r.multiplier, null),
  house: r.house == null ? null : numOr(r.house, null),
  conservationOk: r.conservationOk == null ? null : !!r.conservationOk,
  sealed: r.sealed == null ? r.result == null : !!r.sealed
})

export const wkServerOverview = async () => {
  const o = (await wkRpc('ws_overview', {})) || {}
  const d = wsDefault().overview
  return {
    rounds: numOr(o.rounds, d.rounds),
    bets: numOr(o.bets, d.bets),
    staked: numOr(o.staked, d.staked),
    paidOut: numOr(o.paidOut, d.paidOut),
    houseTake: numOr(o.houseTake, d.houseTake),
    players: numOr(o.players, d.players),
    avgMultiplier: o.avgMultiplier == null ? null : numOr(o.avgMultiplier, null),
    bestMultiplier: o.bestMultiplier == null ? null : numOr(o.bestMultiplier, null),
    conservationOk: o.conservationOk == null ? true : !!o.conservationOk,
    breaches: numOr(o.breaches, 0)
  }
}

export const wkServerRounds = async () => {
  const rows = (await wkRpc('ws_rounds', { limit: WS_ROUNDS_LIMIT, offset: 0 })) || []
  return rows.map((x) => wkServerRoundOut(x))
}

export const wkSeriesFrom = (rounds) => {
  const settled = rounds.filter((r) => r.settledAt).slice().reverse()
  const start = Math.max(0, settled.length - WS_SERIES_LIMIT)
  const potByRound = []
  const multiplierByRound = []
  const playersByRound = []
  for (let i = start; i < settled.length; i++) {
    const r = settled[i]
    const label = wkSeriesLabel(r, i + 1)
    potByRound.push({ label, value: r.pot, roundId: r.id })
    multiplierByRound.push({ label, value: r.multiplier == null ? 0 : r.multiplier, roundId: r.id })
    playersByRound.push({ label, value: r.players, roundId: r.id })
  }
  return { potByRound, multiplierByRound, playersByRound }
}

export const wkServerRoundDetail = async (roundId) => {
  const d = await wkRpc('ws_round_detail', { round_id: roundId })
  if (!d) return null
  const round = d.round ? wkServerRoundOut(d.round) : null
  const bets = (d.bets || []).map((x) => wkServerBetOut(x))
  // ws_round_detail groups by `guess`, which for a duel is the side. A sealed
  // round returns [] and stays [] — the split is never rebuilt client-side.
  const counts = { 1: 0, 2: 0 }
  let unsealed = false
  for (const x of Array.isArray(d.distribution) ? d.distribution : []) {
    const side = normalizeSide(x.guess)
    if (!side) continue
    unsealed = true
    counts[side] += numOr(x.count, 0)
  }
  const sides = unsealed ? [{ side: 1, count: counts[1] }, { side: 2, count: counts[2] }] : []
  return { round, sides, bets }
}

export const wkServerBets = async (filter) => {
  const f = filter || {}
  const filters = {}
  if (f.gameSlug) filters.game_slug = f.gameSlug
  if (f.roundId) filters.round_id = f.roundId
  if (f.playerId) filters.player_id = f.playerId
  if (f.won === true || f.won === false) filters.won = f.won
  const rows = (await wkRpc('ws_bets', { filters })) || []
  return rows.map((x) => wkServerBetOut(x))
}

export const wkServerPlayers = async () => {
  const rows = (await wkRpc('ws_players', {})) || []
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    isBot: !!p.isBot,
    isHouse: !!p.isHouse,
    balance: numOr(p.balance, 0),
    bets: numOr(p.bets, 0),
    wins: numOr(p.wins, 0),
    staked: numOr(p.staked, 0),
    paidOut: numOr(p.paidOut, 0),
    net: numOr(p.net, 0)
  }))
}

export const wkServerLedger = async (filter) => {
  const f = filter || {}
  const filters = {}
  if (f.kind) filters.kind = f.kind
  if (f.playerId) filters.player_id = f.playerId
  if (f.roundId) filters.round_id = f.roundId
  const rows = (await wkRpc('ws_ledger', { filters })) || []
  return rows.map((e) => ({
    id: e.id,
    at: e.at,
    playerId: e.playerId,
    playerName: e.playerName,
    kind: e.kind,
    amount: numOr(e.amount, 0),
    roundId: e.roundId || null
  }))
}

export const wkServerLedgerAudit = async () => {
  const a = await wkRpc('ws_ledger_audit', {})
  const list = Array.isArray(a) ? a : (a && Array.isArray(a.rows) ? a.rows : [])
  const rows = list.map((r) => {
    const ledgerSum = numOr(r.ledgerSum, 0)
    const balance = r.balance == null ? null : numOr(r.balance, null)
    return { playerId: r.playerId, playerName: r.playerName, ledgerSum, balance, ok: r.ok == null ? ledgerSum === balance : !!r.ok }
  })
  const allOk = a && !Array.isArray(a) && a.allOk != null ? !!a.allOk : rows.every((r) => r.ok)
  return { rows, allOk }
}

export const wkServerGames = async () => {
  const rows = (await wkRpc('ws_games', {})) || []
  return rows.map((g) => ({
    slug: g.slug,
    title: g.title,
    active: g.active == null ? !!g.isActive : !!g.active,
    sides: CHALLENGERS.length,
    unit: g.unit || g.resultUnit || '',
    videoSrc: g.videoSrc || videoSrcFor(g.slug === 'water_200g' ? 'water' : 'banana', false),
    scripts: Array.isArray(g.scripts) ? g.scripts.map((x) => wkServerScriptOut(x)) : (ROUND_SCRIPTS[g.slug] || []).map((x) => wkScriptOut(x))
  }))
}

/** ws_games() script rows (camelized) → the WsScriptTimeline shape. */
export const wkServerScriptOut = (sc) => {
  const attempts = (Array.isArray(sc.attempts) ? sc.attempts : [])
    .map((a) => ({ side: normalizeSide(a.side), offset: numOr(a.offsetValue, 0), readings: Array.isArray(a.readings) ? a.readings : [] }))
    .filter((a) => a.side)
    .sort((a, b) => a.side - b.side)
  return {
    id: sc.id || `round_${sc.roundIndex}`,
    lockAt: numOr(sc.videoBetOpenS, 0),
    reveal1At: sc.videoReveal1S == null ? numOr(sc.videoRevealS, 0) : numOr(sc.videoReveal1S, 0),
    reveal2At: numOr(sc.videoRevealS, 0),
    endAt: numOr(sc.videoPauseS, 0),
    winner: sc.resultValue == null ? null : numOr(sc.resultValue, null),
    attempts
  }
}

export const wkServerIntegrity = async () => {
  const rows = (await wkRpc('ws_integrity', {})) || []
  return rows.map((c) => ({
    id: c.id,
    label: c.label || c.id,
    status: ['pass', 'fail', 'na', 'unknown'].indexOf(c.status) >= 0 ? c.status : 'unknown',
    detail: c.detail || ''
  }))
}

// ---- the loader -------------------------------------------------------------

export const wkIsServer = () => engineData.ws.source === 'server'

/** Server → demo for the rest of the session; the badge says so. */
export const wkFallbackToDemo = (err) => {
  engineData.ws.source = 'demo'
  demoStoreBoot()
  const data = wkData()
  data.source = 'demo'
  data.me = { userId: demoPlayerId(), isStaff: true, isAdmin: true }
  data.error = `Server analytics unavailable (${describeError(err)}). Showing demo data for this session.`
}

/** Loads one view into the ws object (does not commit). */
export const wkLoadInto = async (data, view) => {
  const server = wkIsServer()
  if (view === 'overview') {
    if (server) {
      const rounds = await wkServerRounds()
      data.overview = await wkServerOverview()
      data.series = wkSeriesFrom(rounds)
      data.rounds = rounds
    } else {
      data.overview = wkDemoOverview()
      data.series = wkDemoSeries()
    }
    data.live = wkLiveNow()
  } else if (view === 'live') {
    data.live = wkLiveNow()
  } else if (view === 'rounds') {
    data.rounds = server ? await wkServerRounds() : wkDemoRounds()
  } else if (view === 'round') {
    data.roundDetail = data.selectedRoundId
      ? (server ? await wkServerRoundDetail(data.selectedRoundId) : wkDemoRoundDetail(data.selectedRoundId))
      : null
  } else if (view === 'bets') {
    data.bets = server ? await wkServerBets(data.betsFilter) : wkDemoBets(data.betsFilter)
  } else if (view === 'players') {
    data.players = server ? await wkServerPlayers() : wkDemoPlayers()
  } else if (view === 'ledger') {
    data.ledger = server ? await wkServerLedger(data.ledgerFilter) : wkDemoLedger(data.ledgerFilter)
    data.ledgerAudit = server ? await wkServerLedgerAudit() : wkDemoLedgerAudit()
  } else if (view === 'games') {
    data.games = server ? await wkServerGames() : wkDemoGames()
  } else if (view === 'integrity') {
    data.integrity = server ? await wkServerIntegrity() : wkDemoIntegrity()
  }
}

export const wkLoadView = async (view) => {
  const data = wkData()
  const seq = ++engineData.ws.loadSeq
  data.loading = true
  data.error = null
  wkCommit()
  try {
    await wkLoadInto(data, view)
  } catch (err) {
    if (wkIsServer() && isMissingRpc(err)) {
      wkFallbackToDemo(err)
      try {
        await wkLoadInto(data, view)
      } catch (err2) {
        data.error = describeError(err2)
      }
    } else {
      data.error = describeError(err)
    }
  }
  if (seq !== engineData.ws.loadSeq) return
  data.loading = false
  data.lastRefresh = Date.now()
  wkCommit()
}

// ---- public entry points (wrapped by functions/index.js as ws*) -------------

export const wkBoot = async (el) => {
  if (!engineData.rootState && el) {
    engineData.rootState = typeof el.getRootState === 'function' ? el.getRootState() : el.state
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.__zse = engineData
    globalThis.__zseAudio = audioData
  }
  const data = wkData()
  if (WS_VIEWS.indexOf(data.view) < 0) data.view = 'overview'
  data.loading = true
  data.error = null
  wkCommit()

  const mode = await engineBoot()
  let source = mode
  let me = null
  if (mode === 'server') {
    try {
      me = await wkServerMe()
    } catch (err) {
      source = 'demo'
      data.error = `Server analytics unavailable (${describeError(err)}). Showing demo data for this session.`
    }
  }
  if (source === 'demo') {
    demoStoreBoot()
    me = { userId: demoPlayerId(), isStaff: true, isAdmin: true }
  }
  engineData.ws.source = source
  data.source = source
  data.me = me
  const keepError = data.error
  await wkLoadView(data.view)
  if (keepError && !data.error) {
    data.error = keepError
    wkCommit()
  }
  wkStartTicker()
  return source
}

export const wkOpen = (view) => {
  const data = wkData()
  data.view = WS_VIEWS.indexOf(view) >= 0 ? view : 'overview'
  return wkLoadView(data.view)
}

export const wkRefresh = () => wkLoadView(wkData().view)

export const wkSelectRound = (roundId) => {
  const data = wkData()
  data.selectedRoundId = roundId || null
  data.view = 'round'
  return wkLoadView('round')
}

export const wkSetBetsFilter = (partial) => {
  const data = wkData()
  data.betsFilter = Object.assign({ gameSlug: null, roundId: null, playerId: null, won: null }, data.betsFilter, partial || {})
  data.view = 'bets'
  return wkLoadView('bets')
}

export const wkSetLedgerFilter = (partial) => {
  const data = wkData()
  data.ledgerFilter = Object.assign({ kind: null, playerId: null, roundId: null }, data.ledgerFilter, partial || {})
  data.view = 'ledger'
  return wkLoadView('ledger')
}

/** Runs a management action; any raise/message lands in state.ws.error. */
export const wkManage = async (serverFn, demoFn) => {
  const data = wkData()
  data.error = null
  wkCommit()
  try {
    if (wkIsServer()) await serverFn()
    else await demoFn()
  } catch (err) {
    wkSetError(describeError(err))
    return false
  }
  await wkLoadView(data.view)
  return !data.error
}

export const wkSetGameActive = async (slug, active) => {
  const ok = await wkManage(
    () => wkRpc('ws_set_game_active', { slug, active: !!active }),
    () => { demoSetGameActive(slug, !!active) }
  )
  // The games list is management state; keep it current whatever view is open.
  const data = wkData()
  if (ok && data.view !== 'games') {
    try {
      data.games = wkIsServer() ? await wkServerGames() : wkDemoGames()
      wkCommit()
    } catch (err) {
      wkSetError(describeError(err))
    }
  }
  return ok
}

export const wkVoidRound = (roundId) =>
  wkManage(
    () => wkRpc('ws_void_round', { round_id: roundId }),
    () => { throw new Error('Not available in demo mode') }
  )

export const wkScheduleRound = (slug) =>
  wkManage(
    () => wkRpc('ws_schedule_round', { slug, starts_in: '60 seconds' }),
    () => { throw new Error('Not available in demo mode') }
  )

/** Clears the demo store and reboots persistence with a fresh 200-chip grant. */
export const wkResetDemo = async () => {
  const data = wkData()
  if (wkIsServer()) {
    wkSetError('Not available in server mode')
    return false
  }
  storeAbandonCurrent(Date.now())
  engineData.store = storeFresh()
  engineData.storeDirty = false
  engineData.storeBooted = false
  engineData.demoRoundRow = null
  engineData.demoGameFlags = {}
  lsRemove(DEMO_STORE_KEY)
  lsRemove(DEMO_GAMES_KEY)
  demoStoreBoot()
  updateState({ balance: engineData.demo.balance, games: demoGameList() })
  data.selectedRoundId = null
  data.roundDetail = null
  await wkLoadView(data.view)
  return true
}

// ---- CSV export -------------------------------------------------------------

export const csvCell = (v) => {
  if (v == null) return ''
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const toCsv = (rows) => {
  if (!rows || !rows.length) return ''
  const keys = []
  for (const r of rows) for (const k of Object.keys(r)) if (keys.indexOf(k) < 0) keys.push(k)
  const lines = [keys.join(',')]
  for (const r of rows) lines.push(keys.map((k) => csvCell(r[k])).join(','))
  return lines.join('\r\n')
}

export const wkRowsFor = (view) => {
  const data = wkData()
  if (view === 'overview') return [data.overview]
  if (view === 'live') return data.live
  if (view === 'rounds') return data.rounds
  if (view === 'round') return data.roundDetail ? data.roundDetail.bets : []
  if (view === 'bets') return data.bets
  if (view === 'players') return data.players
  if (view === 'ledger') return data.ledger
  if (view === 'games') return data.games
  if (view === 'integrity') return data.integrity
  return []
}

/** Builds the CSV for a view and triggers a download through a Blob URL. Returns the CSV. */
export const wkExportCsv = (view) => {
  const v = WS_VIEWS.indexOf(view) >= 0 ? view : wkData().view
  const csv = toCsv(wkRowsFor(v))
  try {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zse-${wkData().source || 'ws'}-${v}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      a.remove()
      URL.revokeObjectURL(url)
    }, 1000)
  } catch (err) {
    wkSetError(`CSV export failed: ${describeError(err)}`)
  }
  return csv
}

/** Root of the element tree — the router lives there. */
export const rootElementOf = (el) => {
  let cur = el
  while (cur && cur.parent && cur.parent.key !== undefined) cur = cur.parent
  return cur
}

export const wkBackToGame = (el) => {
  wkStop()
  const root = rootElementOf(el)
  if (root && typeof root.navigate === 'function') {
    root.navigate('/')
  } else if (root && typeof root.router === 'function') {
    // router(path, element, state, options) — the element argument is required.
    root.router('/', root, {}, { pushState: true })
  } else if (typeof location !== 'undefined') {
    location.assign('/')
  }
}
