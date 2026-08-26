# Integrity Model

The product makes one claim: **once betting closes, nothing changes.**

This document is how that claim is enforced. Everything here is a security
control, not a feature. If a change would weaken any of it, the change is
wrong.

**Threat model.** Assume a hostile user with the public `anon` key, a HTTP
client, and full knowledge of this schema. Assume they will call the API
directly and never run our JavaScript. Every guarantee below must hold against
that user. Nothing may depend on the client behaving.

---

## 1. Where enforcement lives

| Layer | Trustworthy? | Role |
|---|---|---|
| Symbols client | **No** | Presentation only. Never a guarantee. |
| Edge Function | Partly | Orchestration. Can be bypassed by calling PostgREST directly. |
| **RLS policy** | **Yes** | The security boundary. Cannot be bypassed by any anon/authenticated caller. |
| **Constraint / trigger** | **Yes** | The invariant. Holds even against `service_role`. |

Rule: **a guarantee that is not expressed as an RLS policy or a database
constraint does not exist.** Client checks are courtesy. Edge Function checks
are convenience. Only the database is authoritative.

## 2. Round state is derived, never stored

There is **no `state` column** on `rounds`. State is computed from timestamps:

```sql
case
  when now() <  r.betting_opens_at  then 'preview'
  when now() <  r.betting_closes_at then 'betting'
  when now() <  r.reveal_at         then 'locked'
  when now() <  r.results_end_at    then 'reveal'
  else                                   'results'
end
```

Three reasons this is the right design.

**It removes the race.** A stored state needs a writer. Between "betting
closed" in fact and `UPDATE rounds SET state='locked'` in practice there is a
window. In that window a late bet is accepted. Derived state has no window —
`now() < betting_closes_at` is evaluated inside the same transaction as the
insert.

**It removes a scheduler dependency for correctness.** If a cron job dies,
derived state stays correct. Stored state would freeze and betting would stay
open indefinitely — the exact failure the product cannot survive.

**It removes the operator's ability to cheat.** Nobody can extend betting by
updating a row, because there is no row to update. Moving `betting_closes_at`
is possible but is a visible, auditable change to a scheduled value, not a
silent state flip.

Scheduled work is still needed, but only to **create** future rounds and
**settle** finished ones. Neither is on the correctness path for the lock.

## 3. The lock

Enforced in the RLS `WITH CHECK` on `bets` insert:

```sql
create policy "bets: only while betting is open"
on public.bets for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.rounds r
    where r.id = round_id
      and now() >= r.betting_opens_at
      and now() <  r.betting_closes_at
  )
);
```

Properties:

- `now()` is the **database** clock. Client clocks are never consulted, so
  clock skew and tampering are irrelevant.
- The check runs inside the insert transaction. There is no gap between
  checking and writing.
- A late bet **errors**. It is not clamped, queued or quietly dropped. The
  user is told.
- There is **no UPDATE and no DELETE policy** on `bets`. A placed bet is
  immutable. Not even its owner can change it.
- `unique (round_id, user_id)` enforces one bet per user at the schema level.

Acceptance test: place a bet by direct API call at `betting_closes_at + 50 ms`
and confirm a policy violation. This must be in the test suite, because it is
the single most important behaviour in the product.

## 4. Settlement runs exactly once

Settlement credits chips. Running it twice pays twice.

The guard is a conditional claim, not a check-then-act:

```sql
update public.rounds
   set settled_at = now()
 where id = p_round_id
   and settled_at is null
returning id into v_claimed;

if v_claimed is null then
  return;              -- already settled, or being settled. Do nothing.
end if;
```

The `UPDATE ... WHERE settled_at IS NULL` is atomic. Two concurrent callers
cannot both claim the round: one updates the row, the other matches zero rows.
A `SELECT` followed by an `IF` would not be safe.

Settlement is also refused before the result is due:

```sql
if now() < v_round.reveal_at then
  raise exception 'round % is not revealable yet', p_round_id;
end if;
```

Ledger writes and the `settled_at` claim are in the **same transaction**. A
crash mid-settlement rolls back both, and a retry is clean.

## 5. The three information leaks

v0.1 had no secrets, because it ran entirely on one machine. v1.0 has three,
and two are solved in the schema.

### 5.1 The result — SOLVED

`result_value` is **not** a column on `rounds`. It lives in `round_results`,
whose only read policy is time-gated:

```sql
create policy "results: readable only after reveal"
on public.round_results for select to anon, authenticated
using (
  exists (select 1 from public.rounds r
           where r.id = round_id and now() >= r.reveal_at)
);
```

If `result_value` sat on `rounds`, any client could read the answer during
BETTING and win every round. Row-level security cannot hide a single column,
so the column must live in its own row. **This split is load-bearing. Do not
merge these tables.**

