// Poster card: a still from the footage, a shade, and the pitch. Variants set
// the poster and copy; selection goes through selectGame.
export const GameCard = {
  tag: 'button',
  position: 'relative',
  flow: 'y',
  align: 'flex-start flex-end',
  flex: '1',
  minWidth: 'poster',
  aspectRatio: '4 / 5',
  padding: 'B',
  round: 'B',
  overflow: 'hidden',
  border: '1px solid white.12',
  background: 'ink',
  color: 'white',
  textAlign: 'left',
  cursor: 'pointer',
  shadow: 'glass',
  transition: 'B defaultBezier',
  transitionProperty: 'transform, border-color, box-shadow',
  ':hover': { transform: 'translateY(-.35em)', borderColor: 'gold' },
  ':focus-visible': { outline: '2px solid currentColor', outlineOffset: '3px' },

  Img: {
    position: 'absolute',
    inset: '0 0 0 0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'C defaultBezier',
    transitionProperty: 'transform',
    loading: 'lazy'
  },

  Shade: {
    position: 'absolute',
    inset: '0 0 0 0',
    background: 'posterShade',
    pointerEvents: 'none'
  },

  CardBody: {
    position: 'relative',
    flow: 'y',
    align: 'flex-start flex-start',
    gap: 'Y',
    width: '100%',

    CardKicker: {
      tag: 'span',
      fontSize: 'Z',
      fontWeight: '700',
      letterSpacing: 'Y',
      textTransform: 'uppercase',
      color: 'gold'
    },

    CardTitle: {
      tag: 'h2',
      fontSize: 'E',
      lineHeight: 'E',
      fontWeight: '800',
      letterSpacing: '-Y',
      margin: '0'
    },

    CardLine: {
      tag: 'p',
      fontSize: 'A',
      lineHeight: 'B',
      theme: 'onVideoMuted',
      margin: '0'
    },

    CardMeta: {
      flow: 'x',
      align: 'center flex-start',
      gap: 'Y',
      fontSize: 'Z',
      theme: 'onVideoMuted',
      fontVariantNumeric: 'tabular-nums',

      RangeNote: { tag: 'span' },
      MetaDot: { tag: 'span', text: '·' },
      StakeNote: { tag: 'span', text: '{{ gameStake | polyglot }}' }
    },

    CardAction: {
      flow: 'x',
      align: 'center center',
      gap: 'Y',
      marginTop: 'Y',
      padding: 'Y A',
      round: 'C',
      background: 'white',
      color: 'black',
      fontSize: 'Z',
      fontWeight: '800',
      letterSpacing: 'X',
      textTransform: 'uppercase',

      ActionLabel: { tag: 'span', text: '{{ playNow | polyglot }}' },
      ActionArrow: { tag: 'span', text: '→' }
    }
  }
}
