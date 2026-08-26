# Game Rules and Payout Engine

The exact maths. This document is the authority. If code and this file
disagree, the code is wrong.

---

## 1. One engine, two shapes

Crowdflip (minority-side, binary) and Zero Sum (nearest, continuous) look like
different games. They are the same engine.

```
crowdflip : multiplier = 0.95 / share          (share = backers on winning side / total)
zero sum  : multiplier = payout / stake
          = (players × 20 × 0.95 / winners) / 20
          = 0.95 / (winners / players)
          = 0.95 / share
```

**Identical.** The only difference is which bets are marked as winners.

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

## 3. Winner selection — `nearest`

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
multiplier   = (1 − RAKE) / share
payout_exact = prize / winner_count
```

Displayed multiplier: 2 decimal places, e.g. `×4.75`.

### 4.1 Rounding — chips are integers

v0.1 ignored this because nothing persisted. A real ledger cannot.

`prize / winner_count` is rarely a whole number. The rule:

```
payout_per_winner = floor(prize / winner_count)
dust              = prize − (payout_per_winner × winner_count)
```

**`dust` goes to the house, with the rake.** It is at most
`winner_count − 1` chips.

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
destroyed and the ledger is no longer trustworthy.

## 5. Worked examples

**Ordinary round.** 47 players, no ties.

```
N          = max(1, ceil(47 × 0.10)) = ceil(4.7) = 5
pot        = 47 × 20      = 940
prize      = 940 × 0.95   = 893
share      = 5 / 47       = 0.10638
multiplier = 0.95 / 0.10638 = 8.93   → "×8.93"
payout     = floor(893 / 5) = floor(178.6) = 178
dust       = 893 − (178 × 5) = 3
house      = (940 − 893) + 3 = 50
check      : 178×5 + 50 = 890 + 50 = 940 = pot ✅
```

**Ties at the cut-off.** 47 players, three bets tie at rank 5.

```
N            = 5
winner_count = 7        (ranks 1-4, plus three tied at 5)
share        = 7 / 47   = 0.14894
multiplier   = 0.95 / 0.14894 = 6.38  → "×6.38"
payout       = floor(893 / 7) = 127
dust         = 893 − 889 = 4
house        = 47 + 4 = 51
check        : 127×7 + 51 = 889 + 51 = 940 ✅
```

**Minimum crowd.** 3 players.

```
N          = max(1, ceil(0.3)) = 1
pot        = 60,  prize = 57
multiplier = 0.95 / (1/3) = 2.85
payout     = 57,  dust = 0,  house = 3
check      : 57 + 3 = 60 ✅
```

**Everyone wins.** 5 players, all tied at rank 1.

```
winner_count = 5, share = 1.0, multiplier = 0.95
payout       = floor(95/5) = 19
```

Each player stakes 20 and receives 19. The rake makes a fully-tied round a net
loss for every participant. This is arithmetically correct and it is the
honest outcome, but it will feel bad. **Flagged as an open product question in
`decisions.md`** — one option is to void and refund a round where
`winner_count == player_count`.

## 6. Edge cases

| Case | Rule |
|---|---|
| Zero bets | No settlement. Round voids. No ledger entries. |
| One bet | That bet wins. `multiplier = 0.95`. Player loses 1 chip to rake. |
| All guesses identical | All win. See §5 example 4. |
| Insufficient balance | Bet rejected before insert. Never a negative balance. |
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

See `integrity.md` §4 for idempotency and `data-model.md` §6 for the signature.
