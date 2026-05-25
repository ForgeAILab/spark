---
name: mvp-board
description: Convert the active change's proposal and design into an executable `tasks.md` — numbered sections of one-session tasks with inline status checkboxes, each linked to the `#### Scenario` it satisfies. Use when the user says "build the board", "break this into tasks", "what should I build first?", or after the proposal + specs exist. Do NOT use to update an existing tasks.md after code changes — that is `/sync-board`.
# Generated from .claude/skills/mvp-board/SKILL.md — DO NOT EDIT directly
---

# Skill: mvp-board

## Goal

Produce the active change's `docs/spark/changes/<id>-YYYY-MM-DD/tasks.md` — the cockpit and
single source of truth for execution. Every task is sized for one focused session, links to
the `#### Scenario` it satisfies, and declares whether it can run in parallel. The build-status
view is rendered from this file; there is no separate board file.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these (required), from the active change folder:

- `proposal.md` and its `specs/<capability>/spec.md`

Read if they exist:

- the change's technical `design.md`, and `docs/spark/design.md` (visual)

If the proposal or specs are missing, stop and route the user to `/start` → `/mvp-spec`.

## Rules

- Every task fits one focused session. If it touches more than ~5 files or has more than 3
  acceptance points, split it.
- **Link each task to the `#### Scenario` it makes pass** — that scenario is its definition of done.
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

After writing, recommend `/board-review`. Tasks must not be built until the change is approved.
