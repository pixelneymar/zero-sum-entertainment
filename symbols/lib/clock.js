// symbols/lib/clock.js
//
// Server-time offset, per docs/architecture.md §2.3.
//
// The device clock is never trusted for round state. This module measures
// the offset between the device clock and the database clock once at load,
// correcting for round-trip latency, and re-measures on realtime reconnect.
//
// IMPORTANT — display honesty only. Per docs/architecture.md §2.3 and
// docs/integrity.md §3, this clock never gates a write. `placeBet()` in
// api.js always lets the server's RLS `WITH CHECK` be the real judge; a
// client whose clock says betting is open can still be correctly rejected.
import { supabase } from './supabase.js'

let offset = 0

async function measure() {
  const t0 = Date.now()
  const { data, error } = await supabase.rpc('server_now')
  const rtt = Date.now() - t0

  if (error) {
    // Display-only degradation: keep the last known offset (0 on first
    // failure) rather than throwing. A stale offset only makes the
    // countdown slightly less honest, never unsafe — the RLS check is
    // what actually protects the lock.
    console.error('[clock] server_now failed, keeping previous offset', error)
    return offset
  }

  offset = new Date(data).getTime() - (t0 + rtt / 2)
  return offset
}

// Measured once at module load.
let readyPromise = measure()

/** Best-effort server time, corrected for the measured clock offset. */
export function serverNow() {
  return Date.now() + offset
}

/** Re-measures the offset. Call this on realtime reconnect. */
export function remeasureClock() {
  readyPromise = measure()
  return readyPromise
}

/** Resolves once the first measurement has completed (or failed). */
export function clockReady() {
  return readyPromise
}
