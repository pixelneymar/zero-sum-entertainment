export const BetPanel = {
  flow: 'y',
  align: 'center center',
  gap: 'A',
  padding: 'A B',
  round: 'Z',
  theme: 'surface',
  border: '1px solid neutral.2',
  display: (el, s) =>
    s.screen === 'playing' &&
    (s.phase === 'preview' || s.phase === 'betting' || s.phase === 'locked')
      ? 'flex'
      : 'none',

  BetPrompt: {
    tag: 'span',
    text: '{{ betPrompt | polyglot }}',
    fontSize: 'Z',
    fontWeight: '600',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    theme: 'muted'
  },

  GuessRow: {
    flow: 'x',
    align: 'center center',
    gap: 'A',
    transition: 'A defaultBezier',
    transitionProperty: 'opacity',
    display: (el, s) => (s.myBet ? 'none' : 'flex'),
    opacity: (el, s) =>
      s.phase === 'preview' || s.phase === 'betting' ? '1' : '.45',
    pointerEvents: (el, s) =>
      s.phase === 'preview' || s.phase === 'betting' ? 'auto' : 'none',

    StepDown: {
      extends: 'Button',
      text: '−',
      fontSize: 'B',
      fontWeight: '700',
      padding: 'Y Z',
      round: 'Y',
      theme: 'surface',
      border: '1px solid neutral.2',
      cursor: 'pointer',
      ':hover': { borderColor: 'brand' },
      ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
      onClick: (e, el, s) => {
        const game = s.game
        if (!game || s.myBet || (s.phase !== 'preview' && s.phase !== 'betting')) return
        const step = game.guessStep || 1
        const current = s.myGuess == null ? 0 : s.myGuess
        const next = Math.max(game.guessMin, Math.min(game.guessMax, current - step))
        s.update({ myGuess: next })
      }
    },

    GuessValue: {
      flow: 'y',
      align: 'center center',
      gap: 'X',
      minWidth: '4em',
      textAlign: 'center',
      fontVariantNumeric: 'tabular-nums',

      GuessNumber: {
        tag: 'span',
        text: (el, s) => {
          const value = s.myGuess == null ? 0 : s.myGuess
          return value > 0 ? `+${value}` : String(value)
        },
        fontSize: 'D',
        lineHeight: 'D',
        fontWeight: '800',
        letterSpacing: '-X'
      },

      GuessUnit: {
        tag: 'span',
        text: (el, s) => (s.game ? s.game.resultUnit : ''),
        fontSize: 'Z',
        theme: 'muted'
      }
    },

    StepUp: {
      extends: 'Button',
      text: '+',
      fontSize: 'B',
      fontWeight: '700',
      padding: 'Y Z',
      round: 'Y',
      theme: 'surface',
      border: '1px solid neutral.2',
      cursor: 'pointer',
      ':hover': { borderColor: 'brand' },
      ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
      onClick: (e, el, s) => {
        const game = s.game
        if (!game || s.myBet || (s.phase !== 'preview' && s.phase !== 'betting')) return
        const step = game.guessStep || 1
        const current = s.myGuess == null ? 0 : s.myGuess
        const next = Math.max(game.guessMin, Math.min(game.guessMax, current + step))
        s.update({ myGuess: next })
      }
    }
  },

  RangeHint: {
    tag: 'span',
    text: (el, s) => {
      const game = s.game
      if (!game) return ''
      const min = game.guessMin > 0 ? `+${game.guessMin}` : String(game.guessMin)
      const max = game.guessMax > 0 ? `+${game.guessMax}` : String(game.guessMax)
      return `${min} … ${max} ${game.resultUnit}`
    },
    fontSize: 'Z',
    theme: 'muted',
    display: (el, s) => (s.myBet ? 'none' : 'inline')
  },

  PlacedRow: {
    flow: 'x',
    align: 'baseline center',
    gap: 'Y',
    fontVariantNumeric: 'tabular-nums',
    display: (el, s) => (s.myBet ? 'flex' : 'none'),

    PlacedLabel: {
      tag: 'span',
      text: '{{ yourGuess | polyglot }}',
      fontSize: 'A',
      theme: 'muted'
    },

    PlacedValue: {
      tag: 'span',
      text: (el, s) => {
        const bet = s.myBet
        if (!bet) return ''
        const unit = s.game ? s.game.resultUnit : ''
        const value = bet.guess > 0 ? `+${bet.guess}` : String(bet.guess)
        return `${value}${unit}`
      },
      fontSize: 'C',
      lineHeight: 'C',
      fontWeight: '800',
      letterSpacing: '-X'
    }
  },

  PlaceButton: {
    extends: 'Button',
    background: 'brand',
    color: 'white',
    ':hover': { background: 'brand+8' },
    round: 'Y',
    padding: 'Z B',
    fontSize: 'A',
    fontWeight: '700',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'A defaultBezier',
    transitionProperty: 'opacity, background',
    opacity: (el, s) => (!s.myBet && s.phase === 'betting' ? '1' : '.45'),
    pointerEvents: (el, s) => (!s.myBet && s.phase === 'betting' ? 'auto' : 'none'),
    ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
    onClick: (e, el, s) => {
      if (s.myBet || s.phase !== 'betting') return
      const guess = s.myGuess == null ? 0 : s.myGuess
      // The server's place_bet RPC is the only judge — a rejection surfaces
      // via state.error and myBet stays null so the UI shows the bet did NOT
      // go through.
      el.call('submitBet', guess)
    },

    PlaceLabel: {
      tag: 'span',
      text: '{{ placeBet | polyglot }}',
      display: (el, s) => (s.myBet ? 'none' : 'inline')
    },

    PlacedButtonLabel: {
      tag: 'span',
      text: '{{ betPlaced | polyglot }}',
      display: (el, s) => (s.myBet ? 'inline' : 'none')
    }
  }
}
