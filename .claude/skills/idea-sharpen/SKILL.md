---
name: idea-sharpen
description: Turn a weak or broad product idea into 2–3 sharper MVP angles and recommend one. Use when the user has an idea but is unsure of the angle, says "is this a good idea?", "what's the best version of this?", or "should I do X or Y?". Do NOT use after the angle is already chosen — switch to `/mvp-grill` or `/mvp-spec`.
allowed-tools:
  - Read
  - Write
---

# Skill: idea-sharpen

## Goal

Act as a product strategist. Take a vague idea and produce three concrete MVP angles with real tradeoffs, then recommend one. Challenge the idea — do not validate it.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these if they exist:

- `docs/spark/project.md`
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/proposal.md`

## Rules

- Produce exactly **three angles**, not more. More options means less commitment.
- Each angle must be genuinely different — not three flavors of the same idea.
- Each angle must name a specific target user and the core user action.
- Pick a winner. "It depends" is not an output.
- Call out what is weak about the original idea. Do not soften.
- Do not write code, scaffold files, or commit to a stack here.

## Output format

```
## Original idea
<one-sentence restatement, sharper than the user's>

## What is weak about it
<2–4 bullets: vague user, crowded space, no clear pull, etc.>

## Angle A — Fastest MVP
- Target user:
- Core action:
- What it does NOT do:
- Time to first usable version:
- Why this could win:
- Why this could fail:

## Angle B — Most differentiated
<same shape>

## Angle C — Most monetizable
<same shape>

## Recommendation
<one of A/B/C, with the single reason that decides it>

## Next
Scope angle chosen — hand back to `/start`, which resumes the Propose chain (grilling the chosen angle next).
```

Record the chosen angle and its reasoning in the active change's `proposal.md`, then return control to `/start`. Do not name the next skill yourself; the pipeline order lives in `/start`.
