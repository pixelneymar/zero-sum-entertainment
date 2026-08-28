export default {
  // ---- TypeUI Perspective (colors.md, cards.md): dark registry only ------
  // Page background: neutral-primary-soft (colors.md semantic usage).
  document: {
    '@light': { background: 'neutralPrimarySoft', color: 'body' },
    '@dark': { background: 'neutralPrimarySoft', color: 'body' }
  },

  // Glass card (cards.md dark): white at 6% under a backdrop blur.
  glass: {
    '@light': { background: 'paper.06', color: 'body' },
    '@dark': { background: 'paper.06', color: 'body' }
  },

  // Glass over the footage: a navy tint at 85% so body text stays 4.5:1 even
  // over a white frame (spec white-glass would drop to ~3:1 there).
  stageGlass: {
    '@light': { background: 'neutralPrimary.85', color: 'body' },
    '@dark': { background: 'neutralPrimary.85', color: 'body' }
  },

  // Primary action (buttons.md brand): blue fill, white label.
  brandFill: {
    '@light': { background: 'brand', color: 'paper' },
    '@dark': { background: 'brand', color: 'paper' }
  },

  // Secondary button fill (buttons.md secondary).
  secondaryFill: {
    '@light': { background: 'neutralSecondaryMedium', color: 'body' },
    '@dark': { background: 'neutralSecondaryMedium', color: 'body' }
  },

  // Badge / alert intents (badges.md, alerts.md).
  badgeBrand: {
    '@light': { background: 'brandSofter', color: 'fgBrandStrong' },
    '@dark': { background: 'brandSofter', color: 'fgBrandStrong' }
  },
  badgeAlt: {
    '@light': { background: 'neutralPrimarySoft', color: 'heading' },
    '@dark': { background: 'neutralPrimarySoft', color: 'heading' }
  },
  badgeNeutral: {
    '@light': { background: 'neutralSecondaryMedium', color: 'heading' },
    '@dark': { background: 'neutralSecondaryMedium', color: 'heading' }
  },
  badgeSuccess: {
    '@light': { background: 'successSoft', color: 'fgSuccessStrong' },
    '@dark': { background: 'successSoft', color: 'fgSuccessStrong' }
  },
  badgeDanger: {
    '@light': { background: 'dangerSoft', color: 'fgDangerStrong' },
    '@dark': { background: 'dangerSoft', color: 'fgDangerStrong' }
  },
  badgeWarning: {
    '@light': { background: 'warningSoft', color: 'fgWarning' },
    '@dark': { background: 'warningSoft', color: 'fgWarning' }
  },
  badgeDark: {
    '@light': { background: 'dark', color: 'paper' },
    '@dark': { background: 'dark', color: 'paper' }
  },

  // Disabled controls (colors.md): disabled surface + fg-disabled text.
  disabledCtl: {
    '@light': { background: 'disabled', color: 'fgDisabled' },
    '@dark': { background: 'disabled', color: 'fgDisabled' }
  },

  // ---- workspace console (always dark; no footage underneath) ----------
  wsShell: {
    '@light': { background: 'ink', color: 'white' },
    '@dark': { background: 'ink', color: 'white' }
  },

  wsPanel: {
    '@light': { background: 'slate', color: 'white' },
    '@dark': { background: 'slate', color: 'white' }
  },

  wsRail: {
    '@light': { background: 'black', color: 'white' },
    '@dark': { background: 'black', color: 'white' }
  },

  wsMuted: {
    '@light': { color: 'haze' },
    '@dark': { color: 'haze' }
  },

  wsDim: {
    '@light': { color: 'neutral' },
    '@dark': { color: 'neutral' }
  }
}
