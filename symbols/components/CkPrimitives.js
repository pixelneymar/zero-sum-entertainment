// TypeUI Perspective primitives. Every game component extends one of these so
// surface, blur, radius, border, shadow, type and focus come from one spec
// chain (.claude/skills/typeui-design-system/{cards,buttons,badges,
// typography,radius,shadows,borders}.md).
// Fundamentals (typeui-fundamentals) override the skill where stricter:
// 16px interactive text (spec base button is 14px), 44px targets, a 2px white
// focus ring with a 2px offset (the spec's 4px brand-medium ring is ~1.2:1 on
// navy), control boundaries at white 30% (border-default-medium is 1.17:1),
// hover transitions at 200ms (spec 300ms, fundamentals 100-250ms). Buttons use
// the spec's Large row (16px, 12x20) because the 16px label floor applies.
// letter-spacing and background-size take literal values because the runtime
// does not route those properties through the named-size resolver.

// ---- eyebrow / all-caps label (typography.md: 12-14px, 0.6px tracking) ----
export const CkEyebrow = {
  tag: 'span',
  fontFamily: 'sans',
  fontSize: 'fontSm',
  fontWeight: '500',
  lineHeight: '1.3',
  letterSpacing: '0.0375rem',
  textTransform: 'uppercase',
  color: 'bodySubtle'
}

// ---- glass card (cards.md): white 6% + blur, 1px white 10% edge, 16px, md
export const CkCard = {
  theme: 'glass',
  backdropFilter: 'blur(1rem) saturate(1.4)',
  borderWidth: 'spacingPx',
  borderStyle: 'solid',
  borderColor: 'paper.10',
  round: 'radiusBase',
  shadow: 'shadowMd',
  padding: 'spacing6'
}

// Interactive card: opacity up, one elevation step, 2px lift (cards.md).
export const CkCardInteractive = {
  extends: 'CkCard',
  cursor: 'pointer',
  transition: 'background-color .2s ease-out, box-shadow .2s ease-out, transform .2s ease-out, border-color .2s ease-out',
  '@reducedMotion': { transition: 'none', ':hover': { transform: 'none' } },
  ':hover': { background: 'paper.10', shadow: 'shadowLg', transform: 'translateY(-2px)' },
  ':focus-visible': { outline: 'spacing0_5 solid paper', outlineOffset: 'spacing0_5' }
}

// Glass over the footage (theme.js stageGlass): navy tint at 85%.
export const CkStageGlass = {
  extends: 'CkCard',
  theme: 'stageGlass',
  shadow: 'shadowLg'
}

// ---- badge (badges.md): 12px/500, 2x6, radius 10, 1px border -------------
export const CkBadge = {
  tag: 'span',
  display: 'inline-flex',
  align: 'center center',
  alignSelf: 'flex-start',
  gap: 'spacing1',
  padding: 'spacing0_5 spacing1_5',
  round: 'radiusDefault',
  theme: 'badgeNeutral',
  borderWidth: 'spacingPx',
  borderStyle: 'solid',
  borderColor: 'borderDefault',
  fontFamily: 'sans',
  fontSize: 'fontXs',
  fontWeight: '500',
  lineHeight: '1.3',
  whiteSpace: 'nowrap',
  shadow: 'none'
}

// Large badge: 14px text, 4x8 padding.
export const CkBadgeLg = {
  extends: 'CkBadge',
  padding: 'spacing1 spacing2',
  fontSize: 'fontSm'
}

// ---- button shell (buttons.md): 16px radius, 1px border, glint ------------
export const CkButton = {
  tag: 'button',
  display: 'inline-flex',
  align: 'center center',
  gap: 'spacing2',
  boxSizing: 'border-box',
  minHeight: 'touchMin',
  padding: 'spacing3 spacing5',
  round: 'radiusBase',
  borderWidth: 'spacingPx',
  borderStyle: 'solid',
  borderColor: 'transparent',
  shadow: 'buttonGlint',
  fontFamily: 'sans',
  fontSize: 'fontMd',
  fontWeight: '500',
  lineHeight: '1.3',
  letterSpacing: '0',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  flexShrink: '0',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'background-color .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease',
  '@reducedMotion': { transition: 'none', ':active': { transform: 'none' }, ':hover': { transform: 'none' } },
  ':focus-visible': { outline: 'spacing0_5 solid paper', outlineOffset: 'spacing0_5' },
  ':active': { transform: 'scale(.98)' },
  // buttons.md disabled: disabled fill, fg-disabled text, no shadow, no glint.
  ':disabled': {
    background: 'disabled',
    color: 'fgDisabled',
    borderColor: 'borderDefaultMedium',
    shadow: 'none',
    cursor: 'not-allowed',
    transform: 'none'
  }
}

export const CkButtonPrimary = {
  extends: 'CkButton',
  theme: 'brandFill',
  // brand-strong equals brand in the dark registry, so the hover also lifts
  // one elevation step and shows the white 30% edge (perceptible delta).
  ':hover': { background: 'brandStrong', borderColor: 'paper.30', shadow: 'buttonGlintHover', transform: 'translateY(-1px)' },
  ':active': { background: 'brandStrong', transform: 'translateY(0) scale(.98)' }
}

export const CkButtonSecondary = {
  extends: 'CkButton',
  // white 40%: 4.4:1 boundary against the page (border-default-medium is 1.17:1).
  theme: 'secondaryFill',
  borderColor: 'paper.40',
  ':hover': { background: 'neutralTertiaryMedium', color: 'heading', shadow: 'buttonGlintHover' }
}

// Ghost (buttons.md): no shadow, no glint.
export const CkButtonGhost = {
  extends: 'CkButton',
  background: 'transparent',
  color: 'heading',
  shadow: 'none',
  ':hover': { background: 'neutralSecondaryMedium' }
}

// ---- link (typography.md): fg-brand, underlined, hover removes underline --
export const CkLink = {
  tag: 'a',
  display: 'inline-flex',
  align: 'center center',
  gap: 'spacing2',
  minHeight: 'touchMin',
  padding: 'spacing2 spacing3',
  fontFamily: 'sans',
  fontSize: 'fontMd',
  fontWeight: '500',
  lineHeight: '1.3',
  color: 'fgBrand',
  textDecoration: 'underline',
  textUnderlineOffset: '0.2em',
  cursor: 'pointer',
  ':hover': { textDecoration: 'none' },
  ':focus-visible': { outline: 'spacing0_5 solid paper', outlineOffset: 'spacing0_5' }
}
