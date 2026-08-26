// Keyframes. Every entry becomes `@keyframes <name>` at boot; components
// reference them by name in `animation:`. CSS-only motion — no libraries.
export default {
  livePulse: {
    '0%': { transform: 'scale(1)', opacity: '1' },
    '50%': { transform: 'scale(1.7)', opacity: '.35' },
    '100%': { transform: 'scale(1)', opacity: '1' }
  },
  riseIn: {
    from: { opacity: '0', transform: 'translateY(.75em)' },
    to: { opacity: '1', transform: 'translateY(0)' }
  },
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' }
  },
  stampIn: {
    '0%': { opacity: '0', transform: 'scale(1.8) rotate(-8deg)' },
    '55%': { opacity: '1', transform: 'scale(.94) rotate(-4deg)' },
    '100%': { opacity: '1', transform: 'scale(1) rotate(-4deg)' }
  },
  popIn: {
    '0%': { opacity: '0', transform: 'scale(.55)' },
    '65%': { opacity: '1', transform: 'scale(1.08)' },
    '100%': { opacity: '1', transform: 'scale(1)' }
  },
  tickerIn: {
    from: { opacity: '0', transform: 'translateX(-.6em)' },
    to: { opacity: '1', transform: 'translateX(0)' }
  },
  winGlow: {
    '0%': { boxShadow: '0 0 0 0 rgba(233, 185, 73, .55)' },
    '100%': { boxShadow: '0 0 0 1.4em rgba(233, 185, 73, 0)' }
  },
  barGrow: {
    from: { transform: 'scaleY(0)' },
    to: { transform: 'scaleY(1)' }
  },
  wsSlide: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(400%)' }
  },
  urgentBlink: {
    '0%': { opacity: '1' },
    '50%': { opacity: '.55' },
    '100%': { opacity: '1' }
  }
}
