-- Zero Sum Entertainment - duel model
--
-- One video is one duel: two challengers attempt the same task in turn, and
-- the crowd bets on WHICH SIDE lands closer to the target. The bet is a side
-- (1 or 2) at the standard 20-chip stake. docs/rounds.md, docs/game-rules.md
-- §3.1-§3.2, docs/spec.md §3.
--
-- What changes, and what deliberately does not:
--
--  1. games: shape = 'duel', guess_min = 1, guess_max = 2. The bet still
--     travels in bets.guess, and the existing range checks in place_bet() and
--     bets_validate() are the guard - a side outside {1, 2} is unrepresentable
--     with NO change to the bets table or the write path.
--
--  2. round_results.result_value is now the WINNING SIDE: 1, 2, or 0 for a
--     dead heat. Same table, same time gate (result_visible_at). The reason it
--     lives apart from rounds (integrity.md §5.1) is unchanged.
--
--  3. round_attempts: each challenger's reading, gated PER ROW on its own
--     visible_at. The first challenger's number becomes readable when the
--     footage reaches their scale, mid-duel; the second's at result_visible_at.
--     Both are sealed during betting, for everyone.
--
--  4. rounds.video_reveal_1_s: the frame that shows side 1's reading. The
--     lock frame stays in video_bet_open_s (it is the anchor of post-lock
--     playback, which is what the rounds_video_alignment trigger checks) and
--     side 2's frame stays in video_reveal_s, so the trigger and every
--     existing derivation still hold.
--
--  5. settle_round() branches on games.shape. For 'duel' the winners are every
--     bet on the winning side; the §4 payout maths is shared and unchanged. A
--     duel with no winning bet - a dead heat, or nobody on the winner - has no
--     market and VOIDS: one `refund` ledger row per bet, no rake row, round
--     nets to zero (game-rules.md §3.2). 'nearest' settles exactly as before.
--
--  6. ws_schedule_round(): BETTING is the footage before the lock frame, not a
--     25 s constant - the video plays from frame 0 at betting_opens_at and
--     locks at video_bet_open_s. round_attempts rows are written at
--     scheduling time with their own visible_at, the same way round_results is
--     written up front and hidden by RLS.
--
-- Every function pins search_path = ''. Every new table has RLS.


-- ---------------------------------------------------------------------------
-- 1. rounds.video_reveal_1_s
-- ---------------------------------------------------------------------------

alter table public.rounds
  add column video_reveal_1_s numeric(6,2);

alter table public.rounds
  add constraint rounds_video_reveal_1_ordered check (
    video_reveal_1_s is null
    or (video_reveal_1_s > video_bet_open_s and video_reveal_1_s < video_reveal_s)
  );

comment on column public.rounds.video_bet_open_s is
  'Duel: the LOCK frame. Betting runs from frame 0 to here; post-lock playback is anchored here at betting_closes_at.';
comment on column public.rounds.video_reveal_1_s is
  'Duel: the frame that shows side 1''s reading. Null for a single-attempt (nearest) round.';
comment on column public.rounds.video_reveal_s is
  'The frame that shows the decisive reading (duel: side 2). result_visible_at is derived from it.';


-- ---------------------------------------------------------------------------
-- 2. round_scripts: the first read frame and the two attempts
-- ---------------------------------------------------------------------------

alter table public.round_scripts
  add column video_reveal_1_s numeric(6,2);

alter table public.round_scripts
  add constraint round_scripts_video_reveal_1_ordered check (
    video_reveal_1_s is null
    or (video_reveal_1_s > video_bet_open_s and video_reveal_1_s < video_reveal_s)
  );

comment on column public.round_scripts.result_value is
  'Duel: the winning side (1, 2, or 0 for a dead heat). Nearest: the measured offset.';

create table public.round_script_attempts (
  game_id      uuid not null,
  round_index  integer not null,
  side         smallint not null check (side in (1, 2)),
  offset_value integer not null,
  readings     text[] not null default '{}',
  primary key (game_id, round_index, side),
  foreign key (game_id, round_index)
    references public.round_scripts (game_id, round_index) on delete cascade
);

comment on table public.round_script_attempts is
  'Per-side offsets from docs/rounds.md for a scripted duel. No SELECT policy below service_role, like round_scripts: a script describes a FUTURE round''s answer.';

alter table public.round_script_attempts enable row level security;

grant select, insert, update, delete on public.round_script_attempts to service_role;


-- ---------------------------------------------------------------------------
-- 3. round_attempts - THE SECOND TIME GATE (docs/integrity.md §8)
-- ---------------------------------------------------------------------------

create table public.round_attempts (
  round_id     uuid not null references public.rounds (id) on delete cascade,
  side         smallint not null check (side in (1, 2)),
  offset_value integer not null,
  readings     text[] not null default '{}',
  visible_at   timestamptz not null,
  primary key (round_id, side)
);

