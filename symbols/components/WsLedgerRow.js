// One ledger entry. Child state: an entry { id, at, playerId, playerName,
// kind, amount, roundId }.
export const WsLedgerRow = {
  display: 'grid',
  gridTemplateColumns: '10em 12em 6em 6em 8em',
  alignItems: 'center',
  gap: 'Y',
  padding: 'Y 0',
  borderBottom: '1px solid white.08',
  fontSize: 'Z',
  fontVariantNumeric: 'tabular-nums',
  role: 'row',

  AtCell: {
    tag: 'span',
    padding: '0 Z',
    theme: 'wsMuted',
    whiteSpace: 'nowrap',
    text: (el, s) => {
      if (!s.at) return '—'
      const d = new Date(s.at)
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour12: false })}`
    }
  },
  PlayerCell: {
    tag: 'span',
    fontWeight: '700',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    text: (el, s) => s.playerName || s.playerId || ''
  },
  KindCell: {
    tag: 'span',
    display: 'inline-flex',
    alignSelf: 'center',
    justifySelf: 'start',
    padding: 'W Y',
    round: 'X',
    fontSize: 'Y',
    fontWeight: '800',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    text: (el, s) => String(s.kind || ''),
    background: (el, s) => {
      const k = s.kind
      if (k === 'payout' || k === 'grant') return 'mint'
      if (k === 'stake') return 'white.10'
      if (k === 'rake') return 'gold'
      if (k === 'refund') return 'azure'
      return 'white.10'
    },
    color: (el, s) => (s.kind === 'rake' ? 'black' : s.kind === 'stake' || !s.kind ? 'haze' : 'white')
  },
  AmountCell: {
    tag: 'span',
    textAlign: 'right',
    fontWeight: '800',
    text: (el, s) => {
      const v = Math.round(Number(s.amount) || 0)
      return `${v > 0 ? '+' : ''}${v.toLocaleString('en-US')}`
    },
    color: (el, s) => {
      const v = Number(s.amount) || 0
      return v > 0 ? 'mint' : v < 0 ? 'ember' : 'haze'
    }
  },
  RoundCell: {
    tag: 'span',
    theme: 'wsDim',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    text: (el, s) => (s.roundId ? String(s.roundId) : '—')
  }
}
