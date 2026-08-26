// Top bar: view title, source, last refresh, and the global actions.
export const WsTopBar = {
  tag: 'header',
  position: 'sticky',
  top: '0',
  zIndex: '2',
  flow: 'x',
  align: 'center space-between',
  gap: 'A',
  flexWrap: 'wrap',
  padding: 'A B',
  theme: 'wsShell',
  borderBottom: '1px solid white.10',

  TitleGroup: {
    flow: 'x',
    align: 'baseline flex-start',
    gap: 'A',
    flexWrap: 'wrap',

    ViewTitle: {
      tag: 'h1',
      fontSize: 'C',
      lineHeight: 'C',
      fontWeight: '800',
      letterSpacing: '-Y',
      margin: '0',
      text: (el, s) => {
        const keys = {
          overview: 'wsNavOverview',
          live: 'wsNavLive',
          rounds: 'wsNavRounds',
          round: 'wsNavRound',
          bets: 'wsNavBets',
          players: 'wsNavPlayers',
          ledger: 'wsNavLedger',
          games: 'wsNavGames',
          integrity: 'wsNavIntegrity'
        }
        const view = (s.ws || {}).view || 'overview'
        return s[keys[view] || 'wsNavOverview'] || ''
      }
    },

    WsSourceBadge: {},

    RefreshMeta: {
      flow: 'x',
      align: 'baseline flex-start',
      gap: 'X',
      fontSize: 'Z',
      fontVariantNumeric: 'tabular-nums',
      theme: 'wsMuted',

      RefreshLabel: { tag: 'span', text: '{{ wsLastRefresh | polyglot }}' },
      RefreshTime: {
        tag: 'span',
        fontWeight: '700',
        text: (el, s) => {
          const at = (s.ws || {}).lastRefresh
          if (!at) return s.wsNeverRefreshed || ''
          return new Date(at).toLocaleTimeString('en-US', { hour12: false })
        }
      },
      LoadingWord: {
        tag: 'span',
        text: '{{ wsLoading | polyglot }}',
        color: 'gold',
        display: (el, s) => ((s.ws || {}).loading ? 'inline' : 'none')
      }
    }
  },

  Actions: {
    flow: 'x',
    align: 'center flex-end',
    gap: 'Y',
    flexWrap: 'wrap',

    WsConfirmButton: {
      state: { armed: false, fn: 'wsResetDemo', argPath: null },
      display: (el, s) => ((s.root.ws || {}).source === 'demo' ? 'inline-flex' : 'none'),
      IdleLabel: { text: '{{ wsResetDemo | polyglot }}' }
    },

    WsButton: {
      onClick: (e, el, s) => el.call('wsExportCsv', (s.ws || {}).view || 'overview'),
      Icon: { name: 'download', boxSize: 'A', color: 'white' },
      ExportLabel: { tag: 'span', text: '{{ wsExportCsv | polyglot }}' }
    },

    WsButton_1: {
      onClick: (e, el) => el.call('wsRefresh'),
      Icon: { name: 'refresh', boxSize: 'A', color: 'white' },
      RefreshLabel: { tag: 'span', text: '{{ wsRefresh | polyglot }}' }
    },

    WsButton_2: {
      background: 'white',
      color: 'black',
      onClick: (e, el) => el.call('wsBackToGame'),
      BackLabel: { tag: 'span', text: '{{ wsBackToGame | polyglot }}' }
    }
  }
}
