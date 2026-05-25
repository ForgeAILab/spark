## MODIFIED Requirements

### Requirement: `check` Subcommand

`spark check` SHALL audit the current project against `.spark/state.json` and report drift: missing files that were recorded as installed, env vars declared by installed packs that are missing from `.env.local`, and tasks seeded into the spark workspace's `tasks.md` (under `docs/spark/changes/<id>/tasks.md`) that have been deleted by hand. `check` MUST NOT attempt to repair drift; it only reports.

#### Scenario: Clean project produces an OK report

- **WHEN** every recorded file is present
- **AND** every required env var is present in `.env.local`
- **AND** every seeded task is still present in its `docs/spark/changes/<id>/tasks.md`
- **THEN** `spark check` exits 0 with an "OK" summary

#### Scenario: Missing env var is surfaced

- **WHEN** `payments-stripe` is installed and requires `STRIPE_SECRET_KEY`
- **AND** `.env.local` does not contain `STRIPE_SECRET_KEY`
- **THEN** `spark check` exits non-zero
- **AND** lists `STRIPE_SECRET_KEY` under a "missing env" section

#### Scenario: Missing recorded file is surfaced

- **WHEN** the state file records a pack-installed file
- **AND** that file no longer exists on disk
- **THEN** `spark check` reports the missing file under a "drift" section
- **AND** suggests `git restore` or re-running the affected pack install
