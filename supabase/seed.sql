-- Zero Sum Entertainment - seed data for the betting product.
--
-- Applied automatically by `supabase db reset` against the LOCAL database.
-- It is never run by `supabase db push`, so nothing here reaches the remote
-- project unless somebody applies this file deliberately. Every statement is
-- idempotent so that deliberate re-application is safe.
--
-- Contents:
--   1. the two launch games
--   2. public.dev_create_round() - schedules a round relative to the server
--      clock and records its result, so a live round can be created on demand
--   3. one live round per game, so a fresh database is immediately playable
--
-- Not seeded: profiles, bets and chip_ledger. Profiles key off auth.uid() and
-- are created by public.ensure_profile() on first sign-in. Chips are only ever
-- moved by ensure_profile(), place_bet() and settle_round().


-- ---------------------------------------------------------------------------
-- 1. Games
--
-- Both are `nearest` shape: guess how far off the attempt lands, in grams,
-- signed. -20 .. +20 in steps of 1 gives 41 possible guesses, which is wide
-- enough that a 35-80 player crowd does not saturate the grid.
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
    'Guess how far off the perfect cut',
    'nearest',
    -20, 20, 1,
    'g',
    'https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos/banana.mp4',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'water_200g',
    'Water 200g',
    'Guess how far off 200g the pour lands',
    'nearest',
    -50, 50, 1,
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
-- 2. public.dev_create_round()
--
-- A development helper. It is defined HERE and not in a migration on purpose:
-- it writes rounds and results directly, which no production path may do.
--
-- It schedules every boundary relative to the server clock, so the round it
-- creates is live now rather than at some fixed wall-clock time:
--
--   preview_starts_at = betting_opens_at - p_preview_seconds
--   betting_opens_at  = clock_timestamp() + p_opens_in
--   betting_closes_at = betting_opens_at  + p_betting_seconds
--   result_visible_at = betting_closes_at + (video_reveal_s - video_bet_open_s)
--   results_end_at    = result_visible_at + p_results_seconds
--
-- result_visible_at is derived from the video offsets, not chosen: the video
-- starts playing from video_bet_open_s at betting_closes_at, so the reveal
-- frame lands exactly that far later. public.rounds_video_alignment enforces
-- it, and this helper is written to satisfy it rather than fight it.
--
-- The result is recorded up front. That is safe and it is the whole point of
-- the round_results split: RLS hides it from every caller until
-- result_visible_at.
--
-- Usage:
--   select public.dev_create_round('banana_cut', -3);
--   select public.dev_create_round('water_200g', 7, interval '2 seconds', 10, 90);
-- ---------------------------------------------------------------------------

create or replace function public.dev_create_round(
  p_slug             text,
  p_result           integer,
  p_opens_in         interval default interval '5 seconds',
  p_preview_seconds  numeric  default 10,
  p_betting_seconds  numeric  default 45,
  p_results_seconds  numeric  default 30,
  p_video_bet_open_s numeric  default 0.00,
  p_video_reveal_s   numeric  default 8.00,
  p_video_pause_s    numeric  default 14.00
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_game    public.games%rowtype;
  v_index   integer;
  v_opens   timestamptz;
  v_closes  timestamptz;
  v_visible timestamptz;
  v_id      uuid;
begin
  select g.* into v_game from public.games g where g.slug = p_slug;
  if not found then
    raise exception 'dev_create_round: no game with slug %', p_slug;
  end if;

  if p_result < v_game.guess_min or p_result > v_game.guess_max then
    raise warning
      'dev_create_round: result % is outside the guess range % .. % - legal, but every guess will be far off',
      p_result, v_game.guess_min, v_game.guess_max;
  end if;

  select coalesce(max(r.round_index), 0) + 1 into v_index
    from public.rounds r
   where r.game_id = v_game.id;

  v_opens   := clock_timestamp() + p_opens_in;
  v_closes  := v_opens + make_interval(secs => p_betting_seconds::double precision);
  v_visible := v_closes + make_interval(
                 secs => (p_video_reveal_s - p_video_bet_open_s)::double precision);

  insert into public.rounds (
    game_id, round_index,
    preview_starts_at, betting_opens_at, betting_closes_at,
    result_visible_at, results_end_at,
    video_bet_open_s, video_reveal_s, video_pause_s
  )
  values (
    v_game.id, v_index,
    v_opens - make_interval(secs => p_preview_seconds::double precision),
    v_opens,
    v_closes,
    v_visible,
    v_visible + make_interval(secs => p_results_seconds::double precision),
    p_video_bet_open_s, p_video_reveal_s, p_video_pause_s
  )
  returning id into v_id;

  insert into public.round_results (round_id, result_value)
  values (v_id, p_result);

  return v_id;
end;
$$;

comment on function public.dev_create_round(
  text, integer, interval, numeric, numeric, numeric, numeric, numeric, numeric
) is
  'Development helper from supabase/seed.sql. Schedules a round relative to clock_timestamp() and records its result. Not part of any migration and not a production path.';

revoke execute on function public.dev_create_round(
  text, integer, interval, numeric, numeric, numeric, numeric, numeric, numeric
) from public;

grant execute on function public.dev_create_round(
  text, integer, interval, numeric, numeric, numeric, numeric, numeric, numeric
) to service_role;


-- ---------------------------------------------------------------------------
-- 3. One live round per game
--
-- Betting opens 5 s from now and runs for 45 s, so a reset is immediately
-- playable. Re-run either call to get a fresh live round; round_index
-- increments on its own.
-- ---------------------------------------------------------------------------

select public.dev_create_round('banana_cut', -3);
select public.dev_create_round('water_200g', 7);
