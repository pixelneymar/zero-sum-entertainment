export const HistoryPanel = {
  flow: 'y',
  align: 'flex-start flex-start',
  gap: 'Y',
  padding: 'A',
  round: 'Z',
  theme: 'surface',
  border: '1px solid neutral.2',
  minWidth: '11em',
  display: (el, s) => (s.screen === 'playing' ? 'flex' : 'none'),

  HistoryHead: {
    tag: 'button',
    flow: 'x',
    align: 'center space-between',
    gap: 'A',
    width: '100%',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
    onClick: (e, el, s) => {
      const open = s.historyOpen !== false
      s.update({ historyOpen: !open })
    },

    HistoryTitle: {
      tag: 'span',
      text: '{{ historyTitle | polyglot }}',
      fontSize: 'Z',
      fontWeight: '600',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'muted'
    },

    HistoryChevron: {
      tag: 'span',
      text: (el, s) => (s.historyOpen !== false ? '▾' : '▸'),
      fontSize: 'Z',
      theme: 'muted'
    }
  },

  HistoryList: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: '0',
    width: '100%',
    fontVariantNumeric: 'tabular-nums',
    display: (el, s) => (s.historyOpen !== false ? 'flex' : 'none'),

    childrenAs: 'state',
    children: (el, s) =>
      (s.history || [])
        .slice()
        .sort((a, b) => b.roundIndex - a.roundIndex)
        .slice(0, 8),

    childExtends: 'HistoryRow'
  },

  HistoryEmpty: {
    tag: 'span',
    text: '{{ historyEmpty | polyglot }}',
    fontSize: 'Z',
    theme: 'muted',
    display: (el, s) =>
      s.historyOpen !== false && !(s.history && s.history.length)
        ? 'inline'
        : 'none'
  }
}
