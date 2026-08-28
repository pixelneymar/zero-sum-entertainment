# Game Rules and Payout Engine

The exact maths. This document is the authority. If code and this file
disagree, the code is wrong.

---

## 1. One engine, two shapes

Crowdflip (minority-side, binary) and Zero Sum (nearest, continuous) look like
different games. They are the same engine.

```
crowdflip : multiplier = 0.95 / share          (share = backers on winning side / total)
zero sum  : multiplier = payout_per_winner / STAKE     (payout_per_winner floored, see §4.1)
```

**Same shape, not the same number.** Before rounding,
`payout_per_winner / STAKE` reduces to `0.95 / share`, exactly like
Crowdflip:

```
payout_per_winner / STAKE
  = (players × 20 × 0.95 / winners) / 20
  = 0.95 / (winners / players)
  = 0.95 / share
```

Chips are integers, though, and `prize / winner_count` is rarely whole.
Once §4.1 floors it, `payout_per_winner / STAKE` and `0.95 / share` diverge
by the rounding remainder. The displayed multiplier is always the **post-floor**
value — what a winner actually received divided by what they staked — never
the pre-rounding ideal. The only difference between the two games is which
bets are marked as winners.

So the engine splits in two:

1. A **winner-selection predicate** — game-specific.
2. A **payout calculation** — shape-agnostic, shared by every game.

Build the payout calculation once. Add games by adding predicates.

## 2. Constants

| Name | Value | Notes |
|---|---|---|
| `STAKE` | 20 chips | Fixed at launch. Every bet is equal. |
| `RAKE` | 0.05 | 5%. Disclosed before betting opens. |
| `WINNER_FRACTION` | 0.10 | Top 10% by closeness. |
| `START_BALANCE` | 200 chips | New account grant. |

The payout formula below assumes **every stake is equal**. If variable stakes
are ever introduced, `multiplier` stops being one number per round and the
whole section must be rewritten as a stake-weighted split. Do not add variable
stakes without doing that work.

## 3. Winner selection

Two predicates exist. `duel` is the launch shape; `nearest` is kept for a
future single-attempt game and is unchanged.

### 3.1 `duel` — the launch shape

One video is one duel. Two challengers attempt the same task in turn. Each
attempt lands some absolute distance from the target (`round_attempts.
offset_value`, read off the scale in the frame). The result is the **winning
side**:

```
result_value = 1   if abs(offset_1) < abs(offset_2)
             = 2   if abs(offset_2) < abs(offset_1)
             = 0   if they are equal            -- dead heat
```

A bet is a side. `bets.guess` holds 1 or 2 and nothing else; the stake is the
standard 20 chips. The winners are every bet on the winning side:

```sql
b.guess = result_value          -- and result_value in (1, 2)
```

No ranking, no ties at a cut-off, no `WINNER_FRACTION`: the share is whatever
fraction of the crowd backed the winner. A lopsided crowd pays the minority
little; a contrarian crowd pays a lot. The payout maths in §4 is unchanged.

### 3.2 `duel` — no market

If `result_value = 0` (dead heat), or nobody backed the winning side,
there is no market. The round **voids**: every stake is refunded with one
`refund` ledger row per bet, and the house takes nothing. The round nets to
zero in the ledger exactly as a paid round does. This is Crowdflip's rule
(`reference-crowdflip.md` §3) and the answer to `decisions.md` O3 for this
shape.

### 3.3 `nearest` — kept, not used at launch

Distance is absolute error against the result:

```
distance(bet) = abs(bet.guess − result_value)
```

Winner count target:

```
N = max(1, ceil(player_count × 0.10))
```

Winners are the bets whose distance rank is `≤ N`, using **RANK, not
ROW_NUMBER**:

```sql
rank() over (order by abs(guess - result_value)) <= N
```

This matters. `RANK` gives tied distances the same rank, so every tied bet at
the cut-off is included — which is the rule from v0.1 §5. `ROW_NUMBER` would
break ties arbitrarily and silently exclude someone who tied for the last
winning slot. That is the kind of quiet unfairness this product exists to
avoid.

Consequence: `winner_count ≥ N`. It can exceed `N` by a lot when the crowd
clusters, which lowers the multiplier for everyone. That is correct and
intended — a crowded guess pays less.

## 4. Payout

```
pot          = player_count × STAKE
prize        = pot × (1 − RAKE)
share        = winner_count / player_count
payout_exact = prize / winner_count
```

Chips are integers. `payout_exact` is rarely whole, so §4.1 floors it to get
`payout_per_winner`. **The multiplier is defined from the floored payout, not
the other way round:**

```
multiplier = payout_per_winner / STAKE
```

Displayed to 2 decimal places, e.g. `×4.75`. This is what a winner actually
received, divided by what they staked — never the pre-rounding ideal
`(1 − RAKE) / share`, which diverges from it once the floor applies. See §1.

### 4.1 Rounding — chips are integers

v0.1 ignored this because nothing persisted. A real ledger cannot.

`prize / winner_count` is rarely a whole number. The rule:

```
payout_per_winner = floor(prize / winner_count)
dust              = prize − (payout_per_winner × winner_count)
```

**`dust` goes to the house, with the rake.** Both are credited to the house
account in one `rake`-kind ledger entry (`data-model.md` §5.1) — without a
counterparty row for it, the ledger cannot show conservation on its own. Dust
is at most `winner_count − 1` chips.

Three properties this guarantees:

