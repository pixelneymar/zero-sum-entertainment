-- Zero Sum Entertainment - seed data for the betting product.
--
-- Applied automatically by `supabase db reset` against the LOCAL database.
-- It is never run by `supabase db push`, so nothing here reaches the remote
-- project unless somebody applies this file deliberately. Every statement is
-- idempotent so that deliberate re-application is safe.
--
-- Contents:
--   1. the two launch games
--   2. public.round_scripts - the scripted takes from docs/rounds.md, read
--      by public.ws_schedule_round() (supabase/migrations/
--      20260826193732_workspace_analytics.sql) to create real rounds
--   3. public.dev_create_round() - schedules a round relative to the server
--      clock and records its result, so a live round can be created on demand
--   4. one live round per game, so a fresh database is immediately playable
--
-- Not seeded: profiles, bets and chip_ledger. Profiles key off auth.uid() and
-- are created by public.ensure_profile() on first sign-in. Chips are only ever
-- moved by ensure_profile(), place_bet() and settle_round().


-- ---------------------------------------------------------------------------
-- 1. Games
--
-- Both are `duel` shape (docs/game-rules.md §3.1): two challengers attempt
-- the same task in turn, the bet is a side. guess_min/max = 1/2 is what makes
-- place_bet() and bets_validate() reject anything but a side.
-- ---------------------------------------------------------------------------

insert into public.games (
  id, slug, title, objective_line, shape,
  guess_min, guess_max, guess_step, result_unit, video_asset, is_active
)
values
  (
    'b0000000-0000-4000-8000-000000000001',
    'banana_cut',
    'Banana Cut',
    'Two hosts, one banana each, one cut. Whose halves come out closer to equal?',
    'duel',
    1, 2, 1,
    'g',
    'https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos/banana.mp4',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'water_200g',
    'Water Pour',
    'Two hosts, one pour each, 200 g target. Who lands closer?',
    'duel',
    1, 2, 1,
    'g',
    'https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos/water.mp4',
    true
  )
on conflict (slug) do update
  set title          = excluded.title,
      objective_line = excluded.objective_line,
      shape          = excluded.shape,
      guess_min      = excluded.guess_min,
      guess_max      = excluded.guess_max,
      guess_step     = excluded.guess_step,
      result_unit    = excluded.result_unit,
      video_asset    = excluded.video_asset,
      is_active      = excluded.is_active;


-- ---------------------------------------------------------------------------
-- 2. public.round_scripts + public.round_script_attempts
--
-- The scripted duels from docs/rounds.md, read from the footage frame by
-- frame. One script per video. video_bet_open_s is the LOCK frame,
-- video_reveal_1_s side 1's read, video_reveal_s side 2's read (decisive),
-- video_pause_s the last frame. result_value is the WINNING SIDE.
--
-- banana_cut: offset = left scale - right scale, in grams. -13 vs -15 -> 1.
-- water_200g: offset = scale reading - 200, in grams.     -39 vs -26 -> 2.
-- ---------------------------------------------------------------------------

-- Older seeds wrote two single-attempt scripts per game; a duel has one.
delete from public.round_scripts where round_index > 1;

insert into public.round_scripts (
  game_id, round_index,
  video_bet_open_s, video_reveal_1_s, video_reveal_s, video_pause_s,
  result_value, readings
)
values
  -- banana_cut (docs/rounds.md "banana - 55.1 s")
  ('b0000000-0000-4000-8000-000000000001', 1, 20, 36, 54, 55.1, 1, array['82 g / 95 g', '79 g / 94 g']),
  -- water_200g (docs/rounds.md "water - 49.8 s")
  ('b0000000-0000-4000-8000-000000000002', 1, 17, 30, 48, 49.8, 2, array['161 g', '174 g'])
on conflict (game_id, round_index) do update
  set video_bet_open_s = excluded.video_bet_open_s,
      video_reveal_1_s = excluded.video_reveal_1_s,
      video_reveal_s   = excluded.video_reveal_s,
      video_pause_s    = excluded.video_pause_s,
      result_value     = excluded.result_value,
      readings         = excluded.readings;

insert into public.round_script_attempts (game_id, round_index, side, offset_value, readings)
values
  ('b0000000-0000-4000-8000-000000000001', 1, 1, -13, array['82 g', '95 g']),
  ('b0000000-0000-4000-8000-000000000001', 1, 2, -15, array['79 g', '94 g']),
  ('b0000000-0000-4000-8000-000000000002', 1, 1, -39, array['161 g']),
  ('b0000000-0000-4000-8000-000000000002', 1, 2, -26, array['174 g'])
on conflict (game_id, round_index, side) do update
  set offset_value = excluded.offset_value,
      readings     = excluded.readings;


