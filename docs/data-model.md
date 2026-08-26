# Data Model

Target schema for the betting product. Read `integrity.md` first — several
choices here look odd until you know which attack they stop.

## 0. The existing schema is wrong and must be replaced

Migration `20260826155655_initial_schema.sql` is live on the remote database.
It contains `artists`, `releases`, `events`, `event_artists`, `enquiries` — a
schema for an entertainment company's website.

That was built before `spec.md` was available and it guessed the product
wrong. **None of it applies.** Only `staff` survives, as back-office roles.

Replacement is a destructive change to a live database. It is **not** applied
automatically. See `roadmap.md` Phase 0.

---

## 1. Shape

```
profiles ──┬── bets ──── rounds ──── games
           │      │         │
           │      │         └── round_results   (split for secrecy)
           │      │
           ├── chip_ledger  (append-only, source of truth)
           └── balances     (cache, trigger-maintained)
```

### 1.1 `profiles`

Everything else in this schema references `profiles`, so it comes first.

```sql
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  is_bot       boolean not null default false,
  created_at   timestamptz not null default now()
);
```

One row per `auth.users` row, created at anonymous sign-in (see
`roadmap.md` Phase 2). `is_bot` marks a simulated player, per
`architecture.md` §6. A row `00000000-0000-0000-0000-000000000000`,
`display_name = 'house'`, is seeded once as the rake counterparty — see §5.1.

RLS: a single unconditional SELECT policy for `anon` and `authenticated`.
`display_name` and `is_bot` are not sensitive and there is nothing to
time-gate on this table, so it does not need the split that `rounds` /
`round_results` needs (§3). No INSERT/UPDATE/DELETE policy for any role below
`service_role` — a profile is written once, by the sign-up path.

## 2. `games`

Static configuration. One row per game.

```sql
create type public.game_shape as enum ('nearest', 'minority');

create table public.games (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  objective_line text not null,
  shape         public.game_shape not null default 'nearest',
  guess_min     integer not null,
  guess_max     integer not null,
  guess_step    integer not null default 1,
  result_unit   text not null,
  video_asset   text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  check (guess_min < guess_max),
  check (guess_step > 0)
);
```

`shape` selects the winner predicate. It exists so a second game shape does
not need a schema change. See `game-rules.md` §1.

RLS: a single SELECT policy for `anon` and `authenticated`, `using
(is_active)`. No writes below `service_role`.

## 3. `rounds` and `round_results`

**These are two tables on purpose. Do not merge them.**

```sql
create table public.rounds (
  id                 uuid primary key default gen_random_uuid(),
  game_id            uuid not null references public.games(id),
  round_index        integer not null,

  -- the schedule. state is derived from these, never stored. five columns,
  -- not four — see decisions.md "Corrected".
  preview_starts_at  timestamptz not null,
  betting_opens_at   timestamptz not null,
  betting_closes_at  timestamptz not null,
  result_visible_at  timestamptz not null,
  results_end_at     timestamptz not null,

  -- video timeline offsets, seconds
  video_bet_open_s   numeric(6,2) not null,
  video_reveal_s     numeric(6,2) not null,
  video_pause_s      numeric(6,2) not null,

  settled_at         timestamptz,
  created_at         timestamptz not null default now(),

  unique (game_id, round_index),
  check (preview_starts_at  < betting_opens_at),
  check (betting_opens_at   < betting_closes_at),
  check (betting_closes_at  < result_visible_at),
  check (result_visible_at  < results_end_at)
);
```

The `check` constraints make an incoherent schedule unrepresentable, and the
`betting_closes_at < result_visible_at` constraint is strict: a zero-length
LOCKED phase cannot be inserted either.

`result_visible_at` is not a fixed offset from `betting_closes_at`. It is
computed at round-creation time from the video's own reveal mark, because
that is the instant the video actually shows the result:

```
result_visible_at = betting_closes_at + (video_reveal_s − video_bet_open_s)
```

Gating on a fixed offset instead of this value opens the result before the
video shows it. See `spec.md` §3 for the full derivation of every round
duration from these five columns, and `integrity.md` §5.1 for why the gate
has to be a value in a row, not a fixed rule.

```sql
create table public.round_results (
  round_id     uuid primary key references public.rounds(id) on delete cascade,
  result_value integer not null,
  recorded_at  timestamptz not null default now()
);
```

Separate **only** so RLS can time-gate the result. A column-level `GRANT`
cannot express "readable after `result_visible_at`" — a `GRANT` is static,
and this gate is time-varying. Only a row-level security policy is evaluated
per row, per query, against the current `clock_timestamp()`, so the gated
value has to live in its own row. See `integrity.md` §5.1. **This split is
load-bearing. Do not merge these tables.**

RLS on `rounds`: a single unconditional SELECT policy for `anon` and
`authenticated`. The schedule is public; nothing on this table needs gating,
because the result lives elsewhere.

RLS on `round_results`: full policy text in `integrity.md` §5.1. No writes
below `service_role`.

