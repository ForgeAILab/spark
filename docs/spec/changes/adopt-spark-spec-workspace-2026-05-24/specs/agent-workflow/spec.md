## ADDED Requirements

### Requirement: Spec Workspace Replaces .ai Artifacts

The generated project SHALL record all product planning in a `docs/spark/` spec workspace instead of `.ai/` artifacts. The workspace MUST contain `project.md` (product north star), `design.md` (product visual design language), `AGENTS.md` (workspace usage), a `specs/<capability>/spec.md` tree (truth, in EARS form), and a `changes/<id>-YYYY-MM-DD/` tree for in-flight work. A conforming project MUST NOT contain `.ai/product-spec.md`, `.ai/architecture.md`, `.ai/ux-theme.md`, `.ai/board.md`, `.ai/decision-log.md`, or `.ai/execution-log.md`. Each change folder MUST contain `proposal.md` and `tasks.md`, MAY contain a technical `design.md` and `specs/<capability>/spec.md` deltas, and truth specs MUST be updated only by archiving a completed change.

#### Scenario: Generated project uses docs/spark

- **WHEN** a project is scaffolded by `create-spark`
- **THEN** `docs/spark/project.md`, `docs/spark/design.md`, and `docs/spark/AGENTS.md` exist
- **AND** `docs/spark/specs/` and `docs/spark/changes/` directories exist
- **AND** no `.ai/` directory is present in the generated tree

#### Scenario: A change carries proposal and tasks

- **WHEN** the user runs `/start` and approves the first feature
- **THEN** a `docs/spark/changes/<id>-YYYY-MM-DD/` folder exists
- **AND** it contains `proposal.md` and `tasks.md`
- **AND** any EARS delta lives under that folder's `specs/<capability>/spec.md`

### Requirement: Tasks File Is the Single Execution Source of Truth

Execution state SHALL live inline in each change's `tasks.md` and nowhere else. A task line MUST encode its state as `- [ ]` (todo), `- [~]` (in progress), or `- [x]` (done); side states MUST be annotated inline as `Blocked: <reason>` or `Cut: <reason>`. The kanban / build-status "cockpit" view SHALL be rendered on demand from `tasks.md` across active changes and MUST NOT be persisted as a separate board file. The planner/implementer/evaluator status vocabulary and approval gates are preserved: a task MUST NOT be built before its change is approved, and a task MUST NOT be marked done/`[x]` until its acceptance scenarios pass independent review.

#### Scenario: No stored board file exists

- **WHEN** any skill needs the current task overview
- **THEN** it renders the build-status view from `tasks.md`
- **AND** no `.ai/board.md` or other persisted board file is read or written

#### Scenario: Inline status drives the rendered view

- **WHEN** a task line in `tasks.md` is `- [~] 2.3 Wire login form`
- **THEN** the rendered build-status view shows task `2.3` as in progress
- **AND** marking it `- [x]` moves it to done in the next render without editing any other file

### Requirement: Product Visual Design Document

The `docs/spark/design.md` document SHALL define the product's durable, product-wide visual and frontend design language: color direction, typography, layout style, component conventions, and empty/loading/error patterns. It is distinct from a change-level technical `design.md` (which describes the "how" of a single change). UI-producing skills and tasks MUST treat `docs/spark/design.md` as the source of visual direction.

#### Scenario: Visual design is authored before UI work

- **WHEN** the active change includes user-facing screens
- **AND** `/start` reaches the design phase
- **THEN** `docs/spark/design.md` defines at least color, typography, and component style
- **AND** subsequent UI tasks reference it rather than inventing ad-hoc styling

### Requirement: Start Skill Conducts the Full Pipeline

The `start` skill SHALL be the single conductor and router across the project's whole lifecycle — idea → plan → approval → scaffold → build. The pipeline order SHALL live only in `start`; the individual phase skills MUST hand control back to `start` rather than naming the next skill. `start` MUST chain its phases automatically, stopping for exactly two human touchpoints: (1) it needs user input — idea-sharpen / grill questions, or a genuine fork only the user can decide; and (2) the `/board-review` approval gate.

