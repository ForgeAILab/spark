## ADDED Requirements

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
