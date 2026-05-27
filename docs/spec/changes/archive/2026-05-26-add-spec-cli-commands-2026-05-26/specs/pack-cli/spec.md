## MODIFIED Requirements

### Requirement: CLI Subcommands

The CLI SHALL expose exactly the following subcommands in v1: `list`, `info <pack>`, `check`, `add <pack...> [--dry-run]`, `preset <name>`, `validate [path]`, `status [--change <id>]`. There MUST NOT be a `remove`, `uninstall`, or `update` subcommand. Users who want to undo a pack install revert via git. The `validate` and `status` subcommands operate on the `docs/spark/` spec workspace (not on packs) and their behavior is specified by the `spec-cli` capability.

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

#### Scenario: Workspace subcommands are recognized

- **WHEN** the user runs `spark validate` or `spark status` in a scaffolded project
- **THEN** the CLI dispatches to the corresponding workspace command rather than printing an "unknown subcommand" error
