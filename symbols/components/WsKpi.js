// Stat tile. Child state: { labelKey, value, hint, small }. The value is already
// formatted by the tile grid; this only lays it out.
export const WsKpi = {
  flow: 'y',
  align: 'flex-start flex-start',
  gap: 'X',
  padding: 'A',
  round: 'A',
  theme: 'wsPanel',
  border: '1px solid white.10',
  minWidth: '0',

  KpiLabel: {
    tag: 'span',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    theme: 'wsMuted',
    text: (el, s) => s.root[s.labelKey] || s.labelKey
  },

  KpiValue: {
    tag: 'span',
    fontSize: (el, s) => (s.small ? 'C' : 'D'),
    lineHeight: (el, s) => (s.small ? 'C' : 'D'),
    fontWeight: '800',
    letterSpacing: '-Y',
    whiteSpace: 'nowrap',
    text: (el, s) => s.value
  },

  KpiHint: {
    tag: 'span',
    fontSize: 'Z',
    theme: 'wsDim',
    text: (el, s) => s.hint || '',
    display: (el, s) => (s.hint ? 'inline' : 'none')
  }
}
