// One side of the duel, as a pick. Child of BetPanel.Sides via
// childrenAs: 'state': `s.side`, `s.name`, `s.line`, `s.poster` are the
// challenger; `s.root` is the app state. A tap selects; PLACE BET commits.
// Inset card (cards.md): raised surface, own 2px ink border. Selected = ink
// fill + white label + a check/dot icon + aria-pressed (never colour alone).
// Once the bet is in, the backed card stays selected and the other is
// disabled (native disabled, 55% opacity: ink at 55% on beige is 3.56:1).
const canPick = (root) => !root.myBet && (root.phase === 'preview' || root.phase === 'betting')
const isChosen = (root, side) => (root.myBet ? root.myBet.side === side : root.mySide === side)

export const ChallengerCard = {
  extends: 'CkCard',
  tag: 'button',
  flow: 'x',
  align: 'center flex-start',
  gap: 'spacing3',
  flex: '1',
  minWidth: '0',
  padding: 'spacing3',
  fontFamily: 'sans',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease',
  '@reducedMotion': { transition: 'none' },
  background: (el, s) => (isChosen(s.root, s.side) ? 'brandInk' : 'neutralPrimarySoft'),
  color: (el, s) => (isChosen(s.root, s.side) ? 'paper' : 'body'),
  opacity: (el, s) => (s.root.myBet && s.root.myBet.side !== s.side ? '.55' : '1'),
  ':hover': { borderColor: 'darkStrong', boxShadow: 'elevation1' },
  ':disabled': { cursor: 'not-allowed', boxShadow: 'none' },
  // brand-medium ring: 3.8:1 on beige, 3.57:1 on the ink selected fill.
  ':focus-visible': { outline: 'spacing0_5 solid brandInkMedium', outlineOffset: 'spacing0_5' },
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
    background: 'neutralQuaternary',
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
      fontWeight: '600',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      text: (el, s) => s.name || ''
    },

    Line: {
      tag: 'span',
      fontSize: 'fontSm',
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
