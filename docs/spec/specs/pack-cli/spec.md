# pack-cli Specification

## Purpose
TBD - created by archiving change add-scaffold-and-pack-registry. Update Purpose after archive.
## Requirements
### Requirement: CLI Is a Bun TypeScript Package

The pack manager CLI SHALL be implemented as a TypeScript package in `packages/cli/`, run by Bun, and distributed as a single npm package. The CLI MUST NOT require Rust, native addons, cross-platform binary wrappers, or any compiled dependency outside what Bun and its standard package ecosystem already provide.

#### Scenario: User runs the CLI through Bun

- **WHEN** a user with Bun ≥ 1.3 installed runs `bunx spark list` in a scaffolded project
- **THEN** the command executes the TypeScript entry point directly
- **AND** prints the pack list

#### Scenario: No Rust toolchain is required

- **WHEN** a user with no Rust toolchain installed runs any `spark` subcommand
- **THEN** the command succeeds without compiling, downloading, or invoking a Rust toolchain

### Requirement: CLI Subcommands

The CLI SHALL expose exactly the following subcommands in v1: `list`, `info <pack>`, `check`, `add <pack...> [--dry-run]`, `preset <name>`. There MUST NOT be a `remove`, `uninstall`, or `update` subcommand. Users who want to undo a pack install revert via git.

#### Scenario: `list` shows installed and available packs

- **WHEN** the user runs `spark list` in a scaffolded project with `db-sqlite` and `ui-shadcn` installed
- **THEN** the output groups packs by category
- **AND** marks `db-sqlite` and `ui-shadcn` as installed
- **AND** marks all other packs in the registry as available

#### Scenario: `add --dry-run` previews without applying

- **WHEN** the user runs `spark add payments-stripe --dry-run`
- **THEN** the CLI prints the resolved install plan including every file that would be written or appended
- **AND** the filesystem is unchanged
- **AND** `.spark/state.json` is unchanged

#### Scenario: `remove` subcommand does not exist

- **WHEN** the user runs `spark remove db-sqlite`
- **THEN** the CLI exits non-zero with an "unknown subcommand" error
- **AND** the error message names git as the supported way to undo a pack install

### Requirement: Idempotent Install

`spark add <pack>` MUST be idempotent. Running it twice with the same arguments MUST produce the same end state as running it once and MUST NOT duplicate file writes, env-var appends, or seeded board tasks.

#### Scenario: Second add is a no-op

- **WHEN** the user runs `spark add db-sqlite` and the install succeeds
- **AND** the user immediately runs `spark add db-sqlite` again
- **THEN** the CLI reports `db-sqlite` is already installed
- **AND** exits 0
- **AND** no file in the project tree is modified
- **AND** `.spark/state.json` is unchanged

### Requirement: Capability and Scaffold Resolution

Before applying any filesystem change, the CLI SHALL resolve the requested pack set against installed packs, the registry, and the active project's scaffold template. Resolution MUST detect missing capabilities, conflicting capabilities, scaffold incompatibilities, and circular dependencies, and MUST produce an ordered install plan or a structured error.

#### Scenario: Missing required capability aborts install

- **WHEN** the user runs `spark add payments-stripe` in a project with no `auth` capability installed
- **THEN** the CLI aborts before writing any file
- **AND** prints an error naming `auth` as the missing capability
- **AND** suggests packs that `provides = ["auth"]`

#### Scenario: Conflicting packs cannot coexist

- **WHEN** the user installs `payments-stripe` and then attempts `spark add payments-polar`
- **AND** both packs declare each other under `conflicts`
- **THEN** the second install aborts with an error naming both packs
- **AND** no filesystem change is made

#### Scenario: Incompatible scaffold aborts install

- **WHEN** the active project's `spark.config.json` declares `template = "nextjs"`
- **AND** the user attempts to install a pack whose `compatible_scaffolds` does not include `nextjs`
- **THEN** the install aborts with a scaffold-incompatibility error

### Requirement: State File Tracks Installs for Drift Detection

The CLI SHALL maintain `.spark/state.json` recording, per installed pack, the pack name, version, every file written, every appended block, every env var added, and every task ID seeded. The state file's sole purpose is to support `check`. The state file MUST NOT be used to drive uninstall (which does not exist in v1) and the CLI MUST NOT delete project files based on the state file's contents.

#### Scenario: Install appends to the state file

- **WHEN** the user runs `spark add db-sqlite` for the first time
- **THEN** `.spark/state.json` gains an entry for `db-sqlite` listing the files written, env vars added, and tasks seeded

#### Scenario: State file is read-only with respect to project files

- **WHEN** any `spark` subcommand runs
- **THEN** it MUST NOT delete or modify any project file based on the state file's contents
- **AND** the state file is only used to compute install plans, drift reports, and "already installed" checks

### Requirement: `check` Subcommand

`spark check` SHALL audit the current project against `.spark/state.json` and report drift: missing files that were recorded as installed, env vars declared by installed packs that are missing from `.env.local`, and tasks seeded into `.ai/board.md` that have been deleted by hand. `check` MUST NOT attempt to repair drift; it only reports.

#### Scenario: Clean project produces an OK report

- **WHEN** every recorded file is present
- **AND** every required env var is present in `.env.local`
- **AND** every seeded task is still present in `.ai/board.md`
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
