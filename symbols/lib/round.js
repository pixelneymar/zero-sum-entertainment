// symbols/lib/round.js
//
// Derives round phase from server timestamps. Never from a stored column —
// per docs/integrity.md §2, round state does not exist as a column anywhere;
// it is a pure function of `now()` against the round's schedule. This file
// is the client-side mirror of that same derivation, used for DISPLAY only.
// The database re-derives it independently for every write; the client's
// answer is never authoritative (docs/integrity.md §1).
//
// `round` here is the shape from api.js / the state contract:
//   { id, roundIndex, bettingOpensAt, bettingClosesAt, revealAt, resultsEndAt, ... }

export const PHASES = ['preview', 'betting', 'locked', 'reveal', 'results']

function toMs(value) {
  return new Date(value).getTime()
}

/**
 * now < bettingOpensAt   -> 'preview'
 * now < bettingClosesAt  -> 'betting'
 * now < revealAt         -> 'locked'
 * now < resultsEndAt     -> 'reveal'
 * else                   -> 'results'
 */
export const LOCKED_MS = 5000

export function phaseOf(round, now) {
  if (!round) return 'preview'

  const opens  = toMs(round.bettingOpensAt)
  const closes = toMs(round.bettingClosesAt)
  const visible = toMs(round.resultVisibleAt)
  const ends   = toMs(round.resultsEndAt)

  if (now < opens) return 'preview'
  if (now < closes) return 'betting'
  // LOCKED is a fixed 5s beat after betting closes (docs/spec.md §3). Nothing
  // security-relevant happens at this boundary — the real gate is the server
  // refusing writes past bettingClosesAt — so it is derived client-side.
  if (now < Math.min(closes + LOCKED_MS, visible)) return 'locked'
  // REVEAL: the video is playing the attempt. The result is NOT yet readable;
  // the server gates round_results on resultVisibleAt (docs/integrity.md §5.1).
  if (now < visible) return 'reveal'
  if (now < ends) return 'results'
  return 'results'
}

/** Seconds left in the CURRENT phase, floored at 0. */
export function secondsLeft(round, now) {
  if (!round) return 0

  const phase = phaseOf(round, now)
  let target

  switch (phase) {
    case 'preview':
      target = round.bettingOpensAt
      break
    case 'betting':
      target = round.bettingClosesAt
      break
    case 'locked':
      target = round.resultVisibleAt
      break
    case 'reveal':
      target = round.resultsEndAt
      break
    default:
      return 0
  }

  const ms = toMs(target) - now
  return ms > 0 ? Math.ceil(ms / 1000) : 0
}
