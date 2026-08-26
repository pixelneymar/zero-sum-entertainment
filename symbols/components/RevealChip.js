// Minimal chrome while the footage plays out: your locked guess, nothing
// else. Gets out of the way of the scale reading.
export const RevealChip = {
  flow: 'x',
  align: 'baseline center',
  gap: 'Y',
  padding: 'Y A',
  round: 'C',
  theme: 'glassLocked',
  border: '1px solid white.24',
  shadow: 'glass',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  animation: 'fadeIn .6s ease-out both',
  display: (el, s) =>
    s.screen === 'playing' && s.phase === 'reveal' ? 'flex' : 'none',

  RevealLead: {
    tag: 'span',
    text: '{{ revealWatching | polyglot }}',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    theme: 'onVideoMuted'
  },

  RevealDivider: {
    tag: 'span',
    text: '·',
    fontSize: 'Z',
    theme: 'onVideoMuted',
    display: (el, s) => (s.myBet ? 'inline' : 'none')
  },

  RevealYourGuess: {
    tag: 'span',
    text: '{{ yourGuess | polyglot }}',
    fontSize: 'Z',
    theme: 'onVideoMuted',
    display: (el, s) => (s.myBet ? 'inline' : 'none')
  },

  RevealValue: {
    tag: 'span',
    text: (el, s) => {
      if (!s.myBet) return ''
      const unit = s.game ? s.game.resultUnit : ''
      const value = s.myBet.guess > 0 ? `+${s.myBet.guess}` : String(s.myBet.guess)
      return `${value} ${unit}`
    },
    fontSize: 'B',
    fontWeight: '800',
    letterSpacing: '-X',
    color: 'gold',
    display: (el, s) => (s.myBet ? 'inline' : 'none')
  }
}
