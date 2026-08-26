-- Zero Sum Entertainment - betting core
--
-- Phase 1 of docs/roadmap.md: the whole integrity model, with no interface.
-- Read docs/integrity.md before changing anything in this file. Every RLS
-- policy and every constraint here is a security control, not a feature.
--
-- Statement order is dependency order. PostgreSQL validates the body of a
-- LANGUAGE sql function at CREATE time, so every table a function reads is
-- created before it (see CLAUDE.md, "Writing migrations: two traps").
--
-- Every function pins `set search_path = ''`, so every reference below is
-- schema-qualified. pg_catalog is always searched, so now(), clock_timestamp(),
-- gen_random_uuid(), abs(), ceil(), floor() and rank() still resolve.
--
-- ---------------------------------------------------------------------------
-- Deliberate departures from docs/data-model.md and docs/integrity.md
--
-- These were directed after an adversarial audit of the documents. Each one
-- closes a hole that the documents as written would have shipped.
--
--  1. `round_stats` is a SECURITY DEFINER function, not a view with
--     `security_invoker = true`. Under security_invoker the view runs with the
--     caller's RLS, and the bets SELECT policy hides every bet but your own
--     until the result is visible - so count(*) would return 1 for everybody
--     and the live crowd counter would be permanently wrong. The function
--     returns aggregates only, never a guess, so DEFINER leaks nothing.
--
--  2. `rounds` carries FIVE boundaries. `reveal_at` is replaced by
--     `result_visible_at`, which is the moment the VIDEO shows the result, and
--     `preview_starts_at` is added. Time-gating the result on anything earlier
--     than the video frame publishes the answer before the audience sees it,
--     which defeats the product.
--
--  3. `bets` has NO INSERT policy and no INSERT grant. A direct PostgREST
--     insert would have created a bet with no matching `stake` ledger row -
--     a free bet with a real payout. `public.place_bet()` is the only path.
--
--  4. Every boundary comparison uses `clock_timestamp()`, never `now()`.
--     `now()` is transaction_timestamp(): a client could BEGIN before the
--     close and INSERT after it and still pass. `clock_timestamp()` advances
--     inside the transaction.
--
--  5. `place_bet()` and `settle_round()` both take
--     `pg_advisory_xact_lock()` on the round. Without it a bet committing
--     in-flight can be missed by settlement's snapshot: debited, never ranked,
--     never paid, never refunded.
--
--  6. A zero-bet round is claimed, marked settled, and returns before the
--     payout maths - which would divide by zero.
--
--  7. `ledger_entry_kind` gains `rake`, and settlement writes the house take
--     to a house profile. The ledger then sums to exactly zero per round, so
--     conservation is auditable from the record itself.
--
--  8. The multiplier is `payout_per_winner / 20`, computed AFTER the floor.
--     (1 - RAKE)/share diverges from what winners actually received the moment
--     the division is not exact: 178/20 = 8.90, not 8.93.
--
--  9. `settle_round()` has EXECUTE revoked from PUBLIC.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Selects the winner predicate. A second game shape must not need a schema
-- change. docs/game-rules.md §1.
create type public.game_shape as enum ('nearest', 'minority');

-- grant  : new-account chips, positive.
-- stake  : bet placed, negative.
-- payout : settlement credit to a winner, positive.
-- refund : voided round returned to a player, positive.
-- rake   : house take, positive, always to the house profile.
create type public.ledger_entry_kind as enum ('grant', 'stake', 'payout', 'refund', 'rake');


-- ---------------------------------------------------------------------------
-- profiles
--
-- One row per player. For a real player `id` IS `auth.uid()`:
-- public.ensure_profile() is SECURITY DEFINER and the only writer, and it
-- writes auth.uid() and nothing else. There is no INSERT policy, so no caller
-- can forge a profile.
--
-- There is deliberately NO foreign key to auth.users:
--   * the house profile has no auth user and must still exist;
--   * chip_ledger must outlive a deleted account, because it is the audit
--     record of chips that were really moved.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key,
  display_name text not null check (char_length(trim(display_name)) between 1 and 60),
  is_bot       boolean not null default false,
  is_house     boolean not null default false,
  created_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Players. Display fields only - readable by everyone. id = auth.uid() for real players.';
comment on column public.profiles.is_bot is
  'Simulated player written server-side. docs/architecture.md §6.';
