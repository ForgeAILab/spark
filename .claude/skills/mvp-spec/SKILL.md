---
name: mvp-spec
description: Convert a grilled idea into a single concise MVP specification that an executor can build from. Use when the user says "write the spec", "let's lock the MVP", or after `/mvp-grill` has settled the open questions. Do NOT use if `.ai/product-spec.md` already exists and is current — edit it directly or run `/risk-check` first.
allowed-tools:
  - Read
  - Write
---

# Skill: mvp-spec

## Goal

Produce `.ai/product-spec.md` — the single source of truth for what the MVP is. Technical enough that Sonnet/Claude Code can execute without guessing, short enough to fit in working memory.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these if they exist:

- `.ai/decision-log.md` (this is the input — do not re-grill)
- existing `.ai/product-spec.md` (update in place rather than rewrite)

If the decision log is missing the answers needed, stop and tell the user to run `/mvp-grill` first. Do not invent answers.

## Rules

- One spec, one MVP slice. If the user wants v1 and v2, write v1 only.
- Every section must fit on one screen. If it does not, you are over-specifying.
- **Non-goals are mandatory.** A spec without a non-goals list always leaks scope.
- Acceptance criteria must be checkable, not aspirational.
- Do not pick a stack here — that is `/architecture-cutline`'s job.
- Do not write tasks here — that is `/mvp-board`'s job.

## Output format

Write `.ai/product-spec.md` with exactly these sections:

```md
# Product Spec — <name>

## 1. One-sentence product
<who it is for, what it does, what they get>

## 2. Target user
<specific persona, not a category>

## 3. Core user journey
<3–7 numbered steps from open-app to win>

## 4. MVP feature list
- <feature>: <one-line description>
(keep this list aggressively short)

## 5. Non-goals
- <thing we will NOT build for MVP>
(at least 5 entries; this section is mandatory)

## 6. Data model
<entities and their key fields, no SQL>

## 7. Screens / pages
- <route>: <purpose>

## 8. Integrations
<auth, payments, third-party APIs, or "none">

## 9. Risks
<technical, product, or scope risks — 3–5 bullets>

## 10. Acceptance criteria
- [ ] <observable, testable statement>
(these are what makes MVP "done")
```

After writing, return a short summary and recommend `/architecture-cutline` next.
