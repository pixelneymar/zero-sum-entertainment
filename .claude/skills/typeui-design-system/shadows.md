# Elevation & Shadow Tokens — TypeUI · Cypherpunk

> The depth system for **TypeUI · Cypherpunk**. Cypherpunk reads mostly **flat and grounded**: resting surfaces separate with a crisp 2px ink (`#1C1C1C`) border and a tight 2px corner, not a drop shadow. Depth is reserved for things that genuinely float — dropdowns, tooltips, modals, and drawers — which carry a **soft, low-opacity ink shadow** so they read above the page without glowing. On focus, a **2px ink (`#1C1C1C`) ring** sits just outside the border to mark the active control. The elevation tokens below are the single source of truth — components reference them, never one-off shadow values.

Depends on: `colors.md` (shadow color is the ink token at low opacity; the focus ring is the ink token).

---

## Token naming

| Pattern | Role |
|---|---|
| `elevation-none` | Flat — no shadow; separation by the `#1C1C1C` border + surface |
| `elevation-{1–5}` | Depth level by intent — resting lift through floating overlays |
| `focus-ring` | The 2px ink ring wrapping a focused interactive element |

Each level is a single token — do not split or hand-roll shadow layers in component code.

---

## Shadow anatomy

| Property | Meaning |
|---|---|
| Offset X | Horizontal displacement (+ right, − left) |
| Offset Y | Vertical displacement (+ down, − up) |
| Blur | Softness of the shadow edge |
| Spread | Expansion (+) or contraction (−) of the shadow shape |
| Color | RGBA — ink (`28, 28, 28`) at low opacity; opacity controls perceived elevation |

Cypherpunk shadows are always cast in **ink at low opacity** (never grey, never a colored glow) so floating surfaces stay crisp and neutral against the warm background.

---

## Elevation scale

| Token | Shadow value |
|---|---|
| elevation-none | `none` |
| elevation-1 | `0px 1px 2px rgba(28, 28, 28, 0.06)` |
| elevation-2 | `0px 4px 16px rgba(28, 28, 28, 0.08)` |
| elevation-3 | `0px 4px 12px rgba(28, 28, 28, 0.12)` |
| elevation-4 | `0px 8px 24px rgba(28, 28, 28, 0.16)` |
| elevation-5 | `0px 16px 40px rgba(28, 28, 28, 0.24)` |

---

## Focus ring

The signature interaction state. The focused control draws a 2px solid ink ring; links may instead carry a 2px ink underline-shadow.

| Token | Value |
|---|---|
| focus-ring | `0px 0px 0px 2px #1C1C1C` |
| focus-ring-link | `0px 2px 0px #1C1C1C` |

---

## Flat registry

```
elevation-none   none
elevation-1      0px 1px 2px rgba(28, 28, 28, 0.06)
elevation-2      0px 4px 16px rgba(28, 28, 28, 0.08)
elevation-3      0px 4px 12px rgba(28, 28, 28, 0.12)
elevation-4      0px 8px 24px rgba(28, 28, 28, 0.16)
elevation-5      0px 16px 40px rgba(28, 28, 28, 0.24)
focus-ring       0px 0px 0px 2px #1C1C1C
focus-ring-link  0px 2px 0px #1C1C1C
```

---

## Usage by surface type

| Surface | Token | Rationale |
|---|---|---|
| Resting cards, accordions (grouped) | `elevation-none` | Separation comes from the `#1C1C1C` border + surface, not shadow |
| Separated cards, subtle hover lift | `elevation-1` | A whisper of depth on hover, never a float |
| Dropdowns, popovers, menus | `elevation-2` | Lifts off the section while staying crisp |
| Tooltips | `elevation-3` | Reads above content with a tight, soft shadow |
| Modals, drawers (sheet) | `elevation-4` | Clearly above the backdrop scrim |
| Floating action, critical overlay | `elevation-5` | Maximum lift for the topmost layer |
| Flat lists, flush accordions, inline fields | `elevation-none` | No depth signal |
| Any focused interactive element | `focus-ring` | 2px ink ring — the crisp focus cue |

---

## Principles

- **Grounded by default** — resting surfaces (cards, panels, fields) separate with the `#1C1C1C` border, the 2px corner, and spacing — never a drop shadow. Shadow is for things that truly float.
- **Hierarchy** — elevation rises only as a surface leaves the page: hover (`elevation-1`) → menus (`elevation-2`) → tooltips (`elevation-3`) → modals/drawers (`elevation-4`) → topmost (`elevation-5`).
- **Ink, not glow** — shadows are ink at low opacity. The focus ring is a solid ink ring; do not tint drop shadows.
- **Restraint** — if two resting surfaces need separating, reach for the `#1C1C1C` border before any shadow.

---

## Prohibited

- **No raw box-shadow strings in components** — use an `elevation-*` or `focus-ring` token.
- **No drop shadows on resting cards or fields** — grounded surfaces separate with the `#1C1C1C` border and surface, not elevation.
- **No colored or glowing shadows** — depth shadows are ink at low opacity; the focus cue is a solid ink `focus-ring`. Add a dedicated token to this file with documented intent before using anything else.
- **No removing the focus ring** — every interactive element keeps the ink `focus-ring` (or an accessible equivalent); never `outline: none` without a replacement.
- **No over-lifting** — do not jump a resting card to `elevation-4`; reserve the heavy steps for genuine overlays.
- **No foreign elevation naming** — map into these tokens in your implementation layer; do not rename and call that the design system.
