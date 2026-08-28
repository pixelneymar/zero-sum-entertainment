// End of session (TypeUI section 5). Rounds and balance come straight from
// state; the net and best multiplier are a UI-side ledger of the settlements
// this component saw (each settlement is the server's; nothing here decides
// a payout). It floats over the footage, so it sits on the navy stage glass
// (body text stays 4.5:1 over a white frame) with four inset stat tiles.
export const SessionSummary = {
  extends: 'CkStageGlass',
  shadow: 'shadowXl',
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'spacing6',
  padding: 'spacing6',
  width: 'card',
  maxWidth: '94vw',
  textAlign: 'center',
  fontFamily: 'sans',
  display: (el, s) => (s.root.screen === 'playing' && s.root.phase === 'ended' ? 'flex' : 'none'),

  state: { ledger: [] },

  stateDeps: [(el, s) => s.root.settlement, (el, s) => s.root.game && s.root.game.slug],
  onStateUpdate: (el, s, ctx, change) => {
    const next = change && change.next ? change.next[0] : null
    const prev = change && change.prev ? change.prev[0] : null
    const slugChanged = change && change.prev && change.prev[1] !== change.next[1]
    if (slugChanged) {
      s.update({ ledger: [] })
      return
    }
    if (!next || next === prev) return
    const bet = s.root.myBet
    s.update({
      ledger: s.ledger.concat({
        multiplier: Number(next.multiplier) || 0,
        net: bet ? (Number(next.myPayout) || 0) - (Number(bet.stake) || 0) : 0,
        won: !!next.iWon
      })
    })
  },

  SummaryHead: {
    flow: 'y',
    align: 'center flex-start',
    gap: 'spacing2',
    SummaryKicker: { extends: 'CkEyebrow', text: '{{ sessionKicker | polyglot }}' },
    SummaryTitle: {
      tag: 'h2',
      fontSize: 'fontXl',
      '@mobileL': { fontSize: 'fontMd' },
      lineHeight: '1.3',
      fontWeight: '500',
      color: 'heading',
      margin: '0',
      text: (el, s) => (s.root.game ? s.root.game.title : '')
    }
  },

  StatGrid: {
    flow: 'x',
    align: 'stretch center',
    gap: 'spacing4',
    flexWrap: 'wrap',
    fontVariantNumeric: 'tabular-nums',
    childExtends: 'SessionStat',

    RoundsStat: {
      StatValue: { text: (el, s) => String((s.root.history || []).length) },
      StatLabel: { text: '{{ statRounds | polyglot }}' }
    },

    // Signed value: the sign is the non-colour cue for the intent colour.
    NetStat: {
      StatValue: {
        text: (el, s) => {
          const net = (s.ledger || []).reduce((sum, r) => sum + r.net, 0)
          return net > 0 ? `+${net.toLocaleString('en-US')}` : net.toLocaleString('en-US')
        },
        color: (el, s) => {
          const net = (s.ledger || []).reduce((sum, r) => sum + r.net, 0)
          return net > 0 ? 'fgSuccessStrong' : net < 0 ? 'fgDanger' : 'heading'
        }
      },
      StatLabel: { text: '{{ statNet | polyglot }}' }
    },

    BestStat: {
      StatValue: {
        text: (el, s) => {
          const best = (s.ledger || []).reduce((m, r) => Math.max(m, r.multiplier), 0)
          return best ? `×${best.toFixed(2)}` : 'None'
        }
      },
      StatLabel: { text: '{{ statBest | polyglot }}' }
    },

    BalanceStat: {
      StatValue: { text: (el, s) => (s.root.balance ?? 0).toLocaleString('en-US') },
      StatLabel: { text: '{{ balanceLabel | polyglot }}' }
    }
  },

  Actions: {
    flow: 'x',
    align: 'center center',
    gap: 'spacing4',
    flexWrap: 'wrap',

    PlayAgain: {
      extends: 'CkButtonPrimary',
      attr: { type: 'button' },
      onClick: (e, el, s) => {
        if (s.root.game) el.call('selectGame', s.root.game.slug)
      },
      PlayAgainLabel: { tag: 'span', text: '{{ playAgain | polyglot }}' }
    },

    OtherGame: {
      extends: 'CkButtonSecondary',
      attr: { type: 'button' },
      onClick: (e, el) => el.call('backToPicker'),
      OtherGameLabel: { tag: 'span', text: '{{ otherGame | polyglot }}' }
    }
  }
}

// Inset stat tile: a small glass tile (radius 10) inside the summary card.
export const SessionStat = {
  extends: 'CkCard',
  // Inside an already-blurred panel: no second blur layer.
  backdropFilter: 'none',
  round: 'radiusDefault',
  shadow: 'shadowXs',
  flow: 'y',
  align: 'center center',
  gap: 'spacing1',
  flex: '1',
  minWidth: 'spacing28',
  padding: 'spacing4',

  StatValue: {
    tag: 'span',
    fontFamily: 'sans',
    fontSize: 'font3xl',
    lineHeight: '1',
    fontWeight: '600',
    color: 'heading'
  },
  // Heading colour: bodySubtle falls to 4.3:1 over a white frame here.
  StatLabel: { extends: 'CkEyebrow', color: 'heading' }
}
