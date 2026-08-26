// Bets table shared by the round detail and the Bets view. Rows come from
// `rowsKey` on the child state: 'bets' → ws.bets, 'detail' → ws.roundDetail.bets.
export const WsBetsTable = {
  flow: 'y',
  align: 'stretch flex-start',
  overflowX: 'auto',
  role: 'table',

  Head: {
    display: 'grid',
    gridTemplateColumns: '14em 11em 6em 4em 6em 8em',
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

    ThPlayer: { tag: 'span', fontSize: 'Y', padding: '0 Z', text: '{{ wsColPlayer | polyglot }}' },
    ThGuess: { tag: 'span', fontSize: 'Y', text: '{{ wsColGuess | polyglot }}' },
    ThDistance: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColDistance | polyglot }}' },
    ThWon: { tag: 'span', fontSize: 'Y', textAlign: 'center', text: '{{ wsColWon | polyglot }}' },
    ThPayout: { tag: 'span', fontSize: 'Y', textAlign: 'right', text: '{{ wsColPayout | polyglot }}' },
    ThPlaced: { tag: 'span', fontSize: 'Y', text: '{{ wsColPlaced | polyglot }}' }
  },

  Rows: {
    flow: 'y',
    align: 'stretch flex-start',
    childrenAs: 'state',
    children: (el, s) => {
      const ws = s.root.ws || {}
      if (s.rowsKey === 'detail') return (ws.roundDetail && ws.roundDetail.bets) || []
      return ws.bets || []
    },
    childExtends: 'WsBetRow'
  }
}
