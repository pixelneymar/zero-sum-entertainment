# Spacing Tokens — TypeUI · Cypherpunk

> The spacing system for **TypeUI · Cypherpunk**. Cypherpunk breathes on a calm 4px rhythm: controls are comfortable, never cramped, and hierarchy comes from *deliberately uneven* spacing — tight inside a group, generous between groups. Every value below is a literal size and the single source of truth; components reference these tokens for padding, margin, gap, inset, and layout offset, never raw px or rem.

**Root assumption:** `1rem = 16px` unless the product documents a different root.

**Base unit:** one integer step = **0.25rem (4px)**. The scale is proportional — each step is derived from that unit unless listed as a fixed pixel (`spacing-px`) or zero (`spacing-0`).

---

## Token naming

| Pattern | Role |
|---|---|
| `spacing-{step}` | Value from the scale below (`0`, `1`, `2`, … `96`, plus `px` and half-steps) |
| `spacing-0` | Zero — flush, no gap |
| `spacing-px` | Single pixel — hairline separation |

**Applies to:** padding, margin, gap (flex/grid), inset, stack spacing between siblings, and any layout dimension that expresses **space** rather than content width.

**Does not replace:** component-specific width/height tokens for fixed control sizes — use spacing tokens for **distance between and around** elements.

---

## Spacing scale

| Token | rem | px |
|---|---|---|
| spacing-0 | 0 | 0 |
| spacing-px | 1px | 1px |
| spacing-0-5 | 0.125rem | 2px |
| spacing-1 | 0.25rem | 4px |
| spacing-1-5 | 0.375rem | 6px |
| spacing-2 | 0.5rem | 8px |
| spacing-2-5 | 0.625rem | 10px |
| spacing-3 | 0.75rem | 12px |
| spacing-3-5 | 0.875rem | 14px |
| spacing-4 | 1rem | 16px |
| spacing-5 | 1.25rem | 20px |
| spacing-6 | 1.5rem | 24px |
| spacing-7 | 1.75rem | 28px |
| spacing-8 | 2rem | 32px |
| spacing-9 | 2.25rem | 36px |
| spacing-10 | 2.5rem | 40px |
| spacing-11 | 2.75rem | 44px |
| spacing-12 | 3rem | 48px |
| spacing-14 | 3.5rem | 56px |
| spacing-16 | 4rem | 64px |
| spacing-20 | 5rem | 80px |
| spacing-24 | 6rem | 96px |
| spacing-28 | 7rem | 112px |
| spacing-32 | 8rem | 128px |
| spacing-36 | 9rem | 144px |
| spacing-40 | 10rem | 160px |
| spacing-44 | 11rem | 176px |
| spacing-48 | 12rem | 192px |
| spacing-52 | 13rem | 208px |
| spacing-56 | 14rem | 224px |
| spacing-60 | 15rem | 240px |
| spacing-64 | 16rem | 256px |
| spacing-72 | 18rem | 288px |
| spacing-80 | 20rem | 320px |
| spacing-96 | 24rem | 384px |

Half-step tokens use a **hyphen** (`spacing-0-5`, `spacing-1-5`) — not decimals in token names.

---

## Semantic spacing roles

Map component specs to scale tokens. Prefer the **smallest step that reads clearly** — do not jump to large steps without hierarchy reason.

| Role | Token | px | Typical use |
|---|---|---|---|
| none | spacing-0 | 0 | Collapse gutter, flush edges |
| hairline | spacing-px | 1 | Optical border adjacency |
| tight | spacing-1 | 4 | Icon inset, dense chip padding |
| compact | spacing-2 | 8 | Inline gap, badge padding, paragraph gap inside cards |
| inner | spacing-3 | 12 | Label-to-field gap, trigger icon gap, button group gap |
| default | spacing-4 | 16 | Standard control padding, card inner padding (mobile) |
| comfortable | spacing-5 | 20 | Accordion trigger padding, card padding (desktop) |
| group | spacing-6 | 24 | Section inner padding, separated card gap |
| section | spacing-8 | 32 | Between component groups in a page |
| layout | spacing-12 | 48 | Between major page sections |
| hero-top | spacing-24 | 96 | Sticky nav clearance below nav bar (see layout rules) |
| touch-min | spacing-11 | 44 | Minimum hit-target outer dimension reference |

These are **roles**, not separate values — each resolves to a `spacing-*` token above.

---

## Section separators

Every stacked page section (hero, content band, promo band) ends with a **full-width 2px ink bottom border** (`border-bottom: var(--border-width) solid var(--default)`) — the single divider between lime sections. Apply the border on the **section element** that owns the band, not on an inner container.

- **Direction:** bottom-only — the section above draws the shared edge; the section below never adds a matching top border (see SKILL.md, no duplicate borders).
- **Padding around the rule:** section vertical padding (`padding-block`) must keep content from crowding the separator — use at least **`spacing-12`**–**`spacing-16`** above and below the inner content so the border reads as breathing room between bands, not a tight hairline on copy.
- **Trailing edge:** footers and the last section on a page omit **`border-bottom`** — the penultimate section still carries the divider above the footer.
- **Hero nav → headline gap:** when a hero embeds its own nav bar above the headline block, leave **`spacing-12`** (48px) minimum below the nav on mobile and **`spacing-16`** (64px) from 768px up — in addition to the slice’s internal gap — so the heading and lead never sit tight under the bar.

---

## Pairing rules

