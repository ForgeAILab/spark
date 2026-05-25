# Spark Workspace

This is `{{appName}}`'s spec workspace — the source of truth for what the product is
and how it gets built, not the chat history. Agents read these files before acting;
if an answer isn't here, they ask you instead of inventing it.

## Layout

- `project.md` — product north star (vision, user, core loop, non-goals).
- `design.md` — durable product-wide visual language (color, type, components, states).
- `AGENTS.md` — this file: how the workspace works.
- `specs/<capability>/spec.md` — the **truth**: what the product does, in EARS form
  (`### Requirement:` SHALL + `#### Scenario:` WHEN/THEN). Updated only at archive time.
- `changes/<id>-YYYY-MM-DD/` — one folder per iteration you validate before building:
  - `proposal.md` — Why / What Changes / Impact. **Read this to validate the idea.**
  - `design.md` — optional technical "how" for a complex change.
  - `tasks.md` — the build checklist and the single source of truth for progress.
  - `specs/<capability>/spec.md` — the EARS deltas this change introduces.

## The three stages

1. **Propose** (`/start`) — understand the idea, then write the change:
   `proposal.md` → `design.md` (+ product `design.md` for UI) → EARS `specs/` → `tasks.md`.
   Stops at the approval gate. No application code yet.
2. **Build** (`/scaffold` → `/build-loop`) — once you approve, `/scaffold` stands up the
   stack (installs the change's Pack plan, confirms the app boots), then `/build-loop`
   builds toward the specs: implement each task, test it against its `#### Scenario`
   steps, update the task's status, and loop until the change's scenarios pass.
3. **Archive** — when every task is done and its scenarios pass, fold the change's EARS
   deltas into `specs/` as the new truth and move the change folder aside.

## tasks.md format (the single source of truth)

Execution state lives **only** in `tasks.md`. There is no separate board file — the
build-status view is *rendered* from these lines on demand, so it cannot drift.

    ---
    created_at: <iso8601>
    updated_at: <iso8601>
    completed_at:
    ---

    ## 1. <Section>
    - [ ] 1.1 <task>
    - [~] 1.2 <task in progress>
    - [x] 1.3 <task done>
    - [ ] 1.4 <task>  Blocked: <reason>

- `- [ ]` todo · `- [~]` in progress · `- [x]` done.
- Side states are annotated inline on the task line: `Blocked: <reason>` or `Cut: <reason>`.
- Richer metadata (depends-on, parallel-safe, linked PR) goes as indented sub-bullets
  under the task line. Never renumber a task — cut it instead.

## EARS delta rules

- Delta files live under `changes/<id>/specs/<capability>/spec.md`.
- The first non-empty line MUST be `## ADDED Requirements` / `## MODIFIED Requirements`
  / `## REMOVED Requirements` / `## RENAMED Requirements`.
- Every `### Requirement:` has descriptive SHALL/MUST text before any scenarios.
- Every requirement has ≥1 `#### Scenario:` (4 hashes) with `- **WHEN** / - **THEN** / - **AND**`.
- Use `MODIFIED` only to change existing behavior, and paste the whole updated block.

## Operating model

A **planner / implementer / evaluator** loop. The agent that plans or grades should not
be the one that writes the code it grades. Use a strong reasoning model (Opus 4.7 /
GPT-5.5) for `/start`, review, and risk; a faster executor (Sonnet 4.6 / GPT-5 family)
for routine implementation.

## Status vocabulary & gates

`Clarifying → Approved for planning → Approved for execution → In progress → Needs
review → Validated`, plus side states `Blocked` and `Cut`.

- A task is not built until its change is **approved**.
- A task is not `- [x]` / `Validated` until its acceptance scenarios pass an independent
  `/code-review` + `/qa-verify` (for user-facing work). Execution never grades itself.
- Don't edit files outside the current task's scope — new discoveries become new `- [ ]`
  tasks, not silent edits.
- The `Non-goals` in `project.md` and any proposal are a do-not-build list. Treat
  violations as scope creep.
- When git reality and a self-report disagree, trust git.

## Skills

| Stage | Skill |
| --- | --- |
| Front door | `start` |
| Build loop | `build-loop` |
| Feedback | `capture-feedback` |
| Grill | `mvp-grill`, `idea-sharpen` |
| Plan (proposal → architecture → visual → specs → tasks) | `start` (conductor; phase guidance in `start/references/`) |
| Approve | `board-review` |
| Scaffold stack | `scaffold` |
| Schedule | `parallel-execution`, `next-task` |
| Execute | `implementation-brief`, `execute-task` |
| Evaluate | `code-review`, `qa-verify` |
| Sync | `sync-board` |
| Watch | `risk-check` |
| Packs | `pack-add`, `new-pack` (pack selection is a `start` phase) |

## Packs

Capabilities (auth, db, payments, email, UI, AI, deploy) are added with the `spark`
CLI, not hand-rolled. `/start` picks the set (its pack-resolve phase), `pack-add` dry-runs
and installs, `spark check` reports drift. A pack may seed its own tasks into a
`changes/pack-install-YYYY-MM-DD/tasks.md` as `- [ ]` items tagged `requires_pack:`.
