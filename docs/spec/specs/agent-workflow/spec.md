# agent-workflow Specification

## Purpose
TBD - created by archiving change add-scaffold-and-pack-registry. Update Purpose after archive.
## Requirements
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

### Requirement: Conductor Detects Cold Start vs Iteration

The `start` conductor SHALL determine, from the `docs/spark/` workspace alone and without
asking the user, whether a request is a **cold start** (no real `project.md` and no shipped
`specs/`) or an **iteration** on a shipped MVP (`project.md` carries a north star AND `specs/`
holds shipped truth, or `changes/` contains an archived change). In iteration mode the
conductor SHALL classify the request as bug / polish / feature / scope-change and, for
bug / polish / feature, take a **light route**: open a change and author `proposal.md`, the
open EARS `specs/<capability>/spec.md` deltas, and `tasks.md`, then stop once at
`/board-review`. On the light route it MUST NOT re-grill scope and MUST NOT author a technical
`design.md` (the stack is inherited from the shipped MVP) — this carves an explicit exception
to the full-pipeline authoring sequence. The conductor SHALL escalate to the full chain
(grill + architecture) only when the request is a scope-change, breaches a documented
non-goal, or is a large-scale change the user explicitly asks for. Both modes preserve exactly
one approval gate.

#### Scenario: Iteration is detected and the grill is skipped

- **WHEN** `/start` receives a "change/add/tune X" request in a project whose `project.md` has a north star and whose `specs/` holds shipped truth
- **THEN** the conductor treats it as an iteration and does not re-run `/mvp-grill`
- **AND** it routes the request through the light-route table

#### Scenario: Light route stops at one gate without a technical design

- **WHEN** a bug / polish / feature request is taken on the light route
- **THEN** the conductor authors `proposal.md`, the open `specs/` deltas, and `tasks.md`
- **AND** it does not author a technical `design.md`
- **AND** it stops at exactly one `/board-review` gate before any task is executable

#### Scenario: Scope-change escalates to the full chain

- **WHEN** an iteration request contradicts a documented non-goal or redefines product scope
- **THEN** the conductor escalates to the full chain, grilling the new scope and cutting/extending the architecture before the gate
- **AND** it does not silently absorb the change as a light-route task

#### Scenario: Cold start still runs the full chain

- **WHEN** `/start` receives a fresh idea with no real `project.md` and no shipped `specs/`
- **THEN** the conductor runs the full chain (grill → proposal → architecture → visual → specs → tasks → gate)

### Requirement: Conductor Resolves Unknowns via Conditional Research

Before authoring the proposal, the `start` conductor SHALL resolve genuine unknowns into a
bounded `research.md` in the active change folder
(`docs/spark/changes/<id>-YYYY-MM-DD/research.md`). This phase is **conditional**: the
conductor MUST run it only when a real unknown blocks the proposal or architecture — prior
art or a convention, a rapidly-changing technology/API choice (cold start), or existing
code/specs the agent has not read (iteration) — and MUST skip it when nothing is genuinely
unknown. `research.md` MUST tie every finding to a named unknown and a resulting decision or
an open question carried into the proposal, and MUST NOT pick the stack (that is the
architecture phase) or write tasks. The rendered build-status view SHALL show `Research` as
`n/a` when the phase was skipped.

#### Scenario: Research runs for a real unknown

- **WHEN** a grilled idea depends on a rapidly-changing API whose surface the grill could not settle
- **THEN** `/start` produces a `research.md` whose findings each resolve a named unknown into a decision or an open question
- **AND** it does not pick the stack or write tasks in that file

#### Scenario: Research is skipped when nothing is unknown

- **WHEN** a request introduces no unknown the proposal or architecture would otherwise guess at
- **THEN** `/start` does not create a `research.md`
- **AND** the build-status view shows `Research` as `n/a`

#### Scenario: Iteration explores existing code before proposing

- **WHEN** a light-route modification touches source files or specs the agent has not read
- **THEN** `/start` scans the affected files into `research.md` (with `path:line` notes) before drafting the proposal
- **AND** the proposal extends the existing behavior rather than assuming it

