// The hard LOCK moment. Appears the instant phase becomes 'locked' and holds
// for that phase: a stamped, slightly rotated seal over the footage while the
// counters around it freeze. No backdrop-filter here: Chrome mis-composites
// backdrop-filter together with an animated transform over a <video>.
export const LockStamp = {
  flow: 'y',
  align: 'center center',
  gap: 'Y',
  padding: 'A C',
  border: '.22rem solid white',
  round: 'Z',
  theme: 'glassLocked',
  shadow: 'lock',
  textAlign: 'center',
  animation: 'stampIn .55s cubic-bezier(.2, .9, .3, 1.2) both',
  display: (el, s) =>
    s.screen === 'playing' && s.phase === 'locked' ? 'flex' : 'none',

  StampHead: {
    flow: 'x',
    align: 'center center',
    gap: 'Z',

    Icon: { name: 'lock', boxSize: 'D', color: 'white' },

    StampWord: {
      tag: 'span',
      text: '{{ lockedStamp | polyglot }}',
      fontSize: 'H',
      lineHeight: 'H',
      fontWeight: '900',
      letterSpacing: 'Y',
      textTransform: 'uppercase'
    }
  },

  StampNote: {
    tag: 'span',
    text: '{{ lockedPromise | polyglot }}',
    fontSize: 'A',
    fontWeight: '600',
    theme: 'onVideoMuted'
  }
}
