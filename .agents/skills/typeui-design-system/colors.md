# Color Tokens — TypeUI · Cypherpunk

> The color system for **TypeUI · Cypherpunk**. Cypherpunk is a stark, two-tone, retro-tech aesthetic: **every section uses one electric-lime surface (`#D8FF7C`)** and **all text is near-black ink (`#1C1C1C`)** — no other section background is allowed, and no other color is used for reading text. Ink also supplies borders, the primary `brand` button fill, links, and the focus ring, so the whole system reads as bold lime bands under hard ink type and edges. Status hues (success, danger, warning) appear *only* when something truly is success, danger, or warning, and a small neon accent set is reserved for badges, charts, and inline highlights — never for section backgrounds or reading text. Cards, inputs, and secondary buttons sit on the lime section as a **raised beige `#EAE5DB` surface**, separated by a bold 2px **`#1C1C1C`** border rather than a shadow. Every value below is a literal hex and the single source of truth; components reference semantic tokens, never raw hex or palette steps directly.

---

## Token naming

| Pattern | Role |
|---|---|
| `body`, `heading`, `body-subtle` | Default text hierarchy |
| `fg-{intent}` | Foreground / text for brand, status, accent |
| `neutral-{level}-{accent}` | Neutral surfaces (backgrounds) |
| `brand`, `brand-soft`, `brand-strong` | Brand surfaces |
| `success`, `danger`, `warning` (+ `-soft`, `-medium`, `-strong`) | Status surfaces |
| `default`, `light`, `muted`, `buffer` | Border intent |
| `{accent}` | Standalone accent surfaces (purple, cyan, teal, etc.) |

**Level:** `primary` · `secondary` · `tertiary` · `quaternary`  
**Accent (surface):** `soft` · `medium` · `strong` · `strongest`  
**Foreground accent:** `subtle` · `strong`

---

## Semantic tokens — text

| Token | Hex |
|---|---|
| body | `#1C1C1C` |
| body-subtle | `#1C1C1C` |
| heading | `#1C1C1C` |
| fg-brand-subtle | `#C9C3B1` |
| fg-brand | `#1C1C1C` |
| fg-brand-strong | `#0E0E0E` |
| fg-success | `#1E5E3A` |
| fg-success-strong | `#133F26` |
| fg-danger | `#B14033` |
| fg-danger-strong | `#7A2A20` |
| fg-warning-subtle | `#9A7A28` |
| fg-warning | `#6B5410` |
| fg-yellow | `#C9A300` |
| fg-disabled | `#A9A396` |
| fg-purple | `#6D4FD6` |
| fg-cyan | `#0E8C95` |
| fg-indigo | `#3A48C0` |
| fg-pink | `#FF5C8A` |
| fg-lime | `#5C7A1F` |

---

## Semantic tokens — background

### Neutral

| Token | Hex |
|---|---|
| neutral-primary-soft | `#EAE5DB` |
| neutral-primary | `#EAE5DB` |
| neutral-primary-medium | `#EAE5DB` |
| neutral-primary-strong | `#EAE5DB` |
| neutral-secondary-soft | `#D8FF7C` |
| neutral-secondary | `#D8FF7C` |
| neutral-secondary-medium | `#D8FF7C` |
| neutral-secondary-strong | `#D8FF7C` |
| neutral-secondary-strongest | `#D8FF7C` |
| neutral-tertiary-soft | `#F2F0E7` |
| neutral-tertiary | `#EDE9DD` |
| neutral-tertiary-medium | `#E9E5DB` |
| neutral-quaternary | `#DDD8C9` |
| neutral-quaternary-medium | `#BDB6A2` |
| gray | `#C4BFB3` |

### Brand

| Token | Hex |
|---|---|
| brand-softer | `#E9E5DB` |
| brand-soft | `#C9C3B1` |
| brand | `#1C1C1C` |
| brand-medium | `#677483` |
| brand-strong | `#0E0E0E` |

### Status

