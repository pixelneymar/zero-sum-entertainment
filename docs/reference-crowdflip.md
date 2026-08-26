# Crowdflip engine reference

Source: `/Users/levan/crowdflip/index.html` (single-file demo, 1679 lines). All line
numbers below refer to that file as read on 2026-08-26. Engine logic lives in the
`CF` module between the `//<ENGINE>` / `//</ENGINE>` markers (lines 804-1035);
presentation/DOM logic follows in the second `<script>` block (lines 1038-1677).

This document is a factual extraction for a rebuild on Symbols + Supabase. Section 6
flags what must NOT be carried over as-is.

---

## 1. Round/phase state machine

Identifier: `PHASES` (line 1066).

```js
const PHASES = {REVEAL:2000, OPEN:25000, LOCK:5000, RESOLVE:5000};  // ms
```

Phases and durations:

| Phase | Duration | Purpose |
|---|---|---|
| REVEAL | 2.0 s | New round's emoji pair + word shown, betting disabled |
| OPEN | 25.0 s | Betting window; fake crowd arrives; book is "sealed" |
| LOCK | 5.0 s | Countdown ("Betting closed"); no new bets; book still sealed |
| RESOLVE | 5.0 s | Split revealed, verdict/chips/balance/statsheet animate in via internal beat timings |
| SETTLE | unbounded | Waits for the player to click "Next round" / press Enter |

There is a 5th implicit phase, `SETTLE`, set in `enterSettle()` (line 1548) but not
present in the `PHASES` object — it has no built-in duration; it blocks on user input.

Transition logic is a single `switch` inside the rAF loop `loop()` (lines 1218-1230):

```js
switch(R.phase){
  case 'REVEAL':  if(t >= PHASES.REVEAL) enterOpen(); break;
  case 'OPEN':    tickOpen(t, now); if(t >= PHASES.OPEN) enterLock(); break;
  case 'LOCK':    tickLock(t);      if(t >= PHASES.LOCK) enterResolve(); break;
  case 'RESOLVE': tickResolve(t);   if(t >= PHASES.RESOLVE) enterSettle(); break;
}
```

- `t` is `now - R.phaseStart`, i.e. elapsed time in the current phase (wall clock via
  `performance.now()`, driven purely by `requestAnimationFrame`, not a server timer).
- `REVEAL -> OPEN`: pure timeout, calls `enterOpen()` (line 1332), which enables the bet
  buttons (`setBetEnabled(true)`).
