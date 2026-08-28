// One duel script as a mini timeline: betting runs from frame 0 to the lock,
// then each challenger's scale is read, then the footage ends (labels on
// alternating rows). Child state: a script { id, lockAt, reveal1At,
// reveal2At, endAt, winner, attempts: [{ side, offset, readings }], unit, max }.
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
    flexWrap: 'wrap',
    fontSize: 'Z',
    ScriptId: { tag: 'span', fontWeight: '700', text: (el, s) => String(s.id || '') },
    ScriptResult: {
      flow: 'x',
      align: 'baseline flex-end',
      gap: 'Y',
      flexWrap: 'wrap',
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
          if (s.winner == null) return '—'
          const v = Number(s.winner)
          return v === 0 ? s.root.wsDeadHeat || 'Dead heat' : `${s.root.wsChallenger || 'Challenger'} ${v}`
        }
      },
      AttemptsText: {
        tag: 'span',
        theme: 'wsDim',
        text: (el, s) => {
          const list = Array.isArray(s.attempts) ? s.attempts : []
          if (!list.length) return ''
          return `· ${list
            .map((a) => {
              const rd = a.readings && a.readings.length ? `${a.readings.join(' / ')} → ` : ''
              return `C${a.side} ${rd}${Math.abs(Number(a.offset) || 0)} ${s.unit || ''} off`
            })
            .join(' · ')}`
        }
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
      left: '0',
      width: (el, s) => `${((Number(s.lockAt) || 0) / (Number(s.max) || 1)) * 100}%`
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
          { at: s.lockAt, left: pct(s.lockAt), labelKey: 'wsTlLock', tone: 'gold', row: 'below', anchor: anchor(pct(s.lockAt)) },
          { at: s.reveal1At, left: pct(s.reveal1At), labelKey: 'wsTlReveal1', tone: 'white', row: 'above', anchor: anchor(pct(s.reveal1At)) },
          { at: s.reveal2At, left: pct(s.reveal2At), labelKey: 'wsTlReveal2', tone: 'white', row: 'above', anchor: anchor(pct(s.reveal2At)) },
          { at: s.endAt, left: pct(s.endAt), labelKey: 'wsTlEnd', tone: 'haze', row: 'below', anchor: anchor(pct(s.endAt)) }
        ]
      },
      childExtends: 'WsScriptMark'
    }
  }
}
