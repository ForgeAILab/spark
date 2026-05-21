---
name: board-review
description: Sanity-check `.ai/board.md` before any task moves to `Approved for execution`. The approval gate between planning and execution. Use after `/mvp-board`, when the user says "is the board good?", "review the plan", or before kicking off coding. Do NOT skip this gate — it is the plan/review/approve boundary the whole system depends on.
# Generated from .claude/skills/board-review/SKILL.md — DO NOT EDIT directly
---

# Skill: board-review

## Goal

This is the **technical-founder review** that turns a draft board into one approved for execution. Catch the mistakes that compound: missing tasks, oversized tasks, wrong dependencies, risky parallel batches, and overbuilt scope.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these (required):

- `.ai/board.md`
- `.ai/product-spec.md`
- `.ai/architecture.md`

Read if available:

- `.ai/ux-theme.md`
- `.ai/decision-log.md`

## Rules

- The whole board does not have to pass at once. You may approve some epics while sending others back.
- After review, set the status on approved tasks to `Approved for execution`. Tasks needing changes go to `Clarifying` with a note.
- Verdict per task is binary: **Approved** or **Needs changes**.
- The reviewer is read-only on code, but **may edit `.ai/board.md`** to flip statuses, split oversized tasks, or add missing tasks.

## Checklist

Walk the board and flag:

- **Missing tasks** — anything in the spec's acceptance criteria with no task covering it.
- **Oversized tasks** — touches > 5 files, > 3 acceptance criteria, or > one focused session.
- **Wrong dependencies** — task B depends on A but A does not produce what B needs; or hidden dependency not declared.
- **Risky parallel batches** — tasks marked parallel-safe that actually share files, schema, routes, or shared components.
- **Overbuilt parts** — tasks for things the spec's non-goals ruled out.
- **Vague acceptance criteria** — not observable / testable.
- **No core-flow-first ordering** — auth or dashboards scheduled before the user's primary action.

## Output format

```md
## Board review

### Verdict per epic
- EPIC 1 — <Approved | Needs changes>
- EPIC 2 — <Approved | Needs changes>

### Issues
- <TASK-ID>: <category> — <what's wrong> — <suggested fix>

### Tasks to add
- <NEW-ID>: <title> — <why missing>

### Tasks to split
- <TASK-ID> → <NEW-ID-a>, <NEW-ID-b>, ...

### Status flips applied to board.md
- <TASK-ID>: <old> → Approved for execution
- <TASK-ID>: <old> → Clarifying (<reason>)

### Recommended next
Run `/parallel-execution` on approved tasks, then `/implementation-brief <ID>`.
```

After writing the review, edit `.ai/board.md` to apply the status flips. Do not invent new fields — only change statuses and (if explicitly approved by the user) split tasks.
