export const ErrorBanner = {
  flow: 'x',
  align: 'center space-between',
  gap: 'A',
  padding: 'Y A',
  round: 'Z',
  theme: 'danger',
  shadow: 'glass',
  fontWeight: '600',
  animation: 'riseIn .35s ease-out both',
  display: (el, s) => (s.error ? 'flex' : 'none'),

  ErrorText: {
    tag: 'span',
    text: (el, s) => s.error || '',
    fontSize: 'A',
    lineHeight: 'B'
  },

  DismissButton: {
    tag: 'button',
    text: '×',
    fontFamily: 'inherit',
    fontSize: 'B',
    lineHeight: 'A',
    fontWeight: '700',
    background: 'transparent',
    color: 'white',
    border: 'none',
    padding: 'X Y',
    round: 'Y',
    cursor: 'pointer',
    ':hover': { opacity: '.7' },
    ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
    onClick: (e, el, s) => s.update({ error: null })
  }
}
