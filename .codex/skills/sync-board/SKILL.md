---
name: sync-board
description: Update the active change's `tasks.md` to reflect actual code progress — apply inline status changes from execution reports, add discovered tasks, and recommend the next batch. Use after `/execute-task`, at the end of a working session, or when the user says "update the board", "sync progress", "what's next?". Do NOT use to create the initial tasks.md — that is `/start`'s tasks phase.
# Generated from .claude/skills/sync-board/SKILL.md — DO NOT EDIT directly
---

# Skill: sync-board

## Goal

Keep the active change's `tasks.md` in sync with reality. Inline status is the source of
truth — if it drifts from what is actually built, the whole system breaks.

## Recommended model

Sonnet 4.6. This is mechanical reconciliation, not planning.

## Inputs

Read these (required):

- the active `docs/spark/changes/<id>-YYYY-MM-DD/tasks.md`

Read if available:

- the most recent `/execute-task` report in the conversation
- `git status` and a short `git log` (one screenful) to confirm what actually changed

## Rules

- **Trust git, not claims.** If a report says a file changed but git disagrees, flag it and do not advance the task.
- Never set a task to `- [x]` / Validated straight from execution. `[x]` requires a `/code-review`
  pass and, for user-facing work, a `/qa-verify` pass. Track partial verification as a sub-bullet
  (`code-reviewed`, `qa-verified`).
- Status flow inline: `- [ ]` → `- [~]` → `- [x]`. `Blocked: <reason>` can annotate any task.
- Never approve a change (no approval-banner edits). That is `/board-review`.
- New work discovered during execution becomes a new `- [ ]` task at the bottom of the relevant
  section — not a silent edit to an existing task.
- Tasks the user explicitly cuts get a `Cut: <reason>` annotation — never delete them.
- Record a linked PR or preview URL as a sub-bullet under the task.

## Workflow

1. Read `tasks.md` and the latest execution report.
2. Run `git status` and a short `git log` to confirm actual changes.
3. For each affected task: update its inline marker; add changed-files / verification sub-bullets.
4. Add any follow-up tasks discovered.
5. Identify the next recommended task (or batch) by dependencies.
6. Write the updated `tasks.md`.

## Output format

```md
## tasks.md synced — <change id>

### Status changes
- <task id>: <old> → <new>

### Tasks added
- <new id>: <title> (in <section>)

### Blockers
- <task id>: <reason>

### Next recommended
- <task id> (or batch from `/parallel-execution`)
- Why now: <one line>

### Drift detected
- <e.g. "claimed edit to foo.ts but git shows no change"> | none
```
