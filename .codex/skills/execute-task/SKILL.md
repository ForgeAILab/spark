---
name: execute-task
description: Implement exactly one tasks.md task end-to-end, then report changes and a suggested inline status update. Use when the user says "do TASK-X", "execute the next task", "implement AUTH-001", or hands a task ID to the agent. Do NOT use without a task ID — ask which task, or run `/next-task` first.
# Generated from .claude/skills/execute-task/SKILL.md — DO NOT EDIT directly
---

# Skill: execute-task

## Goal

Execute one and only one task from the active change's `tasks.md`, without touching unrelated areas. The output is code changes plus a clean report with a suggested inline status update.

## Recommended model

Sonnet 4.6 (or a comparable cheaper executor). Planning-quality models are overkill here unless the task is marked high-risk.

## Inputs

Read these (required):

- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/tasks.md` — locate the task by ID
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/proposal.md`
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/design.md`

Read if they exist:

- `docs/spark/design.md` — product-wide visual language
- The active change's `docs/spark/changes/<id>/specs/<capability>/spec.md` — linked `#### Scenario` acceptance steps
- A prior `/implementation-brief` for this task if the user provided one

If the task ID is missing, already `[x]` / `Validated`, or not in status `Approved for execution`, stop and tell the user. Approval comes from `/board-review`, not from this skill.

## Rules

- **Do exactly the task in the brief.** No bonus refactors, no "while I'm here" cleanups.
- If you discover work outside scope, write it down as a follow-up task in the report. Do not silently expand.
- Stay inside `Files likely to edit` unless a real blocker forces otherwise — then explain why in the report.
- After editing, run the verification command(s) from the brief. If they fail, fix and re-run. If you cannot fix, mark the task `Blocked: <reason>` annotated inline in the report.
- Do not edit `tasks.md` directly here — propose the inline status update in the report and let `/sync-board` apply it.
- Never mark a task `[x]` / done if acceptance criteria are not all checked.

## Workflow

1. Re-read the task, brief, and any spec/architecture sections it touches.
2. Plan the edits in your head (or in TodoWrite if non-trivial).
3. Make the changes.
4. Run verification (build / typecheck / tests / the specific command from the brief).
5. Write the report.

## Output format

```md
## Task <ID>: <title> — execution report

### Changed files
- <path>: <one-line description>

### Acceptance criteria check
- [x] <criterion> — <how it was verified>
- [ ] <criterion> — <why not yet>

### Verification
- Command: `<cmd>`
- Result: passed | failed | not run (with reason)

### Suggested tasks.md status update
Status: `[~]` In progress → `[~]` Needs review | `[ ]` Blocked: <specific reason>
Validation state: not started

### Follow-up tasks discovered
- <short title>: <one-line scope>

### Next
Run `/code-review <ID>` (independent evaluator), then `/qa-verify` for user-facing changes, then `/sync-board` to apply state.
```
