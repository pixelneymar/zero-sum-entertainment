# Roadmap

Phased delivery. Each phase ends with something demonstrable.

Ordering principle: **build the integrity guarantees first.** They are the
product. Retrofitting a lock onto a working game means rewriting the game.

---

## Phase 0 — Replace the wrong schema

The live database holds an entertainment-company schema built before `spec.md`
was available. It is unrelated to the product. See `data-model.md` §0.

- [ ] Confirm with the owner that `artists`, `releases`, `events`,
      `event_artists`, `enquiries` may be dropped
- [ ] Write a migration that drops them and keeps `staff`
- [ ] Apply with `--dry-run` first

**This is a destructive change to a live database. It needs explicit approval
and it will not be done without it.** The tables are empty, so the cost is
zero — but that is the owner's call to confirm, not an assumption to make.

## Phase 1 — Integrity core

The whole product in one phase, with no interface.

- [ ] `games`, `rounds`, `round_results`, `bets`, `profiles`
- [ ] `chip_ledger`, `balances`, balance trigger
- [ ] RLS on every table, per `integrity.md`
- [ ] `round_stats` view with `security_invoker = true`
- [ ] `settle_round()` with the idempotent claim and the conservation assert
- [ ] `server_now()` RPC

**Exit criteria — all provable by direct API call, no client involved:**

- [ ] Insert into `bets` at `betting_closes_at + 50 ms` → policy violation
- [ ] `select` on `round_results` before `reveal_at` → zero rows
- [ ] `select` another user's `guess` before `reveal_at` → zero rows
- [ ] `round_stats` returns correct counts while guesses stay hidden
- [ ] `settle_round()` twice → identical result, one set of ledger rows
- [ ] `sum(chip_ledger.amount) = balances.balance` after every settlement
- [ ] Conservation holds on every worked example in `game-rules.md` §5

Phase 1 is the phase worth being slow in. Everything after is presentation.

## Phase 2 — Playable client

Symbols client against the real backend.

- [ ] Anonymous auth, 200-chip grant on profile creation
- [ ] `GamePicker`
- [ ] `VideoSurface` with server-clock sync and drift correction
- [ ] `TimerChip`, `ObjectiveBanner`, `BetPanel`, `BalanceChip`
- [ ] `CrowdCounter` — must visibly freeze at lock
- [ ] `ResultsCard`
- [ ] Clock-offset measurement and re-measure on reconnect
- [ ] Video transcode `.mov` → H.264 MP4

Exit: one human plays a full round and is paid correctly.

## Phase 3 — Crowd

- [ ] Bot writer as `SECURITY DEFINER`, writing before the lock
- [ ] Arrival curve and herd model from `reference-crowdflip.md`
- [ ] Crowd sizing, 35–80 players
- [ ] Realtime aggregate broadcasts
- [ ] `HistoryPanel`, pre-seeded

Exit: a round feels populated; counters freeze at lock.

## Phase 4 — Demo hardening

The pitch requirement from v0.1: survive being projected while someone talks.

- [ ] Full session runs unattended after the first bet
- [ ] Video load failure shows a clear error
- [ ] Realtime disconnect recovers without desync
- [ ] Tab-throttle recovery — verify the drift correction
- [ ] `pg_cron` round creation and settlement sweep
- [ ] Forced high-multiplier round (≥ ×8 per game, from v0.1 acceptance)
      **DEMO ONLY.** This rigs an outcome. It must not ship to a real market.
      See `integrity.md` §8.1. Gate it behind a demo flag that is off by
      default, or the product's one claim becomes false.

Exit: the acceptance checklist in `spec.md` §10 passes end to end.

## Phase 5 — Launch blockers

Not needed for a demo. Needed before real users.

- [ ] **Segmented HLS with gated segments.** `integrity.md` §5.3. Serving the
      whole file is a known hole and must not reach launch.
- [ ] **Bot disclosure decision.** `spec.md` §8.4
- [ ] **Staging project.** Today the remote is the only environment and a bad
      migration hits the demo
- [ ] Rate limiting on bet placement
- [ ] Sybil resistance — real identity
- [ ] Observability: settlement failures, conservation-assert failures

## Deliberately later

- Real money — changes the regulatory position entirely
- Live streaming — dissolves §5.3 rather than solving it
- Variable stakes — rewrites `game-rules.md` §2
- More game shapes — the `shape` enum is the seam
