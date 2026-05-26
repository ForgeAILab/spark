# AGENTS.md

Operating rules for any agent (Codex, Claude Code, or otherwise) working in this repo.
This is the mirror of the workflow encoded in `.claude/skills/` — the workflow spark
ships to generated projects, where it operates on a `docs/spark/` spec workspace.

<!-- SPEC:START -->
## Spec workflow

For proposals/specs/plans, new capabilities, breaking changes, architecture shifts, or
behavior-changing perf/security work in **this repo**, follow the spec workflow in
`@/docs/spec/AGENTS.md`. Stage 1 proposals live under `docs/spec/changes/<id>-YYYY-MM-DD/`;
truth specs after archive live under `docs/spec/specs/`. (Generated founder projects use
the same shape under `docs/spark/` — see below.)
<!-- SPEC:END -->

## Operating model

This project runs a **planner / implementer / evaluator** loop. The same agent should not
plan, build, and grade its own work. Use a strong reasoning model (Opus 4.7 / GPT-5.5) for
planning and review; use a faster executor (Sonnet 4.6 / GPT-5 family) for routine
implementation.

## Source of truth

The truth is in the generated project's `docs/spark/` workspace, not in chat:

- `docs/spark/project.md` — product north star (vision, user, core loop, non-goals).
- `docs/spark/design.md` — durable product-wide **visual** design language.
- `docs/spark/specs/<capability>/spec.md` — what the product does, in EARS form
  (`### Requirement:` SHALL + `#### Scenario:` WHEN/THEN). Updated only at archive time.
- `docs/spark/specs/capabilities.md` — the adopt-time capability map (one line per capability,
  no scenarios); counts as shipped truth until a full `spec.md` is written lazily on first touch.
- `docs/spark/changes/<id>-YYYY-MM-DD/` — the active iteration: `proposal.md` (Why/What/
  Impact, the doc the founder validates), optional `research.md` (explore/research findings
  when an unknown had to be resolved first), optional technical `design.md`, `tasks.md`
  (the single source of truth for execution), and EARS spec deltas.

There is no `.ai/` directory and no stored board file — the build-status view is rendered
from `tasks.md` on demand. If an answer is not in the workspace, ask the user — do not invent it.

## Entry modes: cold start, adopt, iteration

The phases below describe a **cold start** — a fresh idea with no shipped truth and no
existing code. Detect the mode from the workspace **and the repo around it**; the founder
never declares it.

- **Adopt** — an existing codebase spark did not build: real dependencies and source, but no
  `docs/spark/` workspace. Run a one-time **adopt bootstrap** — explore the code, infer
  `project.md` (north star + conventions + the *detected* stack), write
  `specs/capabilities.md` (a one-line capability map, no scenarios), and record the stack as
  already-installed — then stop **once** for the founder to confirm the inferred baseline. It
  never back-fills full specs and never re-stands-up the stack; after confirmation the project
  is an iteration. Detection is conservative — a bare `create-spark` scaffold is a cold start,
  not an adopt. (`/start` → `references/adopt.md`; mirrors OpenSpec `init` in an existing repo.)
- **Iteration** — `project.md` carries a real north star **and** `specs/` holds shipped truth:
  a per-capability `spec.md`, the adopt-time `capabilities.md` map, or an archived `changes/`.
  The MVP was already grilled (or adopted) and the stack is fixed.

In iteration mode, take the **light route** for bug / polish / feature work — open a change
and write `proposal.md` + the open EARS spec deltas + `tasks.md` (the spec-proposal shape),
then stop **once** for approval (phase 6) and go straight to build. Skip the grill (1), the
architecture cut (3), the UX re-theme (4), and pack-resolve — the stack is inherited; no
technical `design.md` is authored. Run `/scaffold` only if the change needs a genuinely new
pack. Escalate back to the full chain below only for a scope-change, a non-goal breach, or a
large-scale change the founder explicitly asks for. Either way there is exactly one gate.

