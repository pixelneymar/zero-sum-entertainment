// Players: leaderboard by net, house row marked.
export const WsPlayers = {
  extends: 'WsPanel',
  gap: 'Y',
  display: (el, s) => ((s.ws || {}).view === 'players' ? 'flex' : 'none'),

  PanelHead: {
    PanelTitle: { text: '{{ wsPlayersTitle | polyglot }}' },
    RowCount: {
      tag: 'span',
      fontSize: 'Z',
      fontVariantNumeric: 'tabular-nums',
      theme: 'wsDim',
      text: (el, s) => String(((s.ws || {}).players || []).length)
    }
  },

  Table: {
    flow: 'y',
    align: 'stretch flex-start',
    overflowX: 'auto',
    role: 'table',
    display: (el, s) => (((s.ws || {}).players || []).length ? 'flex' : 'none'),

    Head: {
      display: 'grid',
      gridTemplateColumns: '3em 14em 7em 4em 4em 7em 7em 7em',
      alignItems: 'center',
      gap: 'Y',
      padding: 'Y 0',
      borderBottom: '1px solid white.14',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'wsMuted',
      role: 'row',
      ThRank: { tag: 'span', fontSize: 'Y', padding: '0 Z', text: '{{ wsColIndex | polyglot }}' },
      ThName: { tag: 'span', fontSize: 'Y', text: '{{ wsColPlayer | polyglot }}' },
      ThBalance: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColBalance | polyglot }}' },
      ThBets: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColBets | polyglot }}' },
      ThWins: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColWins | polyglot }}' },
      ThStaked: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColStaked | polyglot }}' },
      ThPaidOut: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColPaidOut | polyglot }}' },
      ThNet: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColNet | polyglot }}' }
    },

    Rows: {
      flow: 'y',
      align: 'stretch flex-start',
      childrenAs: 'state',
      children: (el, s) => {
        const rows = ((s.ws || {}).players || []).slice()
        rows.sort((a, b) => (Number(b.net) || 0) - (Number(a.net) || 0))
        return rows.map((p, i) => ({ ...p, rank: i + 1 }))
      },
      childExtends: 'WsPlayerRow'
    }
  },

  WsEmpty: {
    display: (el, s) => (((s.ws || {}).players || []).length ? 'none' : 'flex'),
    EmptyText: { text: '{{ wsPlayersEmpty | polyglot }}' }
  }
}
