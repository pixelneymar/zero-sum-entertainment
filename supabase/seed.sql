-- Zero Sum Entertainment - sample data.
--
-- Applied automatically by `supabase db reset` against the LOCAL database only.
-- It is never run by `supabase db push`, so nothing here reaches the remote project.
--
-- The staff table is intentionally not seeded: its rows key off auth.users, and
-- the right way to create one is to sign a user up locally and then insert their
-- id, e.g.
--   insert into public.staff (user_id, display_name, role)
--   values ('<uuid from auth.users>', 'Your Name', 'admin');

-- ---------------------------------------------------------------------------
-- Artists
-- ---------------------------------------------------------------------------

insert into public.artists (id, slug, name, tagline, bio, genres, hometown, is_published, sort_order, links)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'null-hypothesis',
    'Null Hypothesis',
    'Industrial techno, built for rooms with bad acoustics.',
    'Null Hypothesis started as a two-person modular rig in a Tbilisi basement and now tours as a full audiovisual set. Signed to Zero Sum in 2024.',
    array['techno', 'industrial', 'electronic'],
    'Tbilisi, GE',
    true,
    10,
    '{"instagram": "https://instagram.com/nullhypothesis", "spotify": "https://open.spotify.com/artist/placeholder"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'marguerite-vale',
    'Marguerite Vale',
    'Songwriter. Piano, tape hiss, and very few overdubs.',
    'Marguerite Vale writes short, plain songs and records them almost live. Her second album was tracked over nine days in a converted chapel.',
    array['folk', 'singer-songwriter'],
    'Bristol, UK',
    true,
    20,
    '{"bandcamp": "https://margueritevale.bandcamp.com"}'::jsonb
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'kova',
    'KOVA',
    'Producer and DJ. Half the roster owes them a favour.',
    'KOVA produces for most of the label and plays out under their own name roughly once a month.',
    array['house', 'breaks', 'electronic'],
    'Berlin, DE',
    true,
    30,
    '{"soundcloud": "https://soundcloud.com/kova"}'::jsonb
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'the-quiet-part',
    'The Quiet Part',
    'Signing announced soon.',
    'Placeholder page for an unannounced signing. Kept unpublished so it is invisible to the public API.',
    array['post-rock'],
    'Lisbon, PT',
    false,
    40,
    '{}'::jsonb
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Releases
-- ---------------------------------------------------------------------------

insert into public.releases (id, artist_id, slug, title, type, release_date, description, is_published, links)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'flat-affect',
    'Flat Affect',
    'album',
    date '2025-03-14',
    'Nine tracks recorded to tape and mixed in one pass. The label''s first full-length.',
    true,
    '{"spotify": "https://open.spotify.com/album/placeholder"}'::jsonb
  ),
  (
    'a2222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'flat-affect-remixes',
    'Flat Affect (Remixes)',
    'ep',
    date '2025-09-05',
    'Four reworks, including one by KOVA.',
    true,
    '{}'::jsonb
  ),
  (
    'a3333333-3333-4333-8333-333333333333',
    '22222222-2222-4222-8222-222222222222',
    'nine-days-in-the-chapel',
    'Nine Days in the Chapel',
    'album',
    date '2026-02-20',
    'Recorded live to two tracks with no click and almost no editing.',
    true,
    '{"bandcamp": "https://margueritevale.bandcamp.com/album/placeholder"}'::jsonb
  ),
  (
    'a4444444-4444-4444-8444-444444444444',
    '33333333-3333-4333-8333-333333333333',
    'service-road',
    'Service Road',
    'single',
    date '2026-06-12',
    'A one-off club single.',
    true,
    '{}'::jsonb
  ),
  (
    'a5555555-5555-4555-8555-555555555555',
    null,
    'zero-sum-volume-one',
    'Zero Sum, Volume One',
    'compilation',
    date '2026-11-01',
    'Label sampler. Unannounced, so this row stays unpublished.',
    false,
    '{}'::jsonb
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

insert into public.events (id, slug, title, description, venue, city, country_code, starts_at, ends_at, status, ticket_url, is_published)
values
  (
    'e1111111-1111-4111-8111-111111111111',
    'zero-sum-night-tbilisi-2026',
    'Zero Sum Night: Tbilisi',
    'Label night with three of the roster back to back until close.',
    'Left Bank',
    'Tbilisi',
    'GE',
    timestamptz '2026-09-19 21:00+04',
    timestamptz '2026-09-20 06:00+04',
    'scheduled',
    'https://example.com/tickets/zero-sum-tbilisi',
    true
  ),
  (
    'e2222222-2222-4222-8222-222222222222',
    'marguerite-vale-chapel-tour-bristol',
    'Marguerite Vale - Chapel Tour, Bristol',
    'Seated show. Full band for the second half.',
    'St George''s',
    'Bristol',
    'GB',
    timestamptz '2026-10-04 19:30+01',
    timestamptz '2026-10-04 22:00+01',
    'scheduled',
    'https://example.com/tickets/vale-bristol',
    true
  ),
  (
    'e3333333-3333-4333-8333-333333333333',
    'kova-berlin-warehouse-2026',
    'KOVA - Warehouse Set',
    'Postponed from the original spring date.',
    'Hall 3',
    'Berlin',
    'DE',
    timestamptz '2026-12-13 23:00+01',
    null,
    'postponed',
    null,
    true
  ),
  (
    'e4444444-4444-4444-8444-444444444444',
    'zero-sum-showcase-lisbon-2027',
    'Zero Sum Showcase: Lisbon',
    'Held back until the lineup is confirmed.',
    'TBC',
    'Lisbon',
    'PT',
    timestamptz '2027-03-06 20:00+00',
    null,
    'scheduled',
    null,
    false
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Lineups
-- ---------------------------------------------------------------------------

insert into public.event_artists (event_id, artist_id, billing_order, is_headliner)
values
  ('e1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 0, true),
  ('e1111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 1, false),
  ('e2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 0, true),
  ('e3333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 0, true),
  ('e4444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', 0, true)
on conflict (event_id, artist_id) do nothing;

-- ---------------------------------------------------------------------------
-- Enquiries
-- ---------------------------------------------------------------------------

insert into public.enquiries (id, type, status, name, email, company, artist_id, event_date, subject, message)
values
  (
    'c1111111-1111-4111-8111-111111111111',
    'booking',
    'new',
    'Dana Ruiz',
    'dana@examplefestival.com',
    'Example Festival',
    '11111111-1111-4111-8111-111111111111',
    date '2027-07-17',
    'Main stage slot, Saturday',
    'We would like Null Hypothesis for a 75 minute Saturday slot. Please send availability and a fee range.'
  ),
  (
    'c2222222-2222-4222-8222-222222222222',
    'licensing',
    'in_review',
    'Peter Lang',
    'p.lang@example-studio.tv',
    'Example Studio',
    '22222222-2222-4222-8222-222222222222',
    null,
    'Sync request for a short film',
    'We are after one Marguerite Vale track for the closing scene of a 20 minute short. Festival use only for now.'
  ),
  (
    'c3333333-3333-4333-8333-333333333333',
    'demo',
    'closed',
    'Ivo Petrov',
    'ivo.petrov@example.com',
    null,
    null,
    null,
    'Demo submission',
    'Four tracks, recorded at home over the winter. Link is in my profile. Thank you for listening.'
  )
on conflict (id) do nothing;
