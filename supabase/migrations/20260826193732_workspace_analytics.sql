-- Zero Sum Entertainment - workspace analytics and management
--
-- Phase 2 of docs/roadmap.md: the staff dashboard at /workspace. Spec:
-- docs/workspace.md. Read docs/integrity.md before changing anything here -
-- this file adds read paths over the same data integrity.md protects, and a
-- read path that leaks a sealed guess is exactly as much of a break as an
-- insert path that accepts a late bet.
--
-- Builds on supabase/migrations/20260826170955_betting_core.sql. Same style:
-- every function SECURITY DEFINER, `set search_path = ''`, every reference
-- schema-qualified, `clock_timestamp()` for every time comparison, EXECUTE
-- revoked from PUBLIC then granted back narrowly. Statement order is
-- dependency order (CLAUDE.md, "Writing migrations: two traps") - the
-- round_scripts table is created first because every ws_* function below
-- reads it, and PostgreSQL validates a function body against the catalog
-- that exists at CREATE time.
--
-- ---------------------------------------------------------------------------
-- A departure from docs/workspace.md, made deliberately
--
-- docs/workspace.md's "Server source" section reads:
--
--   Management RPCs, all `raise` unless `public.is_staff()`.
--
-- and says nothing of the kind about the read RPCs (ws_overview, ws_rounds,
-- ws_bets, ws_players, ws_ledger, ws_ledger_audit, ws_games, ws_integrity).
-- Taken literally, that means any `authenticated` caller - not just staff -
-- could call ws_players() or ws_ledger() and read every player's balance,
-- every stake, every payout, and their net winnings. That directly
-- contradicts:
--
--   * betting_core.sql's own chip_ledger policy ("read own rows") and
--     balances policy ("read own"), which exist specifically so one player
--     cannot see another's chip position;
--   * docs/workspace.md's own principle 1, "same authority model as the
--     game" - the game never lets one player read another's ledger;
--   * the fact that the route is described as "Staff-facing" at the top of
--     the same document.
--
-- A read RPC that is SECURITY DEFINER bypasses RLS entirely, so without a
-- staff gate it would be a strictly bigger hole than anything RLS closes on
-- the tables themselves. This migration therefore gates every ws_* function
-- with `if not public.is_staff() then raise exception ... end if;` as the
-- first statement, EXCEPT `ws_me()`, which must stay open to any
-- authenticated caller - the client calls it to learn whether it is staff at
-- all, and gating it would make that call unusable for the very users it
-- needs to inform.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- round_scripts
--
-- The scripted takes behind each game, from docs/rounds.md - what the video
-- shows, at what offset, and the result it reveals. `ws_schedule_round()`
-- reads one row to create a real round; `ws_games()` exposes them to staff
-- for review.
--
-- RLS is enabled with NO select policy for anon or authenticated, on
-- purpose, the same idiom betting_core.sql uses for `bets` having no INSERT
-- policy: an explicit absence, not an oversight. A round_scripts row can
-- describe a FUTURE round's result before that round exists. Nothing below
-- service_role may read it directly; every legitimate read goes through a
-- SECURITY DEFINER function that runs as the table owner and is itself
-- staff-gated (ws_games) or has no guess/result in its output at all
-- (ws_schedule_round, called by staff but returning only timestamps).
-- ---------------------------------------------------------------------------

create table public.round_scripts (
  game_id           uuid not null references public.games (id),
  round_index       integer not null,
  video_bet_open_s  numeric(6,2) not null,
  video_reveal_s    numeric(6,2) not null,
  video_pause_s     numeric(6,2) not null,
  result_value      integer not null,
  readings          text[] not null,
  created_at        timestamptz not null default now(),
  primary key (game_id, round_index),
  constraint round_scripts_video_ordered check (
    video_bet_open_s >= 0
    and video_bet_open_s < video_reveal_s
    and video_reveal_s   < video_pause_s
  )
);

comment on table public.round_scripts is
  'Scripted takes from docs/rounds.md, keyed by (game_id, round_index). No SELECT policy for anon/authenticated - deliberate, see the file header. Read only through SECURITY DEFINER functions.';
comment on column public.round_scripts.readings is
  'Raw scale readings as printed in docs/rounds.md, e.g. {''82 g'',''95 g''}. Display only - result_value is the number the engine acts on.';

alter table public.round_scripts enable row level security;

grant select, insert, update, delete on public.round_scripts to service_role;


-- ---------------------------------------------------------------------------
-- ws_me()
--
-- The one ws_* function open to every authenticated caller, staff or not.
-- The dashboard calls this first to decide whether to show anything at all
-- and whether to enable management buttons (docs/workspace.md principle 4).
-- Gating it behind is_staff() would make it useless for exactly the callers
-- who need to learn they are not staff.
-- ---------------------------------------------------------------------------

create or replace function public.ws_me()
returns table (user_id uuid, is_staff boolean, is_admin boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()), public.is_staff(), public.is_admin();
$$;


-- ---------------------------------------------------------------------------
-- ws_overview()
--
-- One row of KPIs. Conservation is judged the way docs/integrity.md §6 and
-- betting_core.sql's own settle_round() judge it: by summing chip_ledger per
-- settled round, never by trusting a rounds/bets column. A round whose
-- ledger does not sum to zero is a breach regardless of what any other table
-- says happened.
-- ---------------------------------------------------------------------------

