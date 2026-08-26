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
| **Constraint / trigger / SECURITY DEFINER function** | **Yes** | The invariant. Holds even against `service_role`'s absence of an RLS check, because the check is inside the function body itself. |

Rule: **a guarantee that is not expressed as an RLS policy, a database
constraint, or a check inside a `SECURITY DEFINER` function does not exist.**
Client checks are courtesy. Edge Function checks are convenience. Only the
database is authoritative.

## 2. Round state is derived, never stored

There is **no `state` column** on `rounds`. State is computed from five
timestamps, not stored:

```sql
case
  when clock_timestamp() <  r.preview_starts_at  then 'scheduled'
  when clock_timestamp() <  r.betting_opens_at   then 'preview'
  when clock_timestamp() <  r.betting_closes_at  then 'betting'
  when clock_timestamp() <  r.result_visible_at  then 'locked'
  when clock_timestamp() <  r.results_end_at     then 'results'
  else                                                 'ended'
end
```

`preview_starts_at` and `result_visible_at` are explained in `data-model.md`
§3. Two notes on the mapping above:

- `'scheduled'` exists so a round created ahead of time by the round-creation
  cron (`architecture.md` §5) does not display a live PREVIEW countdown long
  before it should.
- The client-visible LOCKED and REVEAL phases from `spec.md` §3 are both
  inside the single `'locked'` branch above, split by a fixed 5-second
  client-side convention, not a second database timestamp. Nothing
  security-relevant happens at that internal boundary — the only two gates
  that matter are `betting_closes_at` (§3 below) and `result_visible_at`
  (§5.1).

Three reasons derived state is the right design.

**It removes the race — using `clock_timestamp()`, not `now()`.** A stored
state needs a writer. Between "betting closed" in fact and `UPDATE rounds SET
state='locked'` in practice there is a window. In that window a late bet is
accepted. Derived state has no such window, but only if every comparison uses
`clock_timestamp()`. `now()` is `transaction_timestamp()` — it is fixed at
the **start** of the calling transaction, not evaluated live. A client (or a
long-running function call) that opens its transaction before
`betting_closes_at` would see every `now()` comparison inside that
transaction evaluate against that earlier instant, even if the actual insert
happens after the close — `now()` would not remove the window, it would just
move it from "the gap before an UPDATE" to "the gap before a COMMIT."
`clock_timestamp()` is re-evaluated on every call, including inside a
transaction that has been open for a while, so it has no such gap. See
`decisions.md` D1.

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

`bets` has **no INSERT policy.** The only way to write a bet is through
`public.place_bet(p_round_id uuid, p_guess integer)`, a `SECURITY DEFINER`
function:

```sql
create or replace function public.place_bet(p_round_id uuid, p_guess integer)
returns public.bets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_round   public.rounds;
  v_game    public.games;
  v_user    uuid := auth.uid();
  v_balance integer;
  v_bet     public.bets;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_round_id::text, 0));

  select * into v_round from public.rounds where id = p_round_id;
  select * into v_game  from public.games  where id = v_round.game_id;

  if clock_timestamp() < v_round.betting_opens_at
     or clock_timestamp() >= v_round.betting_closes_at then
    raise exception 'round % is not open for betting', p_round_id;
  end if;

  if p_guess < v_game.guess_min or p_guess > v_game.guess_max then
    raise exception 'guess % outside % .. %',
      p_guess, v_game.guess_min, v_game.guess_max;
  end if;

  select balance into v_balance from public.balances where user_id = v_user;
  if v_balance is null or v_balance < 20 then
    raise exception 'insufficient balance';
  end if;

  insert into public.bets (round_id, user_id, guess, stake)
  values (p_round_id, v_user, p_guess, 20)
  returning * into v_bet;

  insert into public.chip_ledger (user_id, round_id, kind, amount)
  values (v_user, p_round_id, 'stake', -20);

  return v_bet;
end;
$$;

revoke execute on function public.place_bet(uuid, integer) from public;
grant execute on function public.place_bet(uuid, integer) to authenticated;
```

`bets` itself carries only a SELECT policy (§5.2) and the table constraint
`check (stake = 20)`. There is no INSERT policy, no UPDATE policy, no DELETE
policy for any role below `service_role`.

Why a function, not a policy: an RLS policy can only constrain the columns
of the row being inserted. It cannot also write the matching `chip_ledger`
debit in the same statement. Without that debit, PostgREST would let an
anon-key caller insert a bet directly through `bets` and never pay for it — a
free bet with a real payout. `place_bet` inserts the bet and the stake debit
in one transaction, or neither.

Properties:

- `clock_timestamp()`, not `now()`. See §2 and `decisions.md` D1 for why —
  `now()` is fixed at transaction start, so a client that opens its
  transaction early can still land an insert after the real close.
- The check runs inside the same transaction as the insert and the ledger
  debit. There is no gap between checking and writing.
- A late call **errors**. The bet is not clamped, queued or quietly dropped.
  The user is told.
- `unique (round_id, user_id)` enforces one bet per user at the schema
  level, independent of the function logic.
- `check (stake = 20)` on `bets`, and the hardcoded `20` inside the
  function, are redundant on purpose — the constraint holds even if the
  function is ever miswritten or replaced.
- `pg_advisory_xact_lock(hashtextextended(p_round_id::text, 0))` serializes
  every `place_bet` call for a round against `settle_round`'s claim on the
  same round. See §4.

