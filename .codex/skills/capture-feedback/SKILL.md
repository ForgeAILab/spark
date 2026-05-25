---
name: capture-feedback
description: Turn plain-English reactions during live preview into well-formed work in the `docs/spark/` workspace. Use when the user reacts to the running app — "make the header sticky", "add dark mode", "signup is broken", "this copy is wrong" — usually inside `/build-loop`. Classifies each item as bug / polish / feature / scope-change, then either appends a `- [ ]` task to the active change's `tasks.md` or opens a new `changes/<id>/proposal.md`, and flags anything that violates a documented non-goal. Do NOT write application code here — that is `/execute-task`; do NOT approve a change for execution — that is `/board-review`.
# Generated from .claude/skills/capture-feedback/SKILL.md — DO NOT EDIT directly
---

# Skill: capture-feedback

## Goal

Make conversational iteration safe. When the user looks at the running app and
says "change this," capture it as clean, tracked work instead of silently editing
code — so `tasks.md` stays the source of truth and scope creep stays visible. This
is the bridge between the live preview and the build loop.

## Recommended model

Sonnet 4.6 is fine. The only judgment calls are classification and the non-goals
check; escalate only if a request clearly reopens the architecture or scope.

## Inputs

Read these from `docs/spark/` (required):

- The active `changes/<id>-YYYY-MM-DD/tasks.md` — to match feedback to an existing
  task or append a new one
- `docs/spark/project.md` — especially **Non-goals**, to detect scope creep
- The active `changes/<id>/proposal.md` — its scope and any stated non-goals
- The change's `specs/<capability>/spec.md` — whether the ask is already covered

## Rules

- **Never edit code.** Capture intent as tasks or a proposal; building is
  `/execute-task` via `/build-loop`.
- **Classify every item** before writing it:
  - **Bug** on an in-progress task → add a failing criterion to that task and set
    it back to `[~]`. Bug on a done (`[x]`) task → new task referencing it; mark it
    todo (`[ ]`) — only the approving gate makes it executable.
  - **Polish** inside a not-yet-done task in the approved change → append to that
    task's sub-bullets. Otherwise a new `[ ]` task.
  - **Feature / new behavior not covered by any current change** → do not bury it in
    `tasks.md`. Open (or update) a `changes/<id>-YYYY-MM-DD/proposal.md` capturing
    the ask, and route the user to `/start` to flesh it out. Never auto-approve.
  - **Scope-change that contradicts a documented non-goal** → do not create a task.
    Flag it, name the non-goal it breaks (and where it is recorded), and ask whether
    to amend `project.md` / the proposal first.
- **Append, don't renumber.** New tasks join the right `## N. Section` of the active
  `tasks.md` as `- [ ]` items; reuse existing numbering, never renumber.
- **One line of why** for each feature/scope item, tied to the user's words.
- Do not touch any approval gate, and do not write a separate log file — git history
  and the inline `tasks.md` status are the record.

## Workflow

1. Split the user's message into discrete items.
2. Classify each (bug / polish / feature / scope-change).
3. For each, decide where it lands: amend an existing `tasks.md` task, append a new
   `- [ ]` task, or open a `changes/<id>/proposal.md` for genuinely new behavior.
4. Apply the edits (to the active `tasks.md`, or a new/updated `proposal.md`).
5. Re-render the build-status view (from `/start`) and hand back to `/build-loop`.

## Output format

```md
## Captured feedback

| Item (user's words) | Type | Lands as | Where |
| --- | --- | --- | --- |
| "<quote>" | bug/polish/feature/scope | `<task id>` <title> or new proposal | tasks.md / changes/<id> |

### ⚠️ Scope flags
- "<quote>" breaks Non-goal "<non-goal>" (in <project.md|proposal>) — amend first? (y/n)

<build-status view from /start>

### Next
- In-scope, ready: run `/build-loop` to build the appended tasks.
- New behavior: run `/start` to turn the new proposal into an approved change.
- Scope flags above need a decision before they become work.
```
