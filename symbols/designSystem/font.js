// Brand family (docs/brand.md): Darker Grotesque, the TypeUI Neobrutalism
// skill's face, self-hosted as one variable woff2 (OFL; licence beside it in
// symbols/assets/fonts/).
//
// Why self-hosted and not a Google Fonts URL: the runtime turns a Google URL
// into `@import`, then appends it to the shared <style data-smbls> sheet
// AFTER the reset rules. Browsers reject an @import that follows other rules,
// so the import is silently dropped (verified 2026-08-28: Zalando never
// loaded either). A non-Google URL goes through `@font-face`, which appends
// cleanly.
//
// Shape matters: the runtime reads `font[key].value` (Ri → El(key, value))
// and names the face after the key: `font-family: 'darkerGrotesque'`.
// fontFamily.js therefore lists the key first.
export default {
  darkerGrotesque: {
    value: {
      url: '/assets/fonts/darker-grotesque-latin-wght-normal.woff2',
      isVariable: true,
      fontWeight: '300 900',
      fontDisplay: 'swap'
    }
  }
}