comment on column public.profiles.is_house is
  'The single house account. Receives rake and dust at settlement.';

-- At most one house profile.
create unique index profiles_single_house_idx
  on public.profiles (is_house)
  where is_house;

-- The house account. Fixed id so operational queries can rely on it.
insert into public.profiles (id, display_name, is_house)
values ('00000000-0000-0000-0000-000000000000', 'House', true)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------------
-- games
--
-- Static configuration. docs/data-model.md §2.
-- ---------------------------------------------------------------------------

create table public.games (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  objective_line text not null,
  shape          public.game_shape not null default 'nearest',
  guess_min      integer not null,
  guess_max      integer not null,
  guess_step     integer not null default 1,
  result_unit    text not null,
  video_asset    text not null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  check (guess_min < guess_max),
  check (guess_step > 0)
);


-- ---------------------------------------------------------------------------
-- rounds
--
-- State is DERIVED from these timestamps and is never stored.
-- docs/integrity.md §2. There is no `state` column and there must never be
-- one: a stored state needs a writer, and the window between "closed in fact"
-- and "closed in the row" is exactly where a late bet gets accepted.
--
--   clock_timestamp() <  preview_starts_at   -> scheduled
--   clock_timestamp() <  betting_opens_at    -> preview
--   clock_timestamp() <  betting_closes_at   -> betting
--   clock_timestamp() <  result_visible_at   -> locked
--   clock_timestamp() <  results_end_at      -> reveal
--   otherwise                                -> results
--
-- result_visible_at is the frame of the video that shows the result, i.e.
--   result_visible_at = betting_closes_at + (video_reveal_s - video_bet_open_s)
-- because the video starts playing from video_bet_open_s at betting_closes_at
-- (docs/architecture.md §4). The trigger below enforces that alignment. Gating
-- the result on any earlier timestamp publishes the answer before the audience
-- sees it.
-- ---------------------------------------------------------------------------

create table public.rounds (
  id                uuid primary key default gen_random_uuid(),
  game_id           uuid not null references public.games (id),
  round_index       integer not null,

  -- the schedule. five boundaries.
  preview_starts_at timestamptz not null,
  betting_opens_at  timestamptz not null,
  betting_closes_at timestamptz not null,
  result_visible_at timestamptz not null,
  results_end_at    timestamptz not null,

  -- video timeline offsets, seconds
  video_bet_open_s  numeric(6,2) not null,
  video_reveal_s    numeric(6,2) not null,
  video_pause_s     numeric(6,2) not null,

  settled_at        timestamptz,
  created_at        timestamptz not null default now(),

  unique (game_id, round_index),

  -- An incoherent schedule is unrepresentable. Note the strict < between the
  -- close and the reveal: a zero-length lock phase is not allowed.
  constraint rounds_schedule_ordered check (
    preview_starts_at < betting_opens_at
    and betting_opens_at  < betting_closes_at
    and betting_closes_at < result_visible_at
    and result_visible_at < results_end_at
  ),
  constraint rounds_video_ordered check (
    video_bet_open_s >= 0
    and video_bet_open_s < video_reveal_s
    and video_reveal_s   < video_pause_s
  )
);


-- ---------------------------------------------------------------------------
-- round_results
--
-- Split from `rounds` ONLY so RLS can time-gate the result. RLS is row-level;
-- it cannot hide one column of a row the caller may otherwise read. A
-- result_value column on `rounds` would publish the answer during BETTING.
-- docs/integrity.md §5.1. DO NOT MERGE THESE TABLES.
-- ---------------------------------------------------------------------------

