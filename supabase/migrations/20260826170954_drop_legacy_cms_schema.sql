-- Zero Sum Entertainment - drop the legacy CMS schema
--
-- Phase 0 of docs/roadmap.md. See docs/data-model.md §0.
--
-- Migration 20260826155655_initial_schema.sql modelled an entertainment
-- company's website: artists, releases, events, event_artists, enquiries.
-- That schema was written before spec.md existed and it guessed the product
-- wrong. None of it applies to the betting product.
--
-- All six legacy tables were verified empty before this migration was written,
-- so this drop loses no data.
--
-- KEPT, because the betting schema and the back office still use them:
--   public.staff             back-office roles
--   public.staff_role        enum used by public.staff
--   public.is_staff()        membership test
--   public.is_admin()        membership test
--   public.set_updated_at()  trigger helper, attached to public.staff
--
-- Policies, indexes, triggers and grants on the dropped tables go with them:
-- DROP TABLE removes every dependent object of the table itself, and CASCADE
-- covers the foreign keys pointing at it from the other legacy tables.

-- ---------------------------------------------------------------------------
-- Tables
--
-- Listed leaf-first so CASCADE has nothing left to do in the normal case; it
-- is present only to absorb any dependency added outside this repository.
-- ---------------------------------------------------------------------------

drop table if exists public.enquiries cascade;
drop table if exists public.event_artists cascade;
drop table if exists public.events cascade;
drop table if exists public.releases cascade;
drop table if exists public.artists cascade;

-- ---------------------------------------------------------------------------
-- Enums
--
-- public.staff_role is deliberately NOT dropped: public.staff survives and
-- still uses it.
-- ---------------------------------------------------------------------------

drop type if exists public.enquiry_status;
drop type if exists public.enquiry_type;
drop type if exists public.event_status;
drop type if exists public.release_type;
