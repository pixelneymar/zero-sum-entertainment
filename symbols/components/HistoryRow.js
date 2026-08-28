// One past duel: who won and by what margins. Child state: a history entry
// { roundIndex, winner, offsets: [o1, o2], unit }; s.root is the app state.
// Flush list row with a 1px white 10% rule (tables.md flush data, radius none).
export const HistoryRow = {
  tag: 'li',
  flow: 'x',
  align: 'center space-between',
  gap: 'spacing2',
  padding: 'spacing2 0',
  borderBottomWidth: 'spacingPx',
  borderBottomStyle: 'solid',
  borderBottomColor: 'paper.10',
  ':last-child': { borderBottomWidth: '0' },
  fontSize: 'fontSm',
  lineHeight: '1.6',
  color: 'body',
  fontVariantNumeric: 'tabular-nums',

  // The index only distinguishes rows in server mode (demo rounds are all #1).
  RoundTag: { tag: 'span', color: 'bodySubtle', display: (el, s) => (s.root.mode === 'server' ? 'inline' : 'none'), text: (el, s) => `#${s.roundIndex}` },

  WinnerText: {
    color: 'heading',
    flow: 'x',
    align: 'center flex-start',
    gap: 'spacing1',
    minWidth: '0',
    flex: '1',
    WinIcon: {
      extends: 'Icon',
      name: 'trophy',
      boxSize: 'icon14',
      flexShrink: '0',
      attr: { 'aria-hidden': 'true' },
      display: (el, s) => (s.winner === 0 ? 'none' : 'block')
    },
    WinnerName: {
      tag: 'span',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      text: (el, s) => {
        if (s.winner === 0) return s.root.deadHeat || 'Dead heat'
        const names = (s.root.game && s.root.game.challengers) || []
        const c = names[s.winner - 1]
        return c ? c.name : `Challenger ${s.winner}`
      }
    }
  },

  OffsetsText: {
    tag: 'span',
    color: 'bodySubtle',
    whiteSpace: 'nowrap',
    text: (el, s) => {
      const o = Array.isArray(s.offsets) ? s.offsets : []
      if (o.length < 2 || o[0] == null || o[1] == null) return ''
      return `${Math.abs(o[0])} · ${Math.abs(o[1])} ${s.unit || ''}`
    }
  }
}