Before approval (the documents-only Propose stage), `start` grills for scope, then authors `proposal.md`, the change's technical `design.md` (stack + Pack plan), the product visual `design.md` where UI is involved, the EARS `specs/<capability>/spec.md` deltas, and `tasks.md`, without pausing between these documents-only phases, and halts at `/board-review`. Before the approval banner exists it MUST NOT write application code, install packs, or mark a task executable. The change's technical `design.md` and the product visual `design.md` are an unordered pair, both required (visual only when UI is in scope) before `tasks.md` is written.

Once the active change carries the approval banner, `start` SHALL continue the build automatically — running `/scaffold` (install the Pack plan and verify the app boots), then driving `/build-loop` — without requiring the user to invoke each phase. The approval banner is the single authorization for this consequential work. After approval `start` MUST pause only on a blocker (a failed install/boot, or a decision only the user can make), reporting the specific reason rather than thrashing, or on explicit user interruption. `start` MUST render the build-status view whenever it stops.

#### Scenario: Propose stage chains to the gate without per-phase prompts

- **WHEN** `/start` runs on a grilled idea whose `proposal.md`, specs, design docs, and `tasks.md` are not yet written
- **THEN** it authors them in sequence without asking the user to confirm each phase
- **AND** it stops at the `/board-review` approval gate
- **AND** it does not write application code or install any pack

#### Scenario: Approved change continues to a running app without manual kickoff

- **WHEN** the active change carries the `/board-review` approval banner and the stack is not yet stood up
- **THEN** `/start` runs `/scaffold` (installing the Pack plan and verifying the app boots) and then drives `/build-loop`
- **AND** it does not require the user to invoke `/scaffold` or `/build-loop` separately
- **AND** it stops only on a blocker or when the build is complete

#### Scenario: Unapproved change does not build

- **WHEN** the proposal and specs exist but the `tasks.md` carries no approval banner
- **THEN** `/start` stops at `/board-review`
- **AND** it does not install packs, write application code, or mark any task executable

#### Scenario: A blocker pauses the build with a reason

- **WHEN** `/scaffold` or `/build-loop` hits a blocker — a failed install/boot, or a decision only the user can make
- **THEN** `/start` stops and reports the specific blocker
- **AND** it does not continue past the blocker until it is resolved

#### Scenario: Phase skills route through the conductor

- **WHEN** any phase skill (planning or build) finishes its step
- **THEN** it returns control to `/start`
- **AND** it does not itself name the next skill to run
- **AND** `/start` selects the next unsatisfied phase from its routing table

### Requirement: Planning Phases Are Conductor References

The documents-only planning procedures — authoring the proposal/specs, the technical design + Pack plan, the product visual design, the task breakdown, and pack resolution — SHALL be packaged as reference documents under the `start` skill (loaded on demand when the conductor reaches that phase) rather than as separately-invokable top-level skills. The standalone skill set MUST therefore exclude `mvp-spec`, `architecture-cutline`, `ux-theme`, `mvp-board`, and `pack-resolve` as discrete skills. Skills that serve a distinct standalone user intent (e.g. `mvp-grill`, `board-review`, `code-review`, `qa-verify`, `risk-check`, `capture-feedback`, the pack-install skills) remain separate. The project-wide skill mirror MUST copy a skill's full folder (including any `references/`) into `.codex/skills/`, not only its `SKILL.md`.

#### Scenario: Conductor loads a phase reference

- **WHEN** `/start` reaches the spec-authoring phase
- **THEN** it follows `references/spec.md` bundled with the `start` skill
- **AND** there is no separately-invokable `/mvp-spec` skill

#### Scenario: Reference files are mirrored to Codex

- **WHEN** the skill mirror runs for a skill that has files under `references/`
- **THEN** each reference file is copied verbatim into the matching `.codex/skills/<name>/references/` path
- **AND** `--check` mode reports out-of-sync if a reference file is missing or differs

### Requirement: Build Loop Converges on the Spec

