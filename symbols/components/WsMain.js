// Right column: top bar, status strips, then exactly one view.
export const WsMain = {
  tag: 'main',
  flow: 'y',
  align: 'stretch flex-start',
  minWidth: '0',
  minHeight: '100vh',

  WsTopBar: {},
  WsLoadingBar: {},
  WsErrorBanner: {},

  Content: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'B',
    padding: 'B',
    minWidth: '0',

    WsOverview: {},
    WsLive: {},
    WsRounds: {},
    WsRoundDetail: {},
    WsBets: {},
    WsPlayers: {},
    WsLedger: {},
    WsGames: {},
    WsIntegrity: {}
  }
}