comment on table public.round_attempts is
  'Each challenger''s reading, as read off the scale in the frame. RLS gates every row on its own visible_at.';
comment on column public.round_attempts.offset_value is
  'Signed distance from the target in the game''s unit. The winner is the smaller abs().';

alter table public.round_attempts enable row level security;

-- Readable at the frame that shows it, not one second earlier. Same idiom
-- as round_results, evaluated per row against the live clock.
create policy "attempts: readable only once the video shows the reading"
  on public.round_attempts for select
  to anon, authenticated
  using (clock_timestamp() >= visible_at);

grant select on public.round_attempts to anon, authenticated;
grant all    on public.round_attempts to service_role;


-- ---------------------------------------------------------------------------
-- 4. games -> duel. The bet is a side: 1 .. 2, step 1.
-- ---------------------------------------------------------------------------

update public.games
   set shape          = 'duel',
       guess_min      = 1,
       guess_max      = 2,
       guess_step     = 1,
       objective_line = 'Two hosts, one banana each, one cut. Whose halves come out closer to equal?'
 where slug = 'banana_cut';

update public.games
   set shape          = 'duel',
       guess_min      = 1,
       guess_max      = 2,
       guess_step     = 1,
       objective_line = 'Two hosts, one pour each, 200 g target. Who lands closer?'
 where slug = 'water_200g';

comment on column public.games.guess_min is
  'Duel: 1. The bet is a side, and bets.guess holds it. Nearest: the lowest legal offset.';
comment on column public.games.guess_max is
  'Duel: 2. Nearest: the highest legal offset.';


-- ---------------------------------------------------------------------------
-- 5. settle_round() - branches on the game shape. docs/game-rules.md §3, §4.
--
-- Identical to 20260826170955_betting_core.sql for 'nearest'. For 'duel':
-- winners are every bet on the winning side; no winning bet voids the round
-- with refunds and no rake. Conservation is read back from the ledger in
-- both branches.
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
  v_shape       public.game_shape;
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
  perform pg_catalog.pg_advisory_xact_lock(
            pg_catalog.hashtextextended(p_round_id::text, 0));

  -- 1. Claim the round (conditional, not check-then-act).
  update public.rounds r
     set settled_at = clock_timestamp()
   where r.id = p_round_id
     and r.settled_at is null
  returning r.id, r.result_visible_at
       into v_claimed, v_visible_at;

  if v_claimed is null then
    return;
  end if;

  -- 2. Refuse before the result is due; the RAISE rolls the claim back.
  if clock_timestamp() < v_visible_at then
    raise exception 'settle_round: round % is not revealable yet', p_round_id
      using errcode = '55000';
  end if;

  -- 3. The result and the shape.
  select rr.result_value into v_result
    from public.round_results rr
   where rr.round_id = p_round_id;

  if v_result is null then
    raise exception 'settle_round: round % has no recorded result', p_round_id
      using errcode = '55000';
  end if;

  select g.shape into v_shape
    from public.games g
    join public.rounds r on r.game_id = g.id
   where r.id = p_round_id;

  select count(*)::integer, coalesce(sum(b.stake), 0)::integer
    into v_players, v_pot
    from public.bets b
   where b.round_id = p_round_id;

  -- Zero bets: claimed, no ledger rows, never divides by zero.
  if v_players = 0 then
    return query select 0, 0::numeric, 0;
    return;
  end if;

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

  -- 4. Winners - the shape-specific predicate. docs/game-rules.md §3.
  if v_shape = 'duel' then
    -- Every bet on the winning side. A dead heat (0) has no winning side.
    select count(*)::integer into v_winners
      from public.bets b
     where b.round_id = p_round_id
       and v_result in (1, 2)
       and b.guess = v_result;

    -- §3.2 No market: refund every stake, take nothing.
    if v_winners = 0 then
      insert into public.chip_ledger (user_id, round_id, kind, amount)
      select b.user_id, p_round_id, 'refund', b.stake
        from public.bets b
       where b.round_id = p_round_id;

      get diagnostics v_rows = row_count;
      if v_rows <> v_players then
        raise exception
          'settle_round: round % voided with % bets but wrote % refund rows',
          p_round_id, v_players, v_rows
          using errcode = 'XX000';
      end if;

      select coalesce(sum(cl.amount), 0)::integer into v_net
        from public.chip_ledger cl
       where cl.round_id = p_round_id;

      if v_net <> 0 then
        raise exception
          'settle_round: conservation failure on voided round % - ledger net %',
          p_round_id, v_net
          using errcode = 'XX000';
      end if;

      return query select 0, null::numeric, 0;
      return;
    end if;
  else
    -- nearest: RANK, never ROW_NUMBER. docs/game-rules.md §3.3.
    v_n := greatest(1, ceil(v_players * 0.10))::integer;

    with ranked as (
      select rank() over (order by abs(b.guess - v_result)) as rnk
        from public.bets b
       where b.round_id = p_round_id
    )
    select count(*)::integer into v_winners
      from ranked
     where ranked.rnk <= v_n;
  end if;

  -- 5. Payout. floor, dust to the house. docs/game-rules.md §4.1.
  v_prize  := floor(v_pot * 0.95)::integer;      -- RAKE = 0.05
  v_payout := floor(v_prize::numeric / v_winners)::integer;
  v_dust   := v_prize - (v_payout * v_winners);
  v_house  := v_pot - v_prize + v_dust;

  -- 6. One payout row per winner.
  if v_shape = 'duel' then
    insert into public.chip_ledger (user_id, round_id, kind, amount)
    select b.user_id, p_round_id, 'payout', v_payout
      from public.bets b
     where b.round_id = p_round_id
       and b.guess = v_result;
  else
    insert into public.chip_ledger (user_id, round_id, kind, amount)
    select w.user_id, p_round_id, 'payout', v_payout
      from (
        select b.user_id,
               rank() over (order by abs(b.guess - v_result)) as rnk
          from public.bets b
         where b.round_id = p_round_id
      ) w
     where w.rnk <= v_n;
  end if;

  get diagnostics v_rows = row_count;

  if v_rows <> v_winners then
    raise exception
      'settle_round: round % ranked % winners but wrote % payout rows',
      p_round_id, v_winners, v_rows
      using errcode = 'XX000';
  end if;

  if v_house <> 0 then
    insert into public.chip_ledger (user_id, round_id, kind, amount)
    values (v_house_id, p_round_id, 'rake', v_house);
  end if;

  -- 7. Conservation, read back from the ledger.
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

  -- 8. Post-floor multiplier.
  v_multiplier := round(v_payout::numeric / 20, 2);

  return query select v_winners, v_multiplier, v_payout;
