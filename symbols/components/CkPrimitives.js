// TypeUI Cypherpunk primitives. Every game component extends one of these so
// panel radius, border, surface, type and focus come from one spec chain
// (.claude/skills/typeui-design-system/{buttons,cards,badges,typography}.md).
// Fundamentals (typeui-fundamentals) override the skill where stricter:
// interactive text is 16px (not 14px), targets are 44px, focus rings are
// 2px with a 2px offset, eyebrows are 14px (not 12px).
// letter-spacing and background-size take literal registry values because the
// runtime does not route those properties through the named-size resolver.

// ---- overline / eyebrow (typography.md: overline role) ---------------------
export const CkEyebrow = {
  tag: 'span',
  fontFamily: 'mono',
  fontSize: 'fontSm',
  fontWeight: '500',
  lineHeight: '1.3',
  letterSpacing: '0.0625rem',
  textTransform: 'uppercase',
  color: 'bodySubtle'
}

// ---- card (cards.md): raised beige, 2px ink border, 2px corners, no shadow
export const CkCard = {
  theme: 'raised',
  borderWidth: 'spacing0_5',
  borderStyle: 'solid',
  borderColor: 'borderDefault',
  round: 'radiusXxl',
  boxShadow: 'none',
  padding: 'spacing6'
}

// ---- badge (badges.md): square, soft fill, content width -------------------
export const CkBadge = {
  tag: 'span',
  display: 'inline-flex',
  align: 'center center',
  alignSelf: 'flex-start',
  gap: 'spacing1',
  padding: 'spacing0_5 spacing1_5',
  round: 'radiusXxl',
  theme: 'badgeNeutral',
  fontFamily: 'sans',
  fontSize: 'fontXs',
  fontWeight: '500',
  lineHeight: '1.3',
  whiteSpace: 'nowrap',
  boxShadow: 'none'
}

// Large badge: 14px text, spacing-2 x spacing-1.
export const CkBadgeLg = {
  extends: 'CkBadge',
  padding: 'spacing1 spacing2',
  fontSize: 'fontSm'
}

// Bordered badge: 2px intent border (all intents resolve to ink).
export const CkBadgeBordered = {
  extends: 'CkBadge',
  borderWidth: 'spacing0_5',
  borderStyle: 'solid',
  borderColor: 'borderDefault'
}

// ---- button shell (buttons.md, Base size) ----------------------------------
export const CkButton = {
  tag: 'button',
  display: 'inline-flex',
  align: 'center center',
  gap: 'spacing1_5',
  boxSizing: 'border-box',
  minHeight: 'touchMin',
  padding: 'spacing2_5 spacing4',
  round: 'radiusXxl',
  borderWidth: 'spacing0_5',
  borderStyle: 'solid',
  borderColor: 'transparent',
  boxShadow: 'none',
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
  transition: 'background-color .15s ease, color .15s ease, border-color .15s ease',
  '@reducedMotion': { transition: 'none' },
  ':focus-visible': { outline: 'spacing0_5 solid brandInk', outlineOffset: 'spacing0_5' },
  ':active': { transform: 'scale(.98)' }
}

// Small size (dashboard / HUD surfaces). Fundamentals keep the label at 16px.
export const CkButtonSm = {
  extends: 'CkButton',
  padding: 'spacing2 spacing3'
}

export const CkButtonPrimary = {
  extends: 'CkButton',
  theme: 'brandFill',
  ':hover': { background: 'brandInkStrong' },
  ':active': { background: 'brandInkStrong', transform: 'scale(.98)' },
  // brand-medium ring: 3.57:1 against the ink fill, 4.2:1 against lime.
  ':focus-visible': { outline: 'spacing0_5 solid brandInkMedium', outlineOffset: 'spacing0_5' }
}

export const CkButtonSecondary = {
  extends: 'CkButton',
  theme: 'raised',
  borderColor: 'borderDefault',
  ':hover': { background: 'neutralTertiaryMedium', color: 'heading' }
}

export const CkButtonOutline = {
  extends: 'CkButton',
  background: 'transparent',
  color: 'fgBrand',
  borderColor: 'brandInk',
  ':hover': { background: 'brandInk', color: 'paper' }
}

// ---- inline text link (SKILL.md / typography.md): ink, underline on hover
export const CkLink = {
  tag: 'a',
  display: 'inline-flex',
  align: 'center center',
  gap: 'spacing1_5',
  minHeight: 'touchMin',
  padding: 'spacing2 spacing3',
  fontFamily: 'sans',
  fontSize: 'fontMd',
  fontWeight: '500',
  lineHeight: '1.3',
  color: 'fgBrand',
  textDecoration: 'none',
  cursor: 'pointer',
  ':hover': { textDecoration: 'underline' },
  ':focus-visible': { outline: 'spacing0_5 solid brandInk', outlineOffset: 'spacing0_5' }
}
