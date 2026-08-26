// One rail entry. Child state: { view, labelKey }. Active when the console
// shows that view; the round-detail view keeps "Rounds" lit.
export const WsNavItem = {
  tag: 'button',
  fontFamily: 'inherit',
  flow: 'x',
  align: 'center space-between',
  gap: 'Y',
  width: '100%',
  padding: 'Y Z',
  round: 'Y',
  border: 'none',
  fontSize: 'A',
  fontWeight: '600',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'A defaultBezier',
  transitionProperty: 'background, color',
  ':hover': { background: 'white.08' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
  background: (el, s) => {
    const view = (s.root.ws || {}).view
    const active = view === s.view || (s.view === 'rounds' && view === 'round')
    return active ? 'white.12' : 'transparent'
  },
  color: (el, s) => {
    const view = (s.root.ws || {}).view
    const active = view === s.view || (s.view === 'rounds' && view === 'round')
    return active ? 'white' : 'haze'
  },
  onClick: (e, el, s) => el.call('wsOpen', s.view),

  ItemLabel: {
    tag: 'span',
    text: (el, s) => s.root[s.labelKey] || s.labelKey
  },

  ItemDot: {
    tag: 'span',
    width: 'X',
    height: 'X',
    round: 'X',
    background: 'gold',
    display: (el, s) => {
      const view = (s.root.ws || {}).view
      const active = view === s.view || (s.view === 'rounds' && view === 'round')
      return active ? 'block' : 'none'
    }
  }
}
