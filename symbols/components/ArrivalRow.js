// One line of the arrivals ticker: "kv_ruth is in". Names only; sides stay
// hidden until reveal (state contract v2).
export const ArrivalRow = {
  tag: 'li',
  flow: 'x',
  align: 'baseline flex-start',
  gap: 'spacing1',
  fontSize: 'fontSm',
  lineHeight: '1.6',
  color: 'body',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',

  ArrivalName: { tag: 'span', fontWeight: '600', text: (el, s) => s.name || '' },
  ArrivalVerb: { tag: 'span', text: '{{ arrivedVerb | polyglot }}' }
}
