// The one tile that matters: did stakes = prize + house hold on every
// settled round? Green when the source says yes; red with the breach count.
export const WsConservationTile = {
  flow: 'x',
  align: 'center flex-start',
  gap: 'A',
  flexWrap: 'wrap',
  padding: 'Z A',
  round: 'A',
  border: '1px solid white.10',
  minWidth: '0',
  color: 'white',
  background: (el, s) => {
    const o = (s.ws || {}).overview
    if (!o || !o.rounds) return 'slate'
    return o.conservationOk ? 'mint' : 'ember'
  },

  ConsLabel: {
    tag: 'span',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    opacity: '.85',
    text: '{{ wsColConserved | polyglot }}'
  },

  ConsHead: {
    flow: 'x',
    align: 'baseline flex-start',
    gap: 'Y',

    ConsMark: {
      tag: 'span',
      fontSize: 'C',
      lineHeight: 'C',
      fontWeight: '800',
      text: (el, s) => {
        const o = (s.ws || {}).overview
        if (!o || !o.rounds) return '—'
        return o.conservationOk ? '✓' : '✗'
      }
    },
    ConsOk: {
      tag: 'span',
      fontSize: 'A',
      fontWeight: '700',
      text: '{{ wsConservationOk | polyglot }}',
      display: (el, s) => {
        const o = (s.ws || {}).overview
        return o && o.rounds && o.conservationOk ? 'inline' : 'none'
      }
    },
    ConsBreach: {
      flow: 'x',
      align: 'baseline flex-start',
      gap: 'X',
      fontSize: 'A',
      fontWeight: '700',
      display: (el, s) => {
        const o = (s.ws || {}).overview
        return o && o.rounds && !o.conservationOk ? 'flex' : 'none'
      },
      BreachWord: { tag: 'span', text: '{{ wsConservationBreach | polyglot }}' },
      BreachCount: {
        tag: 'span',
        text: (el, s) => {
          const o = (s.ws || {}).overview
          return o ? `· ${o.breaches || 0}` : ''
        }
      },
      BreachUnit: { tag: 'span', text: '{{ wsBreachesWord | polyglot }}' }
    },
    ConsNone: {
      tag: 'span',
      fontSize: 'A',
      fontWeight: '700',
      theme: 'wsMuted',
      text: '{{ wsChartEmpty | polyglot }}',
      display: (el, s) => {
        const o = (s.ws || {}).overview
        return o && o.rounds ? 'none' : 'inline'
      }
    }
  },

  ConsNote: {
    tag: 'span',
    fontSize: 'Z',
    opacity: '.8',
    text: '{{ wsConservationNote | polyglot }}'
  }
}
