# Workspace — analytics and management dashboard

Route: `/workspace` in the same Symbols app. Staff-facing. Shows everything
the platform records, and — more importantly — whether the integrity
guarantees held.

## Principles

1. **Same authority model as the game** (`integrity.md` §1). The dashboard
   renders what the source returns. It never computes a payout of its own.
2. **Two sources, one interface.** `server` reads Supabase. `demo` reads the
   engine's persisted demo store (localStorage). Selected automatically, shown
   in a badge. This mirrors the game engine.
3. **Guesses are sealed until `result_visible_at`, for staff too.** Seeing the
   crowd's guesses before the lock is an insider edge (`decisions.md` O4).
   Pre-reveal the dashboard shows counts and pot only.
4. **Management writes are staff-gated and server-side.** In `server` mode
   they call `SECURITY DEFINER` RPCs that check `public.is_staff()`. In `demo`
   mode they act on the local store. Buttons are disabled when not permitted.

## Views

| View | Shows |
|---|---|
| Overview | KPIs: rounds, bets, staked, paid out, house take, players, avg/best multiplier. Conservation status. Pot / multiplier / players per round as small charts. |
| Live | Every active game's current round: phase, seconds left, players, pot, frozen snapshot. Updates every second. |
| Rounds | Table of every round: game, index, result + readings, players, pot, prize, winners, payout, multiplier, house, settled at, **conservation ✓/✗**. Click → detail. |
| Round detail | Guess distribution histogram with the result marked; bet list (name, bot flag, guess, distance, won, payout). Sealed rows before reveal. |
| Bets | All bets, filter by game/round/player/won. Sealed before reveal. |
| Players | Leaderboard: name, bot flag, balance, bets, wins, staked, paid out, net. |
| Ledger | Chip ledger stream (grant / stake / payout / rake / refund), filters, and the **audit**: Σ ledger per player vs `balances`. |
| Games | Config per game (range, step, unit, video, active) and the round scripts from `rounds.md`. Toggle active. |
| Integrity | Live indicators, one per guarantee: result hidden pre-reveal · no bet after lock · conservation per round · ledger = balances · settlement idempotent. Each shows pass / fail / n-a with detail. |

Management actions: set game active, void a round (refund all stakes),
schedule a round (server), reset demo store (demo), export CSV per view.

## Data shapes (source-agnostic)

```
round    { id, gameSlug, gameTitle, roundIndex, startedAt, settledAt, phase,
           result, unit, readings[], players, pot, prize, winners, payout,
           multiplier, house, conservationOk, sealed }
bet      { id, roundId, playerId, playerName, isBot, guess|null, distance|null,
           won|null, payout|null, placedAt }        // null = sealed
player   { id, name, isBot, isHouse, balance, bets, wins, staked, paidOut, net }
entry    { id, at, playerId, playerName, kind, amount, roundId }
game     { slug, title, active, guessMin, guessMax, guessStep, unit, videoSrc, scripts[] }
check    { id, label, status: 'pass'|'fail'|'na'|'unknown', detail }
```

## Server source

Reads go through analytics RPCs (`SECURITY DEFINER`, `search_path=''`,
`EXECUTE` revoked from `PUBLIC`, granted to `authenticated`). **Every read
RPC except `ws_me()` raises unless `public.is_staff()`.** An earlier draft of
this section gated only the management RPCs, which would have let any
signed-in player read every other player's balance and ledger — a larger hole
than anything the game's own RLS closes. `ws_me()` stays open so a non-staff
client can learn that it is not staff and fall back to the demo source.

- `ws_me()` → `{ user_id, is_staff, is_admin }`
- `ws_overview()`, `ws_rounds(limit, offset)`, `ws_round_detail(round_id)`,
  `ws_bets(filters)`, `ws_players()`, `ws_ledger(filters)`, `ws_ledger_audit()`,
  `ws_games()`, `ws_integrity()`
- `ws_round_detail` and `ws_bets` return `guess = NULL` while
  `clock_timestamp() < result_visible_at`. This is enforced in SQL, not the
  client.
  These RPCs are `SECURITY DEFINER` and bypass RLS, so each one re-derives
  `sealed` itself. There is no "your own bet" exception here, unlike the game's
  `bets` policy.
- Results and readings for display come from `round_scripts(game_id,
  round_index, …)`, seeded from `rounds.md`. **Known limitation:** the join is
  by `(game_id, round_index)`, so an ad-hoc round created with
  `dev_create_round()` and a different result will still show the scripted
  readings for that index. Create rounds with `ws_schedule_round`, which
  cycles through the scripts (`round_index mod script_count`).
- `prize` is derived as `pot − house` from the ledger, which equals
  `Σ payout rows` by conservation — not recomputed as `floor(pot × 0.95)`.

Management RPCs, all `raise` unless `public.is_staff()`:
`ws_set_game_active(slug, active)`, `ws_void_round(round_id)` (refund every
stake in one transaction, mark settled, write `refund` rows),
`ws_schedule_round(slug, starts_in interval)`.

## Demo source

The engine appends every settled round, its bets, and its ledger entries to
`localStorage['zse_demo_store']` (versioned JSON). The dashboard reads that
store plus the live engine state. Guesses are stored but the adapter returns
`null` for rounds whose reveal has not happened. `wsResetDemo()` clears it.

## Acceptance

- Every view renders real data from the current source, with the source badge.
- Rounds table shows conservation ✓ for every settled round.
- A pre-reveal round shows sealed guesses in both modes.
- Ledger audit shows Σ ledger = balance for every player.
- Integrity view: all applicable checks pass; inapplicable ones read n/a.
- Management buttons are disabled without staff; enabled actions work.
- Chrome-tested with screenshots per view; zero console errors.