create table public.round_results (
  round_id     uuid primary key references public.rounds (id) on delete cascade,
  result_value integer not null,
  recorded_at  timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- bets
--
-- Immutable once written: no UPDATE policy, no DELETE policy, for anyone below
-- service_role. `unique (round_id, user_id)` is one bet per player, enforced by
-- the schema rather than by the application.
--
-- `stake = 20` is a hard constraint, not a default. docs/game-rules.md §4
-- assumes every stake is equal; a caller who staked 1 chip would take a full
-- winner's share of a pot built from other people's 20s.
-- ---------------------------------------------------------------------------

create table public.bets (
  id        uuid primary key default gen_random_uuid(),
  round_id  uuid not null references public.rounds (id) on delete cascade,
  user_id   uuid not null references public.profiles (id),
  guess     integer not null,
  stake     integer not null default 20 check (stake = 20),
  placed_at timestamptz not null default now(),
  unique (round_id, user_id)
);


-- ---------------------------------------------------------------------------
-- chip_ledger and balances
--
-- The ledger is the truth. `balances` is a cache maintained by trigger.
-- docs/data-model.md §5, docs/integrity.md §6.
--
-- Audit: sum(amount) from chip_ledger where user_id = $1 must always equal
-- balances.balance. Per round, sum(amount) over all rows must be exactly 0.
-- ---------------------------------------------------------------------------

create table public.chip_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id),
  round_id   uuid references public.rounds (id),
  kind       public.ledger_entry_kind not null,
  amount     integer not null,          -- signed: stake < 0, payout > 0
  created_at timestamptz not null default now()
);

comment on table public.chip_ledger is
  'Append-only. No UPDATE or DELETE policy exists for any role below service_role.';

create table public.balances (
  user_id uuid primary key references public.profiles (id),
  balance integer not null default 0 check (balance >= 0)
);

comment on column public.balances.balance is
  'Cache of sum(chip_ledger.amount). check (balance >= 0) is the last line of defence against a negative balance - it makes an overdraft impossible rather than unlikely.';


-- ---------------------------------------------------------------------------
-- Indexes. docs/data-model.md §8.
-- ---------------------------------------------------------------------------

-- The hot one: carries settlement's ranking scan and the live aggregate.
create index bets_round_idx              on public.bets (round_id);
create index bets_user_placed_idx        on public.bets (user_id, placed_at desc);
create index rounds_game_opens_idx       on public.rounds (game_id, betting_opens_at desc);
create index chip_ledger_user_created_idx on public.chip_ledger (user_id, created_at desc);
create index chip_ledger_round_idx       on public.chip_ledger (round_id);


-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Keeps balances in step with the ledger. SECURITY DEFINER because `balances`
-- has RLS and no write policy: nobody below service_role may write it directly.
create or replace function public.apply_ledger_to_balance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.balances as b (user_id, balance)
  values (new.user_id, new.amount)
  on conflict (user_id) do update
    set balance = b.balance + excluded.balance;
  return null;
end;
$$;

create trigger chip_ledger_apply_balance
  after insert on public.chip_ledger
  for each row execute function public.apply_ledger_to_balance();

-- The result must become readable at the frame that shows it, not before.
-- A CHECK constraint cannot express this (the expression is not immutable), so
-- it is a trigger - which still holds against service_role.
create or replace function public.rounds_check_video_alignment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_schedule_s numeric;
  v_video_s    numeric;
begin
  v_schedule_s := extract(epoch from (new.result_visible_at - new.betting_closes_at));
  v_video_s    := new.video_reveal_s - new.video_bet_open_s;

  if abs(v_schedule_s - v_video_s) > 0.5 then
    raise exception
      'round schedule is not aligned to the video: result_visible_at is % s after betting_closes_at, but the reveal frame is % s after the bet-open frame',
      v_schedule_s, v_video_s
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger rounds_video_alignment
  before insert or update on public.rounds
  for each row execute function public.rounds_check_video_alignment();

-- A guess outside the game's declared range is unrecoverable once ranked, so
-- it is rejected at the table. place_bet() checks the same thing first and
-- returns a friendlier error; this is the invariant behind it, and it also
-- covers the server-side bot writer (docs/architecture.md §6).
-- SECURITY DEFINER so validation reads the true rows regardless of the
-- caller's RLS.
create or replace function public.bets_validate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_game public.games%rowtype;
begin
  select g.* into v_game
    from public.games g
    join public.rounds r on r.game_id = g.id
   where r.id = new.round_id;

  if not found then
    raise exception 'bets_validate: round % has no game', new.round_id
      using errcode = '23503';
  end if;

  if new.guess < v_game.guess_min or new.guess > v_game.guess_max then
    raise exception 'guess % is outside the range % .. % for game %',
      new.guess, v_game.guess_min, v_game.guess_max, v_game.slug
      using errcode = '23514';
  end if;

  if pg_catalog.mod(new.guess - v_game.guess_min, v_game.guess_step) <> 0 then
    raise exception 'guess % is not on the % step grid for game %',
      new.guess, v_game.guess_step, v_game.slug
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger bets_validate_guess
  before insert on public.bets
  for each row execute function public.bets_validate();


