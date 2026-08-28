// The results moment (TypeUI section 5). Three status panels, one shown at a
// time, each an expanded alert (alerts.md) whose intent IS the meaning:
//   WinCard   success: the chips you won are the headline; pops in, pulses.
//   LossCard  danger: the chips you lost are the headline; rises, shakes.
//   PlainCard neutral: no bet, or a voided duel. Just who won.
// Every number comes from the server's settlement; this card decides nothing.
// Intent colour is never the only cue: icon + label carry the meaning too.
export const ResultsCard = {
  flow: 'y',
  align: 'center center',
  attr: { role: 'status', 'aria-live': 'polite' },
  display: (el, s) => (s.screen === 'playing' && s.phase === 'results' && s.result ? 'flex' : 'none'),

  WinCard: {
    extends: 'CkResultCard',
    theme: 'badgeSuccess',
    animation: 'popIn .25s ease-out both',
    '@reducedMotion': { animation: 'none' },
    display: (el, s) => (s.settlement && s.settlement.iWon ? 'flex' : 'none'),

    WinHead: {
      flow: 'x',
      align: 'center center',
      gap: 'spacing2',
      Icon: { name: 'trophy', boxSize: 'icon20', attr: { 'aria-hidden': 'true' } },
      WinKicker: { extends: 'CkEyebrow', color: 'inherit', text: '{{ youWon | polyglot }}' }
    },

    WinAmount: {
      flow: 'x',
      align: 'baseline center',
      gap: 'spacing2',
      fontVariantNumeric: 'tabular-nums',
      animation: 'winPulse .6s ease-out .25s both',
      '@reducedMotion': { animation: 'none' },
      WinValue: {
        tag: 'span',
        fontFamily: 'mono',
        fontSize: 'font9xl',
        lineHeight: '1',
        fontWeight: '700',
        letterSpacing: '-0.0625rem',
        text: (el, s) => (s.settlement ? `+${(s.settlement.myPayout ?? 0).toLocaleString('en-US')}` : '')
      },
      WinUnit: { tag: 'span', fontSize: 'fontLg', lineHeight: '1.3', text: '{{ chipsUnit | polyglot }}' }
    },

    WinLine: {
      tag: 'span',
      fontSize: 'fontMd',
      lineHeight: '1.5',
      fontWeight: '500',
      text: (el, s) => {
        if (!s.settlement || !s.result || s.result.winner == null) return ''
        const c = s.game && s.game.challengers ? s.game.challengers[s.result.winner - 1] : null
        const name = c ? c.name : `Challenger ${s.result.winner}`
        return `${name} ${s.winsVerb || 'wins'} · ×${Number(s.settlement.multiplier).toFixed(2)}`
      }
    },

    WinScores: { extends: 'ResultScores' }
  },

  LossCard: {
    extends: 'CkResultCard',
    theme: 'badgeDanger',
    animation: 'riseIn .2s ease-out both',
    '@reducedMotion': { animation: 'none' },
    display: (el, s) => (s.myBet && s.settlement && !s.settlement.iWon && !s.settlement.voided ? 'flex' : 'none'),

    LossHead: {
      flow: 'x',
      align: 'center center',
      gap: 'spacing2',
      Icon: { name: 'x', boxSize: 'icon20', attr: { 'aria-hidden': 'true' } },
      LossKicker: { extends: 'CkEyebrow', color: 'inherit', text: '{{ youLost | polyglot }}' }
    },

    LossAmount: {
      flow: 'x',
      align: 'baseline center',
      gap: 'spacing2',
      fontVariantNumeric: 'tabular-nums',
      animation: 'shake .3s ease-out .2s both',
      '@reducedMotion': { animation: 'none' },
      LossValue: {
        tag: 'span',
        fontFamily: 'mono',
        fontSize: 'font9xl',
        lineHeight: '1',
        fontWeight: '700',
        letterSpacing: '-0.0625rem',
        text: (el, s) => (s.myBet ? `-${(s.myBet.stake ?? 0).toLocaleString('en-US')}` : '')
      },
      LossUnit: { tag: 'span', fontSize: 'fontLg', lineHeight: '1.3', text: '{{ chipsUnit | polyglot }}' }
    },

    LossLine: {
      tag: 'span',
      fontSize: 'fontMd',
      lineHeight: '1.5',
      fontWeight: '500',
      text: (el, s) => {
        if (!s.result || s.result.winner == null || !s.myBet || !s.settlement) return ''
        const names = (s.game && s.game.challengers) || []
        const w = names[s.result.winner - 1]
        const m = names[s.myBet.side - 1]
        const winner = w ? w.name : `Challenger ${s.result.winner}`
        const mine = m ? m.name : `Challenger ${s.myBet.side}`
        return `${winner} ${s.winsVerb || 'wins'} · ${s.youBacked || 'You backed'} ${mine}`
      }
    },

    LossScores: { extends: 'ResultScores' }
  },

  PlainCard: {
    extends: 'CkResultCard',
    theme: 'badgeNeutral',
    animation: 'fadeIn .2s ease-out both',
    '@reducedMotion': { animation: 'none' },
    display: (el, s) => (s.settlement && (!s.myBet || s.settlement.voided) ? 'flex' : 'none'),

    PlainKicker: { extends: 'CkEyebrow', text: '{{ resultKicker | polyglot }}' },

    PlainTitle: {
      tag: 'span',
      fontFamily: 'mono',
      fontSize: 'font5xl',
      lineHeight: '1',
      fontWeight: '700',
      letterSpacing: '-0.0625rem',
      color: 'heading',
      text: (el, s) => {
        if (!s.result || s.result.winner == null) return ''
        if (s.result.winner === 0) return s.voidTitle || 'Dead heat'
        const c = s.game && s.game.challengers ? s.game.challengers[s.result.winner - 1] : null
        return c ? c.name : `Challenger ${s.result.winner}`
      }
    },

    PlainLine: {
      tag: 'span',
      fontSize: 'fontMd',
      lineHeight: '1.5',
      text: (el, s) => {
        if (!s.settlement) return ''
        if (s.settlement.voided) return s.voidNote || ''
        return `${s.winsVerb || 'wins'} · ${s.noBetNote || ''}`
      }
    },

    PlainScores: { extends: 'ResultScores' }
  }
}

