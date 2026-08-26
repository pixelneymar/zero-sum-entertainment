// The results moment. The scale readings echo what the viewer just watched,
// the result numeral pops, the crowd's distribution shows where everyone
// stood, and a win lights the card gold. All numbers come from the server's
// settlement — this card decides nothing.
export const ResultsCard = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'A',
  padding: 'B C',
  width: 'card',
  maxWidth: '94vw',
  round: 'B',
  theme: 'glass',
  border: '1px solid white.12',
  shadow: 'glass',
  backdropFilter: 'blur(1.1rem)',
  textAlign: 'center',
  animation: 'riseIn .5s ease-out both',
  transition: 'B defaultBezier',
  transitionProperty: 'border-color, box-shadow',
  borderColor: (el, s) => (s.settlement && s.settlement.iWon ? 'gold' : 'white.12'),
  boxShadow: (el, s) => (s.settlement && s.settlement.iWon ? 'win' : 'glass'),
  background: (el, s) => (s.settlement && s.settlement.iWon ? 'winWash' : 'steel.62'),
  display: (el, s) =>
    s.screen === 'playing' && s.phase === 'results' && s.result ? 'flex' : 'none',

  ResultKicker: {
    tag: 'span',
    text: '{{ resultKicker | polyglot }}',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'Y',
    textTransform: 'uppercase',
    theme: 'onVideoMuted'
  },

  Readings: {
    flow: 'x',
    align: 'baseline center',
    gap: 'Y',
    flexWrap: 'wrap',
    fontSize: 'A',
    fontVariantNumeric: 'tabular-nums',
    display: (el, s) =>
      s.result && s.result.readings && s.result.readings.length ? 'flex' : 'none',

    ReadingsLead: {
      tag: 'span',
      text: '{{ scaleSaid | polyglot }}',
      theme: 'onVideoMuted'
    },
    ReadingsValues: {
      tag: 'span',
      text: (el, s) => (s.result && s.result.readings ? s.result.readings.join(' / ') : ''),
      fontWeight: '800',
      letterSpacing: '-X'
    },
    ReadingsArrow: { tag: 'span', text: '→', theme: 'onVideoMuted' }
  },

  ResultValue: {
    flow: 'x',
    align: 'baseline center',
    gap: 'Y',
    fontVariantNumeric: 'tabular-nums',
    animation: 'popIn .6s cubic-bezier(.2, .9, .3, 1.2) both',

    ValueNumber: {
      tag: 'span',
      text: (el, s) => {
        if (!s.result) return ''
        const value = s.result.value
        return value > 0 ? `+${value}` : String(value)
      },
      fontSize: 'I',
      lineHeight: 'H',
      fontWeight: '900',
      letterSpacing: '-Y',
      color: (el, s) => (s.settlement && s.settlement.iWon ? 'gold' : 'white')
    },

    ValueUnit: {
      tag: 'span',
      text: (el, s) => (s.result ? s.result.unit : ''),
      fontSize: 'D',
      theme: 'onVideoMuted'
    }
  },

  ResultHistogram: {},

  WinnerLine: {
    flow: 'x',
    align: 'baseline center',
    gap: 'Y',
    flexWrap: 'wrap',
    fontSize: 'A2',
    display: (el, s) => (s.settlement ? 'flex' : 'none'),

    WinnerCount: {
      tag: 'span',
      text: (el, s) => (s.settlement ? String(s.settlement.winnerCount) : ''),
      fontWeight: '800'
    },
    WinnerWordOne: {
      tag: 'span',
      text: '{{ winnerOne | polyglot }}',
      display: (el, s) =>
        s.settlement && s.settlement.winnerCount === 1 ? 'inline' : 'none'
    },
    WinnerWordMany: {
      tag: 'span',
      text: '{{ winnerMany | polyglot }}',
      display: (el, s) =>
        s.settlement && s.settlement.winnerCount !== 1 ? 'inline' : 'none'
    },
    WinnerDash: { tag: 'span', text: '—', theme: 'onVideoMuted' },
    MultiplierText: {
      tag: 'span',
      text: (el, s) =>
        s.settlement ? `×${Number(s.settlement.multiplier).toFixed(2)}` : '',
      fontWeight: '800',
      color: 'gold'
    }
  },

  WinBanner: {
    flow: 'x',
    align: 'baseline center',
    gap: 'Y',
    alignSelf: 'center',
    theme: 'success',
    round: 'C',
    padding: 'Y B',
    animation: 'popIn .5s cubic-bezier(.2, .9, .3, 1.2) .25s both, winGlow 1.6s ease-out .4s infinite',
    display: (el, s) => (s.settlement && s.settlement.iWon ? 'flex' : 'none'),

    WinLabel: {
      tag: 'span',
      text: '{{ youWon | polyglot }}',
      fontSize: 'A',
      fontWeight: '800',
      letterSpacing: 'X',
      textTransform: 'uppercase'
    },
    WinAmount: {
      tag: 'span',
      text: (el, s) =>
        s.settlement ? `+${(s.settlement.myPayout ?? 0).toLocaleString('en-US')}` : '',
      fontSize: 'C',
      fontWeight: '900',
      fontVariantNumeric: 'tabular-nums'
    },
    WinUnit: { tag: 'span', text: '{{ chipsUnit | polyglot }}', fontSize: 'Z' }
  },

  LossNote: {
    tag: 'span',
    text: '{{ notThisTime | polyglot }}',
    fontSize: 'A',
    theme: 'onVideoMuted',
    display: (el, s) =>
      s.myBet && s.settlement && !s.settlement.iWon ? 'inline' : 'none'
  },

  NoBetNote: {
    tag: 'span',
    text: '{{ noBetNote | polyglot }}',
    fontSize: 'A',
    theme: 'onVideoMuted',
    display: (el, s) => (!s.myBet && s.settlement ? 'inline' : 'none')
  },

  MetaRow: {
    flow: 'x',
    align: 'baseline center',
    gap: 'A',
    flexWrap: 'wrap',
    fontSize: 'Z',
    fontVariantNumeric: 'tabular-nums',
    paddingTop: 'Y',
    borderTop: '1px solid white.10',

    PlayersMeta: {
      flow: 'x',
      align: 'baseline flex-start',
      gap: 'X',
      MetaValue: {
        tag: 'span',
        text: (el, s) =>
          ((s.frozen ? s.frozen.playerCount : s.playerCount) ?? 0).toLocaleString('en-US'),
        fontWeight: '700'
      },
      MetaLabel: { tag: 'span', text: '{{ playersMeta | polyglot }}', theme: 'onVideoMuted' }
    },
    PotMeta: {
      flow: 'x',
      align: 'baseline flex-start',
      gap: 'X',
      MetaValue: {
        tag: 'span',
        text: (el, s) =>
          ((s.frozen ? s.frozen.pot : s.pot) ?? 0).toLocaleString('en-US'),
        fontWeight: '700'
      },
      MetaLabel: { tag: 'span', text: '{{ potMeta | polyglot }}', theme: 'onVideoMuted' }
    },
    RakeMeta: {
      flow: 'x',
      align: 'baseline flex-start',
      gap: 'X',
      MetaValue: { tag: 'span', text: '5%', fontWeight: '700' },
      MetaLabel: { tag: 'span', text: '{{ rakeMeta | polyglot }}', theme: 'onVideoMuted' }
    },
    MultiplierMeta: {
      flow: 'x',
      align: 'baseline flex-start',
      gap: 'X',
      MetaValue: {
        tag: 'span',
        text: (el, s) =>
          s.settlement ? `×${Number(s.settlement.multiplier).toFixed(2)}` : '',
        fontWeight: '700'
      },
      MetaLabel: { tag: 'span', text: '{{ multiplierMeta | polyglot }}', theme: 'onVideoMuted' }
    }
  }
}
