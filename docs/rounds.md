# Round Scripts — ground truth from the footage

Every `result` below was read off the scale display in the actual frame.
`docs/spec.md` rule: a result that does not match the frame is fatal. These
were verified by extracting the frames (see decisions.md C16).

Published location (Supabase Storage, public bucket `videos`, Range-enabled):

- `https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos/banana.mp4`
- `https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos/water.mp4`

Re-upload with `supabase storage cp --experimental symbols/assets/videos/<f>.mp4 ss:///videos/<f>.mp4`.

Times are **video seconds**. Both videos are 1280×720, 30 fps, H.264 MP4
after transcode (`symbols/assets/videos/*.mp4`, 5.0 MB and 4.0 MB).

## Convention

- `banana_cut`: two halves on two scales. `result = left − right` in grams.
  This matches the v0.1 example (`result_value: -13`).
- `water_200g`: one glass on one scale. `result = reading − 200`.

## banana — 55.1 s

Host A (green jacket) cuts first, host B (navy shirt) second.

| id | bet_open_at | reveal_at | pause_at | scales | result |
|---|---|---|---|---|---|
| `banana_01` | 20 | 36 | 37 | 0.082 / 0.095 kg | **−13** |
| `banana_02` | 38 | 54 | 55 | 0.079 / 0.094 kg | **−15** |

Guess range −20 … +20, step 1.

## water — 49.8 s

| id | bet_open_at | reveal_at | pause_at | scale | result |
|---|---|---|---|---|---|
| `water_01` | 17 | 30 | 31 | 0.161 kg | **−39** |
| `water_02` | 32 | 48 | 49 | 0.174 kg | **−26** |

Guess range **−50 … +50**, step 1. v0.1 assumed ±20; both real pours land
outside that, so the range is widened. A slider that cannot reach the answer
is wrong for a demo.

## Timeline per round (docs/spec.md §3)

```
[cold open]  video PLAYS from previous pause_at (or 0) to bet_open_at
PREVIEW      5 s   video PAUSED at bet_open_at
BETTING      25 s  video PAUSED at bet_open_at        ← bets open, crowd arrives
LOCKED       5 s   video PLAYS from bet_open_at       ← counters FREEZE
REVEAL       —     video PLAYS until reveal_at        ← result not yet known
RESULTS      8 s   video PAUSED at pause_at           ← result, winners, payout
```

The cold open is new relative to v0.1: it plays the hosts' intro between
rounds instead of skipping it, so the video is continuous.
