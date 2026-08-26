// One bet. Child state: a bet. guess === null means sealed: the lock glyph
// replaces the guess and the derived columns stay blank.
export const WsBetRow = {
  display: 'grid',
  gridTemplateColumns: '14em 11em 6em 4em 6em 8em',
  alignItems: 'center',
  gap: 'Y',
  padding: 'Y 0',
  borderBottom: '1px solid white.08',
  fontSize: 'Z',
  fontVariantNumeric: 'tabular-nums',
  role: 'row',

  PlayerCell: {
    flow: 'x',
    align: 'center flex-start',
    gap: 'Y',
    padding: '0 Z',
    minWidth: '0',
    PlayerName: {
      tag: 'span',
      fontWeight: '700',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      text: (el, s) => s.playerName || s.playerId || ''
    },
    WsBadge: {
      display: (el, s) => (s.isBot ? 'inline-flex' : 'none'),
      BadgeText: { text: '{{ wsBot | polyglot }}' }
    }
  },

  GuessCell: {
    flow: 'x',
    align: 'center flex-start',
    WsSealedCell: { display: (el, s) => (s.guess == null ? 'flex' : 'none') },
    GuessValue: {
      tag: 'span',
      fontWeight: '800',
      display: (el, s) => (s.guess == null ? 'none' : 'inline'),
      text: (el, s) => {
        if (s.guess == null) return ''
        const v = Number(s.guess)
        return v > 0 ? `+${v}` : String(v)
      }
    }
  },

  DistanceCell: {
    tag: 'span',
    textAlign: 'right',
    text: (el, s) => (s.distance == null ? '—' : String(s.distance))
  },

  WonCell: {
    tag: 'span',
    textAlign: 'center',
    fontWeight: '800',
    text: (el, s) => (s.won == null ? '—' : s.won ? '✓' : '·'),
    color: (el, s) => (s.won ? 'mint' : 'neutral')
  },

  PayoutCell: {
    tag: 'span',
    textAlign: 'right',
    fontWeight: '700',
    text: (el, s) => (s.payout == null ? '—' : Math.round(Number(s.payout)).toLocaleString('en-US')),
    color: (el, s) => (s.payout ? 'mint' : 'white')
  },

  PlacedCell: {
    tag: 'span',
    theme: 'wsMuted',
    whiteSpace: 'nowrap',
    text: (el, s) => (s.placedAt ? new Date(s.placedAt).toLocaleTimeString('en-US', { hour12: false }) : '—')
  }
}
