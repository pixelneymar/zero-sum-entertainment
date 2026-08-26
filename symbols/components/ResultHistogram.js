// The crowd's guess distribution with the result (gold) and your guess
// (white) marked. Data is settlement.distribution — nothing is computed
// here beyond scaling bars to the tallest bucket.
export const ResultHistogram = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'Y',
  width: '100%',
  display: (el, s) =>
    s.settlement && s.settlement.distribution && s.settlement.distribution.length
      ? 'flex'
      : 'none',

  HistogramHead: {
    flow: 'x',
    align: 'baseline space-between',
    gap: 'A',
    fontSize: 'Z',

    HistogramTitle: {
      tag: 'span',
      text: '{{ histogramTitle | polyglot }}',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'onVideoMuted'
    },

    HistogramLegend: {
      flow: 'x',
      align: 'center flex-end',
      gap: 'Z',
      theme: 'onVideoMuted',

      LegendResult: {
        flow: 'x',
        align: 'center center',
        gap: 'X',
        LegendResultDot: { tag: 'span', width: 'Y', height: 'Y', round: 'X', background: 'gold' },
        LegendResultText: { tag: 'span', text: '{{ legendResult | polyglot }}' }
      },
      LegendMine: {
        flow: 'x',
        align: 'center center',
        gap: 'X',
        display: (el, s) => (s.myBet ? 'flex' : 'none'),
        LegendMineDot: { tag: 'span', width: 'Y', height: 'Y', round: 'X', background: 'white' },
        LegendMineText: { tag: 'span', text: '{{ legendMine | polyglot }}' }
      }
    }
  },

  Bars: {
    flow: 'x',
    align: 'flex-end stretch',
    gap: 'X',
    height: 'histogram',
    paddingBottom: 'A',
    borderBottom: '1px solid white.14',

    childrenAs: 'state',
    children: (el, s) => {
      const dist = (s.settlement && s.settlement.distribution) || []
      if (!dist.length) return []
      const sorted = dist.slice().sort((a, b) => a.guess - b.guess)
      const top = sorted.reduce((m, d) => Math.max(m, d.count), 0) || 1
      const result = s.result ? s.result.value : null
      const mine = s.myBet ? s.myBet.guess : null
      return sorted.map((d, i) => ({
        guess: d.guess,
        count: d.count,
        share: d.count / top,
        isResult: d.guess === result,
        isMine: d.guess === mine,
        isEdge: i === 0 || i === sorted.length - 1
      }))
    },
    childExtends: 'HistogramBar'
  }
}