end;
$$;


-- ---------------------------------------------------------------------------
-- 6. ws_schedule_round() - duel timing. docs/rounds.md "Timeline per duel".
--
--   preview_starts_at = now + p_starts_in
--   betting_opens_at  = preview + 5 s           video starts from frame 0
--   betting_closes_at = opens + video_bet_open_s  the lock frame, on screen
--   result_visible_at = closes + (video_reveal_s - video_bet_open_s)
--   results_end_at    = visible + 8 s
--   attempt k visible = closes + (reveal_k - video_bet_open_s)
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
  -- BETTING is the footage before the lock frame. Nothing pauses.
  v_closes  := v_opens + make_interval(secs => v_script.video_bet_open_s::double precision);
  v_visible := v_closes + make_interval(
                 secs => (v_script.video_reveal_s - v_script.video_bet_open_s)::double precision);
  v_ends    := v_visible + interval '8 seconds';

  insert into public.rounds (
    game_id, round_index,
    preview_starts_at, betting_opens_at, betting_closes_at,
    result_visible_at, results_end_at,
    video_bet_open_s, video_reveal_1_s, video_reveal_s, video_pause_s
  )
  values (
    v_game.id, v_new_index,
    v_preview, v_opens, v_closes, v_visible, v_ends,
    v_script.video_bet_open_s, v_script.video_reveal_1_s, v_script.video_reveal_s, v_script.video_pause_s
  )
  returning id into v_id;

  insert into public.round_results (round_id, result_value)
  values (v_id, v_script.result_value);

  -- Each attempt on its own gate. Side 1 unseals at its read frame, side 2
  -- at result_visible_at (its read frame IS video_reveal_s).
  insert into public.round_attempts (round_id, side, offset_value, readings, visible_at)
  select v_id,
         a.side,
         a.offset_value,
         a.readings,
         v_closes + make_interval(secs => (
           (case when a.side = 1
                 then coalesce(v_script.video_reveal_1_s, v_script.video_reveal_s)
                 else v_script.video_reveal_s end)
           - v_script.video_bet_open_s)::double precision)
    from public.round_script_attempts a
   where a.game_id     = v_script.game_id
     and a.round_index = v_script.round_index;

  return query select v_id, v_new_index, v_opens, v_closes, v_visible;
end;
$$;


-- ---------------------------------------------------------------------------
-- 7. ws_games() - scripts carry the first read frame and both attempts.
--    Same signature; only the jsonb payload grows.
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
                 'round_index',       rs.round_index,
                 'video_bet_open_s',  rs.video_bet_open_s,
                 'video_reveal_1_s',  rs.video_reveal_1_s,
                 'video_reveal_s',    rs.video_reveal_s,
                 'video_pause_s',     rs.video_pause_s,
                 'result_value',      rs.result_value,
                 'readings',          rs.readings,
                 'attempts',          coalesce((
                   select jsonb_agg(
                            jsonb_build_object(
                              'side',         a.side,
                              'offset_value', a.offset_value,
                              'readings',     a.readings
                            )
                            order by a.side
                          )
                     from public.round_script_attempts a
                    where a.game_id = rs.game_id and a.round_index = rs.round_index
                 ), '[]'::jsonb)
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
