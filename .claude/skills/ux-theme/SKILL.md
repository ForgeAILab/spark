---
name: ux-theme
description: Define the visual and product direction (vibe, layout, color, typography, component style) before coding starts. Use when the user says "what should this look like?", "pick a theme", "make it feel like Linear/Notion/Vercel", or right before scaffolding UI. Do NOT use for fine-grained component styling — that belongs in execution.
allowed-tools:
  - Read
  - Write
---

# Skill: ux-theme

## Goal

Produce `.ai/ux-theme.md` — a concrete visual direction that every executor task can consult. Lovable-style theme control: one clear vibe, one set of patterns, one reference product.

## Recommended model

Opus 4.7 or GPT-5.5 for the direction. Sonnet 4.6 can implement against it later.

## Inputs

Read these if they exist:

- `.ai/product-spec.md`
- `.ai/architecture.md`
- `.ai/decision-log.md`

## Rules

- Pick **one** vibe. Not "minimal but playful but also enterprise."
- Name **one** reference product to imitate. "Linear-style productivity SaaS" beats "clean and modern."
- Give concrete tokens (color names, type scale, spacing) so executors do not invent their own.
- Define empty / loading / error patterns up front — these are where MVPs feel broken.
- Do not generate full design files. This is a brief, not Figma.

## Reference directions (pick one or describe a new one)

- Linear-style productivity SaaS
- Notion-like workspace
- Vercel-like developer tool
- Stripe-like admin dashboard
- Arc-like playful consumer app

## Output format

Write `.ai/ux-theme.md`:

```md
# UX Theme — <name>

## Vibe
<one sentence>

## Reference product
<one product, with a link or short description of what to copy>

## Layout style
<sidebar + content / centered single column / dashboard grid / etc.>

## Color direction
- Background:
- Surface:
- Text primary:
- Text muted:
- Accent:
- Danger:
(prefer Tailwind palette names or hex)

## Typography
- Display:
- Body:
- Mono:
- Scale: <e.g. 12 / 14 / 16 / 20 / 24 / 32>

## Component style
- Corners: <radius>
- Borders: <weight, color>
- Shadows: <none / soft / layered>
- Buttons: <filled / outlined / ghost variants>
- Inputs: <style>

## Patterns
- Empty state:
- Loading state:
- Error state:
- Table:
- Card:
- Dialog / modal:

## Constraints
- <hard "no" rules, e.g. "no gradients", "no emoji in UI">
```

After writing, recommend `/mvp-board` next.