create or replace function public.ws_overview()
returns table (
  rounds          integer,
  bets            integer,
  staked          integer,
  paid_out        integer,
  house_take      integer,
  players         integer,
  avg_multiplier  numeric,
  best_multiplier numeric,
  conservation_ok boolean,
  breaches        integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_rounds     integer;
  v_bets       integer;
  v_staked     integer;
  v_paid_out   integer;
  v_house_take integer;
  v_players    integer;
  v_avg_mult   numeric;
  v_best_mult  numeric;
  v_breaches   integer;
begin
  if not public.is_staff() then
    raise exception 'ws_overview: staff only' using errcode = '42501';
  end if;

  select count(*) into v_rounds from public.rounds;
  select count(*) into v_bets   from public.bets;

  select coalesce(sum(b.stake), 0) into v_staked from public.bets b;

  select coalesce(sum(cl.amount), 0) into v_paid_out
    from public.chip_ledger cl where cl.kind = 'payout';

  select coalesce(sum(cl.amount), 0) into v_house_take
    from public.chip_ledger cl where cl.kind = 'rake';

  select count(distinct b.user_id) into v_players from public.bets b;

  -- Per settled round: the multiplier every winner actually received
  -- (settle_round writes the same payout amount to every winner of a round,
  -- so max() picks it out), and whether that round's ledger nets to zero.
  -- A round with bets but no ledger rows of any kind (impossible under
  -- place_bet, but this reads the ledger, not the assumption) is simply
  -- absent from this CTE and contributes nothing to avg/best/breaches.
  with per_round as (
    select cl.round_id,
           round(max(cl.amount) filter (where cl.kind = 'payout')::numeric / 20, 2) as mult,
           sum(cl.amount) as net
      from public.chip_ledger cl
      join public.rounds r on r.id = cl.round_id
     where r.settled_at is not null
     group by cl.round_id
  )
  select round(avg(mult), 2), max(mult), count(*) filter (where net <> 0)
    into v_avg_mult, v_best_mult, v_breaches
    from per_round;

  v_breaches := coalesce(v_breaches, 0);

  return query
  select v_rounds, v_bets, v_staked, v_paid_out, v_house_take, v_players,
         v_avg_mult, v_best_mult, (v_breaches = 0), v_breaches;
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_rounds(p_limit, p_offset)
--
-- Every round, newest first by preview_starts_at (the first boundary a round
-- has - the natural "when did this round begin" ordering). `phase` is the
-- exact case expression from docs/integrity.md §2, evaluated against
-- clock_timestamp(), never now() (CLAUDE.md, betting_core.sql note 4).
--
-- Sealing (docs/workspace.md principle 3, docs/integrity.md §5.1/§5.2, "for
-- staff too"): `result` and `readings` are NULL while
-- clock_timestamp() < result_visible_at. This function is SECURITY DEFINER
-- and reads round_results/round_scripts directly as the table owner, so RLS
-- on round_results does not apply here - the seal has to be re-asserted in
-- SQL, exactly like place_bet() re-asserts the betting window instead of
-- relying on a policy it bypasses.
--
-- players/pot come from bets directly (never from a stored column - there is
-- none). prize/winners/payout/multiplier/house come from the ledger, not
-- from re-deriving settle_round's floor/dust math a second time:
--   house  = sum(chip_ledger.amount) where kind = 'rake'
--   payout = the (single, shared) payout amount per winner = max(amount)
--            where kind = 'payout' - every winner of a round is paid the
--            same amount, so max just picks the value out.
--   prize  = pot - house. Conservation (settle_round's own invariant) makes
--            this exactly equal to sum(amount) where kind = 'payout'; it is
--            written as pot - house because that only needs one fewer join.
--   conservation_ok = (sum(chip_ledger.amount) over the whole round = 0),
--            NULL for a round that has not settled yet, because before
--            settlement the ledger holds only negative stake rows and would
--            always read "false" without ever meaning anything.
-- ---------------------------------------------------------------------------

create or replace function public.ws_rounds(p_limit integer default 100, p_offset integer default 0)
returns table (
  id               uuid,
  game_slug        text,
  game_title       text,
  round_index      integer,
  started_at       timestamptz,
  settled_at       timestamptz,
  phase            text,
  result           integer,
  unit             text,
  readings         text[],
  players          integer,
  pot              integer,
  prize            integer,
  winners          integer,
  payout           integer,
  multiplier       numeric,
  house            integer,
  conservation_ok  boolean,
  sealed           boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'ws_rounds: staff only' using errcode = '42501';
  end if;

  return query
  with bets_agg as (
    select b.round_id,
           count(*)::integer as players,
           coalesce(sum(b.stake), 0)::integer as pot
      from public.bets b
     group by b.round_id
  ),
  ledger_agg as (
    select cl.round_id,
           count(*) filter (where cl.kind = 'payout')::integer as winners,
           max(cl.amount) filter (where cl.kind = 'payout')::integer as payout,
           coalesce(sum(cl.amount) filter (where cl.kind = 'rake'), 0)::integer as house,
           coalesce(sum(cl.amount), 0)::integer as ledger_net
      from public.chip_ledger cl
     where cl.round_id is not null
     group by cl.round_id
  )
  select
    r.id,
    g.slug,
    g.title,
    r.round_index,
    r.preview_starts_at,
    r.settled_at,
    case
      when clock_timestamp() < r.preview_starts_at then 'scheduled'
      when clock_timestamp() < r.betting_opens_at  then 'preview'
      when clock_timestamp() < r.betting_closes_at then 'betting'
      when clock_timestamp() < r.result_visible_at then 'locked'
      when clock_timestamp() < r.results_end_at    then 'results'
      else 'ended'
    end,
    case when clock_timestamp() < r.result_visible_at then null else rr.result_value end,
    g.result_unit,
    case when clock_timestamp() < r.result_visible_at then null else rs.readings end,
    coalesce(ba.players, 0),
    coalesce(ba.pot, 0),
    case when r.settled_at is null then null else coalesce(ba.pot, 0) - coalesce(la.house, 0) end,
    la.winners,
    la.payout,
    case when la.payout is null then null else round(la.payout::numeric / 20, 2) end,
    la.house,
    case when r.settled_at is null then null else (coalesce(la.ledger_net, 0) = 0) end,
    clock_timestamp() < r.result_visible_at
  from public.rounds r
  join public.games g on g.id = r.game_id
  left join public.round_results rr on rr.round_id = r.id
  left join public.round_scripts rs on rs.game_id = r.game_id and rs.round_index = r.round_index
  left join bets_agg ba   on ba.round_id = r.id
  left join ledger_agg la on la.round_id = r.id
  order by r.preview_starts_at desc
  limit p_limit offset p_offset;
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_round_detail(p_round_id)
--
-- One round plus its guess distribution and full bet list.
--
-- Sealing, enforced in SQL exactly as docs/workspace.md requires:
-- `guess`, `distance`, `won`, `payout` are NULL for every bet, and
-- `distribution` is `'[]'::jsonb`, while clock_timestamp() < result_visible_at
-- - for every caller, including staff (docs principle 3). There is
-- deliberately no branch that reveals a caller's own bet early: unlike
-- betting_core's bets SELECT policy (which does let a player see their own
-- row before reveal), this dashboard has no "own bet" concept - a staff
-- account looking at this view is auditing the round, not playing it, and
-- must see exactly what every other viewer would see once it unseals.
-- ---------------------------------------------------------------------------

create or replace function public.ws_round_detail(p_round_id uuid)
returns table (
  id               uuid,
  game_slug        text,
  game_title       text,
  round_index      integer,
  started_at       timestamptz,
  settled_at       timestamptz,
  phase            text,
  result           integer,
  unit             text,
  readings         text[],
  players          integer,
  pot              integer,
  prize            integer,
  winners          integer,
  payout           integer,
  multiplier       numeric,
  house            integer,
  conservation_ok  boolean,
  sealed           boolean,
  distribution     jsonb,
  bets             jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_sealed boolean;
begin
  if not public.is_staff() then
    raise exception 'ws_round_detail: staff only' using errcode = '42501';
  end if;

  select clock_timestamp() < r.result_visible_at into v_sealed
    from public.rounds r
   where r.id = p_round_id;

  if not found then
    raise exception 'ws_round_detail: round % not found', p_round_id
      using errcode = '23503';
  end if;

  return query
  with bets_agg as (
    select b.round_id,
           count(*)::integer as players,
           coalesce(sum(b.stake), 0)::integer as pot
      from public.bets b
     where b.round_id = p_round_id
     group by b.round_id
  ),
  ledger_agg as (
    select cl.round_id,
           count(*) filter (where cl.kind = 'payout')::integer as winners,
           max(cl.amount) filter (where cl.kind = 'payout')::integer as payout,
           coalesce(sum(cl.amount) filter (where cl.kind = 'rake'), 0)::integer as house,
           coalesce(sum(cl.amount), 0)::integer as ledger_net
      from public.chip_ledger cl
     where cl.round_id = p_round_id
     group by cl.round_id
  ),
  dist as (
    select case when v_sealed then '[]'::jsonb
                else coalesce(jsonb_agg(
                       jsonb_build_object('guess', d.guess, 'count', d.cnt)
                       order by d.guess
                     ), '[]'::jsonb)
           end as j
      from (
        select b.guess, count(*) as cnt
          from public.bets b
         where b.round_id = p_round_id
         group by b.guess
      ) d
  ),
  bet_rows as (
    select coalesce(jsonb_agg(
             jsonb_build_object(
               'id',         b.id,
               'round_id',   b.round_id,
               'player_id',  b.user_id,
               'player_name', p.display_name,
               'is_bot',     p.is_bot,
               'guess',      case when v_sealed then null else b.guess end,
               'distance',   case when v_sealed or rr.result_value is null
                                   then null
                                   else abs(b.guess - rr.result_value) end,
               'won',        case when v_sealed then null else (pay.amount is not null) end,
               'payout',     case when v_sealed then null else pay.amount end,
               'placed_at',  b.placed_at
             )
             order by b.placed_at
           ), '[]'::jsonb) as j
      from public.bets b
      join public.profiles p on p.id = b.user_id
      left join public.round_results rr on rr.round_id = b.round_id
      left join public.chip_ledger pay
        on pay.round_id = b.round_id
       and pay.user_id  = b.user_id
       and pay.kind      = 'payout'
     where b.round_id = p_round_id
  )
  select
    r.id,
    g.slug,
    g.title,
    r.round_index,
    r.preview_starts_at,
    r.settled_at,
    case
      when clock_timestamp() < r.preview_starts_at then 'scheduled'
      when clock_timestamp() < r.betting_opens_at  then 'preview'
      when clock_timestamp() < r.betting_closes_at then 'betting'
      when clock_timestamp() < r.result_visible_at then 'locked'
      when clock_timestamp() < r.results_end_at    then 'results'
      else 'ended'
    end,
    case when v_sealed then null else rr.result_value end,
    g.result_unit,
    case when v_sealed then null else rs.readings end,
    coalesce(ba.players, 0),
    coalesce(ba.pot, 0),
    case when r.settled_at is null then null else coalesce(ba.pot, 0) - coalesce(la.house, 0) end,
    la.winners,
    la.payout,
    case when la.payout is null then null else round(la.payout::numeric / 20, 2) end,
    la.house,
    case when r.settled_at is null then null else (coalesce(la.ledger_net, 0) = 0) end,
    v_sealed,
    dist.j,
    bet_rows.j
  from public.rounds r
  join public.games g on g.id = r.game_id
  left join public.round_results rr on rr.round_id = r.id
  left join public.round_scripts rs on rs.game_id = r.game_id and rs.round_index = r.round_index
  left join bets_agg ba   on ba.round_id = r.id
  left join ledger_agg la on la.round_id = r.id
  cross join dist
  cross join bet_rows
  where r.id = p_round_id;
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_bets(p_game_slug, p_round_id, p_player_id, p_won, p_limit)
--
-- Same sealing rule as ws_round_detail, applied per bet's own round:
-- guess/distance/won/payout NULL while that bet's round is still sealed.
-- Filtering by p_won on a sealed bet always excludes it (NULL = anything is
-- unknown), which is the correct behaviour - a caller filtering for winners
-- should not get sealed rows back with a guessed-at answer.
-- ---------------------------------------------------------------------------

create or replace function public.ws_bets(
  p_game_slug text default null,
  p_round_id  uuid default null,
  p_player_id uuid default null,
  p_won       boolean default null,
  p_limit     integer default 200
)
returns table (
  id          uuid,
  round_id    uuid,
  game_slug   text,
  game_title  text,
  player_id   uuid,
  player_name text,
  is_bot      boolean,
  guess       integer,
  distance    integer,
  won         boolean,
  payout      integer,
  placed_at   timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'ws_bets: staff only' using errcode = '42501';
  end if;

  return query
  with scored as (
    select
      b.id,
      b.round_id,
      g.slug  as game_slug,
      g.title as game_title,
      b.user_id as player_id,
      p.display_name as player_name,
      p.is_bot,
      (clock_timestamp() < r.result_visible_at) as sealed,
      b.guess as raw_guess,
      rr.result_value as raw_result,
      pay.amount as raw_payout,
      b.placed_at
    from public.bets b
    join public.rounds r   on r.id = b.round_id
    join public.games g    on g.id = r.game_id
    join public.profiles p on p.id = b.user_id
    left join public.round_results rr on rr.round_id = b.round_id
    left join public.chip_ledger pay
      on pay.round_id = b.round_id
     and pay.user_id  = b.user_id
     and pay.kind      = 'payout'
    where (p_game_slug is null or g.slug = p_game_slug)
      and (p_round_id  is null or b.round_id = p_round_id)
      and (p_player_id is null or b.user_id = p_player_id)
  )
  select
    s.id, s.round_id, s.game_slug, s.game_title, s.player_id, s.player_name, s.is_bot,
    case when s.sealed then null else s.raw_guess end,
    case when s.sealed or s.raw_result is null then null else abs(s.raw_guess - s.raw_result) end,
    case when s.sealed then null else (s.raw_payout is not null) end,
    case when s.sealed then null else s.raw_payout end,
    s.placed_at
  from scored s
  where p_won is null
     or (not s.sealed and (s.raw_payout is not null) = p_won)
  order by s.placed_at desc
  limit p_limit;
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_players()
--
-- Leaderboard. `net` is paid_out - staked: what a player has actually taken
-- out of the game relative to what they put in, deliberately excluding the
-- one-off 200-chip `grant` - that grant is starting capital, not winnings,
-- and folding it in would make every player who has placed zero bets show a
-- "net" of +200 instead of 0.
-- ---------------------------------------------------------------------------

create or replace function public.ws_players()
returns table (
  id        uuid,
  name      text,
  is_bot    boolean,
  is_house  boolean,
  balance   integer,
  bets      integer,
  wins      integer,
  staked    integer,
  paid_out  integer,
  net       integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'ws_players: staff only' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.display_name,
    p.is_bot,
    p.is_house,
    coalesce(bal.balance, 0),
    coalesce(bs.bets, 0),
    coalesce(bs.wins, 0),
    coalesce(bs.staked, 0),
    coalesce(ls.paid_out, 0),
    coalesce(ls.paid_out, 0) - coalesce(bs.staked, 0)
  from public.profiles p
  left join public.balances bal on bal.user_id = p.id
  left join (
    select bt.user_id,
           count(*)::integer as bets,
           coalesce(sum(bt.stake), 0)::integer as staked,
           count(*) filter (
             where exists (
               select 1 from public.chip_ledger cl
                where cl.round_id = bt.round_id
                  and cl.user_id  = bt.user_id
                  and cl.kind      = 'payout'
             )
           )::integer as wins
      from public.bets bt
     group by bt.user_id
  ) bs on bs.user_id = p.id
  left join (
    select cl.user_id, coalesce(sum(cl.amount), 0)::integer as paid_out
      from public.chip_ledger cl
     where cl.kind = 'payout'
     group by cl.user_id
  ) ls on ls.user_id = p.id
  order by (coalesce(ls.paid_out, 0) - coalesce(bs.staked, 0)) desc, p.display_name;
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_ledger(p_kind, p_player_id, p_round_id, p_limit)
--
-- Raw ledger stream. No sealing here: chip_ledger rows never carry a guess,
-- only kind/amount/round_id/user_id, and docs/workspace.md's sealing rule is
-- stated for round_detail and bets specifically - not extended to the
-- ledger in the spec, and there is no guess-shaped value in this table to
-- seal.
-- ---------------------------------------------------------------------------

create or replace function public.ws_ledger(
  p_kind      text    default null,
  p_player_id uuid    default null,
  p_round_id  uuid    default null,
  p_limit     integer default 200
)
returns table (
  id          bigint,
  at          timestamptz,
  player_id   uuid,
  player_name text,
  kind        public.ledger_entry_kind,
  amount      integer,
  round_id    uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'ws_ledger: staff only' using errcode = '42501';
  end if;

  return query
  select cl.id, cl.created_at, cl.user_id, p.display_name, cl.kind, cl.amount, cl.round_id
    from public.chip_ledger cl
    join public.profiles p on p.id = cl.user_id
   where (p_kind      is null or cl.kind::text = p_kind)
     and (p_player_id is null or cl.user_id = p_player_id)
     and (p_round_id  is null or cl.round_id = p_round_id)
   order by cl.created_at desc
   limit p_limit;
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_ledger_audit() / ws_ledger_audit_all_ok()
--
-- Per-player audit: sum(chip_ledger.amount) vs balances.balance
-- (docs/integrity.md §6). ws_ledger_audit_all_ok() is the single aggregate
-- the spec permits as an alternative to repeating `ok` per row; both are
-- provided, so a caller can use whichever is more convenient.
-- ---------------------------------------------------------------------------

create or replace function public.ws_ledger_audit()
returns table (
  player_id   uuid,
  player_name text,
  ledger_sum  integer,
  balance     integer,
  ok          boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'ws_ledger_audit: staff only' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.display_name,
    coalesce(ls.sum_amount, 0),
    coalesce(bal.balance, 0),
    coalesce(ls.sum_amount, 0) = coalesce(bal.balance, 0)
  from public.profiles p
  left join public.balances bal on bal.user_id = p.id
  left join (
    select cl.user_id, sum(cl.amount)::integer as sum_amount
      from public.chip_ledger cl
     group by cl.user_id
  ) ls on ls.user_id = p.id
  order by p.display_name;
end;
$$;

create or replace function public.ws_ledger_audit_all_ok()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  -- Explicit gate. ws_ledger_audit() already raises for non-staff, but an
  -- explicit check here keeps every ws_* function self-evidently gated.
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  return not exists (select 1 from public.ws_ledger_audit() a where not a.ok);
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_games()
--
-- Config per game, all rows (including inactive ones - staff need to see a
-- game to be able to reactivate it), plus its round_scripts as a jsonb array
-- for the Games view (docs/workspace.md: "config ... and the round scripts
-- from rounds.md").
-- ---------------------------------------------------------------------------

create or replace function public.ws_games()
returns table (
  id             uuid,
  slug           text,
  title          text,
  objective_line text,
  shape          public.game_shape,
  guess_min      integer,
  guess_max      integer,
  guess_step     integer,
  unit           text,
  video_asset    text,
  active         boolean,
  scripts        jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'ws_games: staff only' using errcode = '42501';
  end if;

  return query
  select
    g.id, g.slug, g.title, g.objective_line, g.shape,
    g.guess_min, g.guess_max, g.guess_step, g.result_unit, g.video_asset, g.is_active,
    coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'round_index',      rs.round_index,
                 'video_bet_open_s', rs.video_bet_open_s,
                 'video_reveal_s',   rs.video_reveal_s,
                 'video_pause_s',    rs.video_pause_s,
                 'result_value',     rs.result_value,
                 'readings',         rs.readings
               )
               order by rs.round_index
             )
        from public.round_scripts rs
       where rs.game_id = g.id
    ), '[]'::jsonb)
  from public.games g
  order by g.slug;
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_integrity()
--
-- One row per guarantee, docs/workspace.md's Integrity view. Status is
-- 'pass' | 'fail' | 'na' | 'unknown'; 'unknown' is reserved for a future
-- check this function cannot yet evaluate and is not used below - every
-- check here can always resolve to pass/fail/na.
--
-- Two checks below are deliberately narrower than their one-line spec
-- description, because the literal description does not survive contact
-- with two legitimate edge cases already built into betting_core.sql and
-- this file:
--
--   * conservation and settle_idempotent both restrict to SETTLED rounds
--     only - an unsettled round's ledger holds only negative stake rows and
--     will never sum to zero, so including it would report every live round
--     as a conservation breach.
--   * settle_idempotent further restricts to rounds that took at least one
--     stake and were NOT voided. A zero-bet round settles with zero ledger
--     rows at all (settle_round's documented zero-bet path), and a voided
--     round (ws_void_round) writes refund rows, never a rake row - both are
--     correct, intentional outcomes with rake-row count 0, and a naive
--     "settled rounds with != 1 rake row" check would flag both as
--     failures. See the CTEs below for the exact predicate.
-- ---------------------------------------------------------------------------

create or replace function public.ws_integrity()
returns table (id text, label text, status text, detail text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_policy_ok  boolean;
  v_pending    uuid;
  v_late_bets  integer;
  v_settled_ct integer;
  v_breaches   integer;
  v_mismatches integer;
  v_idempo_ct  integer;
  v_idempo_bad integer;
begin
  if not public.is_staff() then
    raise exception 'ws_integrity: staff only' using errcode = '42501';
  end if;

  -- result_hidden: the SELECT policy on round_results must exist and must be
  -- gated on result_visible_at (docs/integrity.md §5.1). As a definer
  -- function this code bypasses that policy itself, so it inspects
  -- pg_policies rather than trying to read round_results under RLS, then
  -- samples one pending round if one exists right now.
  select exists (
    select 1 from pg_catalog.pg_policies pol
     where pol.schemaname = 'public'
       and pol.tablename  = 'round_results'
       and pol.cmd = 'SELECT'
       and pol.qual ilike '%result_visible_at%'
  ) into v_policy_ok;

  select r.id into v_pending
    from public.rounds r
   where r.result_visible_at > clock_timestamp()
   order by r.result_visible_at
   limit 1;

  return query select
    'result_hidden'::text,
    'Result hidden pre-reveal'::text,
    case when not v_policy_ok then 'fail'
         when v_pending is null then 'na'
         else 'pass' end,
    case when not v_policy_ok
           then 'no time-gated SELECT policy found on public.round_results'
         when v_pending is null
           then 'policy present; no pending round to sample right now'
         else 'policy present; round ' || v_pending::text || ' is not yet visible'
    end;

  -- no_late_bets
  select count(*) into v_late_bets
    from public.bets b
    join public.rounds r on r.id = b.round_id
   where b.placed_at > r.betting_closes_at;

  return query select
    'no_late_bets'::text,
    'No bet after lock'::text,
    case when v_late_bets = 0 then 'pass' else 'fail' end,
    v_late_bets || ' bet(s) placed after betting_closes_at';

  -- conservation: settled rounds only, ledger sum <> 0 (docs/integrity.md §6)
  select count(*) into v_settled_ct from public.rounds r where r.settled_at is not null;

  select count(*) into v_breaches
    from (
      select cl.round_id
        from public.chip_ledger cl
        join public.rounds r on r.id = cl.round_id
       where r.settled_at is not null
       group by cl.round_id
      having sum(cl.amount) <> 0
    ) x;

  v_breaches := coalesce(v_breaches, 0);

  return query select
    'conservation'::text,
    'Conservation per round'::text,
    case when v_settled_ct = 0 then 'na'
         when v_breaches = 0 then 'pass'
         else 'fail' end,
    v_breaches || ' of ' || v_settled_ct || ' settled round(s) with ledger sum <> 0';

  -- ledger_matches_balances
  select count(*) into v_mismatches
    from public.profiles p
    left join public.balances bal on bal.user_id = p.id
    left join (
      select cl.user_id, sum(cl.amount) as s from public.chip_ledger cl group by cl.user_id
    ) l on l.user_id = p.id
   where coalesce(l.s, 0) <> coalesce(bal.balance, 0);

  return query select
    'ledger_matches_balances'::text,
    'Ledger equals balances'::text,
    case when v_mismatches = 0 then 'pass' else 'fail' end,
    v_mismatches || ' player(s) where sum(chip_ledger.amount) <> balances.balance';

  -- settle_idempotent: see the file-header note on this check's predicate.
  select count(*) into v_idempo_ct
    from public.rounds r
   where r.settled_at is not null
     and exists (select 1 from public.chip_ledger cl where cl.round_id = r.id and cl.kind = 'stake')
     and not exists (select 1 from public.chip_ledger cl where cl.round_id = r.id and cl.kind = 'refund');

  select count(*) into v_idempo_bad
    from public.rounds r
   where r.settled_at is not null
     and exists (select 1 from public.chip_ledger cl where cl.round_id = r.id and cl.kind = 'stake')
     and not exists (select 1 from public.chip_ledger cl where cl.round_id = r.id and cl.kind = 'refund')
     and (
       select count(*) from public.chip_ledger cl2
        where cl2.round_id = r.id and cl2.kind = 'rake'
     ) <> 1;

  return query select
    'settle_idempotent'::text,
    'Settlement wrote exactly one rake row'::text,
    case when v_idempo_ct = 0 then 'na'
         when v_idempo_bad = 0 then 'pass'
         else 'fail' end,
    v_idempo_bad || ' of ' || v_idempo_ct || ' settled round(s) with a rake-row count other than 1';
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_set_game_active(p_slug, p_active)
-- ---------------------------------------------------------------------------

create or replace function public.ws_set_game_active(p_slug text, p_active boolean)
returns table (slug text, active boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated text;
begin
  if not public.is_staff() then
    raise exception 'ws_set_game_active: staff only' using errcode = '42501';
  end if;

  update public.games g
     set is_active = p_active
   where g.slug = p_slug
  returning g.slug into v_updated;

  if v_updated is null then
    raise exception 'ws_set_game_active: no game with slug %', p_slug
      using errcode = '23503';
  end if;

  return query select v_updated, p_active;
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_void_round(p_round_id)
--
-- Refunds every stake for a round in one transaction and claims it settled,
-- the same way settle_round() claims it: an atomic
-- `UPDATE ... WHERE settled_at IS NULL`, not check-then-act
-- (docs/integrity.md §4). Unlike settle_round(), which returns quietly on an
-- already-settled round (it may just be a concurrent settlement finishing),
-- a void that finds the round already settled RAISES - voiding a round that
-- has already paid out for real would double-spend the house's chips, and
-- that must never happen silently.
--
-- The advisory lock is keyed exactly like place_bet()'s and settle_round()'s
-- (same hash, same salt 0), so it shares their lock domain: a void cannot
-- start while a bet for the same round is still mid-transaction, and cannot
-- race a concurrent settle_round() claim on the same round.
-- ---------------------------------------------------------------------------

create or replace function public.ws_void_round(p_round_id uuid)
returns table (refunded_bets integer, refunded_chips integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed uuid;
  v_rows    integer;
  v_total   integer;
begin
  if not public.is_staff() then
    raise exception 'ws_void_round: staff only' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtextextended(p_round_id::text, 0));

  update public.rounds r
     set settled_at = clock_timestamp()
   where r.id = p_round_id
     and r.settled_at is null
  returning r.id into v_claimed;

  if v_claimed is null then
    raise exception 'ws_void_round: round % is already settled', p_round_id
      using errcode = '55000';
  end if;

  insert into public.chip_ledger (user_id, round_id, kind, amount)
  select b.user_id, p_round_id, 'refund', b.stake
    from public.bets b
   where b.round_id = p_round_id;

  get diagnostics v_rows = row_count;

  select coalesce(sum(cl.amount), 0) into v_total
    from public.chip_ledger cl
   where cl.round_id = p_round_id
     and cl.kind      = 'refund';

  return query select v_rows, v_total;
end;
$$;


-- ---------------------------------------------------------------------------
-- ws_schedule_round(p_slug, p_starts_in)
--
-- Creates the next round for a game from its round_scripts, the same shape
-- supabase/seed.sql's dev_create_round() uses but driven by a stored script
-- instead of caller-supplied arguments, and reachable only by staff.
--
-- round_index and script selection: the next round_index for the game is
-- max(round_index) + 1 (as in dev_create_round). There are only a handful of
-- scripted takes per game (two, per docs/rounds.md) but a game runs
-- indefinitely, so the script used is round_scripts.round_index cycled
-- modulo the script count for that game - round 3 replays script 1, round 4
-- replays script 2, and so on. docs/workspace.md does not say what "the
-- game's latest round script" means once the scripts run out; cycling is
-- this migration's answer, called out in the migration report as the one
-- genuinely ambiguous point in the spec.
--
-- Timestamps mirror docs/rounds.md's "Timeline per round" table exactly:
-- PREVIEW 5s, BETTING 25s, then result_visible_at is derived from the
-- video's own reveal offset (never a fixed guess at it - see betting_core.sql
-- note 2 and the rounds_video_alignment trigger it must pass), then
-- RESULTS 8s. p_starts_in is the gap before PREVIEW begins.
--
-- result_value is written to round_results at creation - safe, because
-- round_results is time-gated by RLS regardless of when the row was
-- inserted (docs/workspace.md's own note on this point, and the same
-- reasoning dev_create_round() already relies on in supabase/seed.sql).
-- ---------------------------------------------------------------------------

create or replace function public.ws_schedule_round(
  p_slug      text,
  p_starts_in interval default interval '30 seconds'
)
returns table (
  round_id           uuid,
  round_index        integer,
  betting_opens_at   timestamptz,
  betting_closes_at  timestamptz,
  result_visible_at  timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_game      public.games%rowtype;
  v_new_index integer;
  v_script_ct integer;
  v_script    public.round_scripts%rowtype;
  v_preview   timestamptz;
  v_opens     timestamptz;
  v_closes    timestamptz;
  v_visible   timestamptz;
  v_ends      timestamptz;
  v_id        uuid;
begin
  if not public.is_staff() then
    raise exception 'ws_schedule_round: staff only' using errcode = '42501';
  end if;

  select g.* into v_game from public.games g where g.slug = p_slug;
  if not found then
    raise exception 'ws_schedule_round: no game with slug %', p_slug
      using errcode = '23503';
  end if;

  -- Serialise concurrent scheduling for the same game, so two staff clicks
  -- in quick succession cannot both compute the same next round_index.
  -- Salt 1 keeps this lock's key space distinct from the round-id locks
  -- (salt 0) that place_bet()/settle_round()/ws_void_round() take.
  perform pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtextextended(v_game.id::text, 1));

  select coalesce(max(r.round_index), 0) + 1 into v_new_index
    from public.rounds r
   where r.game_id = v_game.id;

  select count(*) into v_script_ct
    from public.round_scripts rs
   where rs.game_id = v_game.id;

  if v_script_ct = 0 then
    raise exception 'ws_schedule_round: no round_scripts for game %', p_slug
      using errcode = '55000';
  end if;

  select rs.* into v_script
    from public.round_scripts rs
   where rs.game_id     = v_game.id
     and rs.round_index = ((v_new_index - 1) % v_script_ct) + 1;

  v_preview := clock_timestamp() + p_starts_in;
  v_opens   := v_preview + interval '5 seconds';
  v_closes  := v_opens   + interval '25 seconds';
  v_visible := v_closes  + make_interval(
                 secs => (v_script.video_reveal_s - v_script.video_bet_open_s)::double precision);
  v_ends    := v_visible + interval '8 seconds';

  insert into public.rounds (
    game_id, round_index,
    preview_starts_at, betting_opens_at, betting_closes_at,
    result_visible_at, results_end_at,
    video_bet_open_s, video_reveal_s, video_pause_s
  )
  values (
    v_game.id, v_new_index,
    v_preview, v_opens, v_closes, v_visible, v_ends,
    v_script.video_bet_open_s, v_script.video_reveal_s, v_script.video_pause_s
  )
  returning id into v_id;

  insert into public.round_results (round_id, result_value)
  values (v_id, v_script.result_value);

  return query select v_id, v_new_index, v_opens, v_closes, v_visible;
end;
$$;


-- ---------------------------------------------------------------------------
-- staff table read access - already satisfied, no change made
--
-- The task brief asks for "RLS/grant changes needed for staff to read staff
-- rows". supabase/migrations/20260826155655_initial_schema.sql already
-- grants this in full, and 20260826170954_drop_legacy_cms_schema.sql
-- deliberately kept public.staff, its policies, and its grants intact:
--
--   policy "staff: staff read all" on public.staff for select
--     to authenticated using (public.is_staff());
--   grant select, insert, update, delete on ... public.staff to authenticated;
--
-- Re-creating either here would either error (CREATE POLICY has no IF NOT
-- EXISTS) or be a no-op GRANT. Nothing to add.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- games UPDATE path - already satisfied, no change made
--
-- No UPDATE policy is added to public.games in this migration, on purpose:
-- ws_set_game_active() is SECURITY DEFINER and runs as the function owner,
-- which can write games regardless of the caller's grants, exactly the way
-- apply_ledger_to_balance() writes balances despite balances having no write
-- policy for anyone below service_role. Adding a direct UPDATE policy would
-- reopen the "no direct write path" property the task explicitly asks to
-- preserve.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- Grants
--
-- EXECUTE to authenticated only, per docs/workspace.md's "Server source"
-- section - not anon (the dashboard is staff-facing and requires a signed-in
-- session even to learn it is not staff via ws_me()), and not service_role
-- (nothing here is meant to be called by a backend job; the whole surface is
-- browser-driven, staff-session RPCs, unlike settle_round()).
-- ---------------------------------------------------------------------------

revoke execute on function public.ws_me()                                   from public;
revoke execute on function public.ws_overview()                             from public;
revoke execute on function public.ws_rounds(integer, integer)               from public;
revoke execute on function public.ws_round_detail(uuid)                     from public;
revoke execute on function public.ws_bets(text, uuid, uuid, boolean, integer) from public;
revoke execute on function public.ws_players()                              from public;
revoke execute on function public.ws_ledger(text, uuid, uuid, integer)      from public;
revoke execute on function public.ws_ledger_audit()                         from public;
revoke execute on function public.ws_ledger_audit_all_ok()                  from public;
revoke execute on function public.ws_games()                                from public;
revoke execute on function public.ws_integrity()                            from public;
revoke execute on function public.ws_set_game_active(text, boolean)         from public;
revoke execute on function public.ws_void_round(uuid)                       from public;
revoke execute on function public.ws_schedule_round(text, interval)         from public;

grant execute on function public.ws_me()                                   to authenticated;
grant execute on function public.ws_overview()                             to authenticated;
grant execute on function public.ws_rounds(integer, integer)               to authenticated;
grant execute on function public.ws_round_detail(uuid)                     to authenticated;
grant execute on function public.ws_bets(text, uuid, uuid, boolean, integer) to authenticated;
grant execute on function public.ws_players()                              to authenticated;
grant execute on function public.ws_ledger(text, uuid, uuid, integer)      to authenticated;
grant execute on function public.ws_ledger_audit()                         to authenticated;
grant execute on function public.ws_ledger_audit_all_ok()                  to authenticated;
grant execute on function public.ws_games()                                to authenticated;
grant execute on function public.ws_integrity()                            to authenticated;
grant execute on function public.ws_set_game_active(text, boolean)         to authenticated;
grant execute on function public.ws_void_round(uuid)                       to authenticated;
grant execute on function public.ws_schedule_round(text, interval)         to authenticated;
