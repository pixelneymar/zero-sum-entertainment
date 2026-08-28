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


// ---- duel shape — docs/game-rules.md §3.1 / §3.2 ---------------------------
// Winners are every bet on the winning side. No winning bet, or a dead heat,
// voids the round: every stake refunded, no rake. Payout maths is §4 as-is.
const duelWinner = (o1, o2) => (Math.abs(o1) === Math.abs(o2) ? 0 : Math.abs(o1) < Math.abs(o2) ? 1 : 2)

function settleDuel (sides, winner) {
  const players = sides.length
  const winners = winner === 1 || winner === 2 ? sides.filter(x => x === winner).length : 0
  const pot = players * STAKE
  if (winners === 0) {
    return { players, winners: 0, pot, prize: 0, payout: 0, house: 0, refunds: players * STAKE, voided: true, multiplier: null }
  }
  const prize = Math.trunc(pot * (1 - RAKE))
  const payout = Math.floor(prize / winners)
  const dust = prize - payout * winners
  const house = (pot - prize) + dust
  return { players, winners, pot, prize, payout, dust, house, refunds: 0, voided: false, multiplier: Number((payout / STAKE).toFixed(2)) }
}

console.log('\nrounds.md — banana duel: −13 vs −15 → side 1; water duel: −39 vs −26 → side 2')
{
  eq('banana winner', duelWinner(-13, -15), 1)
  eq('water winner', duelWinner(-39, -26), 2)
  eq('equal offsets are a dead heat', duelWinner(-7, 7), 0)
}

console.log('\nduel — 47 players, 12 back the winner')
{
  const sides = Array.from({ length: 47 }, (_, i) => (i < 12 ? 1 : 2))
  const r = settleDuel(sides, 1)
  eq('winners = backers of side 1', r.winners, 12)
  eq('pot', r.pot, 940); eq('prize', r.prize, 893)
  eq('payout', r.payout, Math.floor(893 / 12))
  eq('multiplier is post-floor', r.multiplier, Number((Math.floor(893 / 12) / 20).toFixed(2)))
  eq('conservation', r.payout * r.winners + r.house, r.pot)
}

console.log('\nduel — everyone backs the winner (5 players)')
{
  const r = settleDuel([1, 1, 1, 1, 1], 1)
  eq('payout below stake', r.payout, 19)
  eq('conservation', r.payout * r.winners + r.house, r.pot)
}

console.log('\nduel — no market voids and refunds (§3.2)')
{
  const dead = settleDuel([1, 1, 2], 0)
  eq('dead heat voids', dead.voided, true)
  eq('dead heat refunds every stake', dead.refunds, 60)
  eq('dead heat takes no rake', dead.house, 0)
  const nobody = settleDuel([2, 2, 2, 2], 1)
  eq('nobody on the winner voids', nobody.voided, true)
  eq('refund equals pot', nobody.refunds, nobody.pot)
}

console.log('\nduel — conservation holds for every split 0..200 of 200 players')
{
  let bad = 0
  for (let k = 0; k <= 200; k++) {
    const sides = Array.from({ length: 200 }, (_, i) => (i < k ? 1 : 2))
    const r = settleDuel(sides, 1)
    const back = r.voided ? r.refunds : r.payout * r.winners + r.house
    if (back !== r.pot) bad++
  }
  eq('splits that break conservation', bad, 0)
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
