// Danger alert (alerts.md, bordered + icon + dismiss). Data-layer failures
// and rejected bets land here; they persist until dismissed. role=alert so
// assistive tech announces a rejected bet.
export const ErrorBanner = {
  flow: 'x',
  align: 'center flex-start',
  gap: 'spacing2',
  width: '100%',
  padding: 'spacing4',
  round: 'radiusBase',
  theme: 'badgeDanger',
  borderWidth: 'spacingPx',
  borderStyle: 'solid',
  borderColor: 'borderDangerSubtle',
  shadow: 'shadowMd',
  fontFamily: 'sans',
  fontSize: 'fontMd',
  lineHeight: '1.6',
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
    extends: 'CkButtonGhost',
    attr: { type: 'button', 'aria-label': 'Dismiss' },
    flexShrink: '0',
    width: 'touchMin',
    height: 'touchMin',
    minHeight: 'touchMin',
    margin: 'spacing3Neg spacing3Neg spacing3Neg 0',
    padding: '0',
    round: 'radiusFull',
    color: 'fgDangerStrong',
    ':hover': { background: 'dangerMedium' },
    onClick: (e, el, s) => s.update({ error: null }),
    Icon: { name: 'x', boxSize: 'icon16', attr: { 'aria-hidden': 'true' } }
  }
}
