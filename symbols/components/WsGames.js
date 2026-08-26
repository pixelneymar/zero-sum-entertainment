// Games: one config card per game.
export const WsGames = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'A',
  display: (el, s) => ((s.ws || {}).view === 'games' ? 'flex' : 'none'),

  GamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(24em, 1fr))',
    gap: 'A',
    childrenAs: 'state',
    children: (el, s) => (s.ws || {}).games || [],
    childExtends: 'WsGameCard'
  },

  WsEmpty: {
    display: (el, s) => (((s.ws || {}).games || []).length ? 'none' : 'flex'),
    EmptyText: { text: '{{ wsGamesEmpty | polyglot }}' }
  }
}
