export const ResultsCard = {
  flow: 'y',
  align: 'center center',
  gap: 'A',
  padding: 'B C',
  round: 'Z',
  theme: 'surface',
  textAlign: 'center',
  transition: 'A defaultBezier',
  transitionProperty: 'border-color',
  border: '1px solid neutral.2',
  borderColor: (el, s) =>
    s.settlement && s.settlement.iWon ? 'mint' : 'neutral.2',
  display: (el, s) =>
    s.screen === 'playing' && s.phase === 'results' && s.result
      ? 'flex'
      : 'none',

  ResultKicker: {
    tag: 'span',
    text: '{{ resultKicker | polyglot }}',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'Y',
    textTransform: 'uppercase',
    theme: 'muted'
  },

  ResultValue: {
    flow: 'x',
    align: 'baseline center',
    gap: 'Y',
    fontVariantNumeric: 'tabular-nums',

    ValueNumber: {
      tag: 'span',
      text: (el, s) => {
        if (!s.result) return ''
        const value = s.result.value
        return value > 0 ? `+${value}` : String(value)
      },
      fontSize: 'F',
      lineHeight: 'E',
      fontWeight: '800',
      letterSpacing: '-Y'
    },

    ValueUnit: {
      tag: 'span',
      text: (el, s) => (s.result ? s.result.unit : ''),
      fontSize: 'C',
      theme: 'muted'
    }
  },

  WinnerLine: {
    flow: 'x',
    align: 'baseline center',
    gap: 'Y',
    fontSize: 'A2',

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

    WinnerDash: { tag: 'span', text: '—', theme: 'muted' },

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
    theme: 'success',
    round: 'Y',
    padding: 'Y A',
    display: (el, s) =>
      s.settlement && s.settlement.iWon ? 'flex' : 'none',

    WinLabel: {
      tag: 'span',
      text: '{{ youWon | polyglot }}',
      fontSize: 'A',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase'
    },

    WinAmount: {
      tag: 'span',
      text: (el, s) =>
        s.settlement ? `+${(s.settlement.myPayout ?? 0).toLocaleString('en-US')}` : '',
      fontSize: 'B',
      fontWeight: '800',
      fontVariantNumeric: 'tabular-nums'
    },

    WinUnit: {
      tag: 'span',
      text: '{{ chipsUnit | polyglot }}',
      fontSize: 'Z'
    }
  },

  LossNote: {
    tag: 'span',
    text: '{{ notThisTime | polyglot }}',
    fontSize: 'A',
    theme: 'muted',
    display: (el, s) =>
      s.myBet && s.settlement && !s.settlement.iWon ? 'inline' : 'none'
  },

  MetaRow: {
    flow: 'x',
    align: 'baseline center',
    gap: 'A',
    flexWrap: 'wrap',
    fontSize: 'Z',
    fontVariantNumeric: 'tabular-nums',

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
      MetaLabel: { tag: 'span', text: '{{ playersMeta | polyglot }}', theme: 'muted' }
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
      MetaLabel: { tag: 'span', text: '{{ potMeta | polyglot }}', theme: 'muted' }
    },

    RakeMeta: {
      flow: 'x',
      align: 'baseline flex-start',
      gap: 'X',
      MetaValue: { tag: 'span', text: '5%', fontWeight: '700' },
      MetaLabel: { tag: 'span', text: '{{ rakeMeta | polyglot }}', theme: 'muted' }
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
      MetaLabel: { tag: 'span', text: '{{ multiplierMeta | polyglot }}', theme: 'muted' }
    }
  }
}
