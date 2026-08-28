# Duel Scripts — ground truth from the footage

Every offset below was read off the scale display in the actual frame.
`docs/spec.md` rule: a result that does not match the frame is fatal. These
were verified by extracting the frames (see decisions.md C16).

Published location (Supabase Storage, public bucket `videos`, Range-enabled):

- `https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos/banana.mp4`
- `https://xgvuavikubqwsdhoadyw.supabase.co/storage/v1/object/public/videos/water.mp4`

Re-upload with `supabase storage cp --experimental symbols/assets/videos/<f>.mp4 ss:///videos/<f>.mp4`.

Times are **video seconds**. Both videos are 1280×720, 30 fps, H.264 MP4
after transcode (`symbols/assets/videos/*.mp4`, 5.0 MB and 4.0 MB).

## The shape: one video, one duel

Each video is one duel. Two challengers attempt the same task in turn:

| Side | Challenger | Order |
|---|---|---|
| 1 | Green jacket | attempts first |
| 2 | Navy tee | attempts second |

The crowd bets on **which side lands closer to the target**. The bet is a
side (1 or 2) at the standard 20-chip stake — nothing else. The winner is the
side with the smaller absolute offset; equal offsets are a dead heat (0).

The footage plays from its first frame and **never pauses**. Betting is open
while the hosts stand and introduce the task; it locks on the frame where the
first challenger starts. Everything after the lock plays straight through to
the last frame.

## Convention

- `banana_cut`: two halves on two scales. `offset = left − right` in grams.
  Closest to an even split (offset 0) wins.
- `water_200g`: one glass on one scale. `offset = reading − 200`. Closest to
  200 g wins.

## banana — 55.1 s

| id | lock_at | reveal_1 | reveal_2 | end | side 1 (scales) | side 2 (scales) | winner |
|---|---|---|---|---|---|---|---|
| `banana_duel` | 20 | 36 | 54 | 55.1 | 0.082 / 0.095 kg → **−13** | 0.079 / 0.094 kg → **−15** | **1** (13 < 15) |

## water — 49.8 s

| id | lock_at | reveal_1 | reveal_2 | end | side 1 (scale) | side 2 (scale) | winner |
|---|---|---|---|---|---|---|---|
| `water_duel` | 17 | 30 | 48 | 49.8 | 0.161 kg → **−39** | 0.174 kg → **−26** | **2** (26 < 39) |

## Timeline per duel (docs/spec.md §3)

```
PREVIEW      (server only) video HELD at frame 0 until betting_opens_at
BETTING      video PLAYS 0 → lock_at             ← bets open over the intro, crowd arrives
LOCKED       5 s   video PLAYS                   ← counters FREEZE on the lock frame
REVEAL       —     video PLAYS                   ← side 1 read at reveal_1 (shown, not decisive)
RESULTS      8 s   video PLAYS to its last frame ← side 2 read at reveal_2 decides; payout
```

The betting window is not a constant. It is the length of footage before the
lock frame: 20 s for banana, 17 s for water. In demo mode there is no PREVIEW;
the duel starts on the first frame. In server mode `betting_closes_at` is the
lock frame's wall-clock instant, and every later boundary is derived from it:

```
result_visible_at      = betting_closes_at + (reveal_2 − lock_at)
round_attempts[1].visible_at = betting_closes_at + (reveal_1 − lock_at)
```

In the schema the lock frame is stored in the existing `video_bet_open_s`
column (it is the frame the post-lock playback is anchored to) and the two
reads are `video_reveal_1_s` and `video_reveal_s`.
