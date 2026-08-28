export default {
  // ---- legacy palette: still owned by the /workspace console (Ws*) ----------
  black: '#0B0B0D',
  white: '#F4F4F6',
  ink: '#060608',
  steel: '#15161C',
  haze: '#C3C4CC',
  brand: '#D2352A',
  neutral: '#8C8C95',
  ember: '#FF453A',
  mint: '#2FA36B',
  gold: '#E9B949',
  azure: '#3987E5',
  slate: '#1D1F27',
  graphite: '#2A2C36',

  // ---- TypeUI Cypherpunk registry (.claude/skills/typeui-design-system/colors.md)
  // The game surfaces use ONLY these. Names follow the registry in camelCase.
  // Documented exception: the registry's `brand` family is named `brandInk*`
  // here because `brand` above is a legacy token the workspace still reads.
  // text
  body: '#1C1C1C',
  bodySubtle: '#1C1C1C',
  heading: '#1C1C1C',
  fgBrandSubtle: '#C9C3B1',
  fgBrand: '#1C1C1C',
  fgBrandStrong: '#0E0E0E',
  fgSuccess: '#1E5E3A',
  fgSuccessStrong: '#133F26',
  fgDanger: '#B14033',
  fgDangerStrong: '#7A2A20',
  fgWarningSubtle: '#9A7A28',
  fgWarning: '#6B5410',
  fgDisabled: '#A9A396',
  // neutral surfaces
  neutralPrimarySoft: '#EAE5DB',
  neutralSecondarySoft: '#D8FF7C',
  neutralSecondaryMedium: '#D8FF7C',
  neutralTertiarySoft: '#F2F0E7',
  neutralTertiary: '#EDE9DD',
  neutralTertiaryMedium: '#E9E5DB',
  neutralQuaternary: '#DDD8C9',
  neutralQuaternaryMedium: '#BDB6A2',
  gray: '#C4BFB3',
  // brand (ink)
  brandInkSofter: '#E9E5DB',
  brandInkSoft: '#C9C3B1',
  brandInk: '#1C1C1C',
  brandInkMedium: '#677483',
  brandInkStrong: '#0E0E0E',
  // status
  successSoft: '#EAF5EC',
  success: '#2D8654',
  successMedium: '#CDE8D4',
  successStrong: '#1E5E3A',
  dangerSoft: '#FBEAE7',
  danger: '#E94736',
  dangerMedium: '#F6D6D0',
  dangerStrong: '#8F3328',
  warningSoft: '#FEFBE6',
  warning: '#FDEB65',
  warningMedium: '#FBF3C2',
  warningStrong: '#A8852E',
  // utility
  darkSoft: '#3C444B',
  dark: '#1C1C1C',
  darkStrong: '#000000',
  disabled: '#EDE9DD',
  paper: '#FFFFFF',
  // border (every border token resolves to ink; the scrim is the exception)
  borderDefault: '#1C1C1C',
  darkBackdrop: '#000000'
}