| Token | Hex |
|---|---|
| success-soft | `#EAF5EC` |
| success | `#2D8654` |
| success-medium | `#CDE8D4` |
| success-strong | `#1E5E3A` |
| danger-soft | `#FBEAE7` |
| danger | `#E94736` |
| danger-medium | `#F6D6D0` |
| danger-strong | `#8F3328` |
| warning-soft | `#FEFBE6` |
| warning | `#FDEB65` |
| warning-medium | `#FBF3C2` |
| warning-strong | `#A8852E` |

### Utility & accent

| Token | Hex |
|---|---|
| dark-soft | `#3C444B` |
| dark | `#1C1C1C` |
| dark-strong | `#000000` |
| disabled | `#EDE9DD` |
| purple | `#9D7CFF` |
| sky | `#5BC0EB` |
| teal | `#2BB3A3` |
| pink | `#FF5C8A` |
| cyan | `#3FD8E0` |
| fuchsia | `#E0479B` |
| indigo | `#4A5BE0` |
| orange | `#F6913C` |

---

## Semantic tokens — border

| Token | Hex |
|---|---|
| buffer | `#1C1C1C` |
| buffer-medium | `#1C1C1C` |
| buffer-strong | `#1C1C1C` |
| muted | `#1C1C1C` |
| light-subtle | `#1C1C1C` |
| light | `#1C1C1C` |
| light-medium | `#1C1C1C` |
| default-subtle | `#1C1C1C` |
| default | `#1C1C1C` |
| default-medium | `#1C1C1C` |
| default-strong | `#1C1C1C` |
| success-subtle | `#1C1C1C` |
| danger-subtle | `#1C1C1C` |
| warning-subtle | `#1C1C1C` |
| brand-subtle | `#1C1C1C` |
| brand-light | `#1C1C1C` |
| dark-subtle | `#1C1C1C` |
| dark-backdrop | `#000000` |

---

## Light theme registry

Flat token map for the default (light) theme. Implement in your stack’s token layer — theme file, design tokens JSON, variables map, etc.

```
body                          #1C1C1C
body-subtle                   #1C1C1C
heading                       #1C1C1C
fg-brand-subtle                 #C9C3B1
fg-brand                        #1C1C1C
fg-brand-strong                 #0E0E0E
fg-success                      #1E5E3A
fg-success-strong               #133F26
fg-danger                       #B14033
fg-danger-strong                #7A2A20
fg-warning-subtle               #9A7A28
fg-warning                      #6B5410
fg-yellow                       #C9A300
fg-disabled                     #A9A396
fg-purple                       #6D4FD6
fg-cyan                         #0E8C95
fg-indigo                       #3A48C0
fg-pink                         #FF5C8A
fg-lime                         #5C7A1F
neutral-primary-soft            #EAE5DB
neutral-primary                 #EAE5DB
neutral-primary-medium          #EAE5DB
neutral-primary-strong          #EAE5DB
neutral-secondary-soft          #D8FF7C
neutral-secondary               #D8FF7C
neutral-secondary-medium        #D8FF7C
neutral-secondary-strong        #D8FF7C
neutral-secondary-strongest     #D8FF7C
neutral-tertiary-soft           #F2F0E7
neutral-tertiary                #EDE9DD
neutral-tertiary-medium         #E9E5DB
neutral-quaternary              #DDD8C9
neutral-quaternary-medium       #BDB6A2
gray                            #C4BFB3
brand-softer                    #E9E5DB
brand-soft                      #C9C3B1
brand                           #1C1C1C
brand-medium                    #677483
brand-strong                    #0E0E0E
success-soft                    #EAF5EC
success                         #2D8654
success-medium                  #CDE8D4
success-strong                  #1E5E3A
danger-soft                     #FBEAE7
danger                          #E94736
danger-medium                   #F6D6D0
danger-strong                   #8F3328
warning-soft                    #FEFBE6
warning                         #FDEB65
warning-medium                  #FBF3C2
warning-strong                  #A8852E
dark-soft                       #3C444B
dark                            #1C1C1C
dark-strong                     #000000
disabled                        #EDE9DD
purple                          #9D7CFF
sky                             #5BC0EB
teal                            #2BB3A3
pink                            #FF5C8A
cyan                            #3FD8E0
fuchsia                         #E0479B
indigo                          #4A5BE0
orange                          #F6913C
buffer                          #1C1C1C
buffer-medium                   #1C1C1C
buffer-strong                   #1C1C1C
muted                           #1C1C1C
light-subtle                    #1C1C1C
light                           #1C1C1C
light-medium                    #1C1C1C
default-subtle                  #1C1C1C
default                         #1C1C1C
default-medium                  #1C1C1C
default-strong                  #1C1C1C
success-subtle                  #1C1C1C
danger-subtle                   #1C1C1C
warning-subtle                  #1C1C1C
brand-subtle                    #1C1C1C
brand-light                     #1C1C1C
dark-subtle                     #1C1C1C
dark-backdrop                   #000000
```

