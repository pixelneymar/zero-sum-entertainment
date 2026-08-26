export const CrowdCounter = {
  flow: 'y',
  align: 'flex-start flex-start',
  gap: 'A',
  padding: 'A',
  round: 'Z',
  theme: 'surface',
  border: '1px solid neutral.2',
  minWidth: '11em',
  fontVariantNumeric: 'tabular-nums',
  display: (el, s) => (s.screen === 'playing' ? 'flex' : 'none'),

  CrowdHead: {
    flow: 'x',
    align: 'center space-between',
    gap: 'A',
    width: '100%',

    CrowdTitle: {
      tag: 'span',
      text: '{{ crowdTitle | polyglot }}',
      fontSize: 'Z',
      fontWeight: '600',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'muted'
    },

    LiveBadge: {
      flow: 'x',
      align: 'center center',
      gap: 'X',
      display: (el, s) =>
        s.phase === 'preview' || s.phase === 'betting' ? 'flex' : 'none',

      LiveDot: { tag: 'span', text: '●', fontSize: 'Z', color: 'ember' },
      LiveWord: {
        tag: 'span',
        text: '{{ liveBadge | polyglot }}',
        fontSize: 'Z',
        fontWeight: '700',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        color: 'ember'
      }
    },

    LockBadge: {
      tag: 'span',
      text: '{{ lockedBadge | polyglot }}',
      theme: 'locked',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      padding: 'X Y',
      round: 'Y',
      display: (el, s) =>
        s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results'
          ? 'inline-block'
          : 'none'
    }
  },

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
      theme: 'muted'
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
      fontSize: 'D',
      lineHeight: 'D',
      fontWeight: '800',
      letterSpacing: '-X'
    }
  },

  PotStat: {
    flow: 'y',
    align: 'flex-start flex-start',
    gap: 'X',

    PotLabel: {
      tag: 'span',
      text: '{{ potLabel | polyglot }}',
      fontSize: 'Z',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      theme: 'muted'
    },

    PotRow: {
      flow: 'x',
      align: 'baseline flex-start',
      gap: 'Y',

      PotValue: {
        tag: 'span',
        text: (el, s) => {
          const frozen =
            s.frozen &&
            (s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results')
          const value = frozen ? s.frozen.pot : s.pot
          return (value ?? 0).toLocaleString('en-US')
        },
        fontSize: 'D',
        lineHeight: 'D',
        fontWeight: '800',
        letterSpacing: '-X',
        color: 'gold'
      },

      PotUnit: {
        tag: 'span',
        text: '{{ chipsUnit | polyglot }}',
        fontSize: 'Z',
        theme: 'muted'
      }
    }
  },

  FrozenNote: {
    tag: 'span',
    text: '{{ lockedNote | polyglot }}',
    fontSize: 'Z',
    theme: 'muted',
    display: (el, s) =>
      s.phase === 'locked' || s.phase === 'reveal' || s.phase === 'results'
        ? 'inline'
        : 'none'
  }
}
