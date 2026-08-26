export const HistoryRow = {
  flow: 'x',
  align: 'center space-between',
  gap: 'A',
  padding: 'X 0',
  borderBottom: '1px solid white.10',
  fontVariantNumeric: 'tabular-nums',

  RoundTag: {
    tag: 'span',
    text: (el, s) => `#${s.roundIndex}`,
    fontSize: 'Z',
    theme: 'onVideoMuted'
  },

  ResultText: {
    tag: 'span',
    text: (el, s) => {
      const value = s.value > 0 ? `+${s.value}` : String(s.value)
      return `${value} ${s.unit}`
    },
    fontSize: 'A',
    fontWeight: '700',
    color: (el, s) => (Math.abs(s.value) <= 1 ? 'mint' : 'white')
  }
}
