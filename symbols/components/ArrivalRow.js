// One line of the arrivals ticker: "kv_ruth is in". Names only — guesses
// stay hidden until reveal (state contract v2).
export const ArrivalRow = {
  flow: 'x',
  align: 'baseline flex-start',
  gap: 'X',
  fontSize: 'Z',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  animation: 'tickerIn .45s ease-out both',

  ArrivalName: {
    tag: 'span',
    text: (el, s) => s.name || '',
    fontWeight: '700'
  },

  ArrivalVerb: {
    tag: 'span',
    text: '{{ arrivedVerb | polyglot }}',
    theme: 'onVideoMuted'
  }
}
