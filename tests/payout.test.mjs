// Payout engine unit tests — the worked examples from docs/game-rules.md §5.
// Run: node tests/payout.test.mjs
const STAKE = 20, RAKE = 0.05, FRAC = 0.10
let pass = 0, fail = 0

const targetWinners = players => Math.max(1, Math.ceil(players * FRAC))

function settle (players, winners = null) {
  const n = targetWinners(players)
  const w = winners ?? n
  const pot = players * STAKE
  const prize = Math.trunc(pot * (1 - RAKE))
  const payout = Math.floor(prize / w)
  const dust = prize - payout * w
  const house = (pot - prize) + dust
  // multiplier is what winners ACTUALLY received, computed AFTER the floor
  const multiplier = Number((payout / STAKE).toFixed(2))
  return { n, w, pot, prize, payout, dust, house, multiplier }
}

const eq = (label, actual, expected) => {
  if (actual === expected) { pass++; console.log(`  PASS  ${label}`) }
  else { fail++; console.log(`  FAIL  ${label}\n        expected ${expected}, got ${actual}`) }
}

console.log('\ngame-rules.md §5 — ordinary round (47 players, no ties)')
{
  const r = settle(47)
  eq('N', r.n, 5); eq('pot', r.pot, 940); eq('prize', r.prize, 893)
  eq('payout', r.payout, 178); eq('dust', r.dust, 3); eq('house', r.house, 50)
  eq('multiplier is post-floor', r.multiplier, 8.90)
  eq('conservation', r.payout * r.w + r.house, r.pot)
}

console.log('\ngame-rules.md §5 — ties at the cut-off (47 players, 7 winners)')
{
  const r = settle(47, 7)
  eq('payout', r.payout, 127); eq('dust', r.dust, 4); eq('house', r.house, 51)
  eq('multiplier is post-floor', r.multiplier, 6.35)
  eq('conservation', r.payout * r.w + r.house, r.pot)
}

console.log('\ngame-rules.md §5 — minimum crowd (3 players)')
{
  const r = settle(3)
  eq('N', r.n, 1); eq('payout', r.payout, 57); eq('house', r.house, 3)
  eq('conservation', r.payout * r.w + r.house, r.pot)
}

console.log('\ngame-rules.md §5 — everyone ties (5 players)')
{
  const r = settle(5, 5)
  eq('payout below stake', r.payout, 19)
  eq('every player nets -1', r.payout - STAKE, -1)
  eq('conservation', r.payout * r.w + r.house, r.pot)
}

console.log('\nconservation holds for every crowd size 1..500')
{
  let bad = 0
  for (let p = 1; p <= 500; p++) {
    const r = settle(p)
    if (r.payout * r.w + r.house !== r.pot) bad++
    if (r.payout < 0 || r.house < 0) bad++
  }
  eq('no chips created or destroyed', bad, 0)
}

console.log('\nties can only lower the multiplier, never raise it')
{
  let bad = 0
  for (let p = 10; p <= 200; p += 7) {
    const base = settle(p)
    for (let extra = 1; extra <= 5; extra++) {
      const tied = settle(p, base.n + extra)
      if (tied.multiplier > base.multiplier) bad++
    }
  }
  eq('monotonic', bad, 0)
}

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
