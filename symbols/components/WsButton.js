// Console button. Small, quiet, keyboard-friendly. Disabled state is a real
// attribute so automation and screen readers see it.
export const WsButton = {
  tag: 'button',
  fontFamily: 'inherit',
  flow: 'x',
  align: 'center center',
  gap: 'Y',
  padding: 'Y Z',
  round: 'Y',
  theme: 'chip',
  border: '1px solid white.14',
  fontSize: 'Z',
  fontWeight: '700',
  letterSpacing: 'X',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'A defaultBezier',
  transitionProperty: 'border-color, background, opacity',
  ':hover': { borderColor: 'white' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
  ':disabled': { opacity: '.4', cursor: 'not-allowed', borderColor: 'white.14' }
}
