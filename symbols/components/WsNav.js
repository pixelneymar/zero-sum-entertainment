// Left rail of the console: brand, the eight views, and the way back.
export const WsNav = {
  tag: 'nav',
  position: 'sticky',
  top: '0',
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'Y',
  width: 'wsRail',
  height: '100vh',
  padding: 'B A',
  theme: 'wsRail',
  borderRight: '1px solid white.10',

  NavBrand: {
    flow: 'y',
    align: 'flex-start flex-start',
    gap: 'X',
    padding: '0 Z B',

    BrandKicker: {
      tag: 'span',
      text: '{{ brandName | polyglot }}',
      fontSize: 'Y',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      color: 'gold'
    },
    BrandTitle: {
      tag: 'span',
      text: '{{ wsBrand | polyglot }}',
      fontSize: 'B',
      fontWeight: '800',
      letterSpacing: '-X'
    },
    BrandSub: {
      tag: 'span',
      text: '{{ wsBrandSub | polyglot }}',
      fontSize: 'Z',
      theme: 'wsMuted'
    }
  },

  NavList: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'X',
    childrenAs: 'state',
    children: [
      { view: 'overview', labelKey: 'wsNavOverview' },
      { view: 'live', labelKey: 'wsNavLive' },
      { view: 'rounds', labelKey: 'wsNavRounds' },
      { view: 'bets', labelKey: 'wsNavBets' },
      { view: 'players', labelKey: 'wsNavPlayers' },
      { view: 'ledger', labelKey: 'wsNavLedger' },
      { view: 'games', labelKey: 'wsNavGames' },
      { view: 'integrity', labelKey: 'wsNavIntegrity' }
    ],
    childExtends: 'WsNavItem'
  },

  NavFoot: {
    marginTop: 'auto',
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'Y',

    WsSourceBadge: {},

    WsButton: {
      justifyContent: 'flex-start',
      onClick: (e, el) => el.call('wsBackToGame'),
      BackLabel: { tag: 'span', text: '{{ wsBackToGame | polyglot }}' }
    }
  }
}
