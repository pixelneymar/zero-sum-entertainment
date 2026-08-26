# Decision Log

Project memory. Why things are the way they are, and what is still open.

Read this before changing anything in `integrity.md` or `data-model.md`.
Several decisions look arbitrary and are not.

---

## Settled

### D1 — Round state is derived, never stored, and uses `clock_timestamp()`
A stored `state` column needs a writer, and the gap between "betting closed"
and the `UPDATE` is a window where late bets land. Derived state removes that
window, but only when every comparison uses `clock_timestamp()`, not `now()`.
`now()` is `transaction_timestamp()` — fixed at the start of the calling
transaction. A transaction opened before `betting_closes_at` would see every
`now()` inside it evaluate against that earlier instant, even if the actual
write happens later: `now()` would not remove the window, it would just move
it from "before an `UPDATE`" to "before a `COMMIT`." `clock_timestamp()` is
re-evaluated on every call and has no such gap.
**Cost:** cannot query `WHERE state = 'betting'` directly; use a time
predicate.
**See:** `integrity.md` §2, §3.

### D2 — `result_value` lives in its own table
Not because RLS can hide a column that a `GRANT` cannot — PostgreSQL has
column-level `GRANT` and PostgREST honours it. The reason is that a `GRANT`
is **static**, and this gate is **time-varying**: unreadable before
`result_visible_at`, readable after, with nothing running at that instant to
flip it. Only a row-level security policy is evaluated per row, per query,
against the live clock. A separate table is what lets RLS gate the value at
all. **This is load-bearing. Merging the tables reintroduces the leak.**
**See:** `integrity.md` §5.1.

### D3 — Balance is a ledger, not a number
An append-only ledger can be audited; a mutable integer cannot. Same honesty
argument as the lock — a number nobody can quietly change.
**Cost:** a cache table, a trigger, and a house account as the rake's
counterparty, so a round's ledger rows sum to zero on their own instead of
needing an external assertion.
**See:** `data-model.md` §5.

### D4 — Payout rounds down; dust goes to the house
`prize / winner_count` is rarely whole. Flooring keeps chips integral and
conserved, and treats every winner identically. Distributing dust to the
earliest bets was rejected: it creates a timing advantage.
**See:** `game-rules.md` §4.1.

### D5 — `RANK`, not `ROW_NUMBER`
`ROW_NUMBER` breaks ties arbitrarily and would silently drop someone who tied
for the last winning slot. `RANK` includes all ties, per v0.1 §5.
**Cost:** `winner_count` can exceed the 10% target, lowering the multiplier.
Correct and intended.

### D6 — One payout implementation, in Postgres
Settlement is atomic with its ledger writes and must not be duplicated.
Crowdflip's client computed its own winnings; that cannot survive real users.
**See:** `game-rules.md` §7.

### D7 — Same engine, two shapes
`multiplier = payout_per_winner / STAKE` holds for both crowdflip's minority
market and this nearest market, and reduces to `0.95/share` before rounding
in both. Only winner selection differs, so `games.shape` selects a predicate
and the payout code is shared.
**See:** `game-rules.md` §1.

### D8 — Documentation over a pitch-demo rewrite
The ask was to re-plan v0.1 onto the real stack, so this pass produced the
design and left `index.html` alone. No product code was written.

---

## Open — need a decision

### O1 — Video scrubbing
**The most serious open item.** A client holding the whole file can seek to the
result during BETTING. No database fix exists. Options in `integrity.md` §5.3;
segmented HLS is the recommendation for recorded video, live streaming is the
real answer. Acceptable for a pitch, not for launch.

### O2 — Bot disclosure
Simulated players were fine when v0.1 was openly scripted. With real users,
undisclosed simulated crowds misrepresent the market. Label them, or drop them.
**Recommendation: label them.** The product's whole pitch is honesty; an
undisclosed fake crowd contradicts it more expensively than it gains.

### O3 — Fully-tied rounds are a guaranteed loss
If every player ties, all win and all receive `floor(0.95 × stake)` — everyone
loses the rake. Arithmetically correct, but it will feel like a bug.
Crowdflip already treats this as a void condition, not a novel proposal:
`resolve()` (`reference-crowdflip.md` §3) voids whenever `countA === countB`
(tie) or either side is `0` (unanimous) — `rake = 0`, `prize = 0`, stakes
refunded, outcome `'void'`.
**Recommendation:** carry that precedent over — void and refund when
`winner_count == player_count`. Cheap, and it removes a bad first impression.
**See:** `game-rules.md` §5, example 4.

