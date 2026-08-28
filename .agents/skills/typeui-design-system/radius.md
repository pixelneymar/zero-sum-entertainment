# Border Radius Tokens — TypeUI · Cypherpunk

> Corner-radius tokens for the **TypeUI “Cypherpunk”** design system. Cypherpunk is a retro-tech, terminal-inspired theme: its corners are **crisp and near-square — a tight 2px micro-radius on every component shell**, just enough to soften a hard pixel edge without ever reading as “rounded.” Functionally round controls (toggle track, avatars, radio, range, status dots) stay fully round. Every value below is a literal size — tokens are the source of truth; components reference tokens, never ad-hoc px or rem.

Depends on: none (pairs with `colors.md` for nested-radius math on filled surfaces).

**Root assumption:** `1rem = 16px` unless the product documents a different root.

---

## Cypherpunk radius convention (read first)

This is the rule that defines the Cypherpunk look. Do not deviate without a documented exception.

| Rule | Token | Value | Applies to |
|---|---|---|---|
| **Component shell = 2px (near-square)** | `radius-xxl` | 2px | Every component’s outer container or control shell — buttons, inputs, selects, textareas, file/search/number/phone fields, cards, modals, dropdown & menu panels, alerts, accordions, tabs panels, pagination groups, tables, tooltips, popovers, badges, chips, tags |
| **Functionally round controls** | `radius-full` | 9999px | The toggle track, avatars, radio control, range thumb & track, status dots, spinners — controls whose meaning depends on a round shape |
| **Checkbox box** | `radius-xs` | 2px | The 16px tick box — the same crisp 2px as every other shell |
| **Nested child inside a shell** | `radius-sm` | 2px | Menu items, inset cells, small controls sitting inside a padded parent (see Nested radius) |
| **Flush data** | `radius-none` | 0 | Table cells, flush list rows, dividers |

A component’s **default** corner is always the tight 2px (`radius-xxl`) unless it appears in the functionally-round row above.

**Edge-anchored exception:** panels that sit flush against a viewport edge — drawers, full-bleed bottom sheets — keep **square (0px)** corners on the flush edges only, so they meet the viewport cleanly.

---

## Token naming

| Pattern | Role |
|---|---|
| `radius-base` | Single base unit all steps derive from |
| `radius-{step}` | Named step on the scale (`none` → `full`) |

Steps are **multipliers of `radius-base`**, not independent picks.

---

## Base unit

| Token | rem | px |
|---|---|---|
| radius-base | 0.125rem | 2px |

---

## Radius scale

| Token | Multiplier | rem | px | Typical use |
|---|---|---|---|---|
| radius-none | 0× | 0 | 0 | Flush edges, table cells, dividers, flush drawer edges |
| radius-xs | 1× | 0.125rem | 2 | Checkbox tick box, hairline inset frames |
| radius-sm | 1× | 0.125rem | 2 | Nested children inside a shell (menu items, inset cells) |
| radius-md | 1× | 0.125rem | 2 | Dense inner controls |
| radius-lg | 1× | 0.125rem | 2 | Secondary shell surfaces |
| radius-xl | 1× | 0.125rem | 2 | Larger shell surfaces |
| radius-xxl | 1× | 0.125rem | 2 | **Cypherpunk component shell default** — buttons, inputs, cards, modals, menus, alerts, tabs, tables, tooltips, badges |
| radius-xxxl | 2× | 0.25rem | 4 | Oversized hero cards / large feature panels |
| radius-full | — | — | 9999px | Toggle track, avatars, radio, range, status dots, spinners — functionally round ends |

The whole box scale converges on a tight 2px because Cypherpunk is a uniformly near-square theme — every standard shell is a crisp rectangle with the hard pixel edge just barely knocked off, and only functionally-round controls take `radius-full`.

---

## Flat registry

```
radius-base    0.125rem  (2px)
radius-none    0
radius-xs      0.125rem  (2px)
radius-sm      0.125rem  (2px)
radius-md      0.125rem  (2px)
radius-lg      0.125rem  (2px)
radius-xl      0.125rem  (2px)
radius-xxl     0.125rem  (2px)
radius-xxxl    0.25rem   (4px)
radius-full    9999px
```

---

## Nested radius

When a parent wraps a child with padding between them:

```
innerRadius = outerRadius − padding
```

In a 2px system the inner corner clamps to the same crisp 2px (it never goes negative), so nested children stay concentric at `radius-sm` (2px). There is effectively no rounding to subtract.

---

## Usage by surface type

| Surface | Token | px |
|---|---|---|
| **All component shells** — buttons, inputs, selects, textareas, search/file/number/phone fields, cards, modals, dropdown & menu panels, alerts, accordions, tabs panels, pagination, tables, tooltips, badges, chips | `radius-xxl` | 2 |
| **Functionally round controls** — toggle track, avatars, status dots, radio, range, spinners | `radius-full` | 9999px |
| Checkbox tick box | `radius-xs` | 2 |
| Nested children inside a shell (menu items, inset cells) | `radius-sm` | 2 |
| Oversized hero / feature panels | `radius-xxxl` | 4 |
| Flush lists, table cells, dividers, flush drawer edges | `radius-none` | 0 |

---

## Prohibited

- **No raw px/rem in components** — use a `radius-*` token.
- **No pill-rounded component shells** — Cypherpunk shells are crisp and near-square (`radius-xxl`, 2px). Do not ship 8px/12px/16px control corners; that is a different theme, not Cypherpunk.
- **No soft, rounded buttons, cards, inputs, or badges** — every box-shaped surface stays at the tight 2px; only functionally-round controls use `radius-full`.
- **No `radius-full` on box surfaces** — full rounding is for the toggle track, avatars, radio, range, and naturally round controls only, never page panels, cards, buttons, or badges.
- **No off-scale values** (e.g. 6px, 10px) — add a token to this file if the scale is insufficient.
- **No copying a `radius-full` value onto box children** — items inside a near-square panel stay near-square (`radius-sm`, 2px).
- **No mixing step names from foreign systems** — if a token exists here, use its name.
