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

## 2. `games`

Static configuration. One row per game.

```sql
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

`shape` is an enum (`nearest`, `minority`) selecting the winner predicate. It
exists so a second game shape does not need a schema change. See
`game-rules.md` §1.

## 3. `rounds` and `round_results`

**These are two tables on purpose. Do not merge them.**

```sql
create table public.rounds (
  id                uuid primary key default gen_random_uuid(),
  game_id           uuid not null references public.games(id),
  round_index       integer not null,

  -- the schedule. state is derived from these, never stored.
  betting_opens_at  timestamptz not null,
  betting_closes_at timestamptz not null,
  reveal_at         timestamptz not null,
  results_end_at    timestamptz not null,

  -- video timeline offsets, seconds
  video_bet_open_s  numeric(6,2) not null,
  video_reveal_s    numeric(6,2) not null,
  video_pause_s     numeric(6,2) not null,

  settled_at        timestamptz,
  created_at        timestamptz not null default now(),

  unique (game_id, round_index),
  check (betting_opens_at < betting_closes_at),
  check (betting_closes_at <= reveal_at),
  check (reveal_at < results_end_at)
);
```

The `check` constraints make an incoherent schedule unrepresentable. A round
whose betting closes after its reveal cannot be inserted at all.

```sql
create table public.round_results (
  round_id     uuid primary key references public.rounds(id) on delete cascade,
  result_value integer not null,
  recorded_at  timestamptz not null default now()
);
```

Separate **only** so RLS can time-gate the result. RLS is row-level; it cannot
hide one column of a row a user may otherwise read. Putting `result_value` on
`rounds` would publish the answer during BETTING. See `integrity.md` §5.1.

## 4. `bets` and the public aggregate

```sql
create table public.bets (
  id         uuid primary key default gen_random_uuid(),
  round_id   uuid not null references public.rounds(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  guess      integer not null,
  stake      integer not null default 20 check (stake > 0),
  placed_at  timestamptz not null default now(),
  unique (round_id, user_id)
);
```

No UPDATE policy. No DELETE policy. A bet is immutable once written.

Live pot and player count come from a view that exposes **no guesses**:

```sql
create view public.round_stats
with (security_invoker = true) as
select r.id            as round_id,
       count(b.id)     as player_count,
       coalesce(sum(b.stake), 0) as pot
from public.rounds r
left join public.bets b on b.round_id = r.id
group by r.id;
```

`security_invoker = true` matters. Without it the view runs as its owner and
silently bypasses the caller's RLS — which would leak every bet through the
aggregate. **This flag is a security control.**

## 5. Chips: ledger plus cache

```sql
create table public.chip_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id),
  round_id   uuid references public.rounds(id),
  kind       public.ledger_entry_kind not null,   -- grant|stake|payout|refund
  amount     integer not null,                    -- signed: stake < 0, payout > 0
  created_at timestamptz not null default now()
);

create table public.balances (
  user_id uuid primary key references public.profiles(id),
  balance integer not null default 0 check (balance >= 0)
);
```

The ledger is the truth. `balances` is a cache kept current by an
`AFTER INSERT` trigger on `chip_ledger`.

`check (balance >= 0)` is the last line of defence against a negative balance.
The application checks affordability first; this makes a bug impossible rather
than unlikely.

Audit: `select sum(amount) from chip_ledger where user_id = $1` must always
equal `balances.balance`. Assert it in tests.

## 6. `settle_round`

```sql
create or replace function public.settle_round(p_round_id uuid)
returns table (winner_count integer, multiplier numeric, payout integer)
language plpgsql
security definer
set search_path = ''
as $$ ... $$;
```

`SECURITY DEFINER` because it writes the ledger, which no user role may write
directly. `search_path = ''` for the reason in `CLAUDE.md` — every reference
inside is schema-qualified.

Sequence, all in one transaction:

1. Claim the round: `UPDATE ... SET settled_at = now() WHERE settled_at IS
   NULL RETURNING`. Exit silently if unclaimed — already settled.
2. Refuse if `now() < reveal_at`.
3. Read `result_value` from `round_results`.
4. Rank bets by `abs(guess − result_value)` using `RANK`, take
   `rank <= max(1, ceil(count × 0.10))`.
5. Compute pot, prize, `floor` payout, dust — per `game-rules.md` §4.
6. Insert one `payout` ledger row per winner.
7. Assert conservation: `pot = Σpayouts + house_take`. Raise on mismatch.

Step 7 is not defensive padding. A silent conservation failure means chips
were invented, and the ledger stops being evidence of anything.

## 7. RLS summary

Every table gets RLS. Full policy text is in `integrity.md`.

| Table | anon | authenticated | Notes |
|---|---|---|---|
| `games` | read active | read active | Public config. |
| `rounds` | read | read | Schedule is public. No result here. |
| `round_results` | read **after `reveal_at`** | same | Time-gated. |
| `bets` | none | insert while open; read own; read others after reveal | Immutable. |
| `round_stats` | read | read | Counts only. |
| `chip_ledger` | none | read own | Append-only. No user writes. |
| `balances` | none | read own | Cache. |
| `profiles` | read display fields | read display fields | |

Writes to `chip_ledger` happen **only** inside `settle_round` and the
bet-placement path. No role below `service_role` gets an INSERT policy.

## 8. Indexes

```sql
create index on public.bets (round_id);
create index on public.bets (user_id, placed_at desc);
create index on public.rounds (game_id, betting_opens_at desc);
create index on public.chip_ledger (user_id, created_at desc);
```

`bets (round_id)` carries settlement's ranking scan and the live aggregate. It
is the hot one.
