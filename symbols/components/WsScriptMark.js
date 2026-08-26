// A tick on a round-script timeline. Child state: { at, left (0..100),
// labelKey, tone, row: 'above'|'below', anchor: 'start'|'middle'|'end' }.
// Labels alternate rows so close marks (reveal 36 s, pause 37 s) stay legible.
export const WsScriptMark = {
  position: 'absolute',
  top: '0',
  bottom: '0',
  left: (el, s) => `${Math.max(0, Math.min(100, Number(s.left) || 0))}%`,

  Tick: {
    position: 'absolute',
    top: 'Z',
    width: 'W',
    height: 'A',
    round: 'W',
    transform: 'translateX(-50%)',
    background: (el, s) => (s.tone === 'gold' ? 'gold' : s.tone === 'white' ? 'white' : 'haze')
  },

  MarkLabel: {
    tag: 'span',
    position: 'absolute',
    fontSize: 'Y',
    fontWeight: '700',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
    theme: 'wsMuted',
    top: (el, s) => (s.row === 'above' ? '0' : 'auto'),
    bottom: (el, s) => (s.row === 'above' ? 'auto' : '0'),
    transform: (el, s) =>
      s.anchor === 'end' ? 'translateX(-100%)' : s.anchor === 'start' ? 'translateX(0)' : 'translateX(-50%)',
    text: (el, s) => `${s.root[s.labelKey] || s.labelKey} ${s.at}s`
  }
}
