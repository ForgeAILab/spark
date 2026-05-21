# Spec Instructions

## TL;DR

- **Stage 1 (proposal):** write `docs/spec/changes/<id>-YYYY-MM-DD/` (proposal + tasks + deltas), validate, get approval. Do not write code.
- **Stage 2 (apply):** implement tasks sequentially against the approved change. No scope creep.
- **Stage 3 (archive):** after shipping, move the change to `docs/spec/changes/archive/` and merge approved deltas into `docs/spec/specs/`.

## Delta rules

- Delta files live under `docs/spec/changes/<id>-YYYY-MM-DD/specs/<capability>/spec.md`.
- The **first non-empty line** of a delta file MUST be one of:
  - `## ADDED Requirements`
  - `## MODIFIED Requirements`
  - `## REMOVED Requirements`
  - `## RENAMED Requirements`
- Each `### Requirement:` MUST include descriptive text before any scenarios.
- Each requirement MUST include at least one scenario using exactly `#### Scenario: ...` (4 hashes).
- Prefer `ADDED` for orthogonal additions. Use `MODIFIED` only when changing existing behavior, and paste the entire updated requirement block.

## When to write a proposal

- New capability or feature
- Behavior or acceptance-criteria changes
- Breaking changes (API / schema / contracts)
- Architecture or pattern shifts
- Behavior-changing perf or security work
- Ambiguous requests that benefit from locking intent before coding

## When NOT to write a proposal

- Bug fixes that restore intended behavior
- Typos, formatting, comments-only
- Non-breaking dependency bumps
- Pure config changes that do not alter behavior
- Tests covering existing behavior only
