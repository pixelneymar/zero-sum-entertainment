// Bets: filter row + table. Sealed rows stay sealed here too.
export const WsBets = {
  extends: 'WsPanel',
  gap: 'A',
  display: (el, s) => ((s.ws || {}).view === 'bets' ? 'flex' : 'none'),

  PanelHead: {
    PanelTitle: { text: '{{ wsBetsTitle | polyglot }}' },
    RowCount: {
      tag: 'span',
      fontSize: 'Z',
      fontVariantNumeric: 'tabular-nums',
      theme: 'wsDim',
      text: (el, s) => String(((s.ws || {}).bets || []).length)
    }
  },

  WsBetsFilter: {},

  WsBetsTable: {
    state: { rowsKey: 'bets' },
    display: (el, s) => (((s.root.ws || {}).bets || []).length ? 'flex' : 'none')
  },

  WsEmpty: {
    display: (el, s) => (((s.ws || {}).bets || []).length ? 'none' : 'flex'),
    EmptyText: { text: '{{ wsBetsEmpty | polyglot }}' }
  }
}
