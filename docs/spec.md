# Zero Sum Entertainment — Product Specification v1.0

Supersedes `docs/archive/spec-v0.1.md` (the single-file pitch demo).

v0.1 described one self-contained HTML file with scripted results and fake
crowds. This version keeps **all of the business logic** from v0.1 and drops
its technical constraints. The product is now built on the project's real
stack: Symbols for the client, Supabase for the server.

That change is not cosmetic. v0.1 could fake every guarantee it made, because
one machine held both the bets and the answer. A real system cannot fake them.
Section 8 lists what that costs.

---

## 1. What the product is

A betting layer over short physical-challenge videos.

A host attempts a precise physical task. The crowd bets on **how far off** the
attempt lands. The closest guesses split the pot.

Two launch games:

| Game | Objective | Guess | Unit |
|---|---|---|---|
| `banana_cut` | How far off the perfect cut | signed integer | g |
| `water_200g` | How far off 200 g the pour lands | signed integer | g |

Both are the **nearest** shape: closest guess wins. This is deliberately not a
binary yes/no market. A nearest market produces a spread of outcomes, which
makes the multiplier interesting and the crowd's guess distribution visible.

## 2. Why it exists

The product's single claim is **protocol honesty**: once betting closes,
nothing can change. Not the bets, not the crowd size, not the pot, not the
result.

Everything else is entertainment. This is the part that has to be true.

v0.1 demonstrated this claim visually — the counters froze on screen. v1.0
must *enforce* it, because the crowd is real and the operator has an incentive
to cheat. Section 8 and `integrity.md` cover how.

---

## 3. Round lifecycle

```
PREVIEW → BETTING → LOCKED → REVEAL → RESULTS → (next round)
```

| State | Duration | Video | What happens |
|---|---|---|---|
| PREVIEW | 5 s | paused at `bet_open` | Objective banner. Countdown to open. |
| BETTING | 25 s | paused at `bet_open` | Bets open. Pot and player count tick up. One bet per user. |
| LOCKED | 5 s | starts playing | Nothing can change. The frozen counters are the product. |
| REVEAL | to `reveal` mark | playing | The attempt plays out. Overlay stays minimal. |
| RESULTS | 8 s | paused at `pause` mark | Result, winners, multiplier, payout. |

**The hard rule, unchanged from v0.1:** at the instant LOCKED begins, the bet
list, the player count and the pot are final. A bet that arrives one
millisecond late is rejected, not accepted quietly.

In v1.0 the state is **derived from server timestamps**, never stored and never
taken from a client clock. See `integrity.md` §2.

The schema (`data-model.md` §3) stores five timestamps, not one per state:
`preview_starts_at`, `betting_opens_at`, `betting_closes_at`,
`result_visible_at`, `results_end_at`. The four durations in the table above
are not independent constants; they are derivable from those five columns
and the round's video offsets:

```
PREVIEW  duration = betting_opens_at   − preview_starts_at   =  5 s
BETTING  duration = betting_closes_at  − betting_opens_at    = 25 s
RESULTS  duration = results_end_at     − result_visible_at   =  8 s
LOCKED + REVEAL    = result_visible_at − betting_closes_at   = variable, video-dependent
```

`result_visible_at` is **not** `betting_closes_at + 5 s`. It is the
wall-clock instant playback reaches the frame that shows the result:

```
result_visible_at = betting_closes_at + (video_reveal_s − video_bet_open_s)
```

Gating the result on a fixed 5 s offset instead of this value publishes the
answer before the video shows it — by as much as ~29 s on a typical round.
`result_visible_at`, not a fixed offset, is what `round_results`'s RLS
policy gates on. See `integrity.md` §5.1. Within `[betting_closes_at,
result_visible_at)` the client still shows LOCKED for a fixed first 5 s and
REVEAL for the remainder; that split is a client-side convention, not a
database gate — nothing security-relevant happens at that boundary.

## 4. Betting

- One bet per user per round. No second bet, no edit, no cancel.
- Fixed stake: **20 chips**. There is no stake input at launch.
- The guess is a signed integer in the game's range, e.g. −20 g … +20 g.
- Chips are virtual. No real money is handled anywhere in this system.

## 5. Winning and payout

Winners are the closest guesses to the result.

```
N = max(1, ceil(player_count × 0.10))
```

The top `N` by absolute distance from the result win. **Ties at the cut-off are
all included**, so the real winner count can exceed `N`.

