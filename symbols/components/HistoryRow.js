export const HistoryRow = {
  flow: 'x',
  align: 'center space-between',
  gap: 'A',
  padding: 'X 0',
  borderBottom: '1px solid neutral.2',

  RoundTag: {
    tag: 'span',
    text: (el, s) => `#${s.roundIndex}`,
    fontSize: 'Z',
    theme: 'muted'
  },

  ResultText: {
    tag: 'span',
    text: (el, s) => {
      const value = s.value > 0 ? `+${s.value}` : String(s.value)
      return `${value}${s.unit}`
    },
    fontSize: 'A',
    fontWeight: '600',
    color: (el, s) => (Math.abs(s.value) <= 1 ? 'mint' : 'currentColor')
  }
}
