// Leaderboard row. Child state: a player plus `rank`.
export const WsPlayerRow = {
  display: 'grid',
  gridTemplateColumns: '3em 14em 7em 4em 4em 7em 7em 7em',
  alignItems: 'center',
  gap: 'Y',
  padding: 'Y 0',
  borderBottom: '1px solid white.08',
  fontSize: 'Z',
  fontVariantNumeric: 'tabular-nums',
  role: 'row',
  background: (el, s) => (s.isHouse ? 'white.04' : 'transparent'),

  RankCell: { tag: 'span', padding: '0 Z', theme: 'wsDim', text: (el, s) => String(s.rank ?? '') },

  NameCell: {
    flow: 'x',
    align: 'center flex-start',
    gap: 'Y',
    minWidth: '0',
    PlayerName: {
      tag: 'span',
      fontWeight: '700',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      text: (el, s) => s.name || s.id || ''
    },
    WsBadge: {
      display: (el, s) => (s.isBot ? 'inline-flex' : 'none'),
      BadgeText: { text: '{{ wsBot | polyglot }}' }
    },
    WsBadge_1: {
      background: 'gold',
      color: 'black',
      display: (el, s) => (s.isHouse ? 'inline-flex' : 'none'),
      BadgeText: { text: '{{ wsHouse | polyglot }}' }
    }
  },

  BalanceCell: { tag: 'span', textAlign: 'right', fontWeight: '700', text: (el, s) => Math.round(Number(s.balance) || 0).toLocaleString('en-US') },
  BetsCell: { tag: 'span', textAlign: 'right', text: (el, s) => String(s.bets ?? 0) },
  WinsCell: { tag: 'span', textAlign: 'right', text: (el, s) => String(s.wins ?? 0) },
  StakedCell: { tag: 'span', textAlign: 'right', text: (el, s) => Math.round(Number(s.staked) || 0).toLocaleString('en-US') },
  PaidOutCell: { tag: 'span', textAlign: 'right', text: (el, s) => Math.round(Number(s.paidOut) || 0).toLocaleString('en-US') },
  NetCell: {
    tag: 'span',
    textAlign: 'right',
    fontWeight: '800',
    text: (el, s) => {
      const v = Math.round(Number(s.net) || 0)
      return `${v > 0 ? '+' : ''}${v.toLocaleString('en-US')}`
    },
    color: (el, s) => {
      const v = Number(s.net) || 0
      return v > 0 ? 'mint' : v < 0 ? 'ember' : 'haze'
    }
  }
}