// Shared shell for the three result panels: a raised card (cards.md) whose
// fill and text come from the alert intent (alerts.md expanded variant).
export const CkResultCard = {
  extends: 'CkCard',
  flow: 'y',
  align: 'center flex-start',
  gap: 'spacing3',
  padding: 'spacing6',
  width: 'card',
  maxWidth: '94vw',
  textAlign: 'center',
  fontFamily: 'sans'
}

// One line of scores under every result panel. Reads state.result only.
export const ResultScores = {
  flow: 'x',
  align: 'center center',
  gap: 'spacing4',
  flexWrap: 'wrap',
  width: '100%',
  paddingTop: 'spacing3',
  borderTopWidth: 'spacing0_5',
  borderTopStyle: 'solid',
  borderTopColor: 'borderDefault',
  fontSize: 'fontMd',
  lineHeight: '1.5',
  fontVariantNumeric: 'tabular-nums',

  childrenAs: 'state',
  children: (el, s) => {
    if (!s.result || !s.result.attempts) return []
    const names = (s.game && s.game.challengers) || []
    return s.result.attempts
      .filter((a) => !!a)
      .map((a) => ({
        name: (names[a.side - 1] && names[a.side - 1].name) || `Challenger ${a.side}`,
        offset: Math.abs(a.offset),
        unit: s.result.unit,
        isWinner: s.result.winner === a.side
      }))
  },
  childExtends: 'ScoreChip'
}

// "[trophy] Challenger 1 · 13 g off". Child state: { name, offset, unit, isWinner }.
export const ScoreChip = {
  flow: 'x',
  align: 'center center',
  gap: 'spacing1',
  whiteSpace: 'nowrap',

  WinIcon: {
    extends: 'Icon',
    name: 'trophy',
    boxSize: 'icon16',
    attr: { 'aria-hidden': 'true' },
    display: (el, s) => (s.isWinner ? 'block' : 'none')
  },
  Name: { tag: 'span', fontWeight: '700', text: (el, s) => s.name },
  Dot: { tag: 'span', text: '·', attr: { 'aria-hidden': 'true' } },
  Off: { tag: 'span', text: (el, s) => `${s.offset} ${s.unit} ${s.root.offWord || 'off'}` }
}
