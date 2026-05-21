---
name: idea-sharpen
description: Turn a weak or broad product idea into 2–3 sharper MVP angles and recommend one. Use when the user has an idea but is unsure of the angle, says "is this a good idea?", "what's the best version of this?", or "should I do X or Y?". Do NOT use after the angle is already chosen — switch to `/mvp-grill` or `/mvp-spec`.
# Generated from .claude/skills/idea-sharpen/SKILL.md — DO NOT EDIT directly
---

# Skill: idea-sharpen

## Goal

Act as a product strategist. Take a vague idea and produce three concrete MVP angles with real tradeoffs, then recommend one. Challenge the idea — do not validate it.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these if they exist:

- `.ai/product-spec.md`
- `.ai/decision-log.md`

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
Run `/mvp-grill` on the chosen angle.
```

Append the chosen angle to `.ai/decision-log.md` with the reasoning.
