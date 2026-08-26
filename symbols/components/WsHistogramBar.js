// One bar of the round's guess distribution. Child state: { guess, count,
// x, y, w, base, isResult, isEdge }. Result bar in gold; the rest recede.
export const WsHistogramBar = {
  tag: 'g',
  color: (el, s) => (s.isResult ? 'gold' : 'haze'),
  opacity: (el, s) => (s.isResult ? '1' : '.45'),
  ':hover': { opacity: '1' },

  Bar: {
    // frank-allow FA602 — data-driven chart geometry, not an icon
    tag: 'path',
    attr: {
      fill: 'currentColor',
      d: (el, s) => {
        const r = Math.min(4, s.w / 2, Math.max(0, s.base - s.y))
        const x = s.x
        const w = s.w
        const y = s.y
        const base = s.base
        if (base - y <= 0.5) return `M${x} ${base - 0.5}H${x + w}V${base}H${x}Z`
        return `M${x} ${base}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${base}Z`
      }
    },
    Tip: { tag: 'title', text: (el, s) => `${s.guess > 0 ? '+' : ''}${s.guess}: ${s.count}` }
  },

  Hit: {
    tag: 'rect',
    attr: {
      fill: 'transparent',
      x: (el, s) => String(s.x - 1),
      y: '0',
      width: (el, s) => String(s.w + 2),
      height: (el, s) => String(s.base)
    },
    Tip: { tag: 'title', text: (el, s) => `${s.guess > 0 ? '+' : ''}${s.guess}: ${s.count}` }
  },

  CountLabel: {
    tag: 'text',
    fontSize: 'Z',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
    attr: {
      x: (el, s) => String(s.x + s.w / 2),
      y: (el, s) => String(s.y - 4),
      'text-anchor': 'middle',
      fill: 'currentColor'
    },
    text: (el, s) => String(s.count),
    display: (el, s) => (s.isResult ? 'block' : 'none')
  },

  GuessLabel: {
    tag: 'text',
    fontSize: 'Z',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
    attr: {
      x: (el, s) => String(s.x + s.w / 2),
      y: (el, s) => String(s.base + 16),
      'text-anchor': 'middle',
      fill: 'currentColor'
    },
    text: (el, s) => (s.guess > 0 ? `+${s.guess}` : String(s.guess)),
    display: (el, s) => (s.isResult || s.isEdge ? 'block' : 'none')
  }
}
