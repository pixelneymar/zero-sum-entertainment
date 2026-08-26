// One guarantee. Child state: a check { id, label, status, detail }.
export const WsIntegrityRow = {
  display: 'grid',
  gridTemplateColumns: '7em minmax(10em, 1fr) minmax(12em, 2fr)',
  alignItems: 'center',
  gap: 'A',
  padding: 'Z 0',
  borderBottom: '1px solid white.08',
  fontSize: 'Z',
  role: 'row',

  WsStatusPill: {},
  CheckLabel: { tag: 'span', fontSize: 'A', fontWeight: '700', text: (el, s) => String(s.label || s.id || '') },
  CheckDetail: {
    tag: 'span',
    theme: 'wsMuted',
    lineHeight: 'A',
    fontVariantNumeric: 'tabular-nums',
    text: (el, s) => String(s.detail || '')
  }
}
