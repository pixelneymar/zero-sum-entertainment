// Brand mark. Three variants, one source of truth: docs/brand.md.
//
//   LogoLockup  — horizontal lockup (icon + wordmark). Nav bars, footers.
//   LogoMark    — icon only (the split chip). Favicon-scale slots, mobile nav.
//   LogoStacked — chunky two-line wordmark. Hero / start screen only.
//
// Assets are raster PNG cutouts in symbols/assets/brand/ (served at
// /assets/brand/...). They were generated on Higgsfield in the brand palette
// (docs/brand.md): acid lime #D1FE17, white, near-black #0F1113. They carry
// their own black keyline and offset shadow, so they need no CSS shadow and
// sit on both the near-black stage and the glass top bar.
//
// Every variant is a link home. The image alt is the accessible name; the
// wrapping anchor carries no extra label so screen readers do not read the
// name twice.

const brandLink = {
  tag: 'a',
  display: 'inline-flex',
  align: 'center flex-start',
  flexShrink: '0',
  textDecoration: 'none',
  attr: { href: '/' },
  // Keep the whole mark inside the focus ring, not just the image box.
  round: 'radiusSm',
  ':focus-visible': { outline: '2px solid', outlineColor: 'brand', outlineOffset: 'spacing1' }
}

export const LogoLockup = {
  ...brandLink,

  LogoImg: {
    extends: 'Img',
    display: 'block',
    // Nav height: 3rem tall (the top bar is ~7.5rem), width follows the
    // trimmed 3:1 ratio.
    height: 'spacing12',
    width: 'auto',
    '@tabletS': { height: 'spacing10' },
    src: '/assets/brand/logo-lockup.png',
    alt: 'Zero Sum Games',
    attr: { decoding: 'async', draggable: 'false' }
  }
}

export const LogoMark = {
  ...brandLink,

  LogoImg: {
    extends: 'Img',
    display: 'block',
    height: 'spacing10',
    width: 'spacing10',
    src: '/assets/brand/logo-mark.png',
    alt: 'Zero Sum Games',
    attr: { decoding: 'async', draggable: 'false' }
  }
}

export const LogoStacked = {
  ...brandLink,

  LogoImg: {
    extends: 'Img',
    display: 'block',
    width: '100%',
    maxWidth: 'logoHero',
    height: 'auto',
    src: '/assets/brand/logo-stacked.png',
    alt: 'Zero Sum Games',
    attr: { decoding: 'async', draggable: 'false' }
  }
}
