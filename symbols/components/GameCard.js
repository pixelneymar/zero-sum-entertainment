export const GameCard = {
  tag: 'button',
  flow: 'y',
  align: 'flex-start flex-start',
  gap: 'A',
  padding: 'B',
  round: 'Z',
  theme: 'surface',
  border: '1px solid neutral.2',
  textAlign: 'left',
  cursor: 'pointer',
  flex: '1',
  minWidth: '16em',
  transition: 'A defaultBezier',
  transitionProperty: 'border-color, background, box-shadow',
  ':hover': { borderColor: 'brand' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },

  CardGlyph: {
    tag: 'span',
    fontSize: 'E',
    lineHeight: 'E'
  },

  CardTitle: {
    tag: 'h2',
    fontSize: 'C',
    lineHeight: 'C',
    fontWeight: '700',
    letterSpacing: '-X',
    margin: '0'
  },

  CardLine: {
    tag: 'p',
    fontSize: 'A',
    lineHeight: 'B',
    theme: 'muted',
    margin: '0'
  },

  CardMeta: {
    flow: 'x',
    align: 'center flex-start',
    gap: 'Y',
    fontSize: 'Z',
    theme: 'muted',

    RangeNote: { tag: 'span', text: '{{ gameRange | polyglot }}' },
    MetaDot: { tag: 'span', text: '·' },
    StakeNote: { tag: 'span', text: '{{ gameStake | polyglot }}' }
  },

  CardAction: {
    tag: 'span',
    text: '{{ playNow | polyglot }}',
    fontSize: 'Z',
    fontWeight: '700',
    letterSpacing: 'X',
    textTransform: 'uppercase',
    color: 'brand'
  }
}
