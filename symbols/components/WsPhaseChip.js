// Round / live phase as a small chip. Reads `phase` from its state.
export const WsPhaseChip = {
  tag: 'span',
  display: 'inline-flex',
  align: 'center center',
  padding: 'W Y',
  round: 'C',
  fontSize: 'Y',
  fontWeight: '800',
  letterSpacing: 'X',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  border: '1px solid white.14',
  text: (el, s) => String(s.phase || '—'),
  background: (el, s) => {
    const p = s.phase
    if (p === 'betting' || p === 'preview') return 'gold'
    if (p === 'locked') return 'white'
    if (p === 'settled' || p === 'ended' || p === 'results') return 'mint'
    if (p === 'void' || p === 'voided') return 'ember'
    return 'white.08'
  },
  color: (el, s) => {
    const p = s.phase
    return p === 'betting' || p === 'preview' || p === 'locked' ? 'black' : 'white'
  }
}
