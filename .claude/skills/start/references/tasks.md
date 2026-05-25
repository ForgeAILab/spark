# Reference: Task breakdown (tasks.md)

The conductor (`/start`) follows this when the specs + required design docs exist and
`tasks.md` is empty. (Formerly the standalone `/mvp-board` skill.) Model: Opus 4.7 / GPT-5.5.

## Goal

Produce the active change's `docs/spark/changes/<id>-YYYY-MM-DD/tasks.md` — the cockpit and
single source of truth for execution. Every task is sized for one focused session, links to
the `#### Scenario` it satisfies, and declares whether it can run in parallel. The
build-status view is rendered from this file; there is no separate board file.

## Inputs

Required (from the active change folder): `proposal.md` and its `specs/<capability>/spec.md`.
If present: the change's technical `design.md`, and `docs/spark/design.md` (visual). If the
proposal or specs are missing, the conductor returns to the spec phase first.

## Rules

- Every task fits one focused session. If it touches more than ~5 files or has more than 3
  acceptance points, split it.
- **Link each task to the `#### Scenario` it makes pass** — that scenario is its definition
  of done.
- Order tasks so the **core flow comes online first**, then polish. Auth and dashboards are
  rarely the core; the user's primary action is.
- Record metadata (`Depends on:`, `Parallel-safe:`, likely files) as sub-bullets under the task.
- Use stable numbering (`1.1`, `2.3`) or stable IDs; never renumber.
- New tasks start `- [ ]`. They are not built until `/board-review` approves the change.
- List anything the proposal's non-goals ruled out under a `## Cut` section so it does not
  silently re-enter scope.

## Output format

Write `tasks.md`:

```md
---
created_at: <iso8601>
updated_at: <iso8601>
completed_at:
---

## 1. <Section>
- [ ] 1.1 <task>
  - Scenario: <capability> / <scenario name>
  - Depends on: none
  - Parallel-safe: yes
  - Files: <path>, <path>
- [ ] 1.2 <task>

## Cut
- <thing>  Cut: <reason>
```
