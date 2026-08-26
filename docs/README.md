# Documentation

Zero Sum Entertainment — a betting layer over short physical-challenge videos.

## Read in this order

| Document | What it answers |
|---|---|
| [`spec.md`](spec.md) | What the product is and what it must do. **Start here.** |
| [`game-rules.md`](game-rules.md) | The exact payout maths. Authoritative over code. |
| [`integrity.md`](integrity.md) | How the honesty claim is enforced. **The important one.** |
| [`data-model.md`](data-model.md) | Schema, RLS, and `settle_round()`. |
| [`architecture.md`](architecture.md) | Symbols + Supabase mapping, realtime, video sync. |
| [`roadmap.md`](roadmap.md) | Phased delivery and exit criteria. |
| [`decisions.md`](decisions.md) | Why things are this way. What is still open. |
| [`reference-crowdflip.md`](reference-crowdflip.md) | The reference engine, extracted. |
| [`archive/spec-v0.1.md`](archive/spec-v0.1.md) | The original single-file demo spec. |

For toolchain rules — PATH, Supabase, Symbols, migration traps — see
[`../CLAUDE.md`](../CLAUDE.md).

## The one-paragraph version

Users watch someone attempt a precise physical task and bet on **how far off**
it lands. Closest 10% split the pot, 5% rake. The product's only real claim is
that once betting closes, nothing changes — not the bets, the crowd, the pot,
or the result. Everything else is entertainment; that part has to be true.

## If you read one thing

[`integrity.md`](integrity.md). The product is the guarantee. A change that
weakens it is wrong however good it looks.

Three points that catch people:

1. **Round state is derived from timestamps, never stored.** No `state`
   column. A stored state creates a window where late bets land.
2. **`result_value` lives in its own table.** Not because RLS can't hide a
   column — PostgreSQL has column-level `GRANT` and PostgREST honours it. The
   real reason: a `GRANT` is static, and this gate is time-varying (readable
   only after `result_visible_at`). Only an RLS policy is evaluated per row,
   per query, against the live clock. Merging the column into `rounds`
   publishes the answer during betting.
3. **Crowdflip's "forced spectacle" rigs outcomes.** Verified in source. Fine
   for a fake crowd, fraud with a real one. Demo flag only. §8.1.

## Status

Design only. No product code is written. The live database still holds an
unrelated schema from before `spec.md` was available — `roadmap.md` Phase 0.
