# AGENTS.md

Operating rules for any agent (Codex, Claude Code, or otherwise) working on
`{{appName}}`. The workflow is encoded in `.claude/skills/`, so the system stays
portable across tools.

<!-- SPEC:START -->
## Spec workspace

This project plans and tracks its work in a `docs/spark/` spec workspace. Read
`docs/spark/AGENTS.md` for how it works. In short: the **truth** is in
`docs/spark/specs/<capability>/spec.md` (EARS `### Requirement:` + `#### Scenario:`),
each iteration you validate lives in `docs/spark/changes/<id>-YYYY-MM-DD/`
(`proposal.md` + optional `design.md` + `tasks.md` + spec deltas), and the durable
product visual language is `docs/spark/design.md`. If an answer isn't in the
workspace, ask the user — do not invent it.
<!-- SPEC:END -->

## Operating model

A **planner / implementer / evaluator** loop. The agent that plans or grades should
not be the one that writes the code it grades. Use a strong reasoning model
(Opus 4.7 / GPT-5.5) for planning, review, and risk; a faster executor
(Sonnet 4.6 / GPT-5 family) for routine implementation. High-risk work (auth,
payments, migrations, security) uses a planning-quality model for both build and review.

## Source of truth

- `docs/spark/project.md` — product north star (vision, user, core loop, non-goals).
- `docs/spark/design.md` — durable product-wide visual language.
- `docs/spark/specs/<capability>/spec.md` — what the product does (EARS truth).
- `docs/spark/changes/<id>/` — the active iteration: `proposal.md`, optional `design.md`,
  `tasks.md` (the single source of truth for progress), and EARS deltas.

There is no `.ai/` directory and no stored board file — the build-status view is
rendered from `tasks.md` on demand.

## Three stages

1. **Propose** (`/start`) — grill the idea, then write the change (proposal → design →
   EARS specs → tasks). Stops at the approval gate; no application code yet.
2. **Build** (`/build-loop`) — once approved, implement each task and test it against its
   `#### Scenario` steps, updating `tasks.md` status until the change's scenarios pass.
3. **Archive** — fold a shipped change's EARS deltas into `docs/spark/specs/` as new truth.

`/capture-feedback` turns live-app feedback into appended `tasks.md` items or a new change.

## Hard rules

- Don't edit files outside the current task's scope. New discoveries become new `- [ ]`
  tasks in `tasks.md`, not silent edits.
- Don't pick a stack outside the active change's `design.md`; propose a change first.
- A task isn't `- [x]` / `Validated` without an independent `/code-review` + `/qa-verify`
  (for user-facing work). Execution never grades itself.
- The `Non-goals` in `project.md` and any proposal are a do-not-build list. Violations
  are scope creep, not features.
- Verification commands must actually run. A passing type-check is not a working feature.
- When `git status` and a self-report disagree, trust git.

## Skills & packs

Skills live in `.claude/skills/` (mirrored to `.codex/skills/`); see the table in
`docs/spark/AGENTS.md`. Capabilities (auth, db, payments, email, UI, AI, deploy) are
added with the `spark` CLI — `pack-resolve` to choose, `pack-add` to install,
`spark check` to report drift — never hand-rolled.