-- ---------------------------------------------------------------------------
-- server_now()
--
-- The client measures its clock offset against this once at load and on every
-- reconnect. docs/architecture.md §2.3. It makes the countdown honest; it is
-- NOT a guarantee. The guarantee is the check inside place_bet().
-- ---------------------------------------------------------------------------

create or replace function public.server_now()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select clock_timestamp();
$$;


-- ---------------------------------------------------------------------------
-- round_stats()
--
-- Live pot and player count, exposing NO guesses. docs/data-model.md §4.
--
-- SECURITY DEFINER on purpose. Under the caller's own RLS the bets SELECT
-- policy hides every bet but the caller's own until result_visible_at, so an
-- invoker-rights aggregate would report player_count = 1 to everyone. This
-- returns two integers and can never return a guess, so definer rights leak
-- nothing: the secrecy control in docs/integrity.md §5.2 is untouched.
-- ---------------------------------------------------------------------------

create or replace function public.round_stats(p_round_id uuid)
returns table (player_count integer, pot integer)
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer,
         coalesce(sum(b.stake), 0)::integer
    from public.bets b
   where b.round_id = p_round_id;
$$;


-- ---------------------------------------------------------------------------
-- ensure_profile()
--
-- Idempotent. Creates the caller's profile and the one-off 200-chip grant.
-- docs/game-rules.md §2, START_BALANCE. SECURITY DEFINER because profiles has
-- no INSERT policy and chip_ledger has no write policy at all.
-- ---------------------------------------------------------------------------

