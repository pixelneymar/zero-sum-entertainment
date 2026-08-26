// Ledger kind filter chip. Child state: { kind|null, labelKey }. Active
// when ws.ledgerFilter.kind matches (null = all).
export const WsKindChip = {
  tag: 'button',
  fontFamily: 'inherit',
  padding: 'X Z',
  round: 'C',
  border: '1px solid white.14',
  fontSize: 'Y',
  fontWeight: '800',
  letterSpacing: 'X',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'A defaultBezier',
  transitionProperty: 'background, color, border-color',
  ':hover': { borderColor: 'white' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
  background: (el, s) => (((s.root.ws || {}).ledgerFilter || {}).kind || null) === s.kind ? 'white' : 'white.08',
  color: (el, s) => (((s.root.ws || {}).ledgerFilter || {}).kind || null) === s.kind ? 'black' : 'haze',
  text: (el, s) => s.root[s.labelKey] || s.labelKey,
  onClick: (e, el, s) => el.call('wsSetLedgerFilter', { kind: s.kind })
}
