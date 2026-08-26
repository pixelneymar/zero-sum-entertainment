// A small chart panel over one series of state.ws.series. Child state:
// { seriesKey, titleKey, kind: 'bar'|'line', format }. Inline SVG, one
// hue, hairline grid, y ticks at 0 and max, x labels at the ends only.
// Plot box: x 52..632, y 16..124 in a 640x150 viewBox.
export const WsChartCard = {
  extends: 'WsPanel',
  gap: 'Y',

  PanelHead: {
    PanelTitle: { text: (el, s) => s.root[s.titleKey] || s.titleKey },
    PointCount: {
      tag: 'span',
      fontSize: 'Z',
      fontVariantNumeric: 'tabular-nums',
      theme: 'wsDim',
      text: (el, s) => {
        const series = ((s.root.ws || {}).series || {})[s.seriesKey] || []
        return series.length ? String(series.length) : ''
      }
    }
  },

  ChartEmpty: {
    tag: 'span',
    fontSize: 'Z',
    theme: 'wsDim',
    padding: 'A 0',
    text: '{{ wsChartEmpty | polyglot }}',
    display: (el, s) => {
      const series = ((s.root.ws || {}).series || {})[s.seriesKey] || []
      return series.length ? 'none' : 'inline'
    }
  },

  Svg: {
    width: '100%',
    height: 'auto',
    color: 'azure',
    role: 'img',
    attr: { viewBox: '0 0 640 150' },
    display: (el, s) => {
      const series = ((s.root.ws || {}).series || {})[s.seriesKey] || []
      return series.length ? 'block' : 'none'
    },

    Grid: {
      tag: 'g',
      color: 'graphite',
      GridLines: {
        // frank-allow FA602 — data-driven chart geometry, not an icon
        tag: 'path',
        attr: { d: 'M52 16H632M52 70H632', stroke: 'currentColor', 'stroke-width': '1', fill: 'none' }
      },
      Baseline: {
        // frank-allow FA602 — data-driven chart geometry, not an icon
        tag: 'path',
        attr: { d: 'M52 124H632', stroke: 'currentColor', 'stroke-width': '1', fill: 'none' }
      }
    },

    Ticks: {
      tag: 'g',
      color: 'neutral',
      TickMax: {
        tag: 'text',
        fontSize: 'Z',
        fontVariantNumeric: 'tabular-nums',
        attr: { x: '46', y: '20', 'text-anchor': 'end', fill: 'currentColor' },
        text: (el, s) => {
          const series = ((s.root.ws || {}).series || {})[s.seriesKey] || []
          const max = series.reduce((m, p) => Math.max(m, Number(p.value) || 0), 0)
          if (s.format === 'x') return `${max.toFixed(1)}×`
          return Math.round(max).toLocaleString('en-US')
        }
      },
      TickZero: {
        tag: 'text',
        fontSize: 'Z',
        fontVariantNumeric: 'tabular-nums',
        attr: { x: '46', y: '128', 'text-anchor': 'end', fill: 'currentColor' },
        text: '0'
      },
      XFirst: {
        tag: 'text',
        fontSize: 'Z',
        attr: { x: '52', y: '144', 'text-anchor': 'start', fill: 'currentColor' },
        text: (el, s) => {
          const series = ((s.root.ws || {}).series || {})[s.seriesKey] || []
          return series.length ? String(series[0].label) : ''
        }
      },
      XLast: {
        tag: 'text',
        fontSize: 'Z',
        attr: { x: '632', y: '144', 'text-anchor': 'end', fill: 'currentColor' },
        text: (el, s) => {
          const series = ((s.root.ws || {}).series || {})[s.seriesKey] || []
          return series.length > 1 ? String(series[series.length - 1].label) : ''
        }
      }
    },

    Bars: {
      tag: 'g',
      display: (el, s) => (s.kind === 'bar' ? 'block' : 'none'),
      childrenAs: 'state',
      children: (el, s) => {
        if (s.kind !== 'bar') return []
        const series = ((s.root.ws || {}).series || {})[s.seriesKey] || []
        const n = series.length
        if (!n) return []
        const left = 52
        const width = 580
        const top = 16
        const base = 124
        const max = series.reduce((m, p) => Math.max(m, Number(p.value) || 0), 0) || 1
        const band = width / n
        const w = Math.max(2, Math.min(24, band - 2))
        let maxIndex = 0
        series.forEach((p, i) => {
          if ((Number(p.value) || 0) > (Number(series[maxIndex].value) || 0)) maxIndex = i
        })
        return series.map((p, i) => {
          const value = Number(p.value) || 0
          const h = ((base - top) * value) / max
          return {
            x: left + i * band + (band - w) / 2,
            y: base - h,
            w,
            base,
            label: String(p.label),
            value,
            text: s.format === 'x' ? `${value.toFixed(2)}×` : Math.round(value).toLocaleString('en-US'),
            isMax: i === maxIndex,
            isLast: i === n - 1
          }
        })
      },
      childExtends: 'WsChartBar'
    },

    Line: {
      // frank-allow FA602 — data-driven chart geometry, not an icon
      tag: 'path',
      display: (el, s) => (s.kind === 'line' ? 'block' : 'none'),
      attr: {
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
        d: (el, s) => {
          if (s.kind !== 'line') return ''
          const series = ((s.root.ws || {}).series || {})[s.seriesKey] || []
          const n = series.length
          if (!n) return ''
          const left = 52
          const width = 580
          const top = 16
          const base = 124
          const max = series.reduce((m, p) => Math.max(m, Number(p.value) || 0), 0) || 1
          const step = n > 1 ? width / (n - 1) : 0
          return series
            .map((p, i) => {
              const x = n > 1 ? left + i * step : left + width / 2
              const y = base - ((base - top) * (Number(p.value) || 0)) / max
              return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
            })
            .join('')
        }
      }
    },

    Points: {
      tag: 'g',
      display: (el, s) => (s.kind === 'line' ? 'block' : 'none'),
      childrenAs: 'state',
      children: (el, s) => {
        if (s.kind !== 'line') return []
        const series = ((s.root.ws || {}).series || {})[s.seriesKey] || []
        const n = series.length
        if (!n) return []
        const left = 52
        const width = 580
        const top = 16
        const base = 124
        const max = series.reduce((m, p) => Math.max(m, Number(p.value) || 0), 0) || 1
        const step = n > 1 ? width / (n - 1) : 0
        return series.map((p, i) => {
          const value = Number(p.value) || 0
          return {
            x: n > 1 ? left + i * step : left + width / 2,
            y: base - ((base - top) * value) / max,
            base,
            label: String(p.label),
            value,
            text: s.format === 'x' ? `${value.toFixed(2)}×` : Math.round(value).toLocaleString('en-US'),
            isLast: i === n - 1
          }
        })
      },
      childExtends: 'WsChartPoint'
    }
  }
}
