// One bar of the crowd's guess distribution. Child state: { guess, count,
// share, isResult, isMine }. Grows from the baseline when it appears.
export const HistogramBar = {
  flow: 'y',
  align: 'center flex-end',
  flex: '1',
  minWidth: '0',
  height: '100%',
  position: 'relative',

  BarFill: {
    width: '100%',
    minHeight: '1px',
    round: 'X',
    transformOrigin: 'bottom',
    animation: 'barGrow .6s ease-out both',
    height: (el, s) => `${Math.round((s.share ?? 0) * 100)}%`,
    background: (el, s) => (s.isResult ? 'gold' : s.isMine ? 'white' : 'white.26'),
    boxShadow: (el, s) => (s.isResult ? 'win' : 'none')
  },

  BarLabel: {
    tag: 'span',
    position: 'absolute',
    top: '100%',
    marginTop: 'X',
    fontSize: 'Y',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    text: (el, s) => (s.guess > 0 ? `+${s.guess}` : String(s.guess)),
    color: (el, s) => (s.isResult ? 'gold' : s.isMine ? 'white' : 'haze'),
    display: (el, s) => (s.isResult || s.isMine || s.isEdge ? 'inline' : 'none')
  }
}