## Workflow phases

1. **Grill the idea** until it is buildable. Max 5 questions per round. Only questions that change scope or architecture.
   - *Conditional — explore/research.* Before proposing, resolve any genuine unknown into a short `research.md`: scan the affected code/specs (iteration) or pin a prior-art / rapidly-changing tech fact (cold start). Bounded; skip entirely when nothing is unknown. (`/start` → `references/research.md`; mirrors OpenSpec `explore` + spec-kit Phase 0.)
2. **Write the proposal + specs.** One MVP slice. Non-goals are mandatory. Acceptance criteria are EARS `#### Scenario` WHEN/THEN steps.
3. **Cut the architecture.** Boring stack > clever stack — the change's `design.md`, with a `## Pack plan`. Every choice has a "not building yet" sibling.
4. **Theme the UX.** One vibe, one reference product, concrete tokens — `docs/spark/design.md`.
5. **Build the tasks.** `tasks.md` tasks sized for one focused session, each linked to the scenario it satisfies. Declare `Depends on:` and `Parallel-safe:` as sub-bullets.
6. **Review, then scaffold.** Approval gate between planning and execution. Once approved, `/scaffold` installs the change's Pack plan (`spark add …`) and verifies the app boots. No task is built until its change is `Approved for execution`.
7. **Brief each task** before execution. Self-contained, with files-to-inspect, the linked scenario, and a verification command.
8. **Execute one task at a time.** Stay inside the declared file list. No bonus refactors.
9. **Review independently.** A separate pass checks the diff against the task's scenario, security, and scope.
10. **QA-verify** by actually running the app and walking the core user journey.
11. **Sync tasks.md** from git reality. Trust git, not claims.

## Status vocabulary

`Clarifying` → `Approved for planning` → `Approved for execution` → `In progress` → `Needs review` → `Validated`

Side states: `Blocked`, `Cut`. Stored inline in `tasks.md` as `- [ ]` (todo) / `- [~]` (in
progress) / `- [x]` (done), with `Blocked:` / `Cut:` annotations on the task line.

`Validated` requires both a `/code-review` pass and a `/qa-verify` pass for user-facing changes. Execution never grades itself.

## Hard rules

- Do not edit files outside the current task's declared scope. New discoveries become new `- [ ]` tasks, not silent edits.
- Do not pick a stack outside the active change's `design.md`. Propose a change first.
- Do not mark tasks `Validated` / `[x]` without independent review.
- Do not move a task to `Approved for execution` from execution skills. Only `board-review` can.
- Treat `Non-goals` in `project.md` and any proposal as a `do-not-build` list. Violations are scope creep, not features.
- Verification commands must actually run. Type-check passing is not the same as feature working.
- When `git status` and a self-report disagree, trust git.

## Skill / command equivalents

Claude Code skills live in `.claude/skills/`. The same operations on Codex should be triggered through the matching workflow names:

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

## Model assignment defaults

- Planning / reviewing / scoping: **Opus 4.7** or **GPT-5.5**.
- Routine execution: **Sonnet 4.6** or a GPT-5 family executor.
- High-risk tasks (auth, payments, migrations, security): planning-quality model for both build and review.

## Conventions

- Stable task IDs / numbering (e.g. `1.2`, `AUTH-001`). Never renumber.
- Record non-obvious decisions in the change's `proposal.md` / `design.md` (Decisions); they fold into `specs/` at archive time.
- Do not delete tasks. Annotate them `Cut: <reason>` instead.

## Packs

Feature packs are documented in `docs/pack-spec.md` and live under `packs/`.
`/start` resolves the scaffold + pack set (its pack-resolve phase); `pack-add` dry-runs
and installs declarative pack changes; then `sync-board` reconciles the active
change's `tasks.md` with the installed capabilities and current repository state.
A pack may seed its own tasks into a `docs/spark/changes/pack-install-YYYY-MM-DD/tasks.md`.
