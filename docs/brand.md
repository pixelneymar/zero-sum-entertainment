# Zero Sum Games — brand

Owner decision, 2026-08-28: the brand takes its colour from Higgsfield
(near-black, white, acid lime) and drops the Perspective typography (Zalando
Sans SemiExpanded) as too dull. This file is the single source of truth for
the logo, the palette and the type. Components reference it; they do not
invent brand values.

## The idea

A casino chip cut down the middle. The left half slides **up** (lime), the
right half slides **down** (white). One side wins exactly what the other
loses. That is the whole product in one shape, and it reads at 24 px.

## Assets

All in `symbols/assets/brand/`, served at `/assets/brand/`.

| File | What | Use |
| --- | --- | --- |
| `logo-lockup.png` | icon + one-line wordmark, transparent, 2x | footer, share images (owner rejected it for the stage top bar: "too big and different from the landing") |
| `logo-mark.png` | icon only, transparent, square | favicon, app icon, mobile nav, loading state |
| `logo-stacked.png` | chunky two-line wordmark, transparent | start-screen hero AND the stage top bar (compact, 40 px tall; 32 px on tabletS) — owner decision 2026-08-28 |
| `logo-mark-512.png` | icon at 512 px | PWA / app icon |
| `logo-mark-192.png` | icon at 192 px | PWA / app icon |
| `logo-mark-64.png` | icon at 64 px | favicon |
| `source/` | the original Higgsfield renders on the `#0F1113` background | reference; not shipped |

Shipped PNGs are palette-quantised (256 colours, no dither) at 2x their
largest display size — hero 900 px, nav lockup 1200 px — which took the
start-screen hero from 916 KB to 40 KB with no visible change. Re-cut with
`docs/brand-assets.py` from the `source/` renders if a larger size is ever
needed.

Component: `symbols/components/Logo.js` exports `LogoLockup`, `LogoMark`,
`LogoStacked`. Each is a link home with the image alt as its accessible name.

Rules:

- Minimum clear space = the height of the chip on every side.
- Minimum size: lockup 28 px tall, mark 20 px.
- Never recolour. The mark is lime + white + near-black only.
- Never put the mark on lime. On a lime surface use the near-black + white
  version (to be cut when a lime surface exists — none does today).
- No CSS drop shadow on the images; the keyline and offset shadow are baked in.

## Palette (from higgsfield.ai computed styles, 2026-08-28)

| Token | Hex | Role |
| --- | --- | --- |
| `ink` | `#0F1113` | page background, the stage |
| `inkRaised` | `#131517` | raised panels, cards |
| `inkBorder` | `#1C1E20` | hairlines |
| `paper` | `#FFFFFF` | primary text, the "losing" half |
| `paperMuted` | `#898A8B` | secondary text |
| `lime` | `#D1FE17` | the accent: CTAs, the winning side, live/locked states, the logo |
| `limeSoft` | `rgba(209,254,23,.10)` | lime tint for hover / selected rows |

Contrast, measured: lime `#D1FE17` on `#0F1113` = 16.1:1; white on `#0F1113`
= 18.9:1; `#898A8B` on `#0F1113` = 5.5:1. Near-black text on lime = 16.1:1.
All pass AA for normal text.

Lime is an **accent**. Sections stay near-black. Lime never fills a section
background (that was the Cypherpunk look, which the owner moved off).

## Typography

Chosen from the TypeUI registry: the **Neobrutalism** design skill's family,
**Darker Grotesque** (Google Fonts, variable 300–900). Measured on the
TypeUI Neobrutalism preview: `h1` 900, `h2` 700, labels 700 uppercase with
`1.2px` tracking.

Why this one and not the others:

| Candidate | Family | Verdict |
| --- | --- | --- |
| Perspective (current) | Zalando Sans SemiExpanded | dull — the owner's words |
| **Neobrutalism** | **Darker Grotesque 900 / 700** | **chosen**: chunky, tall x-height, matches the sticker letterforms of the logo, free, one family does display and UI |
| Cypherpunk | Untitled Sans + Offbit pixel display | strong, but the pixel face fights the rounded logo and the product moved off Cypherpunk today |
| Kinetic | JetBrains Mono | good for odds tables, too cold as the only voice |

Roles:

| Role | Family / weight | Size | Tracking | Case |
| --- | --- | --- | --- | --- |
| Display (hero, results) | Darker Grotesque 900 | `fontHero` / `font6xl` | `-0.02em` | upper |
| Headings h2–h4 | Darker Grotesque 800 | `font5xl`–`font3xl` | `-0.01em` | as written |
| UI labels, chips, buttons | Darker Grotesque 700 | `fontSm` / `fontMd` | `0.06em` | upper |
| Body | Darker Grotesque 500 | `fontMd` | `0` | as written |
| Numbers (odds, chips, timers) | Darker Grotesque 700 + `font-variant-numeric: tabular-nums` | — | `0` | — |

Darker Grotesque runs small on the em box: set body at `fontLg` (1.125rem)
where Perspective used `fontMd`, and keep line-height ≥ 1.4 on copy.

Wiring (`symbols/designSystem/font.js` + `fontFamily.js`, applied 2026-08-28):

```js
// symbols/designSystem/font.js — self-hosted variable woff2, OFL
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

// symbols/designSystem/fontFamily.js
export default {
  sans: {
    value: ['darkerGrotesque', 'Darker Grotesque', 'Inter', 'Helvetica Neue', 'Helvetica', 'Arial'],
    type: 'sans-serif',
    isDefault: true
  }
}
```

Two runtime facts that shaped this (verified against the served runtime):

- `font[key].value` is what the runtime reads; an entry without the `value`
  wrapper is silently dropped.
- A Google Fonts URL becomes `@import`, appended to the shared stylesheet
  after the reset rules, which browsers reject. The old Zalando import never
  loaded for the same reason. A self-hosted file becomes `@font-face` and
  works. The face is named after the key (`darkerGrotesque`).

Favicon: `metadata.icon: '/assets/brand/logo-mark-64.png'` on the main page
(`symbols/pages/main.js`).

## Provenance

Generated on Higgsfield (nano_banana_pro), 2026-08-28, three rounds:
shape studies in the old blue/pink palette → six concepts in the Higgsfield
palette → one refinement to make the chip halves actually slide apart.
Winning job ids: lockup `a463d0c8-41dd-4841-b2f8-da3d7911a2a0`, mark
`913b3d08-ba4a-4a7f-a95b-00fe5ebe098a`, stacked
`f1e7f7c3-13df-493d-8bc7-6c87afae679e`. Backgrounds removed with
Higgsfield's `image_background_remover`, then trimmed and resized locally
with Pillow (`docs/brand-assets.py`).
