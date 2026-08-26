// state.ws.error, dismissible. Management RPC failures land here too.
export const WsErrorBanner = {
  flow: 'x',
  align: 'center space-between',
  gap: 'A',
  margin: 'A B 0',
  padding: 'Y A',
  round: 'Z',
  theme: 'danger',
  fontWeight: '600',
  animation: 'riseIn .35s ease-out both',
  display: (el, s) => ((s.ws || {}).error ? 'flex' : 'none'),

  ErrorText: {
    tag: 'span',
    text: (el, s) => (s.ws || {}).error || '',
    fontSize: 'A',
    lineHeight: 'B'
  },

  DismissButton: {
    tag: 'button',
    text: '×',
    aria: { label: (el, s) => s.wsDismiss || '' },
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
    onClick: (e, el, s) => {
      if (s.ws && typeof s.ws.update === 'function') s.ws.update({ error: null })
    }
  }
}
