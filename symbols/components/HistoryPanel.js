// Last results for THIS game, newest first (the session history holds every
// game). Collapsible widget; the open flag is this panel's own UI state,
// never the app's.
export const HistoryPanel = {
  extends: 'CkStageGlass',
  tag: 'section',
  attr: { 'aria-label': 'Last results' },
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'spacing2',
  padding: 'spacing2 spacing6 spacing6',
  width: 'rail',
  display: (el, s) => (s.root.screen === 'playing' && s.root.phase !== 'ended' ? 'flex' : 'none'),

  state: { open: true },

  // 44px-tall disclosure control with aria-expanded.
  HistoryHead: {
    tag: 'button',
    attr: { type: 'button', 'aria-expanded': (el, s) => (s.open ? 'true' : 'false') },
    flow: 'x',
    align: 'center space-between',
    gap: 'spacing3',
    width: '100%',
    minHeight: 'touchMin',
    background: 'transparent',
    color: 'heading',
    border: 'none',
    padding: '0 spacing2',
    round: 'radiusDefault',
    fontFamily: 'sans',
    cursor: 'pointer',
    transition: 'background-color .15s ease',
    '@reducedMotion': { transition: 'none' },
    ':hover': { background: 'neutralSecondaryMedium' },
    ':focus-visible': { outline: 'spacing0_5 solid paper', outlineOffset: 'spacing0_5' },
    onClick: (e, el, s) => s.toggle('open'),

    // Button label: 16px medium, heading colour (fundamentals floor).
    HistoryTitle: {
      tag: 'span',
      fontFamily: 'sans',
      fontSize: 'fontMd',
      lineHeight: '1.3',
      fontWeight: '500',
      color: 'heading',
      text: '{{ historyTitle | polyglot }}'
    },
    HistoryChevron: {
      extends: 'Icon',
      name: 'chevronDown',
      boxSize: 'icon16',
      attr: { 'aria-hidden': 'true' },
      transition: 'transform .15s ease',
      '@reducedMotion': { transition: 'none' },
      transform: (el, s) => (s.open ? 'rotate(0deg)' : 'rotate(-90deg)')
    }
  },

  HistoryList: {
    tag: 'ul',
    flow: 'y',
    align: 'stretch flex-start',
    gap: '0',
    margin: '0',
    padding: '0',
    listStyle: 'none',
    display: (el, s) => (s.open ? 'flex' : 'none'),
    childrenAs: 'state',
    children: (el, s) =>
      (s.root.history || [])
        .filter((h) => !s.root.game || h.gameSlug === s.root.game.slug)
        .sort((a, b) => b.roundIndex - a.roundIndex)
        .slice(0, 8),
    childExtends: 'HistoryRow'
  },

  HistoryEmpty: {
    tag: 'span',
    fontSize: 'fontSm',
    lineHeight: '1.6',
    color: 'bodySubtle',
    text: '{{ historyEmpty | polyglot }}',
    display: (el, s) => (s.open && !(s.root.history && s.root.history.length) ? 'inline' : 'none')
  }
}