The payout engine is defined exactly in `game-rules.md`. In summary:

```
pot                = player_count × 20
prize              = pot × 0.95            (5% rake, fixed and shown before betting)
payout_per_winner  = floor(prize / winner_count)
multiplier         = payout_per_winner / 20
```

`multiplier` is computed **after** the floor, from what a winner actually
receives. `0.95 / (winner_count / player_count)` is the pre-rounding ideal —
it is not what gets paid, and it is not what the multiplier displays. See
`game-rules.md` §1, §4, §4.1.

The 5% rake is disclosed in the UI before betting opens. A market that hides
its rake is not honest, whatever else it does.

## 6. Chips

- Starting balance: 200 chips.
- Balance shows at all times. It falls when a bet is placed and rises when a
  bet wins.
- In v1.0 the balance is **derived from an append-only ledger**, not stored as
  an editable number. See `data-model.md` §5. This is the same honesty
  argument as the lock: a balance nobody can quietly edit.

## 7. Screen furniture

Carried over from v0.1 unchanged in intent.

- **Timer chip** — counts down; turns red under 5 s; reads `LOCKED` when locked.
- **Objective banner** — one line, visible in PREVIEW and BETTING only.
- **Bet control** — guess selector plus one `PLACE BET (20 chips)` button,
  disabled after use and at LOCKED.
- **Crowd counter** — live player count and pot. **Both freeze at LOCKED.**
- **History** — last 8 results for the game, newest first.
- **Results card** — result, winner count, multiplier, and the metadata row
  (`players · pot · rake · multiplier`). A distinct state when the user wins.

## 8. What changes because the crowd is real

v0.1 could not leak anything, because nothing was secret — the whole show ran
on one machine. A real system has three secrets and must keep all three.

**8.1 The result must not reach a client before REVEAL.** In v0.1 the result
sat in a JavaScript array the browser could read at any time. If v1.0 ships the
result alongside the round, any user can read it during BETTING and win every
round. The result is stored separately and released on a server clock.

**8.2 Other players' guesses must not be visible before REVEAL.** v0.1 never
had to care — the crowd was fake. In v1.0, seeing the crowd's guesses before
the lock lets a late better position against the pack and take the top 10%
deliberately. Only aggregates (count, pot) are public before REVEAL.

**8.3 The video must not be scrubbable ahead of the reveal.** This is the
hardest one and it has no client-side fix. If the browser holds the whole file,
a user can seek to the result frame during BETTING. See `integrity.md` §5.

**8.4 Bots are now a disclosure question, not a rendering trick.** v0.1's crowd
was openly scripted, which was fine for a pitch. If simulated players remain in
a product with real users, they must be labelled as simulated in the UI. This
is a product decision, not a technical one, and it is recorded as open in
`decisions.md`.

**8.5 The bot guess distribution is not optional.** Whatever the disclosure
decision, v0.1 §6 specified how bot guesses are drawn and v1.0's docs dropped
that without a replacement. Restored here, unchanged: bot guesses are
**normal-ish around 0, standard deviation 8, clamped to the game's
`guess_min .. guess_max`, with a few outliers.** This is not cosmetic. In a
nearest market, the spread of guesses around the result value is what
determines `winner_count` — and `winner_count` sets every multiplier in
`game-rules.md` §4. An unspecified guess distribution is an unspecified
payout curve. See `architecture.md` §6 for how bots are written, and
`reference-crowdflip.md` for the arrival curve and herd behaviour that still
port.

## 9. Out of scope at launch

- Real money in any form. Deposits, withdrawals, cash-out.
- Live streaming. Launch runs on recorded video.
- Variable stakes, parlays, side markets.
- Social features: chat, friends, leaderboards beyond round history.

## 10. Acceptance criteria

Behavioural, testable, and mostly inherited from v0.1.

- [ ] Both games are selectable and load the correct video and rounds.
- [ ] A bet submitted after `betting_closes_at` is **rejected by the database**,
      not by the UI. Provable with a direct API call that bypasses the client.
- [ ] Player count and pot are identical before and after LOCKED.
- [ ] The result value is **unreadable** through the API before
      `result_visible_at`. Provable with a direct API call.
- [ ] Another user's guess is unreadable before `result_visible_at`.
- [ ] The result shown always matches the video frame.
- [ ] Settlement runs exactly once per round, even if invoked twice.
- [ ] Chip balances equal the sum of the ledger at all times.
- [ ] A full session runs unattended after the first bet.
