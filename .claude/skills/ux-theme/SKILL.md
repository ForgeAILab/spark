---
name: ux-theme
description: Define the product's durable visual language (vibe, layout, color, typography, component style, empty/loading/error patterns) and write it to `docs/spark/design.md`. Use when the user says "what should this look like?", "pick a theme", "make it feel like Linear/Notion/Vercel", or right before scaffolding UI. Do NOT use for fine-grained component styling — that belongs in execution.
allowed-tools:
  - Read
  - Write
---

# Skill: ux-theme

## Goal

Produce / refine `docs/spark/design.md` — the durable, product-wide visual direction every
executor task consults so the app looks like one product. One clear vibe, one set of patterns,
one reference product. This is the product-level visual doc, distinct from a change's technical
`design.md`.

## Recommended model

Opus 4.7 or GPT-5.5 for the direction. Sonnet 4.6 can implement against it later.

## Inputs

Read these if they exist:

- the active change's `proposal.md` and technical `design.md`
- the existing `docs/spark/design.md` (refine in place rather than rewrite)

## Rules

- Pick **one** vibe. Not "minimal but playful but also enterprise."
- Name **one** reference product to imitate. "Linear-style productivity SaaS" beats "clean and modern."
- Give concrete tokens (color roles, type scale, spacing) so executors do not invent their own.
- Define empty / loading / error patterns up front — these are where MVPs feel broken.
- Do not generate full design files. This is a brief, not Figma.

## Reference directions (pick one or describe a new one)

- Linear-style productivity SaaS
- Notion-like workspace
- Vercel-like developer tool
- Stripe-like admin dashboard
- Arc-like playful consumer app

## Output format

Write `docs/spark/design.md`:

```md
# <Product> — Visual Design

## Vibe & reference
<one sentence vibe + one reference product>

## Color
- Background / Surface / Text primary / Text muted / Accent / Danger (Tailwind names or hex)

## Typography
- Display / Body / Mono; Scale: <e.g. 12 / 14 / 16 / 20 / 24 / 32>

## Layout & spacing
<sidebar + content / centered column / dashboard grid; density, max width, radius, elevation>

## Components
<buttons, inputs, cards, dialog conventions — one set>

## States
- Empty / Loading / Error

## Constraints
- <hard "no" rules, e.g. "no gradients", "no emoji in UI">
```

After writing, hand control back to `/start`, which continues the Propose chain. Do not
name the next skill yourself; the pipeline order lives in `/start` (and never skips the
change's technical `design.md` / Pack plan on the way to tasks).
