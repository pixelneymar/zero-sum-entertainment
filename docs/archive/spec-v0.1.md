# Demo 2 — Video Betting Overlay: Specification v0.1

Companion to `CLAUDE.md` (the brief). This is the build spec. Single self-contained HTML file, no frameworks, no install steps. Reuses Crowdflip's engine patterns.

---

## 1. Scope

One HTML page that plays a pre-recorded video and runs a betting overlay on top of it, synced to known timestamps. Two videos = two games, both **nearest** shape (closest guess wins).

| Game | Objective line | Guess input | Result unit |
|---|---|---|---|
| `banana_cut` | "Guess how far off the perfect cut" | number (grams off) | g |
| `water_200g` | "Guess how far off 200g the pour lands" | number (grams off) | g |

Out of scope: real livestream, real resolver, real money, multiplayer networking. All crowd behavior is bots. All results are scripted.

---

## 2. File structure

```
zero-sum-entertainment/
  CLAUDE.md         # the brief
  index.html        # everything: HTML + CSS + JS inline
  videos/
    banana.mp4
    water.mp4
  docs/
    spec.md         # this file
```

One `<video>` element. Game selection = a start screen with two buttons (Banana / Water). Selecting a game loads its video + its round script.

---

## 3. Round state machine

States, in order. Timer-driven, synced to video timestamps.

```
IDLE → PREVIEW → BETTING → LOCKED → REVEAL → RESULTS → (next round or end)
```

| State | Duration | Video | What happens |
|---|---|---|---|
| IDLE | — | paused at 0 | Start screen. |
| PREVIEW | 5s | paused on first frame of round | Objective banner + "Round starting in 5…" countdown. |
| BETTING | 25s | paused (or looping idle segment) | Bets open. Bot bets stream in. Pot + player count tick up. User can place one bet. |
| LOCKED | 5s | starts playing | "LOCKED — result incoming." No changes to any bet or count after this instant. |
| REVEAL | until reveal timestamp | playing | Video plays the attempt. Overlay minimal — don't cover the action. |
| RESULTS | 8s | paused on result frame | Result number, winners, multiplier, metadata. Then next round. |

Hard rule (protocol honesty): the moment LOCKED begins, bet list, player count, and pot are frozen. Never let a bot bet land after lock — this is the on-screen proof of the LOCKED→LIVE gap.

---

## 4. Round script (data)

Each video contains multiple rounds. Hardcode one array per game:

```js
const ROUNDS = [
  {
    round_id: "banana_01",
    bet_open_at: 0,        // video seconds — video paused here during PREVIEW+BETTING
    reveal_at: 34,          // video seconds — result visible on screen
    pause_at: 38,           // freeze frame for RESULTS
    result_value: -13,      // scripted, must match what the video shows
    result_unit: "g",
  },
  ...
];
```

Rule: `result_value` must visually match the video frame at `reveal_at`. If the video shows a scale reading 187g on a 200g target, `result_value` is -13. No exceptions — a mismatched result in a pitch demo is fatal.

---

## 5. Betting model (nearest shape)

- User + bots each submit one integer guess: "how many grams off" (signed, e.g. -20 … +20 range shown as a slider or quick-pick buttons).
- Stake: fixed 20 chips per bet (demo simplification — no stake input).
- Winners: the N closest guesses to `result_value`. `N = max(1, ceil(total_players × 0.1))` (top 10%).
- Ties at the cut-off: all tied guesses included.

Payout:

```
pot     = total_players × 20
prize   = pot × 0.95            // 5% rake, fixed, shown before betting
payout  = prize / winner_count  // equal split among winners (all stakes equal)
multiplier = payout / 20
```

Display multiplier to 2 decimals (e.g. "×4.75").

---

## 6. Bot simulation

Reuse Crowdflip's bot arrival pattern:

- `total_players` per round: random 35–80.
- Arrival: bets trickle in across the 25s window, front-loaded ~30%, back-loaded ~40% in the last 8s (creates late-rush drama).
- Guess distribution: normal-ish around 0 with stddev 8, clamped to slider range. A few outliers.
- Guarantee: at least one high-multiplier round per game session (winner_count forced small by making bot guesses cluster away from `result_value` on one scripted round). Mirrors Crowdflip's forced spectacle round.

Bots have fake usernames (short, varied, no real brands).

---

## 7. UI components

Layout: video fills the frame; overlay elements sit on top with semi-transparent panels. Same visual language as Crowdflip (fonts, colors, button styles — copy them).

### 7.1 Timer chip (top center)
- PREVIEW: "Round starts in 0:05"
- BETTING: "Betting closes in 0:25" (turns red under 5s)
- LOCKED: "LOCKED" (static, distinct color)
- REVEAL: hidden or minimal

### 7.2 Objective banner (top, under timer)
- One line, e.g. "🍌 Guess how far off the perfect cut — closest 10% split the pot"
- Visible in PREVIEW + BETTING. Hidden during REVEAL.

### 7.3 Bet panel (bottom center)
- Slider or button row: -20g … +20g in steps.
- One "PLACE BET (20 chips)" button. Disabled after use and at LOCKED.
- After betting: shows "Your guess: -5g".

### 7.4 Live crowd counter (left side)
- "🔴 47 players in" — ticks up as bot bets land.
- Pot below it: "Pot: 940" ticking up in sync.
- Both freeze at LOCKED.

### 7.5 History panel (right side, collapsible)
- Last 8 results of this game, newest first: `-13g · +2g · -50g · -1g …`
- Persists across rounds within the session. Pre-seed with 4–5 fake past results so round 1 doesn't look empty.

### 7.6 Results card (center, RESULTS state)
- Big result number: "**-13g**"
- Winner line: "6 players nailed it — ×4.75"
- Metadata row: `Players: 47 · Pot: 940 · Rake: 5% · Multiplier: ×4.75`
- If the user won: distinct celebration state ("YOU WON +95 chips").
- Auto-dismiss after 8s → next round PREVIEW.

---

## 8. User chips

- Start balance: 200 chips.
- Balance visible top-right at all times. Deduct on bet, credit on win.
- Balance persists across rounds within a session; resets on page reload. No storage APIs.

---

## 9. Video sync rules

- PREVIEW + BETTING: video paused at `bet_open_at`.
- LOCKED start: `video.play()`.
- At `reveal_at`: allow overlay to show nothing intrusive; result card only fires at `pause_at` (`video.pause()`).
- Use `timeupdate` polling to trigger `pause_at`, tolerance ±0.2s.
- If video fails to load: show a clear error, don't silently hang (pitch reliability).

---

## 10. Acceptance checklist

- [ ] Works by double-clicking `index.html` locally (with `videos/` folder alongside). No server, no install.
- [ ] Both games selectable from start screen; correct video + rounds load.
- [ ] No bet, count, or pot changes after LOCKED — verifiable by watching.
- [ ] Result card number always matches what's visible in the video frame.
- [ ] At least one round in each game produces multiplier ≥ ×8.
- [ ] History panel accumulates across rounds.
- [ ] Runs a full session (all rounds of one video) with zero interaction after the first bet — it must survive being projected in a meeting while Levan talks.