- `OPEN -> LOCK`: pure timeout, calls `enterLock()` (line 1339), which disables betting,
  visually stamps "LOCKED", but does **not** reveal the split yet — the book stays
  `sealed` (comment line 1345: "The book was already sealed all round; LOCK just takes
  the stamp over").
- `LOCK -> RESOLVE`: pure timeout, calls `enterResolve()` (line 1364), which is the
  single point where `R.sealed = false` (line 1372) and `CF.resolve(...)` is invoked
  (line 1382) to compute the outcome that is then displayed.
- `RESOLVE -> SETTLE`: pure timeout, calls `enterSettle()` (line 1548), which applies the
  balance delta as a safety net (line 1555) and shows the "Next round" button.
- `SETTLE -> next REVEAL`: player-driven only. `advance()` (lines 1570-1577) fires on
  `nextBtn` click or Enter keypress (lines 1624, 1635); it increments `G.i`, and either
  calls `showSummary()` if `G.i >= CF.ROUNDS` (line 1575) or `setTimeout(startRound, 260)`
  to begin the next round's REVEAL phase.
- `ROUNDS = 10` (line 806) — fixed session length; after round 10's SETTLE, `advance()`
  routes to `showSummary()` (line 1580) instead of starting another round.

Within `RESOLVE`, `tickResolve(t)` (lines 1418-1426) drives a fixed internal beat
sequence scaled by `k = PHASES.RESOLVE/5000` (so it stays proportional if `PHASES` is
retimed via the `CFDEV.fast()` dev hook, line 1672):
- `t>=500k` → `showVerdict(res)`
- `t>=1000k` → `flowChips(res)` (chip-flight animation, skipped if void)
- `t>=1500k` → `applyRoundDelta()` (actual balance change)
- `t>=2000k` → `showStatsheet(res)`
- `t>=3400k` → fade the verdict overlay

All state (`G`, `R`) is plain in-memory JS — no persistence, no server round-trip
anywhere in the state machine.

---

## 2. Crowd/bot arrival model

### 2a. Total player count per round

Identifiers: `CROWD_BANDS`, `CROWD_CAP`, `drawCrowd`.

```js
const CROWD_CAP = 500;                              // line 807
const CROWD_BANDS = [                                // lines 864-869
  {w:25, lo:40,  hi:90,  name:'Quiet room'},
  {w:45, lo:90,  hi:200, name:'Normal'},
  {w:20, lo:200, hi:350, name:'Busy'},
  {w:10, lo:350, hi:500, name:'Packed'}
];
const drawCrowd = () => {
  const b = weighted(CROWD_BANDS);
  return {n: Math.min(CROWD_CAP, Math.round(rrange(b.lo,b.hi))), band:b.name};
};                                                     // line 880
```

`weighted()` (lines 856-861) does a standard cumulative-weight pick. So each round
independently rolls a band by weight (25/45/20/10 out of 100), then a uniform random
integer inside that band's `[lo,hi]`, capped at 500. This total (`plan.crowdN`) is fixed
once, in `makeRounds()` (called once per round, line 911), **before the OPEN phase ever
starts** — it does not grow or shrink based on anything that happens live.

### 2b. Minority share target (which drives the multiplier)

Identifiers: `SHARE_BANDS`, `BIG_BAND`, `drawShare`.

```js
// minority_share -> multiplier = 0.95 / share                      // line 870
const SHARE_BANDS = [                                                // lines 871-877
  {w:40, lo:0.38, hi:0.47, name:'tight'},
  {w:30, lo:0.28, hi:0.38, name:'standard'},
  {w:18, lo:0.20, hi:0.28, name:'satisfying'},
  {w:9,  lo:0.12, hi:0.20, name:'rare'},
  {w:3,  lo:0.08, hi:0.12, name:'screenshot'}
];
const BIG_BAND = SHARE_BANDS[4];                                     // line 878
const drawShare = (band) => {
  const b = band || weighted(SHARE_BANDS);
  return {share: clamp(rrange(b.lo,b.hi),0.08,0.49), band:b.name};
};                                                                    // line 881
```

`share` is picked the same way as crowd size — one weighted band roll per round, then a
uniform draw inside it, clamped to `[0.08, 0.49]`. This `share` is the **target**
fraction of the crowd that will end up on the minority side; see §3 for how it becomes
the multiplier and §4 for the forced "screenshot" round.

### 2c. Arrival curve over the 25 s betting window

Identifier: `arrivalCdf` (lines 883-890).

```js
function arrivalCdf(tSec){
  const t = clamp(tSec, 0, 25);
  if(t <= 8)  return 0.40 * Math.pow(t/8, 0.72);
  if(t <= 21) return 0.40 + 0.40 * ((t-8)/13);
  return 0.80 + 0.20 * Math.pow((t-21)/4, 1.35);
}
```

This is a CDF normalized to a fixed 25-second reference window regardless of the actual
configured `PHASES.OPEN`: front-loaded burst (0→40% of the crowd arrives in the first
8 s, on a `t^0.72` curve — fast then flattening), a linear "steady trickle" (40%→80%
over the next 13 s, i.e. seconds 8-21), then a "surge" in the final 4 s (80%→100% on a
`t^1.35` curve — accelerating).

In `tickOpen(t, now)` (lines 1246-1272), actual elapsed OPEN-phase time is rescaled to
this 25 s reference:

```js
const target = Math.floor(plan.crowdN * CF.arrivalCdf((t / PHASES.OPEN) * 25));
```

Arrivals are released in bursts, not one at a time: if `target` exceeds
`c.arrived` (the running counter) and the current time has passed `R.nextRelease`, a
burst of `max(1, round(deficit * rrange(0.55, 1.0)))` new bettors is admitted in one
tick, each individually routed through `CF.pickSide()` (line 1259). The next release is
scheduled `rrange(130, 420)` ms later (line 1262) — this is what makes the on-screen
counter jump in visible chunks rather than tick smoothly.

### 2d. Herd/clustering behaviour (the live split path)

Identifiers: `HERD`, `HERD_TAU`, `pickSide`, `newCrowd`.

```js
const HERD = 0.13;      // line 808 — size of the herd pulse (path-only; cannot change the outcome)
const HERD_TAU = 0.20;  // line 809 — how fast the room stops copying the player
```

`newCrowd(plan)` (lines 930-953) is called once per round, immediately when the round
object is built (before OPEN starts), and it **permanently fixes the final split**:

```js
const minCount = clamp(Math.ceil(plan.crowdN * plan.share), 1, plan.crowdN-1);
const majCount = plan.crowdN - minCount;
```

`minCount`/`majCount` become `remMin`/`remMaj`, finite pools that are drained (never
refilled) as bettors "arrive." Because these are fixed at round-build time, **the final
minority/majority counts, and therefore the multiplier, are already decided before the
OPEN phase begins** — nothing during OPEN can move them.

`newCrowd()` also seeds the path-wobble parameters: `hold = min(0.72, plan.share*1.72)`
(how long the split stays near 50/50 before drifting to target), two independently
random-phased sine components (`phase1/freq1`, `phase2/freq2`, `freq` ranges
`[1.6,3.2]` and `[3.4,6.2]`), and a wobble amplitude `wobA` (`[0.12,0.18]` if
`share > 0.30` i.e. "tight," else `[0.10,0.16]`).

`pickSide(c, plan, herdSide)` (lines 956-987) decides, per arriving bettor, which side
(A/B) they join:

- If one pool is already exhausted, the arrival is forced into the other side (lines
  957-958) — no randomness left once a pool empties.
- Otherwise: `t = c.arrived / plan.crowdN` (progress through the crowd, 0..1).
- `ease` is 0 until `t > hold`, then a smoothstep ramp to 1 by `t=1` — this holds the
  visible split near a coin-flip for the "hold" fraction of arrivals, then converges it
  toward the true target share. Comment (line 941): converging too early would let a
  live-split-reading strategy ("back whoever is behind at half-time") win almost every
  round, so this window is deliberately load-bearing.
- `c.walk` is an exponentially-smoothed random walk: `walk = walk*0.945 + (rnd()-0.5)*0.026`.
- `wob` combines both sine components plus `walk`, damped by `(1 - ease*0.9)` as
  convergence approaches.
- **Herd pulse**: if the player has bet (`herdSide` = `R.playerSide`, passed in from
  `tickOpen` at line 1259), the first `pickSide` call after the bet records
  `c.herdT0 = t`. From then on:
  ```js
  const bump = HERD * Math.exp(-(t - c.herdT0) / HERD_TAU);
  herd = (herdSide === plan.minoritySide) ? bump : -bump;
  ```
  i.e. a decaying exponential pulse (time-constant `HERD_TAU = 0.20` of the crowd
  progress) added to (or subtracted from) the desired minority share `d`, oriented so
  the side the player picked appears to gain support right after they bet, then the
  effect fades. See §4 for what this actually does to the multiplier the player sees.
- `d = clamp(0.5 + (plan.share-0.5)*ease + wob + herd*(1-ease*0.75), 0.03, 0.97)` — the
  desired *cumulative* minority share at this point in time.
- `cur = c.cMin/c.arrived` (actual cumulative minority share so far).
- `p = clamp(0.5 + 7*(d - cur), 0.02, 0.98)` — probability this individual arrival takes
  the minority side, proportionally steered to close the gap between `d` and `cur`
  (gain factor 7).
- A coin flip against `p` decides the side; the corresponding pool (`remMin`/`remMaj`)
  is decremented and `cMin`/`cMaj`/`arrived` updated.

Net effect: total headcount and final minority/majority counts are fixed at round
start; everything in `pickSide` only shapes the *order* in which the two fixed-size
pools drain, producing a plausible-looking live wobble/crossover/converge animation.

---

## 3. Payout maths

Identifiers/constants at line 806, band comment at line 870, computation at lines
990-1024.

```js
const STAKE = 10, RAKE = 0.05, ROUNDS = 10, START_BALANCE = 100;   // line 806
```

- `STAKE = 10` ◆ — fixed stake per player per round (no bet sizing).
- `RAKE = 0.05` — 5% of the pot taken by the house.

`resolve(countA, countB, playerSide)` (lines 990-1024):

```js
const total = countA + countB;
const pot = total * STAKE;                          // line 992
```

Pot = total number of players who bet (either side) × 10. (Every bettor stakes exactly
`STAKE`, so `pot` is just `total * STAKE`.)

Void conditions (lines 995-1004): `total===0`, or `countA===countB` (tie), or
`countA===0`/`countB===0` (unanimous). In all void cases: `rake=0`, `prize=0`,
`payoutEach=0`, `multiplier=0`; if the player bet, `playerDelta = STAKE` (their stake is
refunded); outcome is `'void'` (tie/unanimous) or `'nobet'` (player never staked).

Otherwise (lines 1006-1023):

```js
const minoritySide  = countA < countB ? 0 : 1;
const minorityCount = Math.min(countA, countB);
const majorityCount = Math.max(countA, countB);
const rake        = pot * RAKE;
const prize       = pot - rake;
const payoutEach  = prize / minorityCount;
const multiplier  = payoutEach / STAKE;
```

Confirming `share` and the `0.95/share` identity in the code comment at line 870:
`prize = pot*(1-RAKE) = total*STAKE*0.95`. `payoutEach = prize/minorityCount =
total*STAKE*0.95/minorityCount`. `multiplier = payoutEach/STAKE =
0.95 * total/minorityCount = 0.95 / (minorityCount/total)`. So **`share` = the realized
minority side's fraction of the total headcount** (`minorityCount/total`), i.e. the same
quantity `plan.share` was a target for (§2b) — at resolve time it's recomputed from the
actual final `countA`/`countB`, which (per §2d) were pre-fixed to equal `plan.share`
(rounded up via `Math.ceil`) by round-build time.

Player result (lines 1014-1018):
- `playerSide === minoritySide` → `outcome='win'`, `playerDelta = payoutEach` (gross
  payout, not net of the stake already deducted at bet time — see §5).
- otherwise → `outcome='lose'`, `playerDelta = 0` (nothing returned; stake was already
  deducted when the bet was placed).
- If `playerSide` is null (no bet), `outcome='nobet'`.

Note the payout ladder shown in the UI (lines 716-723, e.g. "45% → 2.11x", "10% →
9.50x") is `0.95/share` evaluated at fixed reference shares — decorative/constant, not
computed live, and explicitly commented (line 333) as being the same for every round "so
it leaks nothing."

---

## 4. The "forced spectacle" mechanism

Two distinct devices exist under this heading; the code comments separate them clearly
and it's worth keeping that separation exact.

### 4a. Guaranteed high-multiplier round — this DOES fix the outcome

`makeRounds()` (lines 893-924):

```js
// Guarantee exactly one 8–12% round, placed at random between rounds 4 and 9.
const bigIdx = rint(3, 8);                                    // line 896
...
const sh = drawShare(i===bigIdx ? BIG_BAND : null);            // line 912
```

For exactly one of the ten rounds per session — chosen uniformly at random from rounds
4-9 (0-indexed 3-8) — `drawShare()` is forced to draw from `BIG_BAND` (`SHARE_BANDS[4]`,
the "screenshot" band, `lo:0.08, hi:0.12`, line 878) instead of the normal
weighted pool. This is a genuine, deliberate rig: the session is guaranteed to contain
one round whose target minority share is 8-12% (multiplier ≈ `0.95/0.12=7.9x` up to
`0.95/0.08=11.875x`), regardless of anything any player does. `plan.forcedBig = i===bigIdx`
is stored on the round plan (line 920) but is not otherwise read by the presentation
layer — it exists for potential debugging/telemetry only.

This selection happens once, client-side, at game start (`makeRounds()` is called once
in `newGame()`, line 1113) — **before round 1 even begins**, meaning the entire session's
"big round" index and target share already exist in browser memory from the outset.

### 4b. "Multiplier ceiling" — enforced by clamping + rounding, also an outcome effect

The 8% floor on `share` is enforced twice:
1. `drawShare()` itself clamps to `[0.08, 0.49]` (line 881), so no round (forced or not)
   can roll a target below 8%.
2. `newCrowd()` (lines 931-933) computes the *realized* minority count with `Math.ceil`,
   not `Math.round`:
   ```js
   // ceil, not round: guarantees the realised minority share never falls below
   // the generated share, so the 8% floor / ~12x multiplier ceiling actually holds
   const minCount = clamp(Math.ceil(plan.crowdN * plan.share), 1, plan.crowdN-1);
   ```
   Rounding down could push the realized share under the 8% floor for small `crowdN`;
   `ceil` prevents that, so the maximum possible multiplier is bounded at
   `0.95/0.08 = 11.875x` (≈ the "~12x ceiling" the comment refers to).

Both of these are outcome-shaping: they set the fixed `minCount`/`majCount` pools that
`pickSide` later drains from. They are decided at round-build/`newCrowd()` time, not
during live play.

### 4c. "Multiplier sag" — this is PATH-only, confirmed by the code

The HERD pulse described in §2d (lines 969-972 comment, mechanics at 973-979) is what
the file calls "multiplier sag":

> Herd effect: the moment the player commits, the room starts leaning their way — a
> decaying pulse on the desired path, so the player watches their own pick swell and
> their multiplier sag. It perturbs only the PATH; the final counts were fixed by the
> pools at round start, so this cannot change who wins. (lines 969-972)

Verified against the actual mechanics: `remMin`/`remMaj`, `minCount`/`majCount` are set
once in `newCrowd()` (§2d) and are only ever decremented by `pickSide` — never
recomputed, never influenced by `herd`. The `herd` term only feeds into `d` (the desired
*cumulative* share used to bias which of the still-undecided arrivals joins which side),
which in turn only affects `p`, the coin-flip probability for the *next* arrival. Since
the total pool sizes are fixed, biasing early arrivals toward the player's side simply
means more of that side's members arrive early and more of the other side's members
arrive late (or vice versa) — the final `countA`/`countB` at the end of OPEN are
identical to what they'd be without the herd term, because the pools are finite and
fully drain by construction (barring the crowd not reaching `crowdN` before LOCK — see
Ambiguity note below).

**Bottom line for the rebuild**: the "ceiling" (§4b) and the guaranteed spectacle round
(§4a) are real, pre-committed outcome manipulation, decided entirely client-side before
betting opens. The "sag" (§4c) is genuinely cosmetic/path-only, as the in-file comments
claim — it reorders arrivals, it does not change who wins or what the final multiplier
is.

**Ambiguity to flag**: nothing in `tickOpen` guarantees `c.arrived` reaches `plan.crowdN`
before `PHASES.OPEN` elapses — `arrivalCdf(25)` = 1.0 exactly at the 25 s mark, and
`PHASES.OPEN` is also 25000 ms by default, so in practice the full crowd is intended to
arrive by end of OPEN, but if `PHASES.OPEN` is ever retimed independent of a matching
25 s reference (there's no code coupling the two beyond both defaulting to the same
value), or if a burst is delayed past the phase boundary, some of the pool could remain
undrained when LOCK begins, meaning `countA+countB < plan.crowdN` at resolve time. The
displayed multiplier is computed from whatever `countA`/`countB` actually reached by
LOCK, not from `plan.crowdN`/`plan.share` directly, so this would silently produce a
slightly different multiplier than the one implied by the round's plan. The demo's own
`CFDEV.fast()` hook (line 1672) rescales all four `PHASES` values together, which
avoids this, but nothing enforces that coupling in general.

---

## 5. Balance/chip handling

Identifiers: `adjustBalance`, `applyRoundDelta`, `balAnim`.

`G.balance` (set in `newGame()`, line 1113) is the single source of truth for the
player's chip total — a plain in-memory number, never persisted (no localStorage, no
network call) and never validated against anything external.

`adjustBalance(delta)` (lines 1195-1210):
```js
let balAnim = null;
function adjustBalance(delta){
  const from = G.balance, to = from + delta;
  G.balance = to;                                   // truth updates synchronously
  ...
  const t0 = performance.now(), dur = Math.min(1100, 380 + Math.abs(delta)*10);
  if(balAnim) cancelAnimationFrame(balAnim);
  (function step(){
    const p = Math.min(1, (performance.now()-t0)/dur);
    const e = 1 - Math.pow(1-p, 3);                  // cubic ease-out
    el.balanceVal.textContent = fmt(from + (to-from)*e);
    if(p < 1) balAnim = requestAnimationFrame(step);
    else { el.balanceVal.textContent = fmt(to); setTimeout(()=>el.balanceBox.classList.remove('up','down'), 500); }
  })();
}
```
`G.balance` is mutated immediately and synchronously; only the *displayed* text
(`el.balanceVal`) is animated, counting up/down from the old value to the new one over
`min(1100ms, 380ms + |delta|*10ms)` using a cubic ease-out. `balAnim` is a
module-level handle so a new call cancels any in-flight animation from a prior call
(prevents two competing rAF loops writing the same text node). The balance chip also
gets a CSS flash (`up`/`down` class) for 500 ms after the animation settles.

Call sites:
- `placeBet(side)` (line 1177): `adjustBalance(-CF.STAKE)` — deducted immediately at bet
  time, not at resolution.
- `applyRoundDelta()` (lines 1408-1416):
  ```js
  function applyRoundDelta(){
    if(R.deltaApplied) return;
    R.deltaApplied = true;
    const res = R.result;
    if(res.outcome === 'win')       adjustBalance(res.payoutEach);
    else if(res.outcome === 'void') adjustBalance(CF.STAKE);
  }
  ```
  Guarded by `R.deltaApplied` so it can only ever fire once per round even though it's
  called from two places: the scheduled RESOLVE beat (`tickResolve`, `t>=1500k`, line
  1423) and a safety-net call in `enterSettle()` (line 1555) "even if a frame was
  dropped or the phase was cut short, so the balance can never silently
  under-credit" (comment lines 1553-1554). `'lose'` outcome: no credit (stake already
  gone from the bet-time deduction). `'nobet'`: no credit (never staked).

