// One side of the duel, as a pick. Child of a BetPane's CardSlot via
// childrenAs: 'state': `s.side`, `s.name`, `s.line`, `s.poster` are the
// challenger; `s.root` is the app state. A tap selects; PLACE BET commits.
// Inner glass card (cards.md interactive) with a white 30% control boundary
// (fundamentals: 3:1). Selected = brand fill + white label + a check/dot
// icon + aria-pressed (never colour alone). Once the bet is in, the backed
// card stays selected and the other is natively disabled at 55% opacity.
const canPick = (root) => !root.myBet && (root.phase === 'preview' || root.phase === 'betting')
const isChosen = (root, side) => (root.myBet ? root.myBet.side === side : root.mySide === side)

export const ChallengerCard = {
  tag: 'button',
  // Not a CkCard: a theme would override the background function below, and
  // theme functions resolve one root update late in this runtime.
  backdropFilter: 'blur(1rem) saturate(1.4)',
  borderWidth: 'spacingPx',
  borderStyle: 'solid',
  round: 'radiusDefault',
  shadow: 'shadowXs',
  flow: 'x',
  align: 'center flex-start',
  gap: 'spacing2_5',
  flex: '1',
  minWidth: '0',
  padding: 'spacing4',
  fontFamily: 'sans',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color .2s ease-out, color .2s ease-out, border-color .2s ease-out, box-shadow .2s ease-out, transform .2s ease-out',
  '@reducedMotion': { transition: 'none', ':hover': { transform: 'none' } },
  // Over the footage: stage glass when idle; brand when picked or backed;
  // the spec disabled surface once the bet is on the other side.
  background: (el, s) => (isChosen(s.root, s.side) ? 'brand' : s.root.myBet ? 'disabled' : 'neutralPrimary.85'),
  color: (el, s) => (isChosen(s.root, s.side) ? 'paper' : s.root.myBet ? 'fgDisabled' : 'body'),
  borderColor: (el, s) => (isChosen(s.root, s.side) ? 'paper.30' : 'paper.40'),
  ':hover': { shadow: 'shadowSm', transform: 'translateY(-2px)' },
  ':disabled': { cursor: 'not-allowed', shadow: 'none', transform: 'none' },
  ':focus-visible': { outline: 'spacing0_5 solid paper', outlineOffset: 'spacing0_5' },
  attr: {
    type: 'button',
    'aria-pressed': (el, s) => (isChosen(s.root, s.side) ? 'true' : 'false'),
    disabled: (el, s) => (canPick(s.root) ? undefined : 'true')
  },
  onClick: (e, el, s) => {
    if (!canPick(s.root)) return
    el.call('setSide', s.side)
  },

  // Avatar: functionally round (radius.md), 2px ring in the current text colour.
  Portrait: {
    tag: 'img',
    width: 'portrait',
    height: 'portrait',
    flexShrink: '0',
    round: 'radiusFull',
    objectFit: 'cover',
    background: 'neutralPrimaryMedium',
    borderWidth: 'spacing0_5',
    borderStyle: 'solid',
    borderColor: 'currentColor',
    attr: { alt: '', loading: 'lazy', src: (el, s) => s.poster || '' }
  },

  Body: {
    flow: 'y',
    align: 'flex-start center',
    gap: 'spacing1',
    minWidth: '0',
    flex: '1',

    SideTag: {
      extends: 'CkEyebrow',
      color: 'inherit',
      text: (el, s) => `${s.root.sideWord || 'Side'} ${s.side}`
    },

    Name: {
      tag: 'span',
      fontSize: 'fontLg',
      lineHeight: '1.3',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      text: (el, s) => s.name || ''
    },

    Line: {
      tag: 'span',
      fontSize: 'fontMd',
      lineHeight: '1.3',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      text: (el, s) => s.line || ''
    }
  },

  // Selection cue beyond colour: a check once backed, a dot while picked.
  PickedIcon: {
    extends: 'Icon',
    name: (el, s) => (s.root.myBet ? 'check' : 'radio'),
    boxSize: 'icon20',
    flexShrink: '0',
    attr: { 'aria-hidden': 'true' },
    display: (el, s) => (isChosen(s.root, s.side) ? 'block' : 'none')
  }
}