create or replace function public.ensure_profile()
returns table (profile_id uuid, balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_created uuid;
  v_balance integer;
begin
  if v_uid is null then
    raise exception 'ensure_profile: not authenticated'
      using errcode = '28000';
  end if;

  insert into public.profiles (id, display_name)
  values (v_uid, 'Player ' || upper(substr(v_uid::text, 1, 4)))
  on conflict (id) do nothing
  returning id into v_created;

  -- The grant is written only on the insert that actually created the row, and
  -- the second guard makes a partially-applied profile self-heal rather than
  -- double-grant.
  if v_created is not null
     and not exists (
       select 1 from public.chip_ledger cl
        where cl.user_id = v_uid and cl.kind = 'grant'
     )
  then
    insert into public.chip_ledger (user_id, kind, amount)
    values (v_uid, 'grant', 200);
  end if;

  select b.balance into v_balance
    from public.balances b
   where b.user_id = v_uid;

  return query select v_uid, coalesce(v_balance, 0);
end;
$$;


-- ---------------------------------------------------------------------------
-- place_bet()
--
-- The ONLY way a bet is written. `bets` has no INSERT policy and no INSERT
-- grant, so this function is the whole write surface.
--
-- Being SECURITY DEFINER, it bypasses RLS - so it re-asserts every rule that
-- the RLS policy in docs/integrity.md §3 would have asserted, and then some:
-- the betting window, the stake, the guess range, and affordability. All of it
-- inside one transaction with the insert, so there is no check-then-act gap.
--
-- The clock is the DATABASE clock, and it is clock_timestamp(), not now():
-- now() is the transaction start, so a client that opened a transaction before
-- the close could insert after it.
-- ---------------------------------------------------------------------------

create or replace function public.place_bet(p_round_id uuid, p_guess integer)
returns table (bet_id uuid, stake_charged integer, new_balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_round   public.rounds%rowtype;
  v_game    public.games%rowtype;
  v_stake   integer := 20;                 -- docs/game-rules.md §2, STAKE
  v_balance integer;
  v_bet_id  uuid;
begin
  if v_uid is null then
    raise exception 'place_bet: not authenticated'
      using errcode = '28000';
  end if;

  -- Serialise every writer touching this round against settlement. Without
  -- this a bet can commit inside settlement's snapshot gap: debited, never
  -- ranked, never paid, never refunded.
  perform pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtextextended(p_round_id::text, 0));

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'place_bet: no profile - call ensure_profile() first'
      using errcode = '42501';
  end if;

  select r.* into v_round from public.rounds r where r.id = p_round_id;
  if not found then
    raise exception 'place_bet: round % not found', p_round_id
      using errcode = '23503';
  end if;

  -- THE LOCK. docs/integrity.md §3. A late bet errors; it is never clamped,
  -- queued or quietly dropped.
  if clock_timestamp() < v_round.betting_opens_at then
    raise exception 'place_bet: betting has not opened for round %', p_round_id
      using errcode = '42501';
  end if;

  if clock_timestamp() >= v_round.betting_closes_at then
    raise exception 'place_bet: betting is closed for round %', p_round_id
      using errcode = '42501';
  end if;

  if v_round.settled_at is not null then
    raise exception 'place_bet: round % is already settled', p_round_id
      using errcode = '42501';
  end if;

  select g.* into v_game from public.games g where g.id = v_round.game_id;
  if not found or not v_game.is_active then
    raise exception 'place_bet: game for round % is not active', p_round_id
      using errcode = '42501';
  end if;

  if p_guess < v_game.guess_min or p_guess > v_game.guess_max then
    raise exception 'place_bet: guess % is outside the range % .. %',
      p_guess, v_game.guess_min, v_game.guess_max
      using errcode = '23514';
  end if;

  if pg_catalog.mod(p_guess - v_game.guess_min, v_game.guess_step) <> 0 then
    raise exception 'place_bet: guess % is not on the % step grid',
      p_guess, v_game.guess_step
      using errcode = '23514';
  end if;

  -- Affordability. The friendly error. balances.check (balance >= 0) is the
  -- guarantee behind it and catches any race this check could lose.
  select b.balance into v_balance
    from public.balances b
   where b.user_id = v_uid;
  v_balance := coalesce(v_balance, 0);

  if v_balance < v_stake then
    raise exception 'place_bet: insufficient chips - balance %, stake %',
      v_balance, v_stake
      using errcode = '23514';
  end if;

  begin
    insert into public.bets (round_id, user_id, guess, stake)
    values (p_round_id, v_uid, p_guess, v_stake)
    returning id into v_bet_id;
  exception when unique_violation then
    raise exception 'place_bet: you have already bet on round %', p_round_id
      using errcode = '23505';
  end;

  -- Same transaction as the insert. A bet without its stake row would be a
  -- free bet, and settlement asserts against exactly that.
  insert into public.chip_ledger (user_id, round_id, kind, amount)
  values (v_uid, p_round_id, 'stake', -v_stake);

  select b.balance into v_balance
    from public.balances b
   where b.user_id = v_uid;

  return query select v_bet_id, v_stake, v_balance;
end;
$$;


-- ---------------------------------------------------------------------------
-- settle_round()
--
-- The payout calculation lives here and nowhere else. Not in the client, not
-- in an Edge Function, not duplicated. docs/game-rules.md §7.
--
-- docs/data-model.md §6, docs/game-rules.md §4, docs/integrity.md §4.
-- ---------------------------------------------------------------------------

create or replace function public.settle_round(p_round_id uuid)
returns table (winner_count integer, multiplier numeric, payout integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed     uuid;
  v_visible_at  timestamptz;
  v_result      integer;
  v_players     integer;
  v_pot         integer;
  v_prize       integer;
  v_n           integer;
  v_winners     integer;
  v_payout      integer;
  v_dust        integer;
  v_house       integer;
  v_house_id    uuid;
  v_rows        integer;
  v_staked      integer;
  v_paid        integer;
  v_net         integer;
  v_multiplier  numeric;
begin
  -- Serialise against place_bet() on the same round, so no bet can commit
  -- between the claim and the ranking scan.
  perform pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtextextended(p_round_id::text, 0));

  -- 1. Claim the round. This is a conditional claim, not a check-then-act:
  -- two concurrent callers cannot both match `settled_at is null`.
  -- docs/integrity.md §4.
  update public.rounds r
     set settled_at = clock_timestamp()
   where r.id = p_round_id
     and r.settled_at is null
  returning r.id, r.result_visible_at
       into v_claimed, v_visible_at;

  if v_claimed is null then
    return;                       -- already settled, or being settled. Do nothing.
  end if;

  -- 2. Refuse before the result is due. The RAISE rolls the claim back with
  -- everything else, so a premature call leaves no trace.
  if clock_timestamp() < v_visible_at then
    raise exception 'settle_round: round % is not revealable yet', p_round_id
      using errcode = '55000';
  end if;

  -- 3. The result.
  select rr.result_value into v_result
    from public.round_results rr
   where rr.round_id = p_round_id;

  if v_result is null then
    raise exception 'settle_round: round % has no recorded result', p_round_id
      using errcode = '55000';
  end if;

  select count(*)::integer, coalesce(sum(b.stake), 0)::integer
    into v_players, v_pot
    from public.bets b
   where b.round_id = p_round_id;

  -- Zero bets: the round voids. It stays claimed so the sweep does not retry
  -- it forever, and it writes no ledger rows. docs/game-rules.md §6.
  -- Returning here is also what keeps prize / winner_count from dividing by
  -- zero below.
  if v_players = 0 then
    return query select 0, 0::numeric, 0;
    return;
  end if;

  -- Every bet must have brought its stake row with it. If this fails, a bet
  -- was written outside place_bet() and chips were never debited.
  select coalesce(-sum(cl.amount), 0)::integer into v_staked
    from public.chip_ledger cl
   where cl.round_id = p_round_id
     and cl.kind = 'stake';

  if v_staked <> v_pot then
    raise exception
      'settle_round: round % staked % chips but the ledger debited % - refusing to settle',
      p_round_id, v_pot, v_staked
      using errcode = 'XX000';
  end if;

  select p.id into v_house_id from public.profiles p where p.is_house limit 1;
  if v_house_id is null then
    raise exception 'settle_round: no house profile exists'
      using errcode = 'XX000';
  end if;

  -- 4. Winners. RANK, never ROW_NUMBER: tied distances share a rank, so every
  -- bet tied at the cut-off is included. ROW_NUMBER would break ties
  -- arbitrarily and silently drop someone who tied for the last slot.
  -- docs/game-rules.md §3.
  v_n := greatest(1, ceil(v_players * 0.10))::integer;

  with ranked as (
    select rank() over (order by abs(b.guess - v_result)) as rnk
      from public.bets b
     where b.round_id = p_round_id
  )
  select count(*)::integer into v_winners
    from ranked
   where ranked.rnk <= v_n;

  -- 5. Payout. floor, dust to the house. docs/game-rules.md §4.1.
  v_prize  := floor(v_pot * 0.95)::integer;      -- RAKE = 0.05
  v_payout := floor(v_prize::numeric / v_winners)::integer;
  v_dust   := v_prize - (v_payout * v_winners);
  v_house  := v_pot - v_prize + v_dust;

  -- 6. One payout row per winner.
  insert into public.chip_ledger (user_id, round_id, kind, amount)
  select w.user_id, p_round_id, 'payout', v_payout
    from (
      select b.user_id,
             rank() over (order by abs(b.guess - v_result)) as rnk
        from public.bets b
       where b.round_id = p_round_id
    ) w
   where w.rnk <= v_n;

  get diagnostics v_rows = row_count;

  if v_rows <> v_winners then
    raise exception
      'settle_round: round % ranked % winners but wrote % payout rows',
      p_round_id, v_winners, v_rows
      using errcode = 'XX000';
  end if;

  -- The house take gets a counterparty row, so the round nets to zero and
  -- conservation is auditable from the ledger alone.
  if v_house <> 0 then
    insert into public.chip_ledger (user_id, round_id, kind, amount)
    values (v_house_id, p_round_id, 'rake', v_house);
  end if;

  -- 7. Conservation. Read back from the ledger, not from the arithmetic that
  -- produced it - an assertion against your own variables proves nothing.
  --
  -- A silent conservation failure means chips were invented, and the ledger
  -- stops being evidence of anything. docs/game-rules.md §4.2.
  select coalesce(sum(cl.amount), 0)::integer into v_paid
    from public.chip_ledger cl
   where cl.round_id = p_round_id
     and cl.kind = 'payout';

  select coalesce(sum(cl.amount), 0)::integer into v_net
    from public.chip_ledger cl
   where cl.round_id = p_round_id;

  if v_pot <> v_paid + v_house or v_net <> 0 then
    raise exception
      'settle_round: conservation failure on round % - pot %, payouts %, house %, ledger net %',
      p_round_id, v_pot, v_paid, v_house, v_net
      using errcode = 'XX000';
  end if;

  -- 8. The multiplier is what winners actually received, computed after the
  -- floor. (1 - RAKE) / share is the pre-rounding ideal and diverges from the
  -- truth: 178 / 20 = 8.90, not 8.93.
  v_multiplier := round(v_payout::numeric / 20, 2);

  return query select v_winners, v_multiplier, v_payout;
end;
$$;


-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Every table. A Supabase table without RLS is readable and writable by anyone
-- holding the public anon key.
-- ---------------------------------------------------------------------------

alter table public.profiles      enable row level security;
alter table public.games         enable row level security;
alter table public.rounds        enable row level security;
alter table public.round_results enable row level security;
alter table public.bets          enable row level security;
alter table public.chip_ledger   enable row level security;
alter table public.balances      enable row level security;

-- profiles: display fields only, and the table holds nothing else.
-- No INSERT, UPDATE or DELETE policy: ensure_profile() is the only writer.
create policy "profiles: public read"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- games: public configuration, active rows only.
create policy "games: read active"
  on public.games for select
  to anon, authenticated
  using (is_active);

-- rounds: the schedule is public. The result is not here.
create policy "rounds: read schedule"
  on public.rounds for select
  to anon, authenticated
  using (true);

-- round_results: THE time gate. docs/integrity.md §5.1.
-- result_visible_at, not betting_closes_at: the answer becomes readable at the
-- frame of the video that shows it, and not one second earlier.
create policy "results: readable only once the video shows the result"
  on public.round_results for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.rounds r
       where r.id = round_results.round_id
         and clock_timestamp() >= r.result_visible_at
    )
  );

