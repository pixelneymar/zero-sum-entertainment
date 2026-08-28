export default {
  // ---- TypeUI Cypherpunk (colors.md): one lime section surface, ink text.
  // The registry is single-theme, so both colour schemes resolve identically.
  document: {
    '@light': { background: 'neutralSecondarySoft', color: 'body' },
    '@dark': { background: 'neutralSecondarySoft', color: 'body' }
  },

  // Raised beige component surface (cards, panels, inputs, secondary buttons).
  raised: {
    '@light': { background: 'neutralPrimarySoft', color: 'body' },
    '@dark': { background: 'neutralPrimarySoft', color: 'body' }
  },

  // Primary action: ink fill, white label (buttons.md).
  brandFill: {
    '@light': { background: 'brandInk', color: 'paper' },
    '@dark': { background: 'brandInk', color: 'paper' }
  },

  // Status fills with a white label (buttons.md filled variants).
  successFill: {
    '@light': { background: 'success', color: 'paper' },
    '@dark': { background: 'success', color: 'paper' }
  },

  // Badge / alert intents: soft fill + intent foreground (badges.md, alerts.md).
  badgeBrand: {
    '@light': { background: 'brandInkSofter', color: 'fgBrandStrong' },
    '@dark': { background: 'brandInkSofter', color: 'fgBrandStrong' }
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

  // Disabled controls (colors.md): disabled surface + fg-disabled text.
  disabledCtl: {
    '@light': { background: 'disabled', color: 'fgDisabled' },
    '@dark': { background: 'disabled', color: 'fgDisabled' }
  },




  chip: {
    '@light': { background: 'white.08', color: 'white' },
    '@dark': { background: 'white.08', color: 'white' }
  },


  danger: {
    '@light': { background: 'ember', color: 'white' },
    '@dark': { background: 'ember', color: 'white' }
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