---

## Usage rules

- **Every section background is the lime `#D8FF7C` — no other section background is allowed.** Every band on the page — hero, content sections, and footer alike — uses the electric-lime surface `neutral-secondary-soft` (`#D8FF7C`). Sections never alternate, never go cream, dark, white, or tinted, and never introduce a second section color. (Component fills — buttons, badges, status alerts — keep their own functional colors; this rule governs page sections and the surfaces cards sit on.)
- **All text is ink `#1C1C1C`.** Headings, body, captions, labels, and inline copy all use ink — `heading`, `body`, and `body-subtle` every one resolve to `#1C1C1C` — so type reads crisply on the lime surface. Never use a light or tinted text color for reading text on a section.
- **Cards, inputs & secondary buttons are a raised `#EAE5DB` surface.** Components that stand on the lime section — cards, panels, inputs and every form control, and secondary/tertiary buttons — carry the raised beige surface `neutral-primary-soft` (`#EAE5DB`), never the lime; they are set apart from the section by that fill plus their 2px `default` (`#1C1C1C`) border, never a shadow. Floating panels (modals, drawers, dropdowns, tooltips) use the same raised `#EAE5DB` surface.
- **Controls are the raised surface, defined by a border:** inputs, selects, textareas, checkboxes, radios, and toggles use the raised `#EAE5DB` surface (`neutral-primary-soft`) and are outlined by a 2px `default` (`#1C1C1C`) border — never a contrasting fill. Focus draws an ink `brand` border plus the ink `focus-ring` (`#1C1C1C`, see `shadows.md`); checked / selected / on states use the `brand` fill. See `input-field.md`.
- **Primary actions:** `brand` background (ink `#1C1C1C`); label uses `white` (the ink brand is dark and pairs with a light label — never dark text on `brand`).
- **Headings / Body / Muted:** all ink — `heading`, `body`, and `body-subtle` resolve to `#1C1C1C`; hierarchy comes from size and weight, not color.
- **Links / CTAs:** `fg-brand` (`#1C1C1C`) — ink, underlined on hover.
- **All borders are ink `#1C1C1C`, 2px solid.** Every border token (`buffer`, `muted`, `light`/`light-*`, `default`/`default-*`, `success-subtle`, `danger-subtle`, `warning-subtle`, `brand-subtle`, `brand-light`, `dark-subtle`) resolves to ink `#1C1C1C` and renders as a **2px solid** stroke. Cards, controls, dividers, table rules, every component shell, and outline buttons carry this same bold ink border — never thinner, never another color. Focus is shown by the ink `focus-ring`, and selected/checked states by the `brand` fill — not by recoloring the border. (`dark-backdrop` is the modal scrim, not a border, and is exempt.)
- **Disabled states:** `disabled` background + `fg-disabled` text.
- **Never use raw hex in components** — always reference semantic tokens.

## Prohibited

These rules are non-negotiable unless a product brief explicitly documents an exception and a compensating control.

### Token identity — agnostic by design

