// Dial that drains through each timed phase. Brand arc while betting; under
// five seconds the arc turns danger, thickens, and the caption reads Closing
// (no flashing: fundamentals forbid strobing content); a solid brand lock
// dial the instant the duel locks. The dial is a functionally round control
// (radius.md), so it keeps radius-full. The betting window is the footage
// before the lock frame (round.lockAt); the fixed phases mirror
// docs/rounds.md (preview 5, locked 5, results 8).
export const PhaseTimer = {
  flow: 'y',
  align: 'center center',
  gap: 'spacing1',
  display: (el, s) =>
    s.screen === 'playing' &&
    (s.phase === 'preview' ||
      s.phase === 'betting' ||
      s.phase === 'locked' ||
      s.phase === 'reveal' ||
      s.phase === 'results')
      ? 'flex'
      : 'none',

  Dial: {
    position: 'relative',
    flow: 'y',
    align: 'center center',
    width: 'ring',
    height: 'ring',
    round: 'radiusFull',
    borderWidth: 'spacingPx',
    borderStyle: 'solid',
    borderColor: 'paper.30',
    backdropFilter: 'blur(1rem) saturate(1.4)',
    shadow: 'shadowMd',
    transition: 'background-color .15s ease, color .15s ease',
    '@reducedMotion': { transition: 'none' },
    background: (el, s) => (s.phase === 'locked' || s.phase === 'reveal' ? 'brand' : 'neutralPrimary.85'),
    color: (el, s) => (s.phase === 'locked' || s.phase === 'reveal' ? 'paper' : 'heading'),
    attr: {
      role: 'timer',
      'aria-live': 'off',
      'aria-label': (el, s) => (s.phase === 'reveal' ? s.revealWatching || 'Locked' : `${Math.max(0, Math.ceil(s.secondsLeft ?? 0))} s`)
    },

    // Presentation attributes only on the circles: giving them `color`
    // makes the CSS engine emit a fill, so the colour lives on the <svg>
    // and the circles read currentColor.
    Svg: {
      position: 'absolute',
      inset: '0 0 0 0',
      width: '100%',
      height: '100%',
      transform: 'rotate(-90deg)',
      transition: 'color .15s ease',
      '@reducedMotion': { transition: 'none' },
      attr: { viewBox: '0 0 100 100', 'aria-hidden': 'true' },
      color: (el, s) => {
        if (s.phase === 'locked' || s.phase === 'reveal') return 'paper'
        if (s.phase === 'betting' && (s.secondsLeft ?? 99) <= 5) return 'fgDanger'
        return 'fgBrand'
      },

      Track: {
        tag: 'circle',
        opacity: '.22',
        attr: { cx: '50', cy: '50', r: '44', fill: 'none', stroke: 'currentColor', 'stroke-width': '8' }
      },

      Arc: {
        tag: 'circle',
        transition: 'stroke-dashoffset 1s linear',
        '@reducedMotion': { transition: 'none' },
        attr: {
          cx: '50',
          cy: '50',
          r: '44',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': (el, s) => (s.phase === 'betting' && (s.secondsLeft ?? 99) <= 5 ? '12' : '8'),
          'stroke-linecap': 'butt',
          'stroke-dasharray': '276.46',
          'stroke-dashoffset': (el, s) => {
            const totals = { preview: 5, betting: s.round ? s.round.lockAt : 20, locked: 5, results: 8 }
            const total = totals[s.phase] || 1
            const left = Math.max(0, Math.min(total, s.secondsLeft ?? 0))
            const fraction = s.phase === 'locked' || s.phase === 'reveal' ? 1 : left / total
            return String(276.46 * (1 - fraction))
          }
        }
      }
    },

    Seconds: {
      tag: 'span',
      position: 'relative',
      fontFamily: 'sans',
      fontSize: 'font3xl',
      lineHeight: '1',
      fontWeight: '600',
      fontVariantNumeric: 'tabular-nums',
      text: (el, s) => String(Math.max(0, Math.ceil(s.secondsLeft ?? 0))),
      display: (el, s) =>
        s.phase !== 'locked' && s.phase !== 'reveal' && !(s.phase === 'betting' && (s.secondsLeft ?? 99) <= 5)
          ? 'inline'
          : 'none'
    },

    UrgentSeconds: {
      tag: 'span',
      position: 'relative',
      fontFamily: 'sans',
      fontSize: 'font3xl',
      lineHeight: '1',
      fontWeight: '600',
      fontVariantNumeric: 'tabular-nums',
      color: 'fgDanger',
      text: (el, s) => String(Math.max(0, Math.ceil(s.secondsLeft ?? 0))),
      display: (el, s) =>
        s.phase === 'betting' && (s.secondsLeft ?? 99) <= 5 ? 'inline' : 'none'
    },

    Icon: {
      name: 'lock',
      position: 'relative',
      boxSize: 'icon20',
      color: 'paper',
      display: (el, s) => (s.phase === 'locked' || s.phase === 'reveal' ? 'block' : 'none')
    }
  },

  Caption: {
    extends: 'CkEyebrow',
    textAlign: 'center',
    whiteSpace: 'nowrap',

    PreviewLabel: { tag: 'span', text: '{{ timerPreview | polyglot }}', display: (el, s) => (s.phase === 'preview' ? 'inline' : 'none') },
    BettingLabel: { tag: 'span', text: '{{ timerBetting | polyglot }}', display: (el, s) => (s.phase === 'betting' && (s.secondsLeft ?? 99) > 5 ? 'inline' : 'none') },
    ClosingLabel: { tag: 'span', text: '{{ timerClosing | polyglot }}', color: 'fgDanger', display: (el, s) => (s.phase === 'betting' && (s.secondsLeft ?? 99) <= 5 ? 'inline' : 'none') },
    LockedLabel: { tag: 'span', text: '{{ timerLocked | polyglot }}', display: (el, s) => (s.phase === 'locked' || s.phase === 'reveal' ? 'inline' : 'none') },
    ResultsLabel: { tag: 'span', text: '{{ timerResults | polyglot }}', display: (el, s) => (s.phase === 'results' ? 'inline' : 'none') }
  }
}
