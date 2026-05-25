# Reference: Visual design language

The conductor (`/start`) follows this when UI is in scope and the product visual
`docs/spark/design.md` is empty. (Formerly the standalone `/ux-theme` skill.) Model: Opus
4.7 / GPT-5.5. Run this **after** the architecture phase.

## Goal

Produce / refine `docs/spark/design.md` — the durable, product-wide visual direction every
executor task consults so the app looks like one product. One clear vibe, one set of
patterns, one reference product. This is the product-level visual doc, distinct from a
change's technical `design.md`.

## Rules

- Pick **one** vibe. Not "minimal but playful but also enterprise."
- Name **one** reference product to imitate. "Linear-style productivity SaaS" beats "clean
  and modern."
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
