// One player of the ledger audit. Child state: { playerId, playerName,
// ledgerSum, balance, ok }.
export const WsAuditRow = {
  display: 'grid',
  gridTemplateColumns: 'minmax(8em, 1.4fr) 6em 6em 3em',
  alignItems: 'center',
  gap: 'Y',
  padding: 'Y 0',
  borderBottom: '1px solid white.08',
  fontSize: 'Z',
  fontVariantNumeric: 'tabular-nums',
  role: 'row',
  background: (el, s) => (s.ok === false ? 'ember.14' : 'transparent'),

  PlayerCell: {
    tag: 'span',
    padding: '0 Z',
    fontWeight: '700',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    text: (el, s) => s.playerName || s.playerId || ''
  },
  SumCell: { tag: 'span', textAlign: 'right', text: (el, s) => Math.round(Number(s.ledgerSum) || 0).toLocaleString('en-US') },
  BalanceCell: { tag: 'span', textAlign: 'right', text: (el, s) => Math.round(Number(s.balance) || 0).toLocaleString('en-US') },
  OkCell: {
    tag: 'span',
    textAlign: 'center',
    fontSize: 'A',
    fontWeight: '800',
    text: (el, s) => (s.ok == null ? '—' : s.ok ? '✓' : '✗'),
    color: (el, s) => (s.ok == null ? 'neutral' : s.ok ? 'mint' : 'ember'),
    aria: { label: (el, s) => (s.ok ? s.root.wsStatusPass : s.root.wsStatusFail) || '' }
  }
}
