// Quick-pick value scaled to the game's range. Child of BetPanel.Chips via
// childrenAs: 'state' — `s.value` is the chip, `s.root` is the app state.
export const GuessChip = {
  tag: 'button',
  flow: 'x',
  align: 'center center',
  minWidth: 'C',
  padding: 'Y Z',
  round: 'C',
  fontSize: 'Z',
  fontWeight: '700',
  fontVariantNumeric: 'tabular-nums',
  border: '1px solid white.14',
  cursor: 'pointer',
  transition: 'A defaultBezier',
  transitionProperty: 'background, color, border-color, transform',
  background: (el, s) => (s.root.myGuess === s.value ? 'white' : 'white.08'),
  color: (el, s) => (s.root.myGuess === s.value ? 'black' : 'white'),
  borderColor: (el, s) => (s.root.myGuess === s.value ? 'white' : 'white.14'),
  text: (el, s) => (s.value > 0 ? `+${s.value}` : String(s.value)),
  ':hover': { borderColor: 'gold', transform: 'translateY(-1px)' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
  onClick: (e, el, s) => {
    const root = s.root
    if (root.myBet || (root.phase !== 'preview' && root.phase !== 'betting')) return
    el.call('setGuess', s.value)
  }
}
