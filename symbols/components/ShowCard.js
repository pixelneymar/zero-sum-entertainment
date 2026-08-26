export const ShowCard = {
  flow: 'y',
  gap: 'Y',
  padding: 'B',
  round: 'Z',
  theme: 'surface',

  ShowTitle: {
    tag: 'h3',
    text: (el, s) => s.title,
    fontSize: 'C',
    fontWeight: '600',
    lineHeight: 'C',
    letterSpacing: '-X',
    margin: '0'
  },

  ShowMeta: {
    flow: 'x',
    align: 'center flex-start',
    gap: 'Y',
    fontSize: 'Z',
    theme: 'muted',

    ShowFormat: { tag: 'span', text: (el, s) => s.format },
    ShowYear: { tag: 'span', text: (el, s) => s.year }
  }
}
