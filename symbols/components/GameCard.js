// Poster card (cards.md interactive): a glass card with its own border,
// blur and shadow. The poster bleeds to the top edge under the 16px
// corners; the body is padded 24px. The whole card is ONE button
// (selectGame), so the Play affordance inside is a styled span, never a
// nested control. Variants set the poster and copy.
export const GameCard = {
  extends: 'CkCardInteractive',
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
  color: 'body',

  Img: {
    display: 'block',
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    background: 'neutralPrimaryMedium',
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
      color: 'fgBrand',
      marginBottom: 'spacing2'
    },

    // Card heading (cards.md): 20px medium, heading colour. A span, because the
    // whole card is a <button> (phrasing content only).
    CardTitle: {
      tag: 'span',
      display: 'block',
      fontFamily: 'sans',
      fontSize: 'fontXl',
      '@mobileL': { fontSize: 'fontMd' },
      lineHeight: '1.3',
      fontWeight: '500',
      color: 'heading',
      // cards tier (spacing-principles): 16px between title and body.
      margin: '0 0 spacing4'
    },

    CardLine: {
      tag: 'span',
      display: 'block',
      fontFamily: 'sans',
      fontSize: 'fontMd',
      lineHeight: '1.625',
      color: 'body',
      margin: '0 0 spacing4'
    },

    CardMeta: {
      flow: 'x',
      align: 'center space-between',
      gap: 'spacing3',
      flexWrap: 'wrap',
      width: '100%',

      StakeNote: {
        extends: 'CkBadgeLg',
        theme: 'badgeBrand',
        borderColor: 'borderBrandSubtle',
        text: '{{ gameStake | polyglot }}'
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
}