Dead field: `G.displayBalance` is set once in `newGame()` (line 1113,
`displayBalance: CF.START_BALANCE`) but is never read or written anywhere else in the
file — grep confirms this is the only occurrence. Not used by `adjustBalance`'s
animation (which closes over `from`/`to` locals instead); appears to be vestigial.

---

## 6. What must NOT survive a move to a server-authoritative multiplayer system

Blunt list, in order of severity. These are not edge cases — they are the core
mechanism of the current file, and none of them work in a real multi-client product.

1. **The outcome is decided client-side, before betting opens, from `Math.random()`.**
   `makeRounds()` (lines 893-924) picks `minoritySide` (line 919: `rnd() < 0.5 ? 0 : 1`),
   `crowdN`, and `share` for **all 10 rounds of the session** up front, at game start
   (`newGame()`, line 1113), before the player has placed a single bet. `newCrowd()`
   (lines 930-953) then locks the exact final `minCount`/`majCount`. In a real system
   the minority side must be an emergent fact of real bets aggregated server-side — it
   cannot exist as a value anywhere before the betting window closes. This is the
   single biggest thing to throw away, not adapt.

2. **The "crowd" is entirely fabricated by each client independently.** There are no
   other real players. `drawCrowd()` (line 880) invents a headcount from
   `CROWD_BANDS`; `pickSide()` (lines 956-987) invents which fake bettor joins which
   side and when. Because `Math.random()` is neither seeded nor synced across clients,
   two browsers loading this same page concurrently would generate two entirely
   different "rooms" — different headcounts, different minority sides, different
   multipliers — while each is presented to its own player as *the* room. This is
   single-player wearing a multiplayer skin. Real crowd numbers must come from a
   server aggregating actual concurrent bets (e.g. a Supabase table/RPC with realtime
   subscriptions), never generated locally.

