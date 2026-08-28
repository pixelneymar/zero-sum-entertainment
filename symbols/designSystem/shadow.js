export default {
  // ---- shadows.md: the seven elevation tokens, verbatim -----------------
  shadow2xs: '0 1px 2px rgb(0 0 0 / 0.04)',
  shadowXs: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
  shadowSm: '0 2px 6px -1px rgb(0 0 0 / 0.07), 0 1px 3px -1px rgb(0 0 0 / 0.05)',
  shadowMd: '0 6px 16px -4px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.05)',
  shadowLg: '0 12px 28px -6px rgb(0 0 0 / 0.1), 0 4px 12px -4px rgb(0 0 0 / 0.06)',
  shadowXl: '0 24px 48px -10px rgb(0 0 0 / 0.14), 0 8px 20px -8px rgb(0 0 0 / 0.08)',
  shadow2xl: '0 32px 64px -16px rgb(0 0 0 / 0.22)',
  // buttons.md glint: shadow-xs + inset top highlight + outer glow (dark values).
  buttonGlint:
    '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.03), inset rgba(255,255,255,0.08) 0 6px 0px -5px, rgba(0,0,0,0.30) 0 4px 10px -5px',
  // hover: one elevation step up (shadow-sm) with the same glint.
  buttonGlintHover:
    '0 2px 6px -1px rgb(0 0 0 / 0.07), 0 1px 3px -1px rgb(0 0 0 / 0.05), inset rgba(255,255,255,0.08) 0 6px 0px -5px, rgba(0,0,0,0.30) 0 4px 10px -5px',
  none: 'none'
}
