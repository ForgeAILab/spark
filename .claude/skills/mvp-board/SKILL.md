---
name: mvp-board
description: Convert the spec and architecture into an executable Markdown board of epics and tasks. Use when the user says "build the board", "break this into tasks", "what should I build first?", or after `.ai/product-spec.md` and `.ai/architecture.md` are in place. Do NOT use to update an existing board after code changes — that is `/sync-board`.
allowed-tools:
  - Read
  - Write
---

# Skill: mvp-board

## Goal

Produce `.ai/board.md` — the cockpit for the whole project. Every task is sized for one Claude Code session, has acceptance criteria, and declares whether it can run in parallel.

This is the most important artifact in the system. The board is truth; chat is steering.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these (required):

- `.ai/product-spec.md`
- `.ai/architecture.md`

Read if they exist:

- `.ai/ux-theme.md`
- `.ai/decision-log.md`

If spec or architecture is missing, stop and tell the user.

## Rules

- Every task must fit in one focused execution session. If a task touches more than ~5 files or has more than 3 acceptance criteria, split it.
- Every task must declare **Depends on** and **Parallel-safe**. No exceptions.
- Order tasks so the **core flow comes online first**, then polish. Auth and dashboards are not core — the user's primary action is.
- Mark explicit non-tasks for things the spec ruled out, so they do not silently re-enter scope.
- Use stable IDs (e.g. `AUTH-001`, `FEED-002`) so other skills can reference them.

## Output format

Write `.ai/board.md`:

```md
# MVP Board

## Rules
- Only execute one task at a time unless marked parallel-safe.
- Every task must have acceptance criteria.
- Completed tasks must list changed files and verification result.
- New discoveries become new tasks, not silent scope expansion.

## Status legend
Clarifying | Approved for planning | Approved for execution | In progress | Needs review | Validated | Blocked | Cut from MVP

New tasks start in `Clarifying`. They only move to `Approved for execution` via `/board-review`. Execution skills must refuse to act on tasks not in `Approved for execution`.

---

## EPIC 1: <name>

### TASK <ID>: <short title>
Status: Clarifying
Priority: P0 | P1 | P2
Agent owner: planner | sonnet | reviewer
Human owner: <name or @handle>
Depends on: <ID> | none
Parallel-safe: yes | no
Risk: low | medium | high
Validation state: not started | code-reviewed | qa-verified | both
Linked PR: <url or none>
Demo URL: <url or none>

Acceptance criteria:
- [ ] <observable>
- [ ] <observable>

Files likely touched:
- <path>

Execution prompt:
Use `/implementation-brief <ID>`, then `/execute-task <ID>`, then `/code-review <ID>` and `/qa-verify`.

---

(repeat for every task)

## Cut from MVP
- <thing>: <reason>
```

After writing, recommend `/board-review` as the next step. Tasks must not move to execution until reviewed and approved.
