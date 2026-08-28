// Keyframes. Every entry becomes `@keyframes <name>` at boot; components
// reference them by name in `animation:` and switch them off under the
// `@reducedMotion` media token. CSS-only motion; state transitions stay in
// the 100-250ms ease-out budget (typeui-fundamentals ux-principles).
export default {
  // Live status dot (crowd widget).
  livePulse: {
    '0%': { transform: 'scale(1)', opacity: '1' },
    '50%': { transform: 'scale(1.6)', opacity: '.4' },
    '100%': { transform: 'scale(1)', opacity: '1' }
  },
  // Result feedback: the winning card pops, its payout pulses once.
  popIn: {
    from: { opacity: '0', transform: 'scale(.92)' },
    to: { opacity: '1', transform: 'scale(1)' }
  },
  winPulse: {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.08)' },
    '100%': { transform: 'scale(1)' }
  },
  // Result feedback: the losing card rises, its stake shakes once.
  riseIn: {
    from: { opacity: '0', transform: 'translateY(.5rem)' },
    to: { opacity: '1', transform: 'translateY(0)' }
  },
  shake: {
    '0%': { transform: 'translateX(0)' },
    '25%': { transform: 'translateX(-.25rem)' },
    '50%': { transform: 'translateX(.25rem)' },
    '75%': { transform: 'translateX(-.125rem)' },
    '100%': { transform: 'translateX(0)' }
  },
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' }
  },
  // Workspace console charts.
  barGrow: {
    from: { transform: 'scaleY(0)' },
    to: { transform: 'scaleY(1)' }
  },
  barGrowX: {
    from: { transform: 'scaleX(0)' },
    to: { transform: 'scaleX(1)' }
  },
  wsSlide: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(400%)' }
  }
}