-- ---------------------------------------------------------------------------
-- 3. public.dev_create_round()
--
-- A development helper. It is defined HERE and not in a migration on purpose:
-- it writes rounds, results and attempts directly, which no production path
-- may do.
--
-- It schedules a DUEL relative to the server clock, with the same derivation
-- ws_schedule_round() uses (docs/rounds.md "Timeline per duel"):
--
--   preview_starts_at = betting_opens_at - p_preview_seconds
--   betting_opens_at  = clock_timestamp() + p_opens_in     video starts at 0
--   betting_closes_at = betting_opens_at  + video_lock_s   the lock frame
--   result_visible_at = betting_closes_at + (video_reveal_s - video_lock_s)
--   results_end_at    = result_visible_at + p_results_seconds
--   attempt k visible = betting_closes_at + (reveal_k - video_lock_s)
--
-- The winner is derived from the two offsets (smaller abs() wins, equal is a
-- dead heat = 0) and recorded up front, exactly like the attempts: RLS hides
-- all of it until the frame that shows it.
--
-- Usage:
--   select public.dev_create_round('banana_cut', -13, -15);
--   select public.dev_create_round('water_200g', -39, -26, interval '2 seconds');
-- ---------------------------------------------------------------------------

drop function if exists public.dev_create_round(
  text, integer, interval, numeric, numeric, numeric, numeric, numeric, numeric
);

create or replace function public.dev_create_round(
  p_slug             text,
  p_offset_1         integer,
  p_offset_2         integer,
  p_opens_in         interval default interval '5 seconds',
  p_preview_seconds  numeric  default 5,
  p_results_seconds  numeric  default 8,
  p_video_lock_s     numeric  default null,
  p_video_reveal_1_s numeric  default null,
  p_video_reveal_s   numeric  default null,
  p_video_pause_s    numeric  default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_game     public.games%rowtype;
  v_script   public.round_scripts%rowtype;
  v_index    integer;
  v_lock     numeric;
  v_reveal1  numeric;
  v_reveal   numeric;
  v_pause    numeric;
  v_winner   integer;
  v_opens    timestamptz;
  v_closes   timestamptz;
  v_visible  timestamptz;
  v_id       uuid;
begin
  select g.* into v_game from public.games g where g.slug = p_slug;
  if not found then
    raise exception 'dev_create_round: no game with slug %', p_slug;
  end if;

  -- Frames default to the game's own script, so the seed round plays the real
  -- footage timing without repeating docs/rounds.md here.
  select rs.* into v_script
    from public.round_scripts rs
   where rs.game_id = v_game.id
   order by rs.round_index
   limit 1;

  v_lock    := coalesce(p_video_lock_s,     v_script.video_bet_open_s, 0);
  v_reveal1 := coalesce(p_video_reveal_1_s, v_script.video_reveal_1_s, v_lock + 8);
  v_reveal  := coalesce(p_video_reveal_s,   v_script.video_reveal_s,   v_lock + 16);
  v_pause   := coalesce(p_video_pause_s,    v_script.video_pause_s,    v_reveal + 1);

  v_winner := case
                when abs(p_offset_1) = abs(p_offset_2) then 0
                when abs(p_offset_1) < abs(p_offset_2) then 1
                else 2
              end;

  select coalesce(max(r.round_index), 0) + 1 into v_index
    from public.rounds r
   where r.game_id = v_game.id;

  v_opens   := clock_timestamp() + p_opens_in;
  v_closes  := v_opens + make_interval(secs => v_lock::double precision);
  v_visible := v_closes + make_interval(secs => (v_reveal - v_lock)::double precision);

  insert into public.rounds (
    game_id, round_index,
    preview_starts_at, betting_opens_at, betting_closes_at,
    result_visible_at, results_end_at,
    video_bet_open_s, video_reveal_1_s, video_reveal_s, video_pause_s
  )
  values (
    v_game.id, v_index,
    v_opens - make_interval(secs => p_preview_seconds::double precision),
    v_opens,
    v_closes,
    v_visible,
    v_visible + make_interval(secs => p_results_seconds::double precision),
    v_lock, v_reveal1, v_reveal, v_pause
  )
  returning id into v_id;

  insert into public.round_results (round_id, result_value)
  values (v_id, v_winner);

  insert into public.round_attempts (round_id, side, offset_value, readings, visible_at)
  values
    (v_id, 1, p_offset_1, coalesce((select a.readings from public.round_script_attempts a
                                     where a.game_id = v_game.id and a.round_index = v_script.round_index and a.side = 1), '{}'),
     v_closes + make_interval(secs => (v_reveal1 - v_lock)::double precision)),
    (v_id, 2, p_offset_2, coalesce((select a.readings from public.round_script_attempts a
                                     where a.game_id = v_game.id and a.round_index = v_script.round_index and a.side = 2), '{}'),
     v_visible);

  return v_id;
end;
$$;

comment on function public.dev_create_round(
  text, integer, integer, interval, numeric, numeric, numeric, numeric, numeric, numeric
) is
  'Development helper from supabase/seed.sql. Schedules a duel relative to clock_timestamp() and records its attempts and winner. Not part of any migration and not a production path.';

revoke execute on function public.dev_create_round(
  text, integer, integer, interval, numeric, numeric, numeric, numeric, numeric, numeric
) from public;

grant execute on function public.dev_create_round(
  text, integer, integer, interval, numeric, numeric, numeric, numeric, numeric, numeric
) to service_role;


-- ---------------------------------------------------------------------------
-- 4. One live duel per game
--
-- Betting opens 5 s from now and runs for the footage's own intro (20 s and
-- 17 s), so a reset is immediately playable. Re-run either call to get a
-- fresh live duel; round_index increments on its own.
-- ---------------------------------------------------------------------------

select public.dev_create_round('banana_cut', -13, -15);
select public.dev_create_round('water_200g', -39, -26);
