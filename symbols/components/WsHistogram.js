// Crowd split for the selected round, winning side marked. Data is
// ws.roundDetail.sides — bars scale to the larger side, nothing else is
// computed. Sealed rounds have no split and show a note.
// Plot box: x 16..1264, y 20..136 in a 1280x160 viewBox.
export const WsHistogram = {
  extends: 'WsPanel',
  gap: 'Y',

  PanelHead: {
    PanelTitle: { text: '{{ wsDistributionTitle | polyglot }}' },
    Legend: {
      flow: 'x',
      align: 'center flex-end',
      gap: 'X',
      fontSize: 'Z',
      theme: 'wsMuted',
      LegendDot: { tag: 'span', width: 'Y', height: 'Y', round: 'X', background: 'gold' },
      LegendText: { tag: 'span', text: '{{ legendResult | polyglot }}' }
    }
  },

  SealedNote: {
    flow: 'x',
    align: 'center flex-start',
    gap: 'Y',
    padding: 'Z 0',
    fontSize: 'Z',
    theme: 'wsMuted',
    display: (el, s) => {
      const d = (s.ws || {}).roundDetail
      return d && d.sides && d.sides.length ? 'none' : 'flex'
    },
    Icon: { name: 'lock', boxSize: 'A', color: 'haze' },
    NoteText: { tag: 'span', text: '{{ wsSealedNote | polyglot }}' }
  },

  Svg: {
    width: '100%',
    height: 'auto',
    role: 'img',
    attr: { viewBox: '0 0 1280 160' },
    display: (el, s) => {
      const d = (s.ws || {}).roundDetail
      return d && d.sides && d.sides.length ? 'block' : 'none'
    },

    Baseline: {
      tag: 'g',
      color: 'graphite',
      Line: {
        // frank-allow FA602 — data-driven chart geometry, not an icon
        tag: 'path',
        attr: { d: 'M16 136H1264', stroke: 'currentColor', 'stroke-width': '1', fill: 'none' }
      }
    },

    Bars: {
      tag: 'g',
      childrenAs: 'state',
      children: (el, s) => {
        const d = (s.ws || {}).roundDetail
        const sides = (d && d.sides) || []
        if (!sides.length) return []
        const sorted = sides.slice().sort((a, b) => a.side - b.side)
        const top = sorted.reduce((m, p) => Math.max(m, Number(p.count) || 0), 0) || 1
        const winner = d.round && d.round.result != null ? Number(d.round.result) : null
        const left = 16
        const width = 1248
        const plotTop = 20
        const base = 136
        const n = sorted.length
        const band = width / n
        const w = Math.max(2, Math.min(240, band - 2))
        return sorted.map((p, i) => {
          const count = Number(p.count) || 0
          return {
            side: Number(p.side),
            count,
            x: left + i * band + (band - w) / 2,
            y: base - ((base - plotTop) * count) / top,
            w,
            base,
            isResult: winner != null && Number(p.side) === winner
          }
        })
      },
      childExtends: 'WsHistogramBar'
    }
  }
}
