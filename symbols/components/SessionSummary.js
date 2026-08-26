// End of session. Rounds and balance come straight from state; the net and
// best multiplier are a UI-side ledger of the settlements this component saw
// (each settlement is the server's — nothing here decides a payout).
export const SessionSummary = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'B',
  padding: 'C',
  width: 'card',
  maxWidth: '94vw',
  round: 'B',
  theme: 'glass',
  border: '1px solid white.12',
  shadow: 'glass',
  backdropFilter: 'blur(1.1rem)',
  textAlign: 'center',
  animation: 'riseIn .6s ease-out both',
  display: (el, s) =>
    s.root.screen === 'playing' && s.root.phase === 'ended' ? 'flex' : 'none',

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

  SummaryKicker: {
    tag: 'span',
    text: '{{ sessionKicker | polyglot }}',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'Y',
    textTransform: 'uppercase',
    theme: 'onVideoMuted'
  },

  SummaryTitle: {
    tag: 'h2',
    text: (el, s) => (s.root.game ? s.root.game.title : ''),
    fontSize: 'E',
    lineHeight: 'E',
    fontWeight: '800',
    letterSpacing: '-Y',
    margin: '0'
  },

  StatGrid: {
    flow: 'x',
    align: 'stretch center',
    gap: 'A',
    flexWrap: 'wrap',
    fontVariantNumeric: 'tabular-nums',

    RoundsStat: {
      flow: 'y',
      align: 'center center',
      gap: 'X',
      flex: '1',
      minWidth: '7em',
      padding: 'A',
      round: 'Z',
      theme: 'chip',
      StatValue: {
        tag: 'span',
        text: (el, s) => String((s.root.history || []).length),
        fontSize: 'D',
        lineHeight: 'D',
        fontWeight: '800',
        letterSpacing: '-Y'
      },
      StatLabel: {
        tag: 'span',
        text: '{{ statRounds | polyglot }}',
        fontSize: 'Z',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        theme: 'onVideoMuted'
      }
    },

    NetStat: {
      flow: 'y',
      align: 'center center',
      gap: 'X',
      flex: '1',
      minWidth: '7em',
      padding: 'A',
      round: 'Z',
      theme: 'chip',
      StatValue: {
        tag: 'span',
        text: (el, s) => {
          const net = (s.ledger || []).reduce((sum, r) => sum + r.net, 0)
          return net > 0 ? `+${net.toLocaleString('en-US')}` : net.toLocaleString('en-US')
        },
        fontSize: 'D',
        lineHeight: 'D',
        fontWeight: '800',
        letterSpacing: '-Y',
        color: (el, s) => {
          const net = (s.ledger || []).reduce((sum, r) => sum + r.net, 0)
          return net > 0 ? 'mint' : net < 0 ? 'ember' : 'white'
        }
      },
      StatLabel: {
        tag: 'span',
        text: '{{ statNet | polyglot }}',
        fontSize: 'Z',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        theme: 'onVideoMuted'
      }
    },

    BestStat: {
      flow: 'y',
      align: 'center center',
      gap: 'X',
      flex: '1',
      minWidth: '7em',
      padding: 'A',
      round: 'Z',
      theme: 'chip',
      StatValue: {
        tag: 'span',
        text: (el, s) => {
          const best = (s.ledger || []).reduce((m, r) => Math.max(m, r.multiplier), 0)
          return best ? `×${best.toFixed(2)}` : '—'
        },
        fontSize: 'D',
        lineHeight: 'D',
        fontWeight: '800',
        letterSpacing: '-Y',
        color: 'gold'
      },
      StatLabel: {
        tag: 'span',
        text: '{{ statBest | polyglot }}',
        fontSize: 'Z',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        theme: 'onVideoMuted'
      }
    },

    BalanceStat: {
      flow: 'y',
      align: 'center center',
      gap: 'X',
      flex: '1',
      minWidth: '7em',
      padding: 'A',
      round: 'Z',
      theme: 'chip',
      StatValue: {
        tag: 'span',
        text: (el, s) => (s.root.balance ?? 0).toLocaleString('en-US'),
        fontSize: 'D',
        lineHeight: 'D',
        fontWeight: '800',
        letterSpacing: '-Y'
      },
      StatLabel: {
        tag: 'span',
        text: '{{ balanceLabel | polyglot }}',
        fontSize: 'Z',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        theme: 'onVideoMuted'
      }
    }
  },

  Actions: {
    flow: 'x',
    align: 'center center',
    gap: 'A',
    flexWrap: 'wrap',

    PlayAgain: {
      tag: 'button',
      flow: 'x',
      align: 'center center',
      border: 'none',
      fontFamily: 'inherit',
      background: 'brand',
      color: 'white',
      ':hover': { background: 'brand+8' },
      round: 'C',
      padding: 'Z C',
      fontSize: 'A',
      fontWeight: '800',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      cursor: 'pointer',
      ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
      onClick: (e, el, s) => {
        if (s.root.game) el.call('selectGame', s.root.game.slug)
      },
      PlayAgainLabel: { tag: 'span', text: '{{ playAgain | polyglot }}' }
    },

    OtherGame: {
      tag: 'button',
      flow: 'x',
      align: 'center center',
      fontFamily: 'inherit',
      theme: 'chip',
      border: '1px solid white.14',
      round: 'C',
      padding: 'Z B',
      fontSize: 'A',
      fontWeight: '700',
      cursor: 'pointer',
      ':hover': { borderColor: 'white' },
      ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
      onClick: (e, el) => el.call('backToPicker'),
      OtherGameLabel: { tag: 'span', text: '{{ otherGame | polyglot }}' }
    }
  }
}
