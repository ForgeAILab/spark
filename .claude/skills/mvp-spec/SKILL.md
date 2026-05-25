---
name: mvp-spec
description: Lock a grilled idea into the active change's validatable plan — its `proposal.md` (Why/What/Impact) plus the EARS `specs/<capability>/spec.md` deltas an executor builds against. Use when the user says "write the spec", "lock the MVP", or after `/mvp-grill` settles the open questions. Do NOT use if the active change's `proposal.md` and specs already exist and are current — edit them directly or run `/risk-check` first.
allowed-tools:
  - Read
  - Write
---

# Skill: mvp-spec

## Goal

Produce the two documents the founder validates and the executor builds from, inside
the active `docs/spark/changes/<id>-YYYY-MM-DD/`:

- `proposal.md` — Why / What Changes / Impact, in plain English. This is the legible
  artifact the founder reads to **validate the idea before building**.
- `specs/<capability>/spec.md` — the EARS truth deltas: `### Requirement:` (SHALL/MUST)
  each with at least one `#### Scenario:` (WHEN/THEN). These are the checkable
  acceptance criteria `/code-review` and `/qa-verify` test against.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these from `docs/spark/` if they exist:

- `project.md` — north star and non-goals (settled input; do not re-grill)
- the active change's `proposal.md` (refine in place rather than rewrite)
- existing truth `specs/<capability>/spec.md` (so deltas extend, not duplicate)

If the idea has not been grilled (no clear scope in `project.md` or the conversation),
stop and tell the user to run `/mvp-grill` first. Do not invent answers.

## Rules

- One change, one MVP slice. If the user wants v1 and v2, spec v1 only.
- Keep `proposal.md` short and normative; push checkable detail into scenarios.
- **Non-goals are mandatory** — record them in `proposal.md` (and `project.md` if durable).
- Acceptance criteria live as `#### Scenario:` WHEN/THEN steps, not prose.
- Prefer `## ADDED Requirements` for new capability slices; use `## MODIFIED` only to
  change existing behavior, pasting the whole updated requirement block.
- Do not pick a stack here — that is `/architecture-cutline`. Do not write tasks — that
  is `/mvp-board`.

## Output format

`proposal.md`:

```md
---
created_at: <iso8601>
updated_at: <iso8601>
---

## Why
<1–2 sentences: the problem and why now>

## What Changes
- <bullets; mark breaking changes **BREAKING**>

## Impact
- Affected specs: <capability ids>
- Affected screens / surfaces: <list or none>
- Non-goals: <what this change will NOT do>
```

Each `specs/<capability>/spec.md` delta (the first line is the operation header):

```md
## ADDED Requirements

### Requirement: <Name>
The system SHALL <observable behavior>.

#### Scenario: <short name>
- **WHEN** <trigger>
- **THEN** <observable outcome>
- **AND** <additional outcome>
```

After writing, summarize the proposal in two lines and recommend `/architecture-cutline`
(stack + pack plan) or `/ux-theme` (if UI-heavy), then `/mvp-board`.
