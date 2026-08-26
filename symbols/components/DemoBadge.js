// Product requirement (docs/decisions.md O2): a simulated crowd must be
// labelled. Visible for the whole session whenever state.mode === 'demo'.
export const DemoBadge = {
  flow: 'x',
  align: 'center center',
  gap: 'Y',
  padding: 'X Z',
  round: 'C',
  theme: 'chip',
  border: '1px solid white.14',
  fontSize: 'Z',
  fontWeight: '700',
  letterSpacing: 'X',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  display: (el, s) => (s.mode === 'demo' ? 'flex' : 'none'),

  DemoDot: {
    tag: 'span',
    width: 'Y',
    height: 'Y',
    round: 'Y',
    background: 'gold'
  },

  DemoLabel: {
    tag: 'span',
    text: '{{ demoBadge | polyglot }}'
  }
}
