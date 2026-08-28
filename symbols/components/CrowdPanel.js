// Live crowd widget: player count and pot while bets are open, an arrivals
// ticker, and a hard freeze at LOCK: from then on it renders state.frozen and
// nothing else, which is the product's one promise.
const frozenPhase = (s) => s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results'

export const CrowdPanel = {
  extends: 'CkCard',
  tag: 'section',
  attr: { 'aria-label': 'The crowd' },
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'spacing4',
  padding: 'spacing5',
  width: 'rail',
  fontVariantNumeric: 'tabular-nums',
  display: (el, s) => (s.screen === 'playing' && s.phase !== 'ended' ? 'flex' : 'none'),

  CrowdHead: {
    flow: 'x',
    align: 'center space-between',
    gap: 'spacing3',

    CrowdTitle: { extends: 'CkEyebrow', text: '{{ crowdTitle | polyglot }}' },

    LiveBadge: {
      extends: 'CkBadge',
      theme: 'badgeBrand',
      gap: 'spacing1_5',
      attr: { role: 'status' },
      display: (el, s) => (s.phase === 'preview' || s.phase === 'betting' ? 'inline-flex' : 'none'),

      LiveDot: {
        tag: 'span',
        width: 'dot',
        height: 'dot',
        round: 'radiusFull',
        background: 'fgBrandStrong',
        animation: 'livePulse 1.4s ease-in-out infinite',
        '@reducedMotion': { animation: 'none' },
        attr: { 'aria-hidden': 'true' }
      },
      LiveWord: { tag: 'span', text: '{{ liveBadge | polyglot }}' }
    },

    LockBadge: {
      extends: 'CkBadgeBordered',
      theme: 'badgeAlt',
      gap: 'spacing1',
      attr: { role: 'status' },
      display: (el, s) => (frozenPhase(s) ? 'inline-flex' : 'none'),
      Icon: { name: 'lock', boxSize: 'icon14', attr: { 'aria-hidden': 'true' } },
      LockWord: { tag: 'span', text: '{{ lockedBadge | polyglot }}' }
    }
  },

  Stats: {
    flow: 'x',
    align: 'flex-end space-between',
    gap: 'spacing4',

    PlayersStat: {
      flow: 'y',
      align: 'flex-start flex-start',
      gap: 'spacing1',
      PlayersLabel: { extends: 'CkEyebrow', text: '{{ playersLabel | polyglot }}' },
      PlayersValue: {
        tag: 'span',
        fontFamily: 'mono',
        fontSize: 'font3xl',
        lineHeight: '1',
        fontWeight: '700',
        color: 'heading',
        text: (el, s) => {
          const value = s.frozen && frozenPhase(s) ? s.frozen.playerCount : s.playerCount
          return (value ?? 0).toLocaleString('en-US')
        }
      }
    },

    PotStat: {
      flow: 'y',
      align: 'flex-end flex-start',
      gap: 'spacing1',
      textAlign: 'right',
      PotLabel: { extends: 'CkEyebrow', text: '{{ potLabel | polyglot }}' },
      PotRow: {
        flow: 'x',
        align: 'baseline flex-end',
        gap: 'spacing1',
        PotValue: {
          tag: 'span',
          fontFamily: 'mono',
          fontSize: 'font3xl',
          lineHeight: '1',
          fontWeight: '700',
          color: 'heading',
          text: (el, s) => {
            const value = s.frozen && frozenPhase(s) ? s.frozen.pot : s.pot
            return (value ?? 0).toLocaleString('en-US')
          }
        },
        PotUnit: { tag: 'span', fontSize: 'fontSm', lineHeight: '1.3', color: 'bodySubtle', text: '{{ chipsUnit | polyglot }}' }
      }
    }
  },

  Ticker: {
    tag: 'ul',
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'spacing1',
    minHeight: 'spacing20',
    margin: '0',
    padding: 'spacing3 0 0',
    listStyle: 'none',
    borderTopWidth: 'spacing0_5',
    borderTopStyle: 'solid',
    borderTopColor: 'borderDefault',
    attr: { 'aria-label': 'Arrivals' },
    display: (el, s) => (s.phase === 'preview' || s.phase === 'betting' ? 'flex' : 'none'),
    childrenAs: 'state',
    children: (el, s) => (s.arrivals || []).slice(-4).reverse(),
    childExtends: 'ArrivalRow'
  },

  FrozenNote: {
    flow: 'x',
    align: 'flex-start flex-start',
    gap: 'spacing2',
    minHeight: 'spacing20',
    padding: 'spacing3 0 0',
    borderTopWidth: 'spacing0_5',
    borderTopStyle: 'solid',
    borderTopColor: 'borderDefault',
    fontSize: 'fontSm',
    lineHeight: '1.5',
    color: 'body',
    display: (el, s) => (frozenPhase(s) ? 'flex' : 'none'),
    Icon: { name: 'lock', boxSize: 'icon16', flexShrink: '0', attr: { 'aria-hidden': 'true' } },
    FrozenText: { tag: 'span', text: '{{ lockedNote | polyglot }}' }
  }
}