The `build-loop` skill SHALL, once a change is approved, build toward its specs as the goal: for each `tasks.md` item it implements the work, tests it against the linked `#### Scenario` WHEN/THEN steps, updates the task's inline status, and repeats until the change's spec scenarios pass. It MUST keep a dev preview available for user-facing work, MUST reconcile `tasks.md` with actual results, and MUST stop on a blocker with a specific reason rather than thrash.

#### Scenario: A task is verified against its scenario

- **WHEN** `/build-loop` completes a task linked to a `#### Scenario`
- **THEN** it checks the implementation against that scenario's WHEN/THEN steps
- **AND** marks the task `- [x]` only if the scenario is satisfied
- **AND** otherwise leaves it `- [~]` (or `Blocked:`) with the failing step noted

#### Scenario: Loop ends when specs are satisfied

- **WHEN** every task in the approved change is `- [x]`
- **AND** each linked scenario passes
- **THEN** `/build-loop` reports the change ready to archive

### Requirement: Feedback Is Captured as Changes or Tasks

The `capture-feedback` skill SHALL convert plain-English feedback on the running app into either appended `tasks.md` items (for in-scope work on an approved change) or a new `changes/<id>-YYYY-MM-DD/` proposal (for new behavior), never silent code edits. It MUST flag any request that contradicts a documented non-goal and require an explicit decision before turning it into work.

#### Scenario: New behavior becomes a proposal

- **WHEN** the user asks for a capability not covered by any current change
- **THEN** `/capture-feedback` creates or updates a `changes/<id>/proposal.md`
- **AND** does not edit application code

#### Scenario: Non-goal violation is flagged

- **WHEN** feedback contradicts a non-goal recorded in `project.md` or a proposal
- **THEN** the skill flags the conflict and names the non-goal
- **AND** does not create a task until the user resolves it

## MODIFIED Requirements

### Requirement: Architecture Cutline Output Includes Pack List

The `architecture-cutline` skill SHALL produce the active change's technical `design.md` (under `docs/spark/changes/<id>-YYYY-MM-DD/design.md`) that, in addition to the stack / repo structure / data model / API surface / non-goals sections, includes a `## Pack plan` section enumerating the recommended packs by name, the capabilities each satisfies, and a single fenced code block containing the exact `spark add ...` command. The skill MUST refuse to recommend capabilities for which no pack exists in the registry, instead naming the gap and suggesting `/new-pack`.

#### Scenario: Cutline emits an executable pack plan

- **WHEN** `/architecture-cutline` runs against a spec for a paid SaaS
- **THEN** the active change's `design.md` contains a `## Pack plan` section
- **AND** that section lists at least one pack per required capability
- **AND** contains exactly one fenced code block whose contents are a single line beginning with `spark add`

#### Scenario: Cutline reports missing pack for a needed capability

- **WHEN** the spec implies a `realtime` capability
- **AND** no v1 pack provides `realtime`
- **THEN** the `## Pack plan` section explicitly names the missing capability
- **AND** suggests running `/new-pack` to author one

### Requirement: Risk Check Detects Pack-Level Drift

The `risk-check` skill SHALL, in addition to its existing checks, inspect `.spark/state.json` (if present) and flag any installed pack whose capabilities are not referenced anywhere in the `docs/spark/` workspace (its `project.md`, truth `specs/`, or the active change's `design.md`). Such packs are reported under a "Pack-level drift" section as candidates for human review. Because there is no `remove` subcommand, the recommendation is to review intent and, if the pack is genuinely unused, revert the pack-install commit via git.

#### Scenario: Unused pack is flagged as drift

- **WHEN** `analytics-posthog` is installed
- **AND** no `docs/spark/` document mentions analytics or PostHog
- **THEN** the risk-check output contains a "Pack-level drift" section
- **AND** lists `analytics-posthog` with a recommendation to either justify the install by updating the workspace or revert the pack-install commit via git
- **AND** the recommendation MUST NOT reference any `spark remove` command

#### Scenario: All installed packs are justified

- **WHEN** every installed pack's capability appears somewhere in the `docs/spark/` workspace
- **THEN** the "Pack-level drift" section reports "no drift detected"