### O4 — Operator trust
`service_role` bypasses RLS, so the house can in principle write bets or edit
results. Defending against the operator needs external anchoring: publish a
hash of the result before betting opens, reveal the nonce after.
Worth it if "provably fair" becomes a marketing claim. Not built.

### O5 — No staging environment
The remote project is the only deployed environment. A bad migration hits the
demo. A second Supabase project is cheap insurance.

### O6 — Region
The project sits in `ap-southeast-1` (Singapore). Frankfurt was the stated
preference, but the project already existed when that was asked. Region is
immutable — changing it means a new project. Empty now, so this is the cheapest
it will ever be to move.

---

## Corrected

An adversarial audit of this design pass found the items below. Each is
recorded here rather than silently fixed, so the mistake stays visible.

### C1 — The first schema guessed the product wrong
`artists / releases / events / enquiries` was built for an entertainment
company's website. `spec.md` was not in the repo at the time. The product is a
betting platform and none of that schema applies.
**Lesson:** the brief existed and was not asked for.
**See:** `data-model.md` §0, `roadmap.md` Phase 0.

### C2 — The Symbols CLI 404s were real but temporary
`@symbo.ls/cli` and 13 dependencies were unpublished for part of 2026-08-26,
then published. `smbls` 3.14.786 now installs. Do not repeat the 404 claim.

### C3 — `search_path = ''` is stronger than `public, pg_temp`
A peer review suggested the latter. It is weaker: `public` would resolve
unqualified names again. Empty removes unqualified resolution entirely.
Extension functions then need `search_path = 'extensions'`.
**See:** repo `CLAUDE.md`.

### C4 — Crowdflip's "forced spectacle" is outcome rigging, not showmanship
Verified in source: `makeRounds()` (index.html:893-911) draws each round's
winning share **before any bet exists**, and `newCrowd()` (931-933) uses
`Math.ceil` to hold a multiplier ceiling. Both fix outcomes.

Harmless in v0.1, where the crowd is fake. v0.1 §6 nonetheless asks us to carry
it over. **It must not ship to a real market** — it would make the product's
one claim false. Demo flag only, off by default.
**See:** `integrity.md` §8.

### C5 — `round_stats` as a `security_invoker` view was backwards
This was D8, previously listed as Settled: "`security_invoker = true` on
`round_stats`... without it the view runs as owner and bypasses the caller's
RLS, leaking every bet through the aggregate." That reasoning is **false**.
An aggregate that returns only `count()` and `sum()` leaks no individual
guess regardless of the flag — there is nothing in the return type to leak.

Worse, the flag choice was backwards. Run under `security_invoker = true`,
the aggregate query is itself subject to the caller's RLS — the same `bets`
SELECT policy that (correctly) shows a caller only their own bet before
reveal. So `count(*)` would return `1` for every caller, forever. The live
crowd counter was not merely leaky; it was permanently broken.

Fixed by replacing the view with a `SECURITY DEFINER` function,
`round_stats(p_round_id)`, that returns only two integers. `SECURITY
DEFINER` is the right tool here specifically because the return type cannot
carry a guess.
**See:** `data-model.md` §4.

### C6 — Result gating used the wrong timestamp, publishing the answer early
`rounds` stored four timestamps (`betting_opens_at`, `betting_closes_at`,
`reveal_at`, `results_end_at`) and `round_results` was gated on `reveal_at`.
`reveal_at` was set to a fixed offset from `betting_closes_at`, not to the
wall-clock instant the video actually reaches its reveal frame — which
depends on `video_reveal_s` and can be tens of seconds later. Gating on the
fixed offset opened the result up to ~29 seconds before the video showed it,
defeating the product's only claim.

Fixed by adding `preview_starts_at` and replacing `reveal_at` with
`result_visible_at = betting_closes_at + (video_reveal_s − video_bet_open_s)`,
and gating `round_results` on that value. Five timestamps now, not four.
**See:** `data-model.md` §3, `integrity.md` §5.1, `spec.md` §3.

### C7 — `bets` had no defence against a direct insert
The RLS `INSERT` policy on `bets` checked timing and relied on
`unique (round_id, user_id)`, but a caller with the anon or authenticated key
could still insert a row directly through PostgREST with no matching
`chip_ledger` debit — a free bet with a real payout. Nothing pinned `stake`
to `20` or `guess` to the game's range, either.

Fixed by removing the INSERT policy entirely. `bets` gets SELECT only; the
only way to write a bet is `place_bet()`, a `SECURITY DEFINER` function that
checks affordability, timing, stake, and guess range and writes the bet and
the ledger debit in one transaction. `check (stake = 20)` on the table is a
second, independent line of defence.
**See:** `integrity.md` §3, `data-model.md` §4.

