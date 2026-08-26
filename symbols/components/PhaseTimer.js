// Ring that drains through each timed phase. Gold while betting, ember under
// five seconds, and a solid white lock ring the instant the round locks.
// Phase lengths mirror docs/rounds.md (preview 5, betting 25, locked 5,
// results 8) so the ring reads as a fraction, not just a number.
export const PhaseTimer = {
  flow: 'y',
  align: 'center center',
  gap: 'Y',
  display: (el, s) =>
    s.screen === 'playing' &&
    (s.phase === 'preview' ||
      s.phase === 'betting' ||
      s.phase === 'locked' ||
      s.phase === 'results')
      ? 'flex'
      : 'none',

  Dial: {
    position: 'relative',
    flow: 'y',
    align: 'center center',
    width: 'ring',
    height: 'ring',
    round: 'ring',
    theme: 'glass',
    border: '1px solid white.12',
    shadow: 'glass',
    transition: 'B defaultBezier',
    transitionProperty: 'background, box-shadow',
    background: (el, s) => (s.phase === 'locked' ? 'white' : 'ink.86'),
    color: (el, s) => (s.phase === 'locked' ? 'black' : 'white'),

    // Presentation attributes only on the circles: giving them `color`
    // makes the CSS engine emit a fill, so the colour lives on the <svg>
    // and the circles read currentColor.
    Svg: {
      position: 'absolute',
      inset: '0 0 0 0',
      width: '100%',
      height: '100%',
      transform: 'rotate(-90deg)',
      transition: 'color .3s',
      attr: { viewBox: '0 0 100 100', 'aria-hidden': 'true' },
      color: (el, s) => {
        if (s.phase === 'locked') return 'black'
        if (s.phase === 'betting' && (s.secondsLeft ?? 99) <= 5) return 'ember'
        if (s.phase === 'results') return 'haze'
        return 'gold'
      },

      Track: {
        tag: 'circle',
        opacity: '.18',
        attr: {
          cx: '50',
          cy: '50',
          r: '45',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '6'
        }
      },

      Arc: {
        tag: 'circle',
        transition: 'stroke-dashoffset 1s linear',
        attr: {
          cx: '50',
          cy: '50',
          r: '45',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '6',
          'stroke-linecap': 'round',
          'stroke-dasharray': '282.74',
          'stroke-dashoffset': (el, s) => {
            const totals = { preview: 5, betting: 25, locked: 5, results: 8 }
            const total = totals[s.phase] || 1
            const left = Math.max(0, Math.min(total, s.secondsLeft ?? 0))
            const fraction = s.phase === 'locked' ? 1 : left / total
            return String(282.74 * (1 - fraction))
          }
        }
      }
    },

    Seconds: {
      tag: 'span',
      position: 'relative',
      text: (el, s) => String(Math.max(0, Math.ceil(s.secondsLeft ?? 0))),
      fontSize: 'D',
      lineHeight: 'D',
      fontWeight: '800',
      letterSpacing: '-Y',
      fontVariantNumeric: 'tabular-nums',
      display: (el, s) =>
        s.phase !== 'locked' && !(s.phase === 'betting' && (s.secondsLeft ?? 99) <= 5)
          ? 'inline'
          : 'none'
    },

    UrgentSeconds: {
      tag: 'span',
      position: 'relative',
      text: (el, s) => String(Math.max(0, Math.ceil(s.secondsLeft ?? 0))),
      fontSize: 'D',
      lineHeight: 'D',
      fontWeight: '800',
      letterSpacing: '-Y',
      fontVariantNumeric: 'tabular-nums',
      color: 'ember',
      animation: 'urgentBlink 1s ease-in-out infinite',
      display: (el, s) =>
        s.phase === 'betting' && (s.secondsLeft ?? 99) <= 5 ? 'inline' : 'none'
    },

    Icon: {
      name: 'lock',
      position: 'relative',
      boxSize: 'B',
      color: 'black',
      display: (el, s) => (s.phase === 'locked' ? 'block' : 'none')
    }
  },

  Caption: {
    tag: 'span',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    textShadow: '0 .1em .6em rgba(0, 0, 0, .8)',
    color: (el, s) => (s.phase === 'locked' ? 'white' : 'haze'),

    PreviewLabel: {
      tag: 'span',
      text: '{{ timerPreview | polyglot }}',
      display: (el, s) => (s.phase === 'preview' ? 'inline' : 'none')
    },
    BettingLabel: {
      tag: 'span',
      text: '{{ timerBetting | polyglot }}',
      display: (el, s) => (s.phase === 'betting' ? 'inline' : 'none')
    },
    LockedLabel: {
      tag: 'span',
      text: '{{ timerLocked | polyglot }}',
      display: (el, s) => (s.phase === 'locked' ? 'inline' : 'none')
    },
    ResultsLabel: {
      tag: 'span',
      text: '{{ timerResults | polyglot }}',
      display: (el, s) => (s.phase === 'results' ? 'inline' : 'none')
    }
  }
}
