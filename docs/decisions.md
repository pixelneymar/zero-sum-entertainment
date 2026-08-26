# Decision Log

Project memory. Why things are the way they are, and what is still open.

Read this before changing anything in `integrity.md` or `data-model.md`.
Several decisions look arbitrary and are not.

---

## Settled

### D1 — Round state is derived, never stored
A stored `state` column needs a writer, and the gap between "betting closed"
and the `UPDATE` is a window where late bets land. Derived state has no window.
It also keeps the lock correct when the scheduler dies.
**Cost:** cannot query `WHERE state = 'betting'` directly; use a time predicate.
**See:** `integrity.md` §2.

### D2 — `result_value` lives in its own table
RLS is row-level and cannot hide one column of a readable row. On `rounds`, the
answer would be public during BETTING. A separate row can be time-gated.
**This is load-bearing. Merging the tables reintroduces the leak.**
**See:** `integrity.md` §5.1.

### D3 — Balance is a ledger, not a number
An append-only ledger can be audited; a mutable integer cannot. Same honesty
argument as the lock — a number nobody can quietly change.
**Cost:** a cache table and a trigger.
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
`multiplier = 0.95/share` holds for both crowdflip's minority market and this
nearest market. Only winner selection differs, so `games.shape` selects a
predicate and the payout code is shared.
**See:** `game-rules.md` §1.

### D8 — `security_invoker = true` on `round_stats`
Without it the view runs as owner and bypasses the caller's RLS, leaking every
bet through the aggregate. This flag is a security control, not a preference.

### D9 — Documentation over a pitch-demo rewrite
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
**Recommendation:** void and refund when `winner_count == player_count`.
Cheap, and it removes a bad first impression.
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
