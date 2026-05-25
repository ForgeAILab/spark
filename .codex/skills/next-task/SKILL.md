---
name: next-task
description: Pick the next best task from `tasks.md` to work on, with the reasoning. Use when the user says "what should I do next?", "what's next?", or after `/sync-board` finishes. Do NOT use to plan a whole batch — that is `/parallel-execution`.
# Generated from .claude/skills/next-task/SKILL.md — DO NOT EDIT directly
---

# Skill: next-task

## Goal

Recommend the single next task (or smallest parallel batch) the user should execute now, based on the current state of `tasks.md`.

## Recommended model

Opus 4.7 or GPT-5.5. Picking the next move is a planning call.

## Inputs

Read these (required):

- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/tasks.md`
- `docs/spark/project.md`

Read if available:

- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/design.md`

## Rules

Decision order, in priority:

1. **Unblock the core user flow first.** The user's primary action in the spec must work end-to-end before anything else.
2. **Prefer tasks whose dependencies are satisfied.** A task with unmet `Depends on:` is not eligible.
3. **Prefer tasks with clear acceptance criteria** over vague ones.
4. **Batch parallel-safe tasks** only when the user explicitly asked for parallelism.
5. **Schedule QA after every feature batch**, not at the end of the project.
6. **Do not pick polish before core works.** Empty states and copy come after the loop is alive.

Only recommend tasks in status `Approved for execution`. If nothing is approved, recommend `/board-review` instead.

## Output format

```md
## Next recommended

### Task
- <TASK-ID>: <title>

### Why now
<one line — usually one of: "unblocks core flow", "prerequisites just landed", "highest-risk path">

### Dependencies satisfied
- <DEP-ID>: <status> ✓

### Risk
<low | medium | high — and the specific risk if not low>

### Suggested execution
Run `/implementation-brief <TASK-ID>`, then `/execute-task <TASK-ID>`.

### Alternative
<one other reasonable pick + one-line reason, or "none — this is the clear next step">
```
