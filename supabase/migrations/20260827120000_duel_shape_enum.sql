-- Zero Sum Entertainment - the `duel` game shape (enum value only)
--
-- ALTER TYPE ... ADD VALUE cannot be used in the same transaction that then
-- USES the new value (PostgreSQL rule, still true on 17). Each migration file
-- runs in its own transaction, so the value is added here, alone, and
-- 20260827120001_duel_model.sql - which updates games to shape 'duel' and
-- branches settle_round() on it - runs after this has committed.
--
-- docs/game-rules.md §3.1: one video is one duel, two challengers, the bet
-- is a side.

alter type public.game_shape add value if not exists 'duel';
