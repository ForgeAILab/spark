## ADDED Requirements

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