### C8 — Boundary checks used `now()`, not `clock_timestamp()`
Every timing check that gates a security-relevant action — the former `bets`
lock, the `round_results` and `bets` SELECT policies, `settle_round`'s
readiness check — used `now()`. Because `now()` is fixed at transaction
start, a transaction opened early enough could still pass a check whose real
wall-clock moment had already moved past the boundary. Replaced everywhere
with `clock_timestamp()`.
**See:** D1, `integrity.md` §2, §3, §4.

### C9 — The idempotent settlement claim does not fence the bet set
`UPDATE rounds SET settled_at = ... WHERE settled_at IS NULL` correctly
prevents `settle_round` from running twice. It says nothing about which bets
its snapshot sees: a `place_bet` transaction still committing when
settlement starts can be missed entirely — debited, never ranked, never
paid, never refunded. The original write-up overstated what the idempotent
claim covered.

Fixed with `pg_advisory_xact_lock(hashtextextended(round_id, 0))`, taken at
the top of both `place_bet` and `settle_round`, so a bet still forming for a
round blocks settlement of that same round until it commits or rolls back.
**See:** `integrity.md` §4.

### C10 — Zero-bet rounds divided by zero
`settle_round` computed `prize / winner_count` unconditionally. A round with
no bets has `winner_count = 0`. Fixed by branching before the payout maths:
claim the round, mark it settled, write no ledger rows, return.
**See:** `data-model.md` §6, `game-rules.md` §6.

### C11 — The ledger had no counterparty for the rake
`chip_ledger` recorded `stake` and `payout` rows only. Summed over a round,
those rows are net negative by exactly the rake plus the flooring dust —
value the ledger itself never shows going anywhere. Conservation had to be
*asserted* by `settle_round`'s code rather than *demonstrated* by the
append-only record, which contradicts D3. Fixed with a `rake` ledger kind
and a fixed house account; `settle_round` credits the house with
`house_take` in the same transaction as the payouts.
**See:** `data-model.md` §5, `game-rules.md` §4.2.

### C12 — The multiplier formula used the pre-rounding value
`multiplier` was defined as `(1 − RAKE) / share`, computed before
`prize / winner_count` is floored to integer chips. Once flooring applies,
that value no longer matches what a winner actually receives —
`game-rules.md` §5's own ordinary-round example showed `×8.93` for a payout
of 178 chips on a 20-chip stake, and `178/20` is `×8.90`. Every worked
example in that section used the same pre-rounding value. `spec.md` §5's
`payout = 20 × multiplier` had the same problem in reverse, implying a
fractional-chip payout.

Fixed by defining `multiplier = payout_per_winner / STAKE`, computed after
the floor, and recomputing every worked example.
**See:** `game-rules.md` §1, §4, §4.1, §5; `spec.md` §5.

### C13 — `settle_round` had no `EXECUTE` revoke
PostgreSQL grants `EXECUTE` on a new function to `PUBLIC` by default, and
PostgREST exposes every table-returning function at `/rpc`. `settle_round`
was `SECURITY DEFINER` without the matching `revoke execute ... from public`
that `is_staff()` already uses. Fixed to match existing practice.
**See:** `data-model.md` §6.

### C14 — v0.1's bot guess distribution was dropped without a replacement
v0.1 §6 specified bot guesses as normal-ish around 0, stddev 8, clamped to
the slider range, with a few outliers. v1.0's docs dropped this and
specified nothing in its place. In a nearest market the guess spread
determines `winner_count` directly, and `winner_count` sets every
multiplier — an unspecified distribution is an unspecified payout curve.
Restored, unchanged, in `spec.md` §8.5.

### C15 — Other v0.1 divergences were not recorded
None of these are wrong on their own; none had been written down as
deliberate.

- v0.1's `IDLE` state (the start screen before a game is chosen) has no
  equivalent state name in v1.0's lifecycle. It was not dropped — `GamePicker`
  (`architecture.md` §2.1) covers the same job under a different name.
- v0.1 §8's balance "resets on page reload, no storage APIs" is now
  permanent Postgres persistence (`data-model.md` §5). A deliberate upgrade,
  not a carried-over constraint.
- `spec.md` line 3 named the superseded file `spec.md` v0.1; the file is at
  `docs/archive/spec-v0.1.md`. Fixed.
- v0.1 §7.6's own worked example (47 players, 6 winners, `×4.75`, `+95`)
  does not satisfy v0.1's own formula: `payout = prize / winner_count =
  (940 × 0.95) / 6 = 148.83`, `multiplier = 148.83 / 20 = ×7.44`, not `×4.75`
  or `+95`. Recorded as an arithmetic error in v0.1 itself, not carried into
  any v1.0 worked example.
