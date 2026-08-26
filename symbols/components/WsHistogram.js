// Guess distribution for the selected round, result marked. Data is
// ws.roundDetail.distribution — bars scale to the tallest bucket, nothing
// else is computed. Sealed rounds have no distribution and show a note.
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
      return d && d.distribution && d.distribution.length ? 'none' : 'flex'
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
      return d && d.distribution && d.distribution.length ? 'block' : 'none'
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
        const dist = (d && d.distribution) || []
        if (!dist.length) return []
        const sorted = dist.slice().sort((a, b) => a.guess - b.guess)
        const top = sorted.reduce((m, p) => Math.max(m, Number(p.count) || 0), 0) || 1
        const result = d.round && d.round.result != null ? Number(d.round.result) : null
        const left = 16
        const width = 1248
        const plotTop = 20
        const base = 136
        const n = sorted.length
        const band = width / n
        const w = Math.max(2, Math.min(24, band - 2))
        return sorted.map((p, i) => {
          const count = Number(p.count) || 0
          return {
            guess: Number(p.guess),
            count,
            x: left + i * band + (band - w) / 2,
            y: base - ((base - plotTop) * count) / top,
            w,
            base,
            isResult: result != null && Number(p.guess) === result,
            isEdge: i === 0 || i === n - 1
          }
        })
      },
      childExtends: 'WsHistogramBar'
    }
  }
}
