# Architecture

How the product in `spec.md` maps onto this project's stack.

```
┌─ Symbols client (DOMQL) ───────────────────────────────┐
│  video element + overlay components                    │
│  server-time clock  ·  realtime subscription           │
│  PRESENTATION ONLY — holds no authority                │
└──────────────┬─────────────────────────────────────────┘
               │ supabase-js  (anon key, user JWT)
┌──────────────┴─────────────────────────────────────────┐
│  PostgREST      RLS = the security boundary            │
│  Realtime       aggregate broadcasts                   │
│  Auth           anonymous sign-in                      │
│  Postgres       settle_round()  ·  constraints         │
│  pg_cron        round creation  ·  settlement sweep     │
│  Storage/CDN    video segments                          │
└────────────────────────────────────────────────────────┘
```

## 1. Division of authority

The client renders. It never decides.

| Question | Answered by |
|---|---|
| What round is it? | Server timestamps |
| Is betting open? | Database, at insert time |
| What is the result? | `round_results`, after `result_visible_at` |
| Did I win, and how much? | `settle_round()` |
| What is my balance? | `chip_ledger` |

The client may *predict* any of these for smooth rendering. It may never
*assert* them. Crowdflip's client computed its own winnings; that is the single
biggest thing this rebuild removes.

## 2. Client: Symbols

Symbols is DOMQL — plain objects, reactive `(el, s)` functions, design-system
tokens. Conventions are in the repo `CLAUDE.md` and in `get_sdk_reference`.
Never invent them.

### 2.1 Component tree

```
GamePicker            two games, start screen
BettingStage
  VideoSurface        <video>, seek + play/pause, driven by server clock
  TimerChip           countdown; red under 5 s; "LOCKED" when locked
  ObjectiveBanner     PREVIEW + BETTING only
  CrowdCounter        player count + pot; FREEZES at lock
  BetPanel            guess selector + one PLACE BET button
  HistoryPanel        last 8 results
  ResultsCard         result, winners, multiplier, metadata
BalanceChip           always visible
```

### 2.2 State

Two stores, kept apart on purpose:

- **`serverState`** — rounds, bets, results, balance. Only ever written by a
  server response or a realtime event. Never optimistically.
- **`uiState`** — selected guess, panel open/closed, animation progress.
  Local, disposable.

Mixing them is how a client starts believing its own predictions. Keep the
boundary hard.

### 2.3 The clock

Never use the device clock for round state. Device clocks are wrong and users
can change them.

At load, measure the offset once:

```js
const t0 = Date.now()
const { data } = await supabase.rpc('server_now')
const rtt = Date.now() - t0
const offset = new Date(data).getTime() - (t0 + rtt / 2)
const serverNow = () => Date.now() + offset
```

Re-measure on reconnect. Drive every countdown from `serverNow()`.

This only makes the display honest. It is **not** a guarantee — the guarantee
is the `clock_timestamp()` check inside `place_bet()`, `integrity.md` §3. A
client whose clock says betting is open will still be rejected by the
database if it is not.

## 3. Realtime

Two channels per round.

**Aggregates — broadcast.** Player count and pot. From `round_stats()`, a
`SECURITY DEFINER` function that returns only `count()` and `sum(stake)` —
never a guess row. (Earlier drafts used a `security_invoker` view; run under
the caller's own RLS, that aggregate is subject to the same policy as any
other query on `bets` — own bet only, before reveal — so `count()` would
have returned `1` for every caller. See `decisions.md`, "Corrected".) Safe
to send to everyone.

**Own bet — postgres_changes, filtered.** `filter: user_id=eq.<uid>`. RLS
applies to realtime too, so another user's bet cannot arrive even if the filter
is wrong. Defence in depth.

**Never subscribe to `bets` unfiltered.** That is `integrity.md` §5.2 in
subscription form.

Realtime is a **latency optimisation, not a source of truth**. Reconcile
against a fetch at every phase change. A dropped message must not desynchronise
the round.

## 4. Video sync

Recorded video, server-scheduled rounds.

- PREVIEW and BETTING: paused at `video_bet_open_s`.
- At `betting_closes_at`: `video.play()`.
- Position is derived, not assumed:
  `pos = video_bet_open_s + (serverNow() − betting_closes_at)/1000`.
  If `|video.currentTime − pos| > 0.3`, seek. This survives tab-throttling and
  reconnects.
- At `video_pause_s`: pause and show the results card. Poll `timeupdate`,
  tolerance ±0.2 s.
- On load failure: show a clear error. Never hang silently.

**The scrubbing hole.** Serving the whole file lets a user seek to the result
during BETTING. `integrity.md` §5.3 has the options. Target is segmented HLS
with server-gated segments. Whole-file delivery is acceptable **only** for the
pitch demo and must not reach launch.

Source files are `.mov` (77 MB, 69 MB) — fine for a demo off local disk, too
large for a browser over a network. Transcode to H.264 MP4 and segment.

## 5. Scheduled work

Two `pg_cron` jobs. Neither is on the correctness path for the lock, because
state is derived (`integrity.md` §2).

**Round creation** — every minute. Ensures each active game has a scheduled
future round. Idempotent via `unique (game_id, round_index)`.

**Settlement sweep** — every 30 s. Calls `settle_round()` for rounds past
`result_visible_at` with `settled_at IS NULL`. Idempotent by construction, so
overlap is harmless.

If both jobs stop: existing rounds still lock correctly, results still hide
until `result_visible_at`, and payouts are late but not lost. Degradation is
graceful.

## 6. Bots

Simulated players are server-side rows in `bets` written by a
`SECURITY DEFINER` function, marked `profiles.is_bot = true`.

They must be **written before `betting_closes_at`**, like any other bet. A bot
that can bet after the lock destroys the product's only claim. The bot writer
gets no exemption from the lock.

Arrival curve, herd behaviour and crowd sizing are extracted from Crowdflip in
`reference-crowdflip.md`. The guess distribution itself — normal-ish around
0, stddev 8, clamped, a few outliers — is specified in `spec.md` §8.5, not
here: it is a payout-affecting parameter, not a presentation one.

Disclosure is an open product question — `spec.md` §8.4, `decisions.md`.

## 7. Environments

| | Purpose | Data |
|---|---|---|
| Local | Development | `supabase start`, needs Docker (not installed here) |
| Remote | Demo and launch | ref `xgvuavikubqwsdhoadyw`, ap-southeast-1 |

There is currently **no staging project**. The remote is the only deployed
environment, which means a bad migration hits the demo. Flagged in
`decisions.md`.

## 8. Deferred

- Real money. Nothing here handles value.
- Live streaming. The architecture anticipates it; §4 changes when it lands.
- Variable stakes. Would rewrite `game-rules.md` §2 entirely.
- Native clients.
