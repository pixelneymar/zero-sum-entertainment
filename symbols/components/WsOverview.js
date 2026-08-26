// Overview: KPI tiles, the conservation tile, three small charts.
export const WsOverview = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'B',
  display: (el, s) => (((s.ws || {}).view || 'overview') === 'overview' ? 'flex' : 'none'),

  KpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 'A',
    '@tabletS': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },

    WsConservationTile: { gridColumn: '1 / -1' },

    Tiles: {
      display: 'contents',
      childrenAs: 'state',
      children: (el, s) => {
        const o = (s.ws || {}).overview || {}
        const num = (v) => Math.round(Number(v) || 0).toLocaleString('en-US')
        const mult = (v) => (v == null ? '—' : `${(Number(v) || 0).toFixed(2)}×`)
        return [
          { labelKey: 'wsKpiRounds', value: num(o.rounds) },
          { labelKey: 'wsKpiBets', value: num(o.bets) },
          { labelKey: 'wsKpiStaked', value: num(o.staked), hint: s.chipsUnit },
          { labelKey: 'wsKpiPaidOut', value: num(o.paidOut), hint: s.chipsUnit },
          { labelKey: 'wsKpiHouse', value: num(o.houseTake), hint: s.chipsUnit },
          { labelKey: 'wsKpiPlayers', value: num(o.players) },
          { labelKey: 'wsKpiAvgMult', value: mult(o.avgMultiplier) },
          { labelKey: 'wsKpiBestMult', value: mult(o.bestMultiplier) }
        ]
      },
      childExtends: 'WsKpi'
    }
  },

  Charts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(18em, 1fr))',
    gap: 'A',
    childrenAs: 'state',
    children: [
      { seriesKey: 'potByRound', titleKey: 'wsChartPot', kind: 'bar', format: 'n' },
      { seriesKey: 'multiplierByRound', titleKey: 'wsChartMultiplier', kind: 'line', format: 'x' },
      { seriesKey: 'playersByRound', titleKey: 'wsChartPlayers', kind: 'bar', format: 'n' }
    ],
    childExtends: 'WsChartCard'
  }
}
