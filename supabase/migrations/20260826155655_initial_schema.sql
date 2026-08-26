-- Zero Sum Entertainment - initial schema
--
-- Scope: talent roster (artists), catalogue (releases), live dates (events, with a
-- lineup join table), inbound contact/booking enquiries, and a small staff table
-- that back-office write access is keyed on.
--
-- Security model:
--   anon           -> read published content only; may submit an enquiry.
--   authenticated  -> same as anon, plus staff powers if listed in public.staff.
--   staff          -> full read/write on content; read/triage on enquiries.
--   admin (staff)  -> may also manage the staff table itself.
--   service_role   -> bypasses RLS (server-side jobs, admin tooling).
--
-- Every table below has RLS enabled AND explicit policies. A table with RLS on but
-- no policy denies everything except service_role; a table with RLS off is world
-- writable through the Data API. Neither state is left behind here.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.staff_role as enum ('admin', 'editor');

create type public.release_type as enum (
  'single',
  'ep',
  'album',
  'mixtape',
  'compilation',
  'film',
  'series'
);

create type public.event_status as enum (
  'scheduled',
  'postponed',
  'cancelled',
  'completed'
);

create type public.enquiry_type as enum (
  'booking',
  'licensing',
  'press',
  'demo',
  'general'
);

create type public.enquiry_status as enum (
  'new',
  'in_review',
  'responded',
  'closed'
);

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

-- Keeps updated_at honest. Attached to every table that has the column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Membership tests used by the policies below.
-- SECURITY DEFINER on purpose: these read public.staff, and public.staff itself
-- has RLS. Without DEFINER the staff policies would recurse into themselves.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff s
    where s.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff s
    where s.user_id = (select auth.uid())
      and s.role = 'admin'
  );
$$;

revoke execute on function public.is_staff() from public;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_staff() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- staff
-- ---------------------------------------------------------------------------

create table public.staff (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 120),
  role        public.staff_role not null default 'editor',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.staff is
  'Back-office users. Presence in this table is what grants write access to content.';

create trigger staff_set_updated_at
  before update on public.staff
  for each row execute function public.set_updated_at();

alter table public.staff enable row level security;

create policy "staff: read own row"
  on public.staff for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "staff: staff read all"
  on public.staff for select
  to authenticated
  using (public.is_staff());

create policy "staff: admins insert"
  on public.staff for insert
  to authenticated
  with check (public.is_admin());

create policy "staff: admins update"
  on public.staff for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "staff: admins delete"
  on public.staff for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- artists
-- ---------------------------------------------------------------------------

