---
name: implementation-brief
description: Generate the exact prompt an executor (Sonnet / Claude Code) should receive to implement one tasks.md task without wandering. Use when the user says "give Claude Code the prompt for TASK-X", "prep this task for execution", or right before handing a task to an executor. Do NOT use to actually run the task — that is `/execute-task`.
# Generated from .claude/skills/implementation-brief/SKILL.md — DO NOT EDIT directly
---

# Skill: implementation-brief

## Goal

Produce a tight, executor-ready brief for one specific task. The brief is the contract that stops the executor from inventing scope.

## Recommended model

Opus 4.7 or GPT-5.5 (planning-quality model writes the brief; cheaper model executes it).

## Inputs

Read these (required):

- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/tasks.md` — find the task by ID
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/proposal.md`
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/design.md`

Read if they exist:

- `docs/spark/design.md` — product-wide visual language
- The active change's `docs/spark/changes/<id>/specs/<capability>/spec.md` — EARS deltas

If the task ID is not in `tasks.md`, stop and ask the user.

## Rules

- One task per brief. Never bundle.
- The brief must be **self-contained** — an executor should not need to re-read the spec to do the work.
- Quote the acceptance criteria from the board verbatim. Do not paraphrase.
- List files **to inspect first** separately from files **likely to edit**. Reading comes before writing.
- Include the exact verification command(s) the executor must run before declaring done.
- Forbid anything not in scope by name.

## Output format

Return a single fenced block the user can copy into the executor:

```
# Task brief — <ID>: <title>

## Context
<2–4 sentences pulled from spec and architecture>

## Goal
<single sentence>

## Non-goals
- <thing not to do>
- <thing not to refactor>

## Acceptance criteria (verbatim from board)
- [ ] ...
- [ ] ...

## Files to inspect first
- <path> — <why>

## Files likely to edit
- <path>

## UX / theme constraints (if relevant)
<short reference to `docs/spark/design.md` patterns>

## Commands to run
- <install / build / test>

## Definition of done
1. Acceptance criteria check, item by item.
2. Verification command exits 0.
3. List changed files and one-line per change.
4. Suggest board status update.
5. List any follow-up tasks discovered.

## Out of scope (do not touch)
- <area / file / feature>
```

After returning the brief, recommend `/execute-task <ID>` as the next step.
