// Live crowd: player count and pot with a pulse while bets are open, an
// arrivals ticker, and a hard freeze at LOCK — from then on it renders
// state.frozen and nothing else, which is the product's one promise.
export const CrowdPanel = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'A',
  padding: 'A',
  width: 'rail',
  round: 'B',
  theme: 'glass',
  border: '1px solid white.12',
  shadow: 'glass',
  backdropFilter: 'blur(1.1rem)',
  fontVariantNumeric: 'tabular-nums',
  transition: 'B defaultBezier',
  transitionProperty: 'background, border-color, box-shadow',
  display: (el, s) =>
    s.screen === 'playing' && s.phase !== 'intro' && s.phase !== 'ended'
      ? 'flex'
      : 'none',
  background: (el, s) =>
    s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results'
      ? 'ink.86'
      : 'steel.62',
  borderColor: (el, s) =>
    s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results'
      ? 'white.32'
      : 'white.12',

  CrowdHead: {
    flow: 'x',
    align: 'center space-between',
    gap: 'A',

    CrowdTitle: {
      tag: 'span',
      text: '{{ crowdTitle | polyglot }}',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'onVideoMuted'
    },

    LiveBadge: {
      flow: 'x',
      align: 'center center',
      gap: 'Y',
      display: (el, s) =>
        s.phase === 'preview' || s.phase === 'betting' ? 'flex' : 'none',

      LiveDot: {
        tag: 'span',
        width: 'Y',
        height: 'Y',
        round: 'Y',
        background: 'ember',
        animation: 'livePulse 1.4s ease-in-out infinite'
      },
      LiveWord: {
        tag: 'span',
        text: '{{ liveBadge | polyglot }}',
        fontSize: 'Z',
        fontWeight: '800',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        color: 'ember'
      }
    },

    LockBadge: {
      flow: 'x',
      align: 'center center',
      gap: 'X',
      theme: 'locked',
      fontSize: 'Z',
      fontWeight: '800',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      padding: 'X Y',
      round: 'Y',
      display: (el, s) =>
        s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results'
          ? 'flex'
          : 'none',

      Icon: { name: 'lock', boxSize: 'Z', color: 'black' },
      LockWord: { tag: 'span', text: '{{ lockedBadge | polyglot }}' }
    }
  },

  Stats: {
    flow: 'x',
    align: 'flex-end space-between',
    gap: 'A',

    PlayersStat: {
      flow: 'y',
      align: 'flex-start flex-start',
      gap: 'X',

      PlayersLabel: {
        tag: 'span',
        text: '{{ playersLabel | polyglot }}',
        fontSize: 'Z',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        theme: 'onVideoMuted'
      },

      PlayersValue: {
        tag: 'span',
        text: (el, s) => {
          const frozen =
            s.frozen &&
            (s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results')
          const value = frozen ? s.frozen.playerCount : s.playerCount
          return (value ?? 0).toLocaleString('en-US')
        },
        fontSize: 'E',
        lineHeight: 'E',
        fontWeight: '800',
        letterSpacing: '-Y'
      }
    },

    PotStat: {
      flow: 'y',
      align: 'flex-end flex-start',
      gap: 'X',
      textAlign: 'right',

      PotLabel: {
        tag: 'span',
        text: '{{ potLabel | polyglot }}',
        fontSize: 'Z',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        theme: 'onVideoMuted'
      },

      PotRow: {
        flow: 'x',
        align: 'baseline flex-end',
        gap: 'X',

        PotValue: {
          tag: 'span',
          text: (el, s) => {
            const frozen =
              s.frozen &&
              (s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results')
            const value = frozen ? s.frozen.pot : s.pot
            return (value ?? 0).toLocaleString('en-US')
          },
          fontSize: 'E',
          lineHeight: 'E',
          fontWeight: '800',
          letterSpacing: '-Y',
          color: 'gold'
        },

        PotUnit: {
          tag: 'span',
          text: '{{ chipsUnit | polyglot }}',
          fontSize: 'Z',
          theme: 'onVideoMuted'
        }
      }
    }
  },

  Ticker: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'X',
    minHeight: 'C',
    borderTop: '1px solid white.10',
    paddingTop: 'Y',
    display: (el, s) =>
      s.phase === 'preview' || s.phase === 'betting' ? 'flex' : 'none',

    childrenAs: 'state',
    children: (el, s) => (s.arrivals || []).slice(-4).reverse(),
    childExtends: 'ArrivalRow'
  },

  FrozenNote: {
    flow: 'x',
    align: 'center flex-start',
    gap: 'Y',
    minHeight: 'C',
    borderTop: '1px solid white.10',
    paddingTop: 'Y',
    fontSize: 'Z',
    theme: 'onVideoMuted',
    display: (el, s) =>
      s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results'
        ? 'flex'
        : 'none',

    FrozenText: { tag: 'span', text: '{{ lockedNote | polyglot }}' }
  }
}
