// One round script as a mini timeline: bet_open → reveal → pause (labels on
// alternating rows), with the result read off the frame. Child state: a script { id, betOpenAt,
// revealAt, pauseAt, readings, result, unit, max }.
export const WsScriptTimeline = {
  flow: 'y',
  align: 'stretch flex-start',
  gap: 'Y',
  padding: 'Z 0',
  borderTop: '1px solid white.08',

  ScriptHead: {
    flow: 'x',
    align: 'baseline space-between',
    gap: 'A',
    fontSize: 'Z',
    ScriptId: { tag: 'span', fontWeight: '700', text: (el, s) => String(s.id || '') },
    ScriptResult: {
      flow: 'x',
      align: 'baseline flex-end',
      gap: 'Y',
      ResultWord: {
        tag: 'span',
        fontSize: 'Y',
        fontWeight: '700',
        letterSpacing: 'X',
        textTransform: 'uppercase',
        theme: 'wsMuted',
        text: '{{ wsTlResult | polyglot }}'
      },
      ResultValue: {
        tag: 'span',
        fontWeight: '800',
        color: 'gold',
        text: (el, s) => {
          if (s.result == null) return '—'
          const v = Number(s.result)
          return `${v > 0 ? '+' : ''}${v} ${s.unit || ''}`
        }
      },
      ReadingsText: {
        tag: 'span',
        theme: 'wsDim',
        text: (el, s) => (s.readings && s.readings.length ? `· ${s.readings.join(' / ')}` : '')
      }
    }
  },

  Track: {
    position: 'relative',
    height: 'D',

    Rail: {
      position: 'absolute',
      top: 'B',
      left: '0',
      right: '0',
      height: 'W',
      round: 'W',
      background: 'white.10'
    },
    BettingSpan: {
      position: 'absolute',
      top: 'B',
      height: 'W',
      round: 'W',
      background: 'gold',
      left: (el, s) => `${((Number(s.betOpenAt) || 0) / (Number(s.max) || 1)) * 100}%`,
      width: (el, s) => `${(((Number(s.revealAt) || 0) - (Number(s.betOpenAt) || 0)) / (Number(s.max) || 1)) * 100}%`
    },

    Marks: {
      position: 'absolute',
      inset: '0 0 0 0',
      childrenAs: 'state',
      children: (el, s) => {
        const max = Number(s.max) || 1
        const pct = (v) => ((Number(v) || 0) / max) * 100
        const anchor = (p) => (p < 12 ? 'start' : p > 88 ? 'end' : 'middle')
        return [
          { at: s.betOpenAt, left: pct(s.betOpenAt), labelKey: 'wsTlBetOpen', tone: 'gold', row: 'below', anchor: anchor(pct(s.betOpenAt)) },
          { at: s.revealAt, left: pct(s.revealAt), labelKey: 'wsTlReveal', tone: 'white', row: 'above', anchor: anchor(pct(s.revealAt)) },
          { at: s.pauseAt, left: pct(s.pauseAt), labelKey: 'wsTlPause', tone: 'haze', row: 'below', anchor: anchor(pct(s.pauseAt)) }
        ]
      },
      childExtends: 'WsScriptMark'
    }
  }
}
