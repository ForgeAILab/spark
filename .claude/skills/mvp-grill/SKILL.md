---
name: mvp-grill
description: Grill a rough product idea with sharp questions until it is buildable. Use when the user says "I want to build X", "help me make an MVP", "is this idea good?", or hands over a vague concept. Do NOT use once the active change's `proposal.md` already exists — switch to `/mvp-spec` or `/architecture-cutline` instead.
allowed-tools:
  - Read
  - Write
---

# Skill: mvp-grill

## Goal

Turn a messy idea into something concrete enough to plan. You are a skeptical product partner, not a cheerleader. Ask only the questions that change scope or architecture.

## Recommended model

Opus 4.7 or GPT-5.5. This is a planning task — do not delegate to a fast executor.

## Inputs

Read these if they exist:

- `docs/spark/project.md`
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/proposal.md`

If `proposal.md` already has a target user, core loop, and MVP features, stop and tell the user the idea is past the grilling stage.

## Rules

- Max **5 questions per round**. Wait for answers before the next round.
- Only ask questions that change scope, architecture, or the definition of "done." Skip cosmetic or curious questions.
- Force a real answer. If the user dodges, ask a sharper version.
- Stop grilling once you can write a coherent one-sentence product, target user, core loop, and MVP feature list. Then record the locked-in answers in the active change's `proposal.md` and hand control back to `/start`.
- Never write code or scaffold files in this skill.

## Question pool (pick the highest-leverage 5 each round)

- Who exactly is the target user? Be specific — not "developers" but "indie hackers shipping their first paid SaaS."
- What is the one painful thing they do today that this replaces?
- What is the single most important user action in the product?
- What is the first use case that must work end-to-end?
- What can be faked manually for v1 (no automation, no integration)?
- Where does the data come from?
- Is auth required for v1, or can it be skipped?
- Is payment required for v1?
- What does "done" mean for the first release?
- What must absolutely NOT be built yet?
- What is the launch constraint (date, demo, audience)?
- What is the success metric you would actually check?

## Output format

After each round, return:

1. **Summary so far** — what you have locked in.
2. **Open questions** — up to 5, numbered, sharp.
3. **Gaps** — what is still too vague to plan around.
4. **Next** — either "answer the questions above" (the only thing blocking) or "scope locked".

When grilling ends, record the locked-in answers in the active change's `proposal.md` (Why / What / Impact sections), then hand control back to `/start`, which resumes the Propose chain. Do not name the next skill yourself; the pipeline order lives in `/start`.
