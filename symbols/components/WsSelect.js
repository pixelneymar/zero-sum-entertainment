// Console <select>. Options come from `children` on the instance.
export const WsSelect = {
  tag: 'select',
  fontFamily: 'inherit',
  fontSize: 'Z',
  fontWeight: '600',
  padding: 'Y Z',
  round: 'Y',
  width: 'wsSelect',
  maxWidth: '100%',
  theme: 'chip',
  border: '1px solid white.14',
  cursor: 'pointer',
  ':hover': { borderColor: 'white' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
  childrenAs: 'state',
  childExtends: 'WsOption'
}
