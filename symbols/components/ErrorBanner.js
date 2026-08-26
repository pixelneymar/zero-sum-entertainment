export const ErrorBanner = {
  flow: 'x',
  align: 'center space-between',
  gap: 'A',
  padding: 'Y A',
  round: 'Z',
  theme: 'danger',
  fontWeight: '600',
  display: (el, s) => (s.error ? 'flex' : 'none'),

  ErrorText: {
    tag: 'span',
    text: (el, s) => s.error || '',
    fontSize: 'A',
    lineHeight: 'B'
  },

  DismissButton: {
    extends: 'Button',
    text: '×',
    fontSize: 'B',
    lineHeight: 'A',
    fontWeight: '700',
    background: 'transparent',
    border: 'none',
    padding: 'X Y',
    round: 'Y',
    cursor: 'pointer',
    ':hover': { opacity: '.7' },
    ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
    onClick: (e, el, s) => s.update({ error: null })
  }
}