create table public.artists (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (char_length(trim(name)) between 1 and 160),
  tagline      text check (char_length(tagline) <= 240),
  bio          text,
  genres       text[] not null default '{}',
  hometown     text,
  image_url    text,
  links        jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.artists is 'Talent roster. Only is_published = true rows are public.';
comment on column public.artists.links is
  'Free-form social/streaming links, e.g. {"instagram":"...","spotify":"..."}.';

create index artists_published_idx on public.artists (is_published, sort_order, name);

create trigger artists_set_updated_at
  before update on public.artists
  for each row execute function public.set_updated_at();

alter table public.artists enable row level security;

create policy "artists: public read published"
  on public.artists for select
  to anon, authenticated
  using (is_published);

create policy "artists: staff read all"
  on public.artists for select
  to authenticated
  using (public.is_staff());

create policy "artists: staff insert"
  on public.artists for insert
  to authenticated
  with check (public.is_staff());

create policy "artists: staff update"
  on public.artists for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "artists: staff delete"
  on public.artists for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- releases
-- ---------------------------------------------------------------------------

create table public.releases (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid references public.artists (id) on delete set null,
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null check (char_length(trim(title)) between 1 and 200),
  type         public.release_type not null default 'single',
  release_date date,
  description  text,
  cover_url    text,
  links        jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.releases is
  'Records and productions. artist_id is nullable for label-wide or various-artists titles.';

create index releases_artist_idx on public.releases (artist_id);
create index releases_published_idx on public.releases (is_published, release_date desc);

create trigger releases_set_updated_at
  before update on public.releases
  for each row execute function public.set_updated_at();

alter table public.releases enable row level security;

-- A published release attached to an unpublished artist stays hidden, so that
-- unpublishing an artist cannot leak them through the catalogue.
create policy "releases: public read published"
  on public.releases for select
  to anon, authenticated
  using (
    is_published
    and (
      artist_id is null
      or exists (
        select 1 from public.artists a
        where a.id = releases.artist_id and a.is_published
      )
    )
  );

create policy "releases: staff read all"
  on public.releases for select
  to authenticated
  using (public.is_staff());

create policy "releases: staff insert"
  on public.releases for insert
  to authenticated
  with check (public.is_staff());

create policy "releases: staff update"
  on public.releases for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "releases: staff delete"
  on public.releases for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

create table public.events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null check (char_length(trim(title)) between 1 and 200),
  description  text,
  venue        text,
  city         text,
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  status       public.event_status not null default 'scheduled',
  ticket_url   text,
  poster_url   text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint events_ends_after_starts check (ends_at is null or ends_at >= starts_at)
);

comment on column public.events.country_code is 'ISO 3166-1 alpha-2, uppercase.';

create index events_published_idx on public.events (is_published, starts_at);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "events: public read published"
  on public.events for select
  to anon, authenticated
  using (is_published);

create policy "events: staff read all"
  on public.events for select
  to authenticated
  using (public.is_staff());

create policy "events: staff insert"
  on public.events for insert
  to authenticated
  with check (public.is_staff());

create policy "events: staff update"
  on public.events for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "events: staff delete"
  on public.events for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- event_artists (lineup)
-- ---------------------------------------------------------------------------

create table public.event_artists (
  event_id      uuid not null references public.events (id) on delete cascade,
  artist_id     uuid not null references public.artists (id) on delete cascade,
  billing_order integer not null default 0,
  is_headliner  boolean not null default false,
  created_at    timestamptz not null default now(),
  primary key (event_id, artist_id)
);

comment on table public.event_artists is 'Which artists play which event. Lower billing_order bills higher.';

create index event_artists_artist_idx on public.event_artists (artist_id);

alter table public.event_artists enable row level security;

-- Visible only when both sides of the link are public.
create policy "event_artists: public read published"
  on public.event_artists for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_artists.event_id and e.is_published
    )
    and exists (
      select 1 from public.artists a
      where a.id = event_artists.artist_id and a.is_published
    )
  );

create policy "event_artists: staff read all"
  on public.event_artists for select
  to authenticated
  using (public.is_staff());

create policy "event_artists: staff insert"
  on public.event_artists for insert
  to authenticated
  with check (public.is_staff());

create policy "event_artists: staff update"
  on public.event_artists for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "event_artists: staff delete"
  on public.event_artists for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- enquiries
-- ---------------------------------------------------------------------------

create table public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  type          public.enquiry_type not null default 'general',
  status        public.enquiry_status not null default 'new',
  name          text not null check (char_length(trim(name)) between 1 and 160),
  email         text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone         text check (char_length(phone) <= 40),
  company       text check (char_length(company) <= 160),
  artist_id     uuid references public.artists (id) on delete set null,
  event_date    date,
  subject       text check (char_length(subject) <= 200),
  message       text not null check (char_length(trim(message)) between 10 and 5000),
  internal_note text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.enquiries is
  'Inbound contact and booking forms. Write-only for the public: anyone may insert, nobody anonymous may read back.';

create index enquiries_triage_idx on public.enquiries (status, created_at desc);
create index enquiries_artist_idx on public.enquiries (artist_id);

create trigger enquiries_set_updated_at
  before update on public.enquiries
  for each row execute function public.set_updated_at();

alter table public.enquiries enable row level security;

-- Submission is open, but the row must arrive untriaged: no self-assigned status
-- and no injected internal note.
create policy "enquiries: anyone may submit"
  on public.enquiries for insert
  to anon, authenticated
  with check (status = 'new' and internal_note is null);

-- Deliberately no SELECT policy for anon. Staff only.
create policy "enquiries: staff read"
  on public.enquiries for select
  to authenticated
  using (public.is_staff());

create policy "enquiries: staff update"
  on public.enquiries for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "enquiries: admins delete"
  on public.enquiries for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Data API grants
--
-- New tables are no longer auto-exposed to the Data API roles, so privileges are
-- granted explicitly. RLS above is what actually decides each row; these grants
-- only decide which verbs the role may attempt at all.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.artists, public.releases, public.events, public.event_artists
  to anon, authenticated;

grant insert on public.enquiries to anon, authenticated;

grant select, insert, update, delete
  on public.artists, public.releases, public.events, public.event_artists, public.enquiries, public.staff
  to authenticated;

grant all on public.artists, public.releases, public.events, public.event_artists,
  public.enquiries, public.staff to service_role;
