// Which source the console is reading. Mirrors the game's DemoBadge rule:
// a simulated store must be labelled, always.
export const WsSourceBadge = {
  flow: 'x',
  align: 'center flex-start',
  gap: 'Y',
  padding: 'X Z',
  round: 'C',
  theme: 'chip',
  border: '1px solid white.14',
  fontSize: 'Y',
  fontWeight: '700',
  letterSpacing: 'X',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  alignSelf: 'flex-start',

  SourceDot: {
    tag: 'span',
    width: 'Y',
    height: 'Y',
    round: 'Y',
    background: (el, s) => {
      const source = (s.ws || {}).source
      return source === 'server' ? 'mint' : source === 'demo' ? 'gold' : 'neutral'
    }
  },

  SourceDemo: {
    tag: 'span',
    text: '{{ wsSourceDemo | polyglot }}',
    display: (el, s) => ((s.ws || {}).source === 'demo' ? 'inline' : 'none')
  },
  SourceServer: {
    tag: 'span',
    text: '{{ wsSourceServer | polyglot }}',
    display: (el, s) => ((s.ws || {}).source === 'server' ? 'inline' : 'none')
  },
  SourceNone: {
    tag: 'span',
    text: '{{ wsSourceNone | polyglot }}',
    display: (el, s) => ((s.ws || {}).source ? 'none' : 'inline')
  }
}
