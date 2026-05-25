## MODIFIED Requirements

### Requirement: Pack-Seeded Board Tasks

A pack MAY include a `tasks.yaml` declaring tasks to seed into the spark workspace at install time. Each task MUST have a stable ID, a title, acceptance criteria, and an initial status. Seeded tasks SHALL be inserted into a `docs/spark/changes/pack-install-YYYY-MM-DD/tasks.md` as `- [ ]` items annotated `Status: Clarifying` and `requires_pack: <name>` referencing the installing pack's name. Seeding MUST NOT write to any `.ai/board.md` file, which no longer exists.

#### Scenario: Tasks are seeded into the workspace on install

- **WHEN** `payments-stripe` declares two tasks `PAY-001` and `PAY-002`
- **AND** the user installs `payments-stripe`
- **THEN** a `docs/spark/changes/pack-install-YYYY-MM-DD/tasks.md` contains `- [ ]` entries for both tasks
- **AND** both tasks are annotated `Status: Clarifying`
- **AND** both tasks carry a `requires_pack: payments-stripe` annotation
- **AND** no `.ai/board.md` file is created or modified