- **Semantic tokens are this design system’s vocabulary** — named roles (`body`, `brand`, `neutral-secondary-soft`), not imports from any external palette, framework, or vendor scale. Palette tables in this file are derivation reference only; they are **not** token names and **not** licensed aliases for third-party color systems.
- **Do not label or treat tokens as foreign palette steps** — never refer to `brand` as “neutral 900”, `body` as “zinc 800”, or `neutral-quaternary` as “stone 200” in specs, code comments, or handoff. If a token exists, use its name.
- **Do not rename tokens to match another stack** — map *into* your implementation layer (theme file, variables map, design tool styles); do not rename tokens to fit a framework’s naming convention and call that “the design system.”
- **Hex values belong to the token registry** — each semantic token owns one resolved hex per theme. Tokens are the contract; hex is the stored value, not something authors pick at build time.

### Implementation boundaries

- **No raw hex in UI surfaces** — components, layouts, illustrations, and marketing assets must reference semantic tokens only. Hex appears in this registry and in the token layer — nowhere else.
- **No palette steps in product UI** — do not apply base-palette rows directly to buttons, text, borders, or backgrounds. Every color choice resolves through a semantic token.
- **No token chaining** — semantic tokens must not point at other tokens or palette variables (`token-a → token-b → #hex`). Each semantic token holds its own hex so the system stays portable and auditable.
- **No one-off colors for “close enough”** — if no token fits, add a token to this file with documented intent; do not hard-code a nearby hex in a single screen or component.
- **No mixing themes on one surface** — light-registry values and dark-registry values must not be blended on the same element because the other theme “looked better.”
- **Sections are lime only** — every section, including the hero and footer, uses the lime (`#D8FF7C`) surface; never apply the ink `brand` (`#1C1C1C`) or any other color as a section background, never alternate section backgrounds, and never introduce a second section color. `brand` is for the primary button fill, links, borders, and the focus ring — never a section surface.
- **No card fill other than the raised surface** — cards, inputs, and secondary buttons always use the raised `#EAE5DB` surface (`neutral-primary-soft`), never the lime section color and never a lighter, derived, or tinted fill; separation from the section is that raised fill plus the 2px `default` (`#1C1C1C`) border.

### Semantic misuse

- **No brand foreground for long copy** — `fg-brand`, `fg-brand-strong`, and related brand text tokens are for links, labels, badges, and short emphasis — not paragraphs, articles, or legal text. Body copy uses `body` / `body-subtle`.
- **No accent foreground for navigation or body** — `fg-purple`, `fg-cyan`, `fg-pink`, `fg-indigo`, `fg-lime`, and similar accent text tokens are for tags, charts, and inline highlights — not nav items, menu labels, or reading text.
- **No status colors without status meaning** — `success`, `danger`, `warning`, and their `-soft` / `-strong` variants communicate state. Do not use them for decoration, category color-coding unrelated to state, or “making it pop.”
- **No accent or alternate section backgrounds** — every page section and band uses the one allowed lime surface (`#D8FF7C`). Accent and status fills are for controls, badges, and charts only — never a section background.
- **No border tokens as fills or text colors** — `default`, `light`, `brand-subtle`, and other border tokens define edges; do not repurpose them as background or typography colors without adding a proper surface or text token.

### Contrast, accessibility, and states

- **No token pairing that fails readable contrast** — when combining text and surface tokens, verify legibility (WCAG 2.2 AA minimum for text). The ink `brand` in particular pairs with a light (`white`) label, never dark. If a pair fails, change the token assignment or add a dedicated pair to the registry — do not override with raw hex.
- **No disabled styling that looks active** — disabled surfaces use `disabled` + `fg-disabled`; do not reuse `body` or `brand` on disabled controls because they read as clickable.
- **No hover/focus/active colors outside the system** — interaction states must derive from the same semantic set (e.g. a stronger brand step already in the registry), not ad-hoc lightened or darkened hex.

### Governance

- **No silent drift** — changing a token’s hex is a design-system change; update this file, note the reason, and propagate to all platforms. Per-platform hex tweaks break parity.
- **No duplicate tokens for the same job** — if two names resolve to the same role, merge them. Synonym sprawl erodes the agnostic contract.
- **No exceptions without documentation** — breaking any rule above requires naming the exception, the surface it applies to, and why the existing tokens were insufficient.
