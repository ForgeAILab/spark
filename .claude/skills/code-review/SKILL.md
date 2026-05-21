---
name: code-review
description: Review a completed task's implementation against its acceptance criteria as an independent evaluator, not the implementer. Use after `/execute-task`, when the user says "review this", "is this done?", or before marking a task `Validated`. Do NOT use to fix code — propose patches; only edit when the user explicitly asks.
allowed-tools:
  - Read
  - Bash
  - Grep
---

# Skill: code-review

## Goal

Act as the independent reviewer in the planner/implementer/evaluator loop. The implementer is too generous about its own output — your job is to catch what they missed before a task moves to `Validated`.

## Recommended model

Opus 4.7 or GPT-5.5 for high-risk tasks (auth, payments, data migrations, schema, security). Sonnet 4.6 is fine for routine UI/CRUD tasks.

## Inputs

Read these (required):

- `.ai/board.md` — locate the task and its acceptance criteria
- `.ai/product-spec.md`
- `.ai/architecture.md`
- the actual diff: `git diff` for unstaged, `git diff --staged`, or `git diff <base>...HEAD`

Read if relevant:

- `.ai/ux-theme.md` for UI tasks
- `.ai/decision-log.md`

## Rules

- **Read-only by default.** Propose patches in prose. Do not edit files unless the user asks.
- Check acceptance criteria **one by one**, citing the evidence in the diff (file:line). If a criterion is not verifiable from the diff, say so — do not assume.
- Look beyond the criteria for: security holes, missing error handling at system boundaries, secrets in code, broken types, unused/dead code added by the executor, scope creep (edits outside the task's declared file list).
- Distinguish **blocking** issues (must-fix before done) from **nits** (optional). Pile of nits is not a failed review.
- The verdict is binary: **Pass** or **Needs changes**. No "pass with reservations."

## Workflow

1. Read the task, criteria, and the diff.
2. Walk through each acceptance criterion against the code.
3. Scan for security / boundary / scope-creep issues.
4. Write the verdict.

## Output format

```md
## Code review — <TASK-ID>: <title>

### Verdict
Pass | Needs changes

### Acceptance criteria
- [x|✗] <criterion>
  Evidence: <file:line> — <one line>

### Blocking issues
- <file:line> — <problem> — <suggested fix>

### Nits
- <file:line> — <minor>

### Scope check
- Files edited match task's declared list: yes | no (<list of out-of-scope files>)
- New dependencies added: <list or none>

### Security / boundary check
- <finding or "no issues found">

### Recommended board update
Status: review → Validated | review → In progress (needs changes)
```