Acceptance test: call `place_bet` by direct API call at `betting_closes_at +
50 ms` and confirm it raises, with no bet row and no ledger row written. Also
confirm a **direct INSERT into `bets`**, bypassing `place_bet` entirely, is
rejected by PostgREST at any time — there is no INSERT policy to satisfy.
Both must be in the test suite; the first is the single most important
behaviour in the product, and the second is what stops a free bet.

## 4. Settlement runs exactly once, and does not race a landing bet

Settlement credits chips. Running it twice pays twice. Running it while a bet
for the same round is still committing can pay out for a smaller crowd than
actually played. These are two different problems, solved by two different
mechanisms — do not conflate them.

**Double-settlement** is prevented by an idempotent claim, not a
check-then-act:

```sql
update public.rounds
   set settled_at = clock_timestamp()
 where id = p_round_id
   and settled_at is null
returning id into v_claimed;

if v_claimed is null then
  return;              -- already settled, or being settled. Do nothing.
end if;
```

The `UPDATE ... WHERE settled_at IS NULL` is atomic. Two concurrent callers
cannot both claim the round: one updates the row, the other matches zero
rows. A `SELECT` followed by an `IF` would not be safe. **This solves
double-settlement only.** On its own it says nothing about which bets
settlement's snapshot sees.

**The bet race** is a separate problem. `place_bet` checks
`clock_timestamp() < betting_closes_at` and then, in the same transaction,
inserts the bet and debits the ledger. Between that check passing and the
transaction committing, real time keeps moving. If `settle_round` reads
`bets` while that transaction is still open, under Postgres's normal
read-committed visibility it will not see the row — and the bet still
commits a moment later, because its own check already passed. Result: a
player who is debited, never ranked, never paid, and never refunded. The
idempotent claim above does not prevent this; it only stops a *second*
settlement, not a settlement that starts too early relative to an in-flight
bet.

The fix is a session-level advisory lock, keyed by round, taken at the top of
**both** `place_bet` and `settle_round`:

```sql
perform pg_advisory_xact_lock(hashtextextended(p_round_id::text, 0));
```

Because it is an `_xact_` lock it is held until the transaction ends and
released automatically on commit or rollback — no explicit unlock, no risk
of leaving it held after a crash. Whichever function acquires the lock first
for a given round forces the other to wait until that transaction ends. A
`place_bet` call that is still mid-transaction therefore blocks
`settle_round` from proceeding until it commits or rolls back — so
settlement's snapshot is guaranteed to include every bet that will ever exist
for that round, and no bet can be debited and then missed.

Settlement is also refused before the result is due:

```sql
if clock_timestamp() < v_round.result_visible_at then
  raise exception 'round % result is not visible yet', p_round_id;
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
create policy "results: readable only after the video shows them"
on public.round_results for select to anon, authenticated
using (
  exists (select 1 from public.rounds r
           where r.id = round_id and clock_timestamp() >= r.result_visible_at)
);
```

Why a separate table, and not a column-level `GRANT` on
`rounds.result_value`: PostgreSQL does have column-level grants, and
PostgREST honours them — that is not the problem. The problem is that a
`GRANT` is **static**: set once, true until someone changes it. This
requirement is **time-varying** — the column must be unreadable before
`result_visible_at` and readable after, with no code running at that instant
to flip anything. Only a row-level security *policy* is evaluated per row,
per query, against the live `clock_timestamp()`. A `GRANT` cannot express
"readable after this moment"; only a policy predicate can. So the gated value
has to live somewhere RLS can gate it — its own row, in its own table. **This
split is load-bearing. Do not merge these tables.**

`result_visible_at` is the wall-clock instant playback reaches the frame that
shows the result — computed from `video_reveal_s`, not a fixed offset from
`betting_closes_at`. Gating on a fixed offset instead published the answer
before the video showed it. See `data-model.md` §3 and `spec.md` §3.

### 5.2 Other players' guesses — SOLVED

Seeing the crowd's guesses before the lock is a real edge: a late better can
position just outside the cluster and take a winning slot deliberately.

```sql
create policy "bets: own bet always, others only after the video shows the result"
on public.bets for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.rounds r
              where r.id = round_id and clock_timestamp() >= r.result_visible_at)
);
```

Live pot and player count still work, because they come from
`round_stats()`, a `SECURITY DEFINER` function that returns **counts only,
never a guess**. See `data-model.md` §4.

### 5.3 The video — NOT SOLVED BY THE SCHEMA

**This is the weakest point in the system and it has no database fix.**

If the browser holds the whole file, the user can seek to the result frame
during BETTING. No RLS policy helps: the leak is in the media, not the data.

Options, best first:

1. **Live stream.** Nothing exists ahead of the play-head, so there is nothing
   to scrub. This is the only complete fix, and it is where the product wants
   to go anyway.
2. **Segmented HLS with server-gated segments.** Cut the video into segments.
   Refuse to serve any segment past the reveal point until
   `clock_timestamp() >= result_visible_at`. Strong, and works with recorded
   video.
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
- Every round's `chip_ledger` rows — stakes, payouts, and the `rake` entry to
  the house account (`data-model.md` §5.1) — sum to exactly zero on their
  own. That is what makes the ledger auditable evidence rather than a claim
  `settle_round` merely asserts.

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