### 5.2 Other players' guesses — SOLVED

Seeing the crowd's guesses before the lock is a real edge: a late better can
position just outside the cluster and take a winning slot deliberately.

```sql
create policy "bets: own bet always, others only after reveal"
on public.bets for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.rounds r
              where r.id = round_id and now() >= r.reveal_at)
);
```

Live pot and player count still work, because they come from an aggregate
view that exposes **counts only, never guesses**. See `data-model.md` §4.

### 5.3 The video — NOT SOLVED BY THE SCHEMA

**This is the weakest point in the system and it has no database fix.**

If the browser holds the whole file, the user can seek to the result frame
during BETTING. No RLS policy helps: the leak is in the media, not the data.

Options, best first:

1. **Live stream.** Nothing exists ahead of the play-head, so there is nothing
   to scrub. This is the only complete fix, and it is where the product wants
   to go anyway.
2. **Segmented HLS with server-gated segments.** Cut the video into segments.
   Refuse to serve any segment past the reveal point until `now() >=
   reveal_at`. Strong, and works with recorded video.
3. **Signed URLs with time-limited validity.** Weaker — a determined user can
   fetch the moment the URL becomes valid, but they cannot pre-fetch.
4. **Ship the whole file and accept the risk.** Only acceptable for a pitch
   demo where the audience is not adversarial. **Not acceptable at launch.**

Recorded video at launch means option 2 is the target. Recorded video served
whole is a known, accepted hole during the demo phase and must not survive it.

## 6. Chips cannot be edited

Balance is **derived**, not stored as an editable number.

- `chip_ledger` is append-only. There is no UPDATE policy and no DELETE policy
  for any role below `service_role`.
- `balances` is a cache maintained by trigger, for read speed only.
- The audit query is `sum(amount) from chip_ledger where user_id = ?`. If that
  ever disagrees with `balances`, the cache is wrong and the ledger wins.

Same argument as the lock: a number nobody can quietly change is worth more
than a number that is merely correct today.

## 7. What is deliberately not defended

Stated plainly so nobody assumes otherwise.

- **A colluding operator with `service_role`.** `service_role` bypasses RLS by
  design. Defending against the house requires external anchoring — publishing
  a commitment to the result before betting opens, and revealing the nonce
  afterwards. That is a genuine option for a trust-critical product and it is
  recorded as open in `decisions.md`. It is not built.
- **Sybil accounts.** One user with many accounts can take many of the top
  10% slots. Needs identity work, not schema work.
- **Timing advantage from network latency.** A user closer to the region can
  bet marginally later. Inherent to any real-time market.
- **Bot disclosure.** A policy question, not a technical control. See
  `spec.md` §8.4.

---

## 8. What cannot be ported from Crowdflip

`reference-crowdflip.md` documents the reference engine. Three of its
mechanisms are incompatible with a real market and must not be carried over.
They are listed here rather than there because each is a correctness boundary,
not a style choice.

### 8.1 The outcome is drawn before the bets

`makeRounds()` (index.html:893) generates all ten rounds up front. For each it
draws a crowd size and a **winning minority share** before a single bet exists:

```js
// Guarantee exactly one 8–12% round, placed at random between rounds 4 and 9.
const bigIdx = rint(3, 8);
const sh = drawShare(i === bigIdx ? BIG_BAND : null);
```

The crowd then animates toward that predetermined split.

This is fine in v0.1 — the crowd is fake, so the "outcome" is just a show being
scripted. **It cannot survive real bettors.** In a real market the winning
share *is* the aggregate of real bets. Deciding it in advance means deciding
who wins in advance.

v0.1 §6 asks for this behaviour ("Guarantee: at least one high-multiplier
round per game session… Mirrors Crowdflip's forced spectacle round"). That
requirement is **demo-only**. Shipping it to a market with real users would
contradict the product's one claim, and would be fraud rather than a feature.

### 8.2 The multiplier ceiling

`newCrowd()` (index.html:931) uses `Math.ceil` deliberately so the realised
minority share never falls below the generated one, holding a ~×12 ceiling.
This is the same category as 8.1 — it fixes an outcome. It does not port.

### 8.3 The client resolves itself

Crowdflip's client holds every round in memory, generates the crowd locally
with unsynchronised RNG, computes its own winnings, and keeps balance as a
plain local number. Its "sealed book" is CSS, not secrecy.

None of this is a criticism of Crowdflip — it is a single-file demo with no
server, and these were correct choices for that. They are simply the parts a
server-authoritative rebuild replaces wholesale.

**What does port:** the phase-timer shape, the arrival curve, the herd path
model, and the payout formula. The herd "sag" pulse (index.html:969) is
genuinely path-only — it perturbs the animation, not the final counts — so it
is safe to reuse for making a *real* crowd feel alive.