-- bets: SELECT only. docs/integrity.md §5.2.
-- Seeing the crowd's guesses before the lock is a real edge - a late better
-- could position just outside the cluster and take a winning slot on purpose.
--
-- There is deliberately no INSERT policy: place_bet() is the only writer, so a
-- direct PostgREST insert cannot create a bet without its stake ledger row.
-- There is no UPDATE and no DELETE policy: a placed bet is immutable, and not
-- even its owner can change it.
create policy "bets: own bet always, others only after the result is visible"
  on public.bets for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.rounds r
       where r.id = bets.round_id
         and clock_timestamp() >= r.result_visible_at
    )
  );

-- chip_ledger: read your own rows. Append-only, and no role below service_role
-- gets an INSERT, UPDATE or DELETE policy. docs/integrity.md §6.
create policy "ledger: read own rows"
  on public.chip_ledger for select
  to authenticated
  using (user_id = (select auth.uid()));

-- balances: read your own cached balance.
create policy "balances: read own"
  on public.balances for select
  to authenticated
  using (user_id = (select auth.uid()));


-- ---------------------------------------------------------------------------
-- Data API grants
--
-- New tables are not auto-exposed to the Data API roles, so privileges are
-- granted explicitly. RLS above decides which rows; these grants decide which
-- verbs a role may attempt at all. The two together are the boundary.
--
-- Note what is NOT granted: no INSERT on bets, no write of any kind on
-- chip_ledger or balances, nothing at all on anything for anon beyond SELECT.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.profiles, public.games, public.rounds, public.round_results
  to anon, authenticated;

