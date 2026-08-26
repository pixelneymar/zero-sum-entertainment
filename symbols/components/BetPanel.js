// The bet dock. A real range slider (min/max/step from the game) plus
// quick-pick chips; the readout is the big numeral. Guess changes go through
// setGuess, the bet through submitBet — the server is the only judge.
export const BetPanel = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'A',
  padding: 'A B',
  width: 'dock',
  maxWidth: '94vw',
  round: 'B',
  theme: 'glass',
  border: '1px solid white.12',
  shadow: 'glass',
  backdropFilter: 'blur(1.1rem)',
  transition: 'B defaultBezier',
  transitionProperty: 'background, border-color, box-shadow',
  display: (el, s) =>
    s.screen === 'playing' &&
    (s.phase === 'preview' || s.phase === 'betting' || s.phase === 'locked')
      ? 'flex'
      : 'none',
  background: (el, s) => (s.phase === 'locked' ? 'ink.86' : 'steel.62'),
  borderColor: (el, s) => (s.phase === 'locked' ? 'white.32' : 'white.12'),

  HeadRow: {
    flow: 'x',
    align: 'flex-end space-between',
    gap: 'A',

    PromptBlock: {
      flow: 'y',
      align: 'flex-start flex-start',
      gap: 'X',

      BetPrompt: {
        tag: 'span',
        text: '{{ betPrompt | polyglot }}',
        fontSize: 'Z',
        fontWeight: '700',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        theme: 'onVideoMuted'
      },

      ObjectiveText: {
        tag: 'span',
        text: (el, s) => (s.game ? s.game.objectiveLine : ''),
        fontSize: 'A',
        fontWeight: '600',
        letterSpacing: '-X'
      }
    },

    Readout: {
      flow: 'x',
      align: 'baseline flex-end',
      gap: 'Y',
      fontVariantNumeric: 'tabular-nums',

      ReadoutValue: {
        tag: 'span',
        text: (el, s) => {
          const value = s.myBet ? s.myBet.guess : s.myGuess == null ? 0 : s.myGuess
          return value > 0 ? `+${value}` : String(value)
        },
        fontSize: 'G',
        lineHeight: 'G',
        fontWeight: '800',
        letterSpacing: '-Y',
        transition: 'A defaultBezier',
        transitionProperty: 'color',
        color: (el, s) => (s.myBet ? 'gold' : 'white')
      },

      ReadoutUnit: {
        tag: 'span',
        text: (el, s) => (s.game ? s.game.resultUnit : ''),
        fontSize: 'B',
        theme: 'onVideoMuted'
      }
    }
  },

  SliderRow: {
    flow: 'y',
    align: 'stretch flex-start',
    gap: 'Y',
    transition: 'A defaultBezier',
    transitionProperty: 'opacity',
    opacity: (el, s) =>
      !s.myBet && (s.phase === 'preview' || s.phase === 'betting') ? '1' : '.4',
    pointerEvents: (el, s) =>
      !s.myBet && (s.phase === 'preview' || s.phase === 'betting') ? 'auto' : 'none',

    Input: {
      type: 'range',
      width: '100%',
      height: 'B',
      margin: '0',
      padding: '0',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      accentColor: 'gold',
      aria: { label: (el, s) => s.betPrompt || '' },
      min: (el, s) => String(s.game ? s.game.guessMin : -20),
      max: (el, s) => String(s.game ? s.game.guessMax : 20),
      step: (el, s) => String(s.game && s.game.guessStep ? s.game.guessStep : 1),
      disabled: (el, s) =>
        !(!s.myBet && (s.phase === 'preview' || s.phase === 'betting')),
      value: (el, s) => String(s.myBet ? s.myBet.guess : s.myGuess == null ? 0 : s.myGuess),
      ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '4px' },
      onInput: (e, el, s) => {
        if (s.myBet || (s.phase !== 'preview' && s.phase !== 'betting')) return
        el.call('setGuess', Number(e.target.value))
      }
    },

    ScaleRow: {
      flow: 'x',
      align: 'center space-between',
      fontSize: 'Z',
      fontVariantNumeric: 'tabular-nums',
      theme: 'onVideoMuted',

      ScaleMin: {
        tag: 'span',
        text: (el, s) => (s.game ? `${s.game.guessMin} ${s.game.resultUnit}` : '')
      },
      ScaleZero: { tag: 'span', text: '{{ scaleExact | polyglot }}' },
      ScaleMax: {
        tag: 'span',
        text: (el, s) => (s.game ? `+${s.game.guessMax} ${s.game.resultUnit}` : '')
      }
    }
  },

  Chips: {
    flow: 'x',
    align: 'center center',
    gap: 'Y',
    flexWrap: 'wrap',
    transition: 'A defaultBezier',
    transitionProperty: 'opacity',
    opacity: (el, s) =>
      !s.myBet && (s.phase === 'preview' || s.phase === 'betting') ? '1' : '.4',
    pointerEvents: (el, s) =>
      !s.myBet && (s.phase === 'preview' || s.phase === 'betting') ? 'auto' : 'none',

    childrenAs: 'state',
    children: (el, s) => {
      const game = s.game
      const max = game ? Math.abs(game.guessMax) : 20
      const step = game && game.guessStep ? game.guessStep : 1
      const snap = (n) => Math.round(n / step) * step
      return [-1, -0.5, -0.2, 0, 0.2, 0.5, 1].map((fraction) => ({
        value: snap(fraction * max)
      }))
    },
    childExtends: 'GuessChip'
  },

  ActionRow: {
    flow: 'x',
    align: 'center space-between',
    gap: 'A',
    flexWrap: 'wrap',

    StakeNote: {
      tag: 'span',
      text: '{{ rakeNote | polyglot }}',
      fontSize: 'Z',
      theme: 'onVideoMuted'
    },

    PlacedRow: {
      flow: 'x',
      align: 'center flex-start',
      gap: 'Y',
      display: (el, s) => (s.myBet ? 'flex' : 'none'),
      animation: 'popIn .4s ease-out both',

      PlacedTick: {
        tag: 'span',
        text: '✓',
        fontSize: 'A',
        fontWeight: '800',
        color: 'mint'
      },
      PlacedLabel: {
        tag: 'span',
        text: '{{ betPlaced | polyglot }}',
        fontSize: 'A',
        fontWeight: '700'
      },
      PlacedStake: {
        tag: 'span',
        text: (el, s) => (s.myBet ? `· ${s.myBet.stake}` : ''),
        fontSize: 'Z',
        theme: 'onVideoMuted'
      },
      PlacedUnit: {
        tag: 'span',
        text: '{{ chipsUnit | polyglot }}',
        fontSize: 'Z',
        theme: 'onVideoMuted'
      }
    },

    PlaceButton: {
      tag: 'button',
      flow: 'x',
      align: 'center center',
      border: 'none',
      fontFamily: 'inherit',
      background: 'brand',
      color: 'white',
      ':hover': { background: 'brand+8' },
      round: 'C',
      padding: 'Z C',
      fontSize: 'A',
      fontWeight: '800',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      cursor: 'pointer',
      transition: 'A defaultBezier',
      transitionProperty: 'opacity, background, transform',
      display: (el, s) => (s.myBet ? 'none' : 'inline-flex'),
      opacity: (el, s) => (s.phase === 'betting' ? '1' : '.45'),
      pointerEvents: (el, s) => (s.phase === 'betting' ? 'auto' : 'none'),
      ':active': { transform: 'scale(.97)' },
      ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
      onClick: (e, el, s) => {
        if (s.myBet || s.phase !== 'betting') return
        // The server's place_bet is the only judge — a rejection surfaces via
        // state.error while myBet stays null.
        el.call('submitBet', s.myGuess == null ? 0 : s.myGuess)
      },

      PlaceLabel: {
        tag: 'span',
        text: '{{ placeBet | polyglot }}'
      }
    },

    LockedNote: {
      flow: 'x',
      align: 'center flex-end',
      gap: 'Y',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'X',
      textTransform: 'uppercase',
      display: (el, s) => (s.phase === 'locked' ? 'flex' : 'none'),

      Icon: { name: 'lock', boxSize: 'Z', color: 'white' },
      LockedText: { tag: 'span', text: '{{ betsLocked | polyglot }}' }
    }
  }
}
