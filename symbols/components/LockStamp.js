// The hard LOCK moment. Appears the instant phase becomes 'locked' and holds
// for that phase: an ink stamp over the footage while the counters around it
// freeze. No backdrop-filter here: Chrome mis-composites backdrop-filter
// together with an animated transform over a <video>.
export const LockStamp = {
  extends: 'CkCard',
  theme: 'brandFill',
  // Animated transform over the <video>: no backdrop-filter (Chrome bug).
  backdropFilter: 'none',
  borderColor: 'paper.30',
  shadow: 'shadowXl',
  flow: 'y',
  align: 'center center',
  gap: 'spacing2',
  padding: 'spacing5 spacing8',
  textAlign: 'center',
  fontFamily: 'sans',
  animation: 'popIn .25s ease-out both',
  '@reducedMotion': { animation: 'none' },
  attr: { role: 'status' },
  display: (el, s) => (s.screen === 'playing' && s.phase === 'locked' ? 'flex' : 'none'),

  StampHead: {
    flow: 'x',
    align: 'center center',
    gap: 'spacing3',
    Icon: { name: 'lock', boxSize: 'icon20', attr: { 'aria-hidden': 'true' } },
    StampWord: {
      tag: 'span',
      fontFamily: 'sans',
      fontSize: 'font5xl',
      lineHeight: '1',
      fontWeight: '600',
      letterSpacing: '-0.025rem',
      text: '{{ lockedStamp | polyglot }}'
    }
  },

  StampNote: { tag: 'span', fontSize: 'fontMd', lineHeight: '1.625', text: '{{ lockedPromise | polyglot }}' }
}
