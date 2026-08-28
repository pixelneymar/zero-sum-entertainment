// Poster card (TypeUI section 2, cards.md "with image"): a raised beige card
// with a 2px ink border, 2px corners and no resting shadow; the poster bleeds
// to the top edge, the body is padded 24px. The whole card is ONE button
// (selectGame), so the Play affordance inside is a styled span, never a
// nested control. Variants set the poster and copy.
export const GameCard = {
  extends: 'CkCard',
  tag: 'button',
  attr: { type: 'button' },
  flow: 'y',
  align: 'stretch flex-start',
  flex: '1',
  minWidth: 'poster',
  padding: '0',
  overflow: 'hidden',
  fontFamily: 'sans',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'box-shadow .15s ease, border-color .15s ease',
  '@reducedMotion': { transition: 'none' },
  ':hover': { borderColor: 'darkStrong', boxShadow: 'elevation1' },
  ':focus-visible': { outline: 'spacing0_5 solid brandInk', outlineOffset: 'spacing0_5' },

  Img: {
    display: 'block',
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    background: 'neutralQuaternary',
    loading: 'lazy'
  },

  CardBody: {
    flow: 'y',
    align: 'flex-start flex-start',
    width: '100%',
    padding: 'spacing6',
    '@tabletS': { padding: 'spacing4' },

    CardKicker: {
      extends: 'CkEyebrow',
      marginBottom: 'spacing3'
    },

    // Card title: 20px semibold (fundamentals cap card titles at 20px).
    CardTitle: {
      tag: 'h2',
      fontFamily: 'sans',
      fontSize: 'fontXl',
      lineHeight: '1.3',
      fontWeight: '600',
      color: 'heading',
      margin: '0 0 spacing3'
    },

    CardLine: {
      tag: 'p',
      fontFamily: 'sans',
      fontSize: 'fontMd',
      lineHeight: '1.5',
      color: 'body',
      margin: '0 0 spacing3'
    },

    CardMeta: {
      flow: 'x',
      align: 'center flex-start',
      gap: 'spacing2',
      flexWrap: 'wrap',
      marginBottom: 'spacing6',

      StakeNote: {
        extends: 'CkBadgeBordered',
        theme: 'badgeAlt',
        text: '{{ gameStake | polyglot }}'
      }
    },

    // Visual primary action; the card button owns the click.
    CardAction: {
      extends: 'CkButtonPrimary',
      tag: 'span',
      attr: { 'aria-hidden': 'true' },
      ActionLabel: { tag: 'span', text: '{{ playNow | polyglot }}' },
      ActionIcon: { extends: 'Icon', name: 'arrowRight', boxSize: 'icon16' }
    }
  }
}