### Requirement: Conductor Detects and Adopts an Existing Project

The `start` conductor SHALL recognize a third entry mode — **adopt** — for an existing
codebase that spark did not build: substantive source code is present (real dependencies and
application source such as `src/`, `app/`, or `server/`) but there is no spark workspace (no
real `project.md`, and no shipped `specs/` including `specs/capabilities.md`). Because this
condition otherwise matches a cold start, detection MUST be conservative — the conductor SHALL
confirm with the user before adopting, so a freshly initialized `create-spark` scaffold (files
present but no product code) is not mistaken for a brownfield app. On adopt the conductor SHALL
NOT re-grill the product as a fresh idea and SHALL NOT run `/scaffold` to stand up the existing
stack.

Adopt is a one-time **bootstrap**: the conductor SHALL explore the codebase (reusing the
conditional research phase), then author `docs/spark/project.md` (an inferred north star plus
conventions and the *detected* stack) and `docs/spark/specs/capabilities.md` (a one-line index
of the detected capabilities, with no scenarios). It MUST NOT back-fill full EARS `spec.md`
files for untouched capabilities. The conductor SHALL record the detected scaffold template and
present packs in `spark.config.json` / `.spark/state.json` so the inherited stack reads as
already-installed. Adopt SHALL stop at **exactly one** approval gate: the user confirms the
inferred north star and conventions before the project is considered onboarded.

#### Scenario: Existing project is adopted, not cold-started

- **WHEN** `/start` runs in a repo that has real dependencies and application source but no `docs/spark/` workspace
- **THEN** the conductor detects an existing project and, after confirming with the user, runs the adopt bootstrap
- **AND** it does not re-grill the product as a fresh idea
- **AND** it does not run `/scaffold` to re-stand-up the existing stack

#### Scenario: Adopt captures a capability map, not full specs

- **WHEN** the adopt bootstrap completes for a codebase with several capabilities
- **THEN** `docs/spark/project.md` carries an inferred north star, conventions, and the detected stack
- **AND** `docs/spark/specs/capabilities.md` lists each detected capability as a single line with no scenarios
- **AND** no per-capability `specs/<capability>/spec.md` is written at adopt time

#### Scenario: Fresh scaffold is not mistaken for a brownfield app

- **WHEN** `/start` runs in a directory that holds only a freshly initialized `create-spark` scaffold with no product code
- **THEN** the conductor does not silently adopt it
- **AND** it treats the project as a cold start (or confirms intent before doing anything irreversible)

#### Scenario: Adopt stops at exactly one gate

- **WHEN** the adopt bootstrap has authored `project.md` and `specs/capabilities.md` and recorded the stack
- **THEN** the conductor stops once for the user to confirm the inferred north star and conventions
- **AND** it does not proceed to build before that confirmation

### Requirement: Adopted Workspace Behaves as an Iteration

After a project has been adopted, the `start` conductor SHALL treat the workspace as an
**iteration**: a real north star in `project.md` together with `docs/spark/specs/capabilities.md`
counts as shipped truth, so the next request resolves to the light route rather than falling
back to cold start. Because lazy capture leaves capabilities with only a map entry, the **first**
light-route change that touches an un-specced capability SHALL create that capability's
`specs/<capability>/spec.md` from the current behavior (the EARS truth of what exists today)
alongside the change's spec delta, rather than assuming a prior spec already exists.

#### Scenario: Post-adopt request takes the light route

- **WHEN** a "change/add/tune X" request arrives in a workspace that was adopted (north star in `project.md` plus a populated `specs/capabilities.md`)
- **THEN** the conductor classifies it as an iteration and routes it through the light-route table
- **AND** it does not re-run the cold-start chain

#### Scenario: First change to a mapped capability writes its spec from current behavior

- **WHEN** a light-route change is the first to touch a capability that exists only in `specs/capabilities.md`
- **THEN** the conductor first writes `specs/<capability>/spec.md` capturing the current behavior as EARS truth
- **AND** it records the requested change as a delta against that newly captured spec
