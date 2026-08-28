// Named sizes. The runtime resolves these names for ANY length property
// (padding, gap, width, font-size, letter-spacing...), so they are the
// implementation layer for the TypeUI Cypherpunk token registry.
export default {
  // ---- spacing.md: 4px grid ----------------------------------------------
  spacing0: '0',
  spacingPx: '1px',
  spacing0_5: '0.125rem',
  spacing1: '0.25rem',
  spacing1_5: '0.375rem',
  spacing2: '0.5rem',
  spacing2_5: '0.625rem',
  spacing3: '0.75rem',
  spacing3_5: '0.875rem',
  spacing4: '1rem',
  spacing5: '1.25rem',
  spacing6: '1.5rem',
  spacing7: '1.75rem',
  spacing8: '2rem',
  spacing9: '2.25rem',
  spacing10: '2.5rem',
  spacing11: '2.75rem',
  spacing12: '3rem',
  spacing14: '3.5rem',
  spacing16: '4rem',
  spacing20: '5rem',
  spacing24: '6rem',

  // ---- radius.md ----------------------------------------------------------
  radiusNone: '0',
  radiusXxl: '0.125rem',
  radiusXxxl: '0.25rem',
  radiusFull: '9999px',

  // ---- typography.md: desktop size scale ---------------------------------
  fontXxs: '0.6875rem',
  fontXs: '0.75rem',
  fontSm: '0.875rem',
  fontMd: '1rem',
  fontLg: '1.125rem',
  fontXl: '1.25rem',
  font2xl: '1.375rem',
  font3xl: '1.5625rem',
  font4xl: '1.75rem',
  font5xl: '2rem',
  font6xl: '2.25rem',
  font7xl: '2.5rem',
  font8xl: '2.8125rem',
  font9xl: '3.125rem',
  font10xl: '3.75rem',
  fontHero: '4.5rem',
  // letter-spacing scale lives in typography.md; letter-spacing is not
  // routed through this resolver, so components use the literal rem values.

  // ---- fixed control boxes (buttons.md, badges.md, alerts.md) -------------
  icon14: '0.875rem',
  icon16: '1rem',
  icon20: '1.25rem',
  iconButtonSm: '2.25rem',
  iconButtonBase: '2.5rem',
  touchMin: '2.75rem',
  dot: '0.5rem',

  // ---- layout (SKILL.md) --------------------------------------------------
  containerMax: '80rem',
  headerMax: '48rem',
  copyMax: '42rem',

  // ---- stage furniture (game) ---------------------------------------------
  ring: '4.5rem',
  rail: '15rem',
  dock: '46rem',
  card: '34rem',
  poster: '22rem',
  portrait: '3.5rem',

  // ---- workspace console furniture (Ws*) ----------------------------------
  wsRail: '13.5rem',
  wsChart: '8.5rem',
  wsHist: '9rem',
  wsRing: '3.25rem',
  wsSelect: '11rem'
}