- **Inner group (related items):** `spacing-2` – `spacing-3` (8–12px).
- **Between groups in the same section:** `spacing-6` – `spacing-8` (24–32px).
- **Between page sections:** `spacing-12`+ (48px+).
- **Heading → body:** tighter than **section → section** — use `spacing-2`–`spacing-3` below headings, `spacing-8`+ between sections.
- **Control rows (input + button):** align heights first; horizontal gap **`spacing-3`** (12px) minimum.
- **Stacked form fields:** **`spacing-4`**–**`spacing-5`** (16–20px) vertical gap between fields.
- **Equal spacing everywhere is forbidden** — vary inner vs outer deliberately.

---

## Flat registry

```
spacing-0        0
spacing-px       1px
spacing-0-5      0.125rem   (2px)
spacing-1        0.25rem    (4px)
spacing-1-5      0.375rem   (6px)
spacing-2        0.5rem     (8px)
spacing-2-5      0.625rem   (10px)
spacing-3        0.75rem    (12px)
spacing-3-5      0.875rem   (14px)
spacing-4        1rem       (16px)
spacing-5        1.25rem    (20px)
spacing-6        1.5rem     (24px)
spacing-7        1.75rem    (28px)
spacing-8        2rem       (32px)
spacing-9        2.25rem    (36px)
spacing-10       2.5rem     (40px)
spacing-11       2.75rem    (44px)
spacing-12       3rem       (48px)
spacing-14       3.5rem     (56px)
spacing-16       4rem       (64px)
spacing-20       5rem       (80px)
spacing-24       6rem       (96px)
spacing-28       7rem       (112px)
spacing-32       8rem       (128px)
spacing-36       9rem       (144px)
spacing-40       10rem      (160px)
spacing-44       11rem      (176px)
spacing-48       12rem      (192px)
spacing-52       13rem      (208px)
spacing-56       14rem      (224px)
spacing-60       15rem      (240px)
spacing-64       16rem      (256px)
spacing-72       18rem      (288px)
spacing-80       20rem      (320px)
spacing-96       24rem      (384px)
```

---

## Usage by surface type

| Surface | Typical tokens |
|---|---|
| Button / input padding | spacing-4 (default), spacing-3 (compact) |
| Card inner padding | spacing-5 desktop, spacing-4 mobile |
| Accordion trigger padding | spacing-5 |
| Gap label ↔ icon | spacing-3 |
| Gap between stacked paragraphs | spacing-2 |
| Gap between form fields | spacing-4 – spacing-5 |
| Gap between cards in a list | spacing-6 |
| Page section separation | spacing-12 – spacing-16 |
| Sticky nav → hero content offset | spacing-24 below nav (plus measured nav height) |
| Modal / dialog padding | spacing-6 – spacing-8 |
| Table cell padding | spacing-3 – spacing-4 |
| Inline badge padding | spacing-1 – spacing-2 |

---

## Scoped token overrides — never alias a token to itself

Spacing tokens are declared **once at the root** and inherit down the tree. A local scope — an app shell, a dashboard region, a panel — may **override** a spacing token with **a real value from the scale** when that region genuinely needs a different rhythm, but it must **never redefine a token in terms of its own name** (aliasing the token to itself).

A self-referential override resolves to **nothing**: the token becomes invalid, and every gap, padding, and inset that reads from it silently collapses to zero. The layout then looks broken — widgets glued together, sections with no breathing room — **even though the grid and gap rules are all correct**, because the value they depend on has been nulled out. This is the most damaging spacing bug precisely because it fails silently and reads as a layout problem, not a token problem.

- **Override with a value, never with the same token name.** If a scope must change a gutter, point the token at a concrete step from the scale.
- **When gaps vanish across a whole region, suspect a self-referential token first** — before touching the grid or gap rules.

---

## Dashboard grid rhythm — one gutter for everything

The application dashboard uses **one gutter everywhere** so widgets never read as glued together:

- **Between rows, sections, and widgets:** `spacing-8` (32px) — the dashboard gutter.
- **Inside each card / widget:** `spacing-5` (20px) padding — so a card's own padding never eats into the 32px gutter between cards.
- **Main content-area padding:** `spacing-8` (32px), matching the section gutter.
- **KPI strip:** responsive columns — **1** on mobile, **2** from 640px, **4** from 1280px — separated by the 32px gutter.
- **Charts row:** a single column on mobile, **two** columns from 1280px, using the same 32px gutter.

The gutter and the card padding are the **same tokens across the whole dashboard** — never mix a 32px gap in one row with an ad-hoc gap in another, and never let a card's padding stand in for the between-card gutter.

---

## Prohibited

- **No raw px/rem in components** for padding, margin, or gap — use `spacing-*` tokens.
- **No off-scale values** (e.g. 15px, 18px) — pick the nearest step or add a token to this file with documented intent.
- **No equal spacing on every edge and every section** — inner groups stay tight; outer groups breathe more.
- **No spacing tokens as brand color** — spacing is distance only.
- **No foreign scale names** in specs or handoff — map into `spacing-*` in your implementation layer.
- **No margin hacks for vertical rhythm** when padding on the container is the correct tool — prefer padding on the owning surface for predictable backgrounds and borders.
- **No negative spacing tokens** unless a dedicated inset token is added to this file with documented exception.
- **No self-referential token overrides** — a scope must never redefine a spacing token as a reference to its own name; that nulls the token and silently collapses every gap that depends on it. Override with a real value from the scale, or leave the root value to inherit.
- **No mixed dashboard gutters** — the dashboard uses **one** gutter (`spacing-8`, 32px) between every widget and row and **one** card padding (`spacing-5`, 20px); never vary the gutter per row, and never let card padding substitute for the between-card gutter.
