// Leave the stage. The engine tears the round down (backToPicker).
export const ExitButton = {
  tag: 'button',
  fontFamily: 'inherit',
  flow: 'x',
  align: 'center center',
  gap: 'Y',
  padding: 'Y A',
  round: 'C',
  theme: 'glass',
  border: '1px solid white.12',
  shadow: 'glass',
  backdropFilter: 'blur(1.1rem)',
  fontSize: 'Z',
  fontWeight: '700',
  letterSpacing: 'X',
  textTransform: 'uppercase',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'A defaultBezier',
  transitionProperty: 'border-color',
  ':hover': { borderColor: 'white' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
  onClick: (e, el) => el.call('backToPicker'),

  ExitGlyph: { tag: 'span', text: '←' },
  ExitLabel: { tag: 'span', text: '{{ exitStage | polyglot }}' }
}
