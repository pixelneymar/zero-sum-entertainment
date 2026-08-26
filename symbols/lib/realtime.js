// symbols/lib/realtime.js
//
// Realtime subscriptions, per docs/architecture.md §3.
//
// Two channels per round:
//   - Aggregates: player count + pot, from `round_stats`. Counts only,
//     never guesses. Safe to broadcast to everyone.
//   - Own bet: `bets`, filtered to `user_id=eq.<uid>`. RLS applies to
//     realtime too, so another user's bet cannot arrive even if this filter
//     were ever wrong — this filter is defence in depth, not the guarantee.
//
// NEVER subscribe to `bets` without a `user_id` filter — an unfiltered
// subscription is the realtime form of the information leak described in
// docs/integrity.md §5.2.
//
// Realtime is a latency optimisation, not a source of truth (architecture.md
// §3). Every handler here only triggers a re-fetch through api.js; nothing
// in this file is ever trusted as the final answer, and engine.js separately
// reconciles with a fetch at every phase change regardless of whether any
// event arrived.
import { supabase } from './supabase.js'
import { remeasureClock } from './clock.js'

const activeChannels = new Map()

function teardown(key) {
  const channel = activeChannels.get(key)
  if (channel) {
    supabase.removeChannel(channel)
    activeChannels.delete(key)
  }
}

/**
 * Subscribes to the round's public aggregate (player count + pot).
 * `onChange({ playerCount, pot })` is called whenever the underlying row
 * changes. This targets the `round_stats` aggregate, never raw `bets`,
 * so that only counts — never a guess — can ever reach this handler.
 *
 * Returns an unsubscribe function.
 */
export function subscribeRoundAggregates(roundId, onChange) {
  const key = `aggregates:${roundId}`
  teardown(key)

  const channel = supabase
    .channel(`round-stats-${roundId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'round_stats',
        filter: `round_id=eq.${roundId}`
      },
      (payload) => {
        const row = payload.new || payload.old
        if (!row) return
        onChange({
          playerCount: Number(row.player_count) || 0,
          pot: Number(row.pot) || 0
        })
      }
    )
    .subscribe((status) => onStatusChange(status))

  activeChannels.set(key, channel)
  return () => teardown(key)
}

/**
 * Subscribes to the caller's OWN bet for a round. `onBet({ guess, stake })`
 * fires when their bet row is inserted. Filtered server-side to
 * `user_id=eq.<uid>` (architecture.md §3's exact recipe); this handler also
 * double-checks `round_id` client-side before calling back, so a stray event
 * for a different round is never mistaken for this one.
 *
 * Returns an unsubscribe function.
 */
export function subscribeOwnBet(roundId, userId, onBet) {
  const key = `own-bet:${roundId}:${userId}`
  teardown(key)

  const channel = supabase
    .channel(`own-bet-${roundId}-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bets',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const row = payload.new
        if (!row || row.round_id !== roundId) return
        onBet({ guess: row.guess, stake: row.stake })
      }
    )
    .subscribe((status) => onStatusChange(status))

  activeChannels.set(key, channel)
  return () => teardown(key)
}

function onStatusChange(status) {
  // Re-measure the clock offset on (re)connect, per architecture.md §2.3.
  // Cheap and idempotent, so it is safe to do on every SUBSCRIBED, not just
  // ones that follow a drop.
  if (status === 'SUBSCRIBED') remeasureClock()
}

/** Tears down every open channel — call on unmount / game switch. */
export function unsubscribeAll() {
  for (const key of Array.from(activeChannels.keys())) teardown(key)
}