1. No winner ever receives a fraction of a chip.
2. Chips are conserved exactly. `pot = house_take + Σ payouts`, always.
3. No winner is favoured over another by rounding.

The alternative — distributing dust to the earliest bets — creates a timing
advantage and is rejected for that reason.

### 4.2 Conservation

Every round must satisfy:

```
player_count × STAKE  =  Σ(payout_per_winner)  +  house_take
house_take            =  pot − prize + dust
```

This is an invariant, not an aspiration. It should be asserted in the
settlement function and in tests. If it fails, chips have been created or
destroyed and the ledger is no longer trustworthy. It is also directly
checkable from the ledger itself, not merely from the settlement code's own
arithmetic: `select sum(amount) from chip_ledger where round_id = $1` must be
`0` for every settled round, because the `rake` entry (§4.1) is the house's
counterparty to every stake and payout in that round.

## 5. Worked examples

Every multiplier below is `payout_per_winner / STAKE`, computed **after**
the floor in §4.1 — what a winner actually received. It is not
`(1 − RAKE) / share`; that pre-rounding value is shown alongside the first
two examples only to make the divergence visible.

**Ordinary round.** 47 players, no ties.

```
N            = max(1, ceil(47 × 0.10)) = ceil(4.7) = 5
pot          = 47 × 20      = 940
prize        = 940 × 0.95   = 893
share        = 5 / 47       = 0.10638
pre-round    = 0.95 / 0.10638 = 8.93   (ideal, not what is paid)
payout       = floor(893 / 5) = floor(178.6) = 178
multiplier   = 178 / 20 = 8.90   → "×8.90"
dust         = 893 − (178 × 5) = 3
house_take   = (940 − 893) + 3 = 50
check        : 178×5 + 50 = 890 + 50 = 940 = pot ✅
```

**Ties at the cut-off.** 47 players, three bets tie at rank 5.

```
N            = 5
winner_count = 7        (ranks 1-4, plus three tied at 5)
share        = 7 / 47   = 0.14894
pre-round    = 0.95 / 0.14894 = 6.38   (ideal, not what is paid)
payout       = floor(893 / 7) = 127
multiplier   = 127 / 20 = 6.35   → "×6.35"
dust         = 893 − 889 = 4
house_take   = 47 + 4 = 51
check        : 127×7 + 51 = 889 + 51 = 940 ✅
```

**Minimum crowd.** 3 players.

```
N          = max(1, ceil(0.3)) = 1
pot        = 60,  prize = 57
payout     = floor(57 / 1) = 57
multiplier = 57 / 20 = 2.85   → "×2.85"
dust       = 0,  house_take = 3
check      : 57 + 3 = 60 ✅
```

At this crowd size `prize / winner_count` happens to be whole, so the
pre-round and post-floor values coincide. That is a coincidence of this
example, not a rule.

**Everyone wins.** 5 players, all tied at rank 1.

```
winner_count = 5, share = 1.0
pot          = 100, prize = 95
payout       = floor(95 / 5) = 19
multiplier   = 19 / 20 = 0.95   → "×0.95"
dust         = 0,  house_take = 5
check        : 19×5 + 5 = 95 + 5 = 100 ✅
```

Each player stakes 20 and receives 19. The rake makes a fully-tied round a net
loss for every participant. This is arithmetically correct and it is the
honest outcome, but it will feel bad. Crowdflip already treats this as a void
condition — `resolve()` (`reference-crowdflip.md` §3) voids on
`countA === countB` (tie) or either side at zero (unanimous), refunding
stakes with no rake taken. **Flagged as an open product question in
`decisions.md` O3, crediting that precedent** — one option is to void and
refund this game's round the same way, whenever
`winner_count == player_count`.

## 6. Edge cases

| Case | Rule |
|---|---|
| Dead heat (`duel`) | Voided. Every stake refunded, no rake, no payout rows. §3.2. |
| Nobody backed the winner (`duel`) | Voided, the same way. §3.2. |
| Zero bets | `settle_round` still claims the round and marks it settled (`data-model.md` §6, step 2), then branches before the payout maths (step 4): no ledger rows are written, `winner_count/multiplier/payout` return as `0/null/0`. `prize / winner_count` never executes — dividing by zero is not caught, it is never reached. |
| One bet | That bet wins. `payout = floor(0.95 × 20) = 19`, `multiplier = 19 / 20 = 0.95`. Player loses 1 chip to rake. |
| All guesses identical | All win. See §5 example 4. |
| Insufficient balance | Bet rejected inside `place_bet()`, before insert. Never a negative balance. |
| Guess outside the game's range | Rejected inside `place_bet()`, before insert. See `integrity.md` §3. For `duel` the range is `1 .. 2`. |
| Result outside guess range | Legal. The nearest guess still wins, however far off. |
| Round never settled | Stakes stay debited until settlement runs. Settlement is idempotent and can be re-run safely. |

## 7. Where this is enforced

The payout calculation lives in **one** Postgres function,
`public.settle_round(round_id)`. Not in the client. Not in an Edge Function.
Not duplicated anywhere.

Reasons:

- The client must never compute its own winnings. v0.1 did, because it had no
  server; that cannot survive contact with real users.
- Settlement must be atomic with the ledger writes. Same transaction, one
  place.
- One implementation means one place to audit.

See `integrity.md` §4 for idempotency and the advisory lock against a
landing bet, and `data-model.md` §6 for the signature and the zero-bet
branch.
