// One column of a small bar chart. Child state: { x, y, w, base, label,
// value, text, isMax, isLast }. Rounded 4-unit data-end, square baseline,
// native tooltip via <title>, direct label on the extreme only.
export const WsChartBar = {
  tag: 'g',
  cursor: 'default',
  ':hover': { opacity: '.75' },

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
    Tip: { tag: 'title', text: (el, s) => `${s.label}: ${s.text}` }
  },

  Hit: {
    tag: 'rect',
    attr: {
      fill: 'transparent',
      x: (el, s) => String(s.x - 2),
      y: '0',
      width: (el, s) => String(s.w + 4),
      height: (el, s) => String(s.base)
    },
    Tip: { tag: 'title', text: (el, s) => `${s.label}: ${s.text}` }
  },

  ValueLabel: {
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
    text: (el, s) => s.text,
    display: (el, s) => (s.isMax ? 'block' : 'none')
  }
}
