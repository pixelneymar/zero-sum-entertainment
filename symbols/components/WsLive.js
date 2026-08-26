// Live: every active game's current round, one card each. The data layer
// ticks state.ws.live once a second; this only renders it.
export const WsLive = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'A',
  display: (el, s) => ((s.ws || {}).view === 'live' ? 'flex' : 'none'),

  LiveGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(22em, 1fr))',
    gap: 'A',
    childrenAs: 'state',
    children: (el, s) => (s.ws || {}).live || [],
    childExtends: 'WsLiveCard'
  },

  WsEmpty: {
    display: (el, s) => (((s.ws || {}).live || []).length ? 'none' : 'flex'),
    EmptyText: { text: '{{ wsLiveEmpty | polyglot }}' }
  }
}
