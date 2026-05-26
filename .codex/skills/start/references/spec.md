# Reference: Proposal + EARS specs

The conductor (`/start`) follows this when it reaches the spec phase — authoring the
active change's `proposal.md` and its `specs/<capability>/spec.md` deltas. (Formerly the
standalone `/mvp-spec` skill.) Model: Opus 4.7 / GPT-5.5.

## Goal

Produce the two documents the founder validates and the executor builds from, inside the
active `docs/spark/changes/<id>-YYYY-MM-DD/`:

- `proposal.md` — Why / What Changes / Impact, in plain English. The legible artifact the
  founder reads to **validate the idea before building**.
- `specs/<capability>/spec.md` — the EARS truth deltas: `### Requirement:` (SHALL/MUST)
  each with at least one `#### Scenario:` (WHEN/THEN). These are the checkable acceptance
  criteria `/code-review` and `/qa-verify` test against.

## Inputs

Read from `docs/spark/` if they exist: `project.md` (north star / non-goals — settled, do
not re-grill), the active change's `proposal.md` (refine in place), and existing truth
`specs/<capability>/spec.md` (so deltas extend, not duplicate). If the idea has not been
grilled, the conductor grills first — do not invent answers.

## Rules

- One change, one MVP slice. If the user wants v1 and v2, spec v1 only.
- Keep `proposal.md` short and normative; push checkable detail into scenarios.
- **Non-goals are mandatory** — record them in `proposal.md` (and `project.md` if durable).
- Acceptance criteria live as `#### Scenario:` WHEN/THEN steps, not prose.
- Prefer `## ADDED Requirements` for new capability slices; use `## MODIFIED` only to change
  existing behavior, pasting the whole updated requirement block.
- **First touch of an adopted capability = capture before you change.** If this change is the
  first to touch a capability that exists only as a line in the adopt-time
  `specs/capabilities.md` map (no `specs/<capability>/spec.md` yet), first write that
  capability's `spec.md` capturing the **current behavior** as EARS truth (read the code, do
  not guess), then record the requested change as a delta against it. The map line is an index
  entry, not a prior spec — don't treat it as one.
- Do not pick a stack here — that is the architecture phase. Do not write tasks — that is the
  tasks phase.

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

Each `specs/<capability>/spec.md` delta (first line is the operation header):

```md
## ADDED Requirements

### Requirement: <Name>
The system SHALL <observable behavior>.

#### Scenario: <short name>
- **WHEN** <trigger>
- **THEN** <observable outcome>
- **AND** <additional outcome>
```