3. **The client computes its own win/loss and payout.** `CF.resolve()` (lines
   990-1024) runs entirely in the browser, over data (`countA`, `countB`) that same
   browser fabricated. The client is simultaneously the house and the player, and it
   already has the answer before the "reveal." Resolution and payout math must move to
   a trusted server (Supabase Edge Function / Postgres function under RLS), computed
   from the real aggregated bet ledger, and pushed to clients as a result they cannot
   predict or alter.

4. **Balance is a local, unauthenticated number.** `G.balance` (line 1113) lives only
   in JS memory; `adjustBalance()` (line 1195) mutates it directly with no server
   round-trip, no transaction log, no validation. A real chip/points economy needs
   server-authoritative balance changes (ledger table, applied only after a
   server-confirmed round result), with the client purely rendering a value the server
   already committed.

5. **"Sealed book" is a UI trick, not real information hiding.** `R.countA`/`R.countB`
   are updated live throughout OPEN in `tickOpen()` (lines 1246-1272); `R.sealed`
   (`updateLive()`, lines 1289-1292) only withholds the *display* (opacity 0 / no
   percentage text) — the true running split is sitting in the client's own JS the
   entire time and is trivially readable via devtools or the exposed
   `window.CFDEV.state()` hook (line 1674, which returns `R.plan` — including
   `minoritySide` — mid-round). In a real system this must be a genuine boundary: the
   server must not send per-side counts/shares to any client until the round is
   actually locked and resolved.