grant select on public.bets, public.chip_ledger, public.balances
  to authenticated;

grant all on public.profiles, public.games, public.rounds, public.round_results,
             public.bets, public.chip_ledger, public.balances
  to service_role;

-- Functions default to EXECUTE for PUBLIC. Revoke first, then grant narrowly.
revoke execute on function public.server_now()             from public;
revoke execute on function public.round_stats(uuid)        from public;
revoke execute on function public.ensure_profile()         from public;
revoke execute on function public.place_bet(uuid, integer) from public;
revoke execute on function public.settle_round(uuid)       from public;

-- The three trigger functions above are deliberately left alone. EXECUTE on a
-- trigger function is checked when the trigger is CREATED, not when it fires,
-- so revoking it here would be either useless or actively harmful, and a
-- `returns trigger` function cannot be called directly anyway - PostgreSQL
-- refuses it before the body runs.

grant execute on function public.server_now()      to anon, authenticated, service_role;
grant execute on function public.round_stats(uuid) to anon, authenticated, service_role;
grant execute on function public.ensure_profile()  to authenticated, service_role;
grant execute on function public.place_bet(uuid, integer) to authenticated, service_role;

-- settle_round() moves chips. It is called by the settlement sweep, never by a
-- browser. anon and authenticated get nothing.
grant execute on function public.settle_round(uuid) to service_role;