## 4. `bets`, `place_bet()`, and the public aggregate

```sql
create table public.bets (
  id         uuid primary key default gen_random_uuid(),
  round_id   uuid not null references public.rounds(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  guess      integer not null,
  stake      integer not null check (stake = 20),
  placed_at  timestamptz not null default now(),
  unique (round_id, user_id)
);
```

`stake` is pinned to exactly `20` by a table constraint, not merely a
default. `bets` gets **no INSERT policy, no UPDATE policy, no DELETE
policy** for any role below `service_role` — only a SELECT policy (full text
in `integrity.md` §5.2). The only way to write a bet is
`public.place_bet()`:

```sql
create or replace function public.place_bet(p_round_id uuid, p_guess integer)
returns public.bets
language plpgsql
security definer
set search_path = ''
as $$ ... $$;

revoke execute on function public.place_bet(uuid, integer) from public;
grant execute on function public.place_bet(uuid, integer) to authenticated;
```

Full body and reasoning are in `integrity.md` §3. In one transaction it:
takes the round's advisory lock (`integrity.md` §4), checks
`clock_timestamp() < betting_closes_at`, checks `p_guess` against
`games.guess_min .. guess_max`, checks the caller can afford `20`, inserts
the bet, and inserts the matching `stake` ledger debit.

A bare RLS INSERT policy cannot do this: a policy can only constrain the row
being inserted, and cannot also write the matching ledger debit in the same
statement. Without that debit, a direct PostgREST insert into `bets` is a
free bet with a real payout — which is why `bets` gets no INSERT policy at
all, not even a well-guarded one.

Live pot and player count come from a `SECURITY DEFINER` function that
returns **no guesses**, only aggregates:

```sql
create function public.round_stats(p_round_id uuid)
returns table (player_count integer, pot integer)
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int, coalesce(sum(stake),0)::int
  from public.bets where round_id = p_round_id
$$;

revoke execute on function public.round_stats(uuid) from public;
grant execute on function public.round_stats(uuid) to anon, authenticated;
```

`SECURITY DEFINER` is safe here **only because the return type is two
integers, never a row, never a guess.** A `security_invoker` view was tried
first and rejected: run under the caller's own RLS, the aggregate is subject
to the same SELECT policy as any other query on `bets` — which shows a
caller only their own bet before reveal — so `count()` would return `1` for
every caller, forever. The live crowd counter would be permanently broken,
not merely leaky. See `decisions.md`, "Corrected", for the full account of
that mistake.

`round_stats` is a function, not a table, so it has no RLS policy of its
own — access is controlled entirely by the `grant execute` above. It does
not appear in the RLS table in §7 for that reason.

## 5. Chips: ledger plus cache

```sql
create type public.ledger_entry_kind as enum
  ('grant', 'stake', 'payout', 'refund', 'rake');

create table public.chip_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id),
  round_id   uuid references public.rounds(id),
  kind       public.ledger_entry_kind not null,
  amount     integer not null,   -- signed: stake < 0; grant/payout/refund/rake > 0
  created_at timestamptz not null default now()
);

create table public.balances (
  user_id uuid primary key references public.profiles(id),
  balance integer not null default 0 check (balance >= 0)
);
```

### 5.1 The house account

Every ledger entry has a `user_id`. Stakes debit a player; payouts and
refunds credit a player. Without a counterparty for the rake, a round's
entries never sum to zero on their own — the ledger is net negative by
exactly the rake plus the flooring dust (`game-rules.md` §4.1), and
`pot = Σpayouts + house_take` becomes a claim `settle_round` merely
*asserts*, not one the append-only record *demonstrates*. That contradicts
D3: "the ledger is the auditable truth."

The fix is a house account: the fixed `profiles` row from §1.1,
`id = '00000000-0000-0000-0000-000000000000'`. `settle_round` writes one
`rake` ledger entry crediting the house with `house_take` (§4.2 of
`game-rules.md`) in the same transaction as the payout rows. After that
entry, every round's ledger rows sum to exactly zero by themselves.

### 5.2 The cache and its trigger

The ledger is the truth. `balances` is a cache kept current by an
`AFTER INSERT` trigger on `chip_ledger`:

```sql
create or replace function public.apply_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.balances (user_id, balance)
  values (new.user_id, new.amount)
  on conflict (user_id) do update
    set balance = public.balances.balance + new.amount;
  return new;
end;
$$;

create trigger chip_ledger_apply
after insert on public.chip_ledger
for each row execute function public.apply_ledger_entry();
```

`check (balance >= 0)` is the last line of defence against a negative
balance. The application checks affordability first (in `place_bet`); this
makes a bug impossible rather than unlikely.

Audit: `select sum(amount) from chip_ledger where user_id = $1` must always
equal `balances.balance`. Assert it in tests.

