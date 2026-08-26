// Last results for this game, newest first. Collapsible; the open flag is
// this panel's own UI state, never the app's.
export const HistoryPanel = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'Y',
  padding: 'A',
  width: 'rail',
  round: 'B',
  theme: 'glass',
  border: '1px solid white.12',
  shadow: 'glass',
  backdropFilter: 'blur(1.1rem)',
  display: (el, s) =>
    s.root.screen === 'playing' && s.root.phase !== 'intro' && s.root.phase !== 'ended'
      ? 'flex'
      : 'none',

  state: { open: true },

  HistoryHead: {
    tag: 'button',
    flow: 'x',
    align: 'center space-between',
    gap: 'A',
    width: '100%',
    background: 'transparent',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
    onClick: (e, el, s) => s.toggle('open'),

    HistoryTitle: {
      tag: 'span',
      text: '{{ historyTitle | polyglot }}',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'onVideoMuted'
    },

    HistoryChevron: {
      tag: 'span',
      text: '▾',
      fontSize: 'Z',
      theme: 'onVideoMuted',
      transition: 'A defaultBezier',
      transitionProperty: 'transform',
      transform: (el, s) => (s.open ? 'rotate(0deg)' : 'rotate(-90deg)')
    }
  },

  HistoryList: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: '0',
    display: (el, s) => (s.open ? 'flex' : 'none'),

    childrenAs: 'state',
    children: (el, s) =>
      (s.root.history || [])
        .slice()
        .sort((a, b) => b.roundIndex - a.roundIndex)
        .slice(0, 8),
    childExtends: 'HistoryRow'
  },

  HistoryEmpty: {
    tag: 'span',
    text: '{{ historyEmpty | polyglot }}',
    fontSize: 'Z',
    theme: 'onVideoMuted',
    display: (el, s) =>
      s.open && !(s.root.history && s.root.history.length) ? 'inline' : 'none'
  }
}
