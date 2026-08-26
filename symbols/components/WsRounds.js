// Rounds: every round from the source, sortable, newest first by default.
// Conservation ✓/✗ is the source's verdict, not ours.
export const WsRounds = {
  extends: 'WsPanel',
  state: { sortKey: 'settledAt', sortDir: -1 },
  gap: 'Y',
  display: (el, s) => ((s.root.ws || {}).view === 'rounds' ? 'flex' : 'none'),

  PanelHead: {
    PanelTitle: { text: '{{ wsRoundsTitle | polyglot }}' },
    RowCount: {
      tag: 'span',
      fontSize: 'Z',
      fontVariantNumeric: 'tabular-nums',
      theme: 'wsDim',
      text: (el, s) => String(((s.root.ws || {}).rounds || []).length)
    }
  },

  Table: {
    flow: 'y',
    align: 'stretch flex-start',
    overflowX: 'auto',
    role: 'table',
    display: (el, s) => (((s.root.ws || {}).rounds || []).length ? 'flex' : 'none'),

    Head: {
      display: 'grid',
      gridTemplateColumns: 'minmax(8em, 1.4fr) 3em 9em 4.5em 5em 5em 4.5em 5em 4.5em 4.5em 8em 5.5em',
      alignItems: 'center',
      gap: 'Y',
      fontSize: 'Z',
      borderBottom: '1px solid white.14',
      role: 'row',
      childrenAs: 'state',
      children: [
        { key: 'gameTitle', labelKey: 'wsColGame' },
        { key: 'roundIndex', labelKey: 'wsColIndex' },
        { key: 'result', labelKey: 'wsColResult' },
        { key: 'players', labelKey: 'wsColPlayers', align: 'end' },
        { key: 'pot', labelKey: 'wsColPot', align: 'end' },
        { key: 'prize', labelKey: 'wsColPrize', align: 'end' },
        { key: 'winners', labelKey: 'wsColWinners', align: 'end' },
        { key: 'payout', labelKey: 'wsColPayout', align: 'end' },
        { key: 'multiplier', labelKey: 'wsColMultiplier', align: 'end' },
        { key: 'house', labelKey: 'wsColHouse', align: 'end' },
        { key: 'settledAt', labelKey: 'wsColSettled' },
        { key: 'conservationOk', labelKey: 'wsColConserved' }
      ],
      childExtends: 'WsSortTh'
    },

    Rows: {
      flow: 'y',
      align: 'stretch flex-start',
      childrenAs: 'state',
      children: (el, s) => {
        const rows = ((s.root.ws || {}).rounds || []).slice()
        const key = s.sortKey
        const dir = s.sortDir || -1
        rows.sort((a, b) => {
          let x = a[key]
          let y = b[key]
          if (key === 'settledAt') {
            x = x ? new Date(x).getTime() : 0
            y = y ? new Date(y).getTime() : 0
          }
          if (x == null && y == null) return 0
          if (x == null) return 1
          if (y == null) return -1
          if (typeof x === 'string' || typeof y === 'string') return String(x).localeCompare(String(y)) * dir
          return (Number(x) - Number(y)) * dir
        })
        return rows
      },
      childExtends: 'WsRoundRow'
    }
  },

  WsEmpty: {
    display: (el, s) => (((s.root.ws || {}).rounds || []).length ? 'none' : 'flex'),
    EmptyText: { text: '{{ wsRoundsEmpty | polyglot }}' }
  }
}
