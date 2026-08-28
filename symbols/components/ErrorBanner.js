// Danger alert (alerts.md, bordered + icon + dismiss). Data-layer failures
// and rejected bets land here; they persist until dismissed. role=alert so
// assistive tech announces a rejected bet.
export const ErrorBanner = {
  flow: 'x',
  align: 'center flex-start',
  gap: 'spacing2',
  width: '100%',
  padding: 'spacing4',
  round: 'radiusXxl',
  theme: 'badgeDanger',
  borderWidth: 'spacing0_5',
  borderStyle: 'solid',
  borderColor: 'borderDefault',
  boxShadow: 'none',
  fontFamily: 'sans',
  fontSize: 'fontMd',
  lineHeight: '1.5',
  attr: { role: 'alert' },
  display: (el, s) => (s.error ? 'flex' : 'none'),

  ErrorIcon: { extends: 'Icon', name: 'alertCircle', boxSize: 'icon16', flexShrink: '0', attr: { 'aria-hidden': 'true' } },

  ErrorText: {
    tag: 'span',
    flex: '1',
    minWidth: '0',
    text: (el, s) => s.error || ''
  },

  // 44px hit target (fundamentals) around a 16px glyph; the negative margin
  // keeps the alert's 16px padding optically intact (alerts.md optical inset).
  DismissButton: {
    tag: 'button',
    attr: { type: 'button', 'aria-label': 'Dismiss' },
    display: 'inline-flex',
    align: 'center center',
    flexShrink: '0',
    width: 'touchMin',
    height: 'touchMin',
    margin: '-spacing3 -spacing3 -spacing3 0',
    padding: '0',
    round: 'radiusXxl',
    background: 'transparent',
    color: 'fgDangerStrong',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color .15s ease',
    '@reducedMotion': { transition: 'none' },
    ':hover': { background: 'dangerMedium' },
    ':focus-visible': { outline: 'spacing0_5 solid brandInk', outlineOffset: 'spacing0_5' },
    onClick: (e, el, s) => s.update({ error: null }),
    Icon: { name: 'x', boxSize: 'icon16', attr: { 'aria-hidden': 'true' } }
  }
}
