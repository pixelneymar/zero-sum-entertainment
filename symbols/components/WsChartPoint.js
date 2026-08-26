// A marker on a small line chart. Child state: { x, y, label, text, isLast,
// base }. Radius 4 with a 2-unit surface ring; the last point is labelled.
export const WsChartPoint = {
  tag: 'g',
  cursor: 'default',

  Hit: {
    tag: 'rect',
    attr: {
      fill: 'transparent',
      x: (el, s) => String(s.x - 10),
      y: '0',
      width: '20',
      height: (el, s) => String(s.base)
    },
    Tip: { tag: 'title', text: (el, s) => `${s.label}: ${s.text}` }
  },

  Dot: {
    tag: 'circle',
    attr: {
      cx: (el, s) => String(s.x),
      cy: (el, s) => String(s.y),
      r: '4',
      fill: 'currentColor',
      stroke: 'var(--color-slate, transparent)',
      'stroke-width': '2'
    },
    display: (el, s) => (s.isLast ? 'block' : 'none'),
    Tip: { tag: 'title', text: (el, s) => `${s.label}: ${s.text}` }
  },

  EndLabel: {
    tag: 'text',
    fontSize: 'Z',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
    attr: {
      x: (el, s) => String(s.x),
      y: (el, s) => String(s.y - 8),
      'text-anchor': 'end',
      fill: 'currentColor'
    },
    text: (el, s) => s.text,
    display: (el, s) => (s.isLast ? 'block' : 'none')
  }
}
