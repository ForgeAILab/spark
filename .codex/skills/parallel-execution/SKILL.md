---
name: parallel-execution
description: Decide which board tasks can safely run at the same time and group them into execution batches. Use when the user says "what can run in parallel?", "batch the board", "can I spin up multiple agents?", or after `.ai/board.md` is built. Do NOT use as a license to fan out everything — the output may be one batch.
# Generated from .claude/skills/parallel-execution/SKILL.md — DO NOT EDIT directly
---

# Skill: parallel-execution

## Goal

Read the board and produce ordered execution batches where every task inside a batch is safe to run in parallel. Conflicts are detected up front, not at merge time.

## Recommended model

Opus 4.7 or GPT-5.5. This is dependency analysis — do not rush it.

## Inputs

Read these (required):

- `.ai/board.md`
- `.ai/architecture.md`

## Rules

- A batch is parallel-safe only if **no two tasks share**:
  - the same files (likely-edit lists)
  - the same database schema migration
  - the same route or layout
  - the same shared component
  - the same migration / config file
- If two tasks conflict, the later one moves to the next batch.
- Foundations (schema, routing skeleton, theme tokens) usually go alone in Batch 1.
- Integration / QA / deployment tasks usually go alone in the last batch.
- Prefer **fewer, safer batches** over many micro-batches.
- It is fine for the answer to be "no parallelism — run sequentially."

## Output format

```md
## Execution batches

### Batch 1 — foundations
- <TASK-ID>: <title>
- <TASK-ID>: <title>
Why parallel-safe: <one line>

### Batch 2 — feature work
- ...

### Batch 3 — integration / QA
- ...

## Conflicts detected
- <TASK-A> ⇄ <TASK-B>: <shared resource>

## Recommended execution mode
- Sequential: <which tasks>
- Parallel with worktrees / subagents: <which tasks>
- Background: <which tasks, if any>

## Notes for the executor
- <e.g. "DB migration must finish before Batch 2 starts">
```

After returning the plan, recommend `/execute-task <ID>` for the first batch.
