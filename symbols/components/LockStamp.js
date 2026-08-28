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
  flow: 'x',
  align: 'center flex-start',
  gap: 'spacing3',
  flexWrap: 'wrap',
  padding: 'spacing3 spacing4',
  textAlign: 'left',
  fontFamily: 'sans',
  animation: 'popIn .25s ease-out both',
  '@reducedMotion': { animation: 'none' },
  display: (el, s) => (s.screen === 'playing' && s.phase === 'locked' ? 'flex' : 'none'),

  StampHead: {
    flow: 'x',
    align: 'center center',
    gap: 'spacing2',
    Icon: { name: 'lock', boxSize: 'icon20', attr: { 'aria-hidden': 'true' } },
    StampWord: {
      tag: 'span',
      fontFamily: 'sans',
      fontSize: 'font2xl',
      lineHeight: '1',
      fontWeight: '600',
      letterSpacing: '-0.025rem',
      text: '{{ lockedStamp | polyglot }}'
    }
  },

  StampNote: { tag: 'span', fontSize: 'fontMd', lineHeight: '1.625', text: '{{ lockedPromise | polyglot }}' }
}
