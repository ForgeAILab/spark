---
name: board-review
description: Sanity-check the active change's `tasks.md` (against its proposal + specs) before the change moves to `Approved for execution`. The approval gate between planning and building. Use after `/start` drafts the tasks, when the user says "is the plan good?", "review the plan", or before kicking off coding. Do NOT skip this gate — it is the plan/review/approve boundary the whole system depends on.
# Generated from .claude/skills/board-review/SKILL.md — DO NOT EDIT directly
---

# Skill: board-review

## Goal

The **technical-founder review** that turns a draft `tasks.md` into an approved change. Catch
the mistakes that compound: missing tasks, oversized tasks, wrong dependencies, risky parallel
batches, and overbuilt scope — before any code is written.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these (required), from the active `docs/spark/changes/<id>-YYYY-MM-DD/`:

- `tasks.md`
- `proposal.md` and its `specs/<capability>/spec.md`

Read if available: the change's technical `design.md`, and `docs/spark/design.md`.

## Rules

- The whole change does not have to pass at once. You may approve it while sending specific tasks back.
- **Approval is recorded on the change, not per task.** When approved, add (or update) a banner
  line directly under the `tasks.md` frontmatter:
  `> **Approved for execution** — <date> (/board-review)`. `/build-loop` only builds a change
  that carries this banner.
- Tasks needing changes get a `Needs changes: <note>` sub-bullet and stay `- [ ]`.
- Verdict per task is binary: **Approved** or **Needs changes**.
- The reviewer is read-only on code, but **may edit `tasks.md`** to add the banner, split
  oversized tasks, or add missing tasks.

## Checklist

Walk the tasks and flag:

- **Missing tasks** — any `#### Scenario` in the change's specs with no task covering it.
- **Oversized tasks** — touches > 5 files, > 3 acceptance points, or > one focused session.
- **Wrong dependencies** — B depends on A but A does not produce what B needs; or an undeclared hidden dependency.
- **Risky parallel batches** — `Parallel-safe` tasks that actually share files, schema, routes, or components.
- **Overbuilt parts** — tasks for things the proposal's non-goals ruled out.
- **Vague acceptance** — a task with no linked scenario, or not observable.
- **No core-flow-first ordering** — auth or dashboards scheduled before the user's primary action.

## Output format

```md
## Plan review — <change id>

### Verdict
- Change: <Approved for execution | Needs changes>

### Issues
- <task id>: <category> — <what's wrong> — <suggested fix>

### Tasks to add / split
- <new id>: <title> — <why missing>
- <task id> → <id-a>, <id-b>

### Applied to tasks.md
- Added "Approved for execution" banner (<date>) | Sent <task id> back with a note

### Recommended next
Approved → hand back to `/start`, which now **continues the build automatically**: it runs
`/scaffold` (install the Pack plan, verify boot) and then drives `/build-loop` — no manual
kickoff needed. It pauses only on a blocker or a decision. (Sent tasks back instead? Stay in
planning until they're resolved and re-approved.)
```

After writing the review, edit `tasks.md`: add the approval banner if approved, or attach
`Needs changes:` notes to the tasks sent back. Do not invent new fields.
