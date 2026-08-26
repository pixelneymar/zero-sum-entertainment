// pass / fail / n-a / unknown pill. Reads `status` from its state.
export const WsStatusPill = {
  tag: 'span',
  display: 'inline-flex',
  align: 'center center',
  gap: 'X',
  padding: 'X Z',
  round: 'C',
  fontSize: 'Y',
  fontWeight: '800',
  letterSpacing: 'X',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  minWidth: 'D',
  justifyContent: 'center',
  background: (el, s) => {
    const st = s.status
    if (st === 'pass') return 'mint'
    if (st === 'fail') return 'ember'
    if (st === 'na') return 'neutral'
    return 'white.10'
  },
  color: (el, s) => (s.status === 'unknown' || !s.status ? 'haze' : 'white'),

  PillMark: {
    tag: 'span',
    text: (el, s) => {
      const st = s.status
      if (st === 'pass') return '✓'
      if (st === 'fail') return '✗'
      if (st === 'na') return '–'
      return '?'
    }
  },
  PassText: { tag: 'span', text: '{{ wsStatusPass | polyglot }}', display: (el, s) => (s.status === 'pass' ? 'inline' : 'none') },
  FailText: { tag: 'span', text: '{{ wsStatusFail | polyglot }}', display: (el, s) => (s.status === 'fail' ? 'inline' : 'none') },
  NaText: { tag: 'span', text: '{{ wsStatusNa | polyglot }}', display: (el, s) => (s.status === 'na' ? 'inline' : 'none') },
  UnknownText: {
    tag: 'span',
    text: '{{ wsStatusUnknown | polyglot }}',
    display: (el, s) => (s.status === 'pass' || s.status === 'fail' || s.status === 'na' ? 'none' : 'inline')
  }
}