6. **All 10 rounds' plans (including future rounds) exist in memory from game start.**
   `makeRounds()` (line 893) is called once in `newGame()` and produces the full
   session's `minoritySide`/`share`/`crowdN` for every round before round 1 starts.
   Nothing about round 7's outcome should exist anywhere — client or server — before
   round 7 actually resolves.

7. **The guaranteed "screenshot" round (§4a) has no honest equivalent.** Forcing one
   round in 10 into an 8-12% target share only works because the split is fake. A real
   system cannot secretly rig a round's target minority share; if the product wants to
   guarantee an occasional high-multiplier moment, that has to be achieved through
   real mechanics (e.g. incentivizing contrarian bets, or simply accepting the natural
   variance of real crowds), not a hidden per-session scripted round.

8. **The herd/"multiplier sag" effect (§2d, §4c) is harmless *only* because the crowd
   is fake.** As analyzed in §4c, it doesn't change the fake outcome, only fake arrival
   order — but it exists purely to manufacture a UX beat ("the room starts leaning
   your way, then it doesn't") using data the client made up. If this UX beat is worth
   keeping, it needs to be redriven off a stream of real incoming bet events from the
   server, not a local exponential-decay bias function.

9. **`window.CFDEV`** (lines 1660-1675) exposes `forceTie`, `forceUnanimous`,
   `setBalance`, `fast()`, and `state()` on `window` unconditionally. Fine for a demo
   rehearsal tool; must not ship in a production build, and its existence is further
   proof the whole round state (including the pre-decided minority side) sits
   unprotected in client memory.

**Net assessment**: essentially everything in §1 (phase timing/state machine
structure) and the *shape* of §3 (stake/rake/pot/multiplier formula) are safe and
worth reusing as-is — they're just arithmetic and a timer, agnostic to where the
counts come from. Everything in §2 and §4 (crowd generation, arrival simulation,
herd bias, forced big round) is fake-data machinery that must be replaced wholesale
by a real server-authoritative bet ledger and a real-time aggregation/resolution
pipeline; only the *visual choreography* those sections drive (bar wobble, reveal
replay, chip-flight) is worth keeping, re-plumbed to real events.
