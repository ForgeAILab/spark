---
name: sync-board
description: Update `.ai/board.md` to reflect actual code progress — apply status changes from execution reports, add discovered tasks, and recommend the next batch. Use after `/execute-task`, at the end of a working session, or when the user says "update the board", "sync progress", "what's next?". Do NOT use to create the initial board — that is `/mvp-board`.
# Generated from .claude/skills/sync-board/SKILL.md — DO NOT EDIT directly
---

# Skill: sync-board

## Goal

Keep `.ai/board.md` in sync with reality. The board is the source of truth — if it drifts from what is actually built, the whole system breaks.

## Recommended model

Sonnet 4.6. This is mechanical reconciliation, not planning.

## Inputs

Read these (required):

- `.ai/board.md`

Read if available:

- the most recent `/execute-task` report in the conversation
- `git status` and `git log` (one screenful) to confirm what actually changed
- `.ai/execution-log.md` if it exists

## Rules

- **Trust git, not claims.** If a report says a file changed but git disagrees, flag it and do not advance the task.
- Never set status to `Validated` directly from execution. `Validated` requires a `/code-review` pass and, for user-facing changes, a `/qa-verify` pass. Update `Validation state` accordingly: `code-reviewed`, `qa-verified`, or `both`.
- Status flow is: `In progress` → `Needs review` → `Validated`. `Blocked` can come from any state.
- Never move a task to `Approved for execution`. That is `/board-review`'s job.
- New work discovered during execution becomes a new task in `Clarifying`, at the bottom of the relevant epic — not a silent edit to an existing task.
- Tasks the user explicitly cut go in the `Cut from MVP` section with a reason — never delete them.
- If a task is `Blocked`, record the specific blocker in a `Blocked by:` line.
- When a PR is opened, update `Linked PR:`. When a preview deploy exists, update `Demo URL:`.
- Append a one-line entry per state change to `.ai/execution-log.md` (create it if missing).

## Workflow

1. Read the board and the latest execution report.
2. Run `git status` and a short `git log` to confirm actual changes.
3. For each affected task: update status, append changed-files and verification result.
4. Add any follow-up tasks discovered.
5. Identify the next recommended task (or batch) based on dependencies.
6. Write the updated board and append to the execution log.

## Output format

After writing, return:

```md
## Board synced

### Status changes
- <TASK-ID>: <old> → <new>

### Tasks added
- <NEW-TASK-ID>: <title> (in <EPIC>)

### Blockers
- <TASK-ID>: <reason>

### Next recommended
- <TASK-ID> (or batch from `/parallel-execution`)
- Why now: <one line>

### Drift detected
- <e.g. "claimed edit to foo.ts but git shows no change"> | none
```
