# AGENTS.md

Operating rules for any agent (Codex, Claude Code, or otherwise) working in this repo. Mirror of the workflow encoded in `.claude/skills/`, so the system stays portable.

<!-- SPEC:START -->
## Spec workflow

For proposals/specs/plans, new capabilities, breaking changes, architecture shifts, or behavior-changing perf/security work, keep the source of truth in this project's `.ai/` artifacts first. If the project later adopts formal spec deltas, place them under `docs/spec/changes/<id>-YYYY-MM-DD/`; truth specs after archive live under `docs/spec/specs/`.
<!-- SPEC:END -->

## Operating model

This project runs a **planner / implementer / evaluator** loop. The same agent should not plan, build, and grade its own work. Use a strong reasoning model (Opus 4.7 / GPT-5.5) for planning and review; use a faster executor (Sonnet 4.6 / GPT-5 family) for routine implementation.

## Source of truth

The truth is in repo artifacts, not in chat:

- `.ai/product-spec.md` — what the MVP is. Source of acceptance criteria and non-goals.
- `.ai/architecture.md` — the stack and the cutline (what we are NOT building yet).
- `.ai/ux-theme.md` — visual direction. Empty / loading / error patterns live here.
- `.ai/board.md` — every task, with status, dependencies, owners, validation state, linked PR.
- `.ai/decision-log.md` — locked-in decisions and the reasoning.
- `.ai/execution-log.md` — append-only history of state changes.

If an answer is not in these files, ask the user — do not invent it.

## Workflow phases

1. **Grill the idea** until it is buildable. Max 5 questions per round. Only questions that change scope or architecture.
2. **Write the spec.** One MVP slice. Non-goals are mandatory.
3. **Cut the architecture.** Boring stack > clever stack. Every choice has a "not building yet" sibling.
4. **Theme the UX.** One vibe, one reference product, concrete tokens.
5. **Build the board.** Tasks sized for one focused session. Declare `Depends on:` and `Parallel-safe:`.
6. **Review the board.** Approval gate between planning and execution. No task starts until it is `Approved for execution`.
7. **Brief each task** before execution. Self-contained, with files-to-inspect, acceptance criteria verbatim, and a verification command.
8. **Execute one task at a time.** Stay inside the declared file list. No bonus refactors.
9. **Review independently.** A separate pass checks the diff against acceptance criteria, security, and scope.
10. **QA-verify** by actually running the app and walking the core user journey.
11. **Sync the board** from git reality. Trust git, not claims.

## Board statuses

`Clarifying` → `Approved for planning` → `Approved for execution` → `In progress` → `Needs review` → `Validated`

Side states: `Blocked`, `Cut from MVP`.

`Validated` requires both a `/code-review` pass and a `/qa-verify` pass for user-facing changes. Execution never grades itself.

## Hard rules

- Do not edit files outside the current task's declared scope. New discoveries become new tasks in `Clarifying`, not silent edits.
- Do not pick a stack outside `.ai/architecture.md`. Propose a decision-log update first.
- Do not mark tasks `Validated` without independent review.
- Do not move a task to `Approved for execution` from execution skills. Only board-review can.
- Treat the `Non-goals` section of the spec and the `What we are NOT building yet` section of architecture as a `do-not-build` list. Violations are scope creep, not features.
- Verification commands must actually run. Type-check passing is not the same as feature working.
- When `git status` and a self-report disagree, trust git.

## Skill / command equivalents

Claude Code skills live in `.claude/skills/`. The same operations on Codex should be triggered through the matching workflow names:

| Stage | Skill |
| --- | --- |
| Grill | `mvp-grill`, `idea-sharpen` |
| Spec | `mvp-spec` |
| Architecture | `architecture-cutline` |
| Theme | `ux-theme` |
| Board | `mvp-board`, `board-review` |
| Schedule | `parallel-execution`, `next-task` |
| Execute | `implementation-brief`, `execute-task` |
| Evaluate | `code-review`, `qa-verify` |
| Sync | `sync-board` |
| Watch | `risk-check` |

## Model assignment defaults

- Planning / reviewing / scoping: **Opus 4.7** or **GPT-5.5**.
- Routine execution: **Sonnet 4.6** or a GPT-5 family executor.
- High-risk tasks (auth, payments, migrations, security): planning-quality model for both build and review.

## Conventions

- Stable task IDs (e.g. `AUTH-001`). Never renumber.
- Append to `.ai/decision-log.md` whenever a non-obvious choice is made, with: decision, context, alternatives considered, why, risk, revisit condition.
- Append to `.ai/execution-log.md` one line per state change in `.ai/board.md`.
- Do not delete board tasks. Move them to `Cut from MVP` with a reason.

## Packs

Feature packs are installed with the `anvil` CLI.
Use `pack-resolve` to choose the scaffold and pack set, `pack-add` to dry-run
and install declarative pack changes, then `sync-board` to reconcile `.ai/board.md`
with the installed capabilities and current repository state.