RLS on `chip_ledger`: read own entries only, `authenticated` role, no `anon`
access. No INSERT/UPDATE/DELETE policy for any role below `service_role` —
entries are written only by `place_bet()` and `settle_round()`, both
`SECURITY DEFINER`.

RLS on `balances`: read own balance only, `authenticated` role, no `anon`
access. No write policy — written only by the trigger above.

## 6. `settle_round`

```sql
create or replace function public.settle_round(p_round_id uuid)
returns table (winner_count integer, multiplier numeric, payout integer)
language plpgsql
security definer
set search_path = ''
as $$ ... $$;

revoke execute on function public.settle_round(uuid) from public;
grant execute on function public.settle_round(uuid) to anon, authenticated;
```

`SECURITY DEFINER` because it writes the ledger, which no user role may write
directly. `search_path = ''` for the reason in `CLAUDE.md` — every reference
inside is schema-qualified. The `revoke ... from public` matches the
practice already used for `is_staff()`: PostgreSQL grants `EXECUTE` on a new
function to `PUBLIC` by default, and PostgREST exposes every table-returning
function at `/rpc`. Left ungranted, `settle_round` would be callable by
anyone holding the anon key, for any round, at any time.

Sequence, all in one transaction:

1. Take the round's advisory lock:
   `pg_advisory_xact_lock(hashtextextended(p_round_id::text, 0))`. Blocks
   until any in-flight `place_bet()` call for this round has committed or
   rolled back. See `integrity.md` §4 — this is what stops a bet from being
   debited but never ranked, paid, or refunded.
2. Claim the round: `UPDATE ... SET settled_at = clock_timestamp() WHERE
   settled_at IS NULL RETURNING`. Exit silently if unclaimed — already
   settled.
3. Refuse if `clock_timestamp() < result_visible_at`.
4. Count the round's bets. **If zero, stop here:** the round is already
   claimed and marked settled. Write no ledger rows. Return
   `(0, null, 0)`. `prize / winner_count` is undefined at zero winners, so
   nothing past this point may run. See `game-rules.md` §6.
5. Read `result_value` from `round_results`.
6. Rank bets by `abs(guess − result_value)` using `RANK`, take
   `rank <= max(1, ceil(count × 0.10))`.
7. Compute pot, prize, `floor` payout, dust — per `game-rules.md` §4.
8. Insert one `payout` ledger row per winner, and one `rake` ledger row
   crediting the house account with `house_take` (§5.1).
9. Assert conservation: `pot = Σpayouts + house_take`. Raise on mismatch.

Step 9 is not defensive padding. A silent conservation failure means chips
were invented, and the ledger stops being evidence of anything.

## 7. RLS summary

Every table gets RLS. Policies not already shown in full above:

```sql
-- profiles
create policy "profiles: read display fields"
on public.profiles for select to anon, authenticated
using (true);

-- games
create policy "games: anyone reads active games"
on public.games for select to anon, authenticated
using (is_active);

-- rounds
create policy "rounds: anyone reads the schedule"
on public.rounds for select to anon, authenticated
using (true);

-- chip_ledger
create policy "chip_ledger: read own entries only"
on public.chip_ledger for select to authenticated
using (user_id = (select auth.uid()));

-- balances
create policy "balances: read own balance only"
on public.balances for select to authenticated
using (user_id = (select auth.uid()));
```

`round_results` and `bets` policies are quoted in full in `integrity.md`
§5.1 and §5.2 — both are time-gated or ownership-gated, unlike the tables
above, so they are kept next to the reasoning rather than repeated here.

| Table | anon | authenticated | Notes |
|---|---|---|---|
| `profiles` | read all | read all | Nothing to gate. |
| `games` | read active | read active | Public config. |
| `rounds` | read | read | Schedule is public. No result here. |
| `round_results` | read **after `result_visible_at`** | same | Time-gated. |
| `bets` | none | read own; read others after `result_visible_at` | No INSERT/UPDATE/DELETE below `service_role`. Writes go through `place_bet()`. |
| `chip_ledger` | none | read own | Append-only. No user writes. |
| `balances` | none | read own | Cache. No user writes. |

`round_stats` and `place_bet` are functions, not tables — they have no RLS
of their own. Access is controlled by `grant execute` / `revoke execute`, as
shown in §4 and §6. A view or function has no per-row policy; do not list one
in this table.

## 8. Indexes

```sql
create index on public.bets (round_id);
create index on public.bets (user_id, placed_at desc);
create index on public.rounds (game_id, betting_opens_at desc);
create index on public.chip_ledger (user_id, created_at desc);
```

`bets (round_id)` carries settlement's ranking scan and the live aggregate. It
is the hot one.

## 9. `server_now()`

```sql
create or replace function public.server_now()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$ select clock_timestamp() $$;
```

Used only by the client to measure its clock offset (`architecture.md`
§2.3). It is a display aid, not a guarantee — the guarantee is the set of
`clock_timestamp()` checks inside `place_bet()` and `settle_round()`
themselves (`integrity.md` §2, §3, §4).
