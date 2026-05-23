## MODIFIED Requirements

### Requirement: CLI Subcommands

The CLI SHALL expose exactly the following subcommands in v1: `list`, `info <pack>`, `check`, `add <pack...> [--dry-run]`, `preset <name>`. There MUST NOT be a `remove`, `uninstall`, or `update` subcommand. Users who want to undo a pack install revert via git.

`info` and `add` MUST surface and act on a pack's `[runtime_package]` block when present (see "Install Modes" requirement below). `check` MUST verify the helper package is still present in the consumer project's `package.json` for every installed hybrid pack.

#### Scenario: `list` shows installed and available packs

- **WHEN** the user runs `anvil list` in a scaffolded project with `db-sqlite` and `ui-shadcn` installed
- **THEN** the output groups packs by category
- **AND** marks `db-sqlite` and `ui-shadcn` as installed
- **AND** marks all other packs in the registry as available

#### Scenario: `add --dry-run` previews without applying

- **WHEN** the user runs `anvil add payments-stripe --dry-run`
- **THEN** the CLI prints the resolved install plan including every file that would be written or appended AND the helper package that would be installed
- **AND** the filesystem is unchanged
- **AND** `.anvil/state.json` is unchanged
- **AND** the consumer project's `package.json` is unchanged

#### Scenario: `remove` subcommand does not exist

- **WHEN** the user runs `anvil remove db-sqlite`
- **THEN** the CLI exits non-zero with an "unknown subcommand" error
- **AND** the error message names git as the supported way to undo a pack install

## ADDED Requirements

### Requirement: Install Modes — Copy and Hybrid

The CLI SHALL recognize two pack install modes — `copy` and `hybrid` — inferred from the presence/absence of `[runtime_package]` in the pack manifest. `copy` is the default. `hybrid` adds exactly one behavior to the `copy` install path: the named helper package is included in the `bun add` batch alongside the pack's declared `[dependencies].runtime`. All other install steps (file operations, env-var appends, board seeding, skill copying, state writes) are identical between the two modes.

#### Scenario: Hybrid pack install adds the helper package

- **WHEN** the user runs `anvil add auth-better-auth`
- **AND** `packs/auth-better-auth/pack.toml` declares `[runtime_package] package = "@forgeailab/anvil-auth-better-auth"`, `version = "^0.1"`
- **THEN** the CLI invokes `bun add @forgeailab/anvil-auth-better-auth@^0.1` as part of the install
- **AND** the consumer's `package.json` lists `@forgeailab/anvil-auth-better-auth` under dependencies
- **AND** the pack's wiring files (declared in `[[files]]`) are copied per their mode

#### Scenario: Copy pack install does not add a helper package

- **WHEN** the user runs `anvil add db-sqlite`
- **AND** `packs/db-sqlite/pack.toml` has no `[runtime_package]` block
- **THEN** the CLI install path does not invoke `bun add` for any helper package
- **AND** only the packages declared in `[dependencies].runtime` and `[dependencies].dev` are added

#### Scenario: Dev-mode resolution uses `file:` link when the helper exists locally

- **WHEN** the user runs `anvil add auth-better-auth` against a project whose `anvil.config.json` sits outside the monorepo
- **AND** `ANVIL_ROOT` is set to the monorepo root
- **AND** `libs/anvil-auth-better-auth/package.json` exists at `${ANVIL_ROOT}/libs/anvil-auth-better-auth/`
- **THEN** the CLI invokes `bun add file:${ANVIL_ROOT}/libs/anvil-auth-better-auth` (or an equivalent relative `file:` path)
- **AND** the consumer's `package.json` lists `@forgeailab/anvil-auth-better-auth` with a `file:` dep specifier
- **AND** the version range from `[runtime_package].version` is NOT used in this mode

#### Scenario: Published-mode resolution uses npm version range when the helper is not local

- **WHEN** the user runs `anvil add auth-better-auth` against a project where neither `ANVIL_ROOT` is set nor a local `libs/anvil-auth-better-auth/` is reachable from the project's anvil monorepo lookup
- **AND** `packs/auth-better-auth/pack.toml` declares `[runtime_package].version = "^0.1"`
- **THEN** the CLI invokes `bun add @forgeailab/anvil-auth-better-auth@^0.1`
- **AND** the consumer's `package.json` lists the helper with the `^0.1` range

### Requirement: `info` Reports Install Mode and Resolved Helper Version

`anvil info <pack>` SHALL include an "Install mode" line — either `copy` or `hybrid`. For hybrid packs, the output MUST also display the helper package name, the version range declared in the pack manifest, and the resolved installed version (looked up from the consumer's `bun pm ls` or equivalent). When the helper package is not yet installed in the consumer project, the resolved version is reported as `not installed`.

#### Scenario: `info` on a hybrid pack shows the helper

- **WHEN** the user runs `anvil info auth-better-auth` in a project where `@forgeailab/anvil-auth-better-auth@0.1.4` is installed
- **THEN** the output contains `Install mode: hybrid`
- **AND** the output contains `Runtime helper: @forgeailab/anvil-auth-better-auth (range ^0.1, resolved 0.1.4)`

#### Scenario: `info` on a copy pack shows copy mode

- **WHEN** the user runs `anvil info db-sqlite`
- **THEN** the output contains `Install mode: copy`
- **AND** the output does NOT contain a `Runtime helper:` line

### Requirement: `check` Audits Hybrid Helper Presence

For every pack recorded in `.anvil/state.json` whose manifest declares `[runtime_package]`, `anvil check` SHALL verify that the helper package is still listed in the consumer project's `package.json` (as a `dependencies` or `devDependencies` entry; `dependencies` is the expected location). When the helper is missing, `check` MUST report drift with a clear "helper package missing" line naming the pack and the helper package.

#### Scenario: Missing hybrid helper is surfaced as drift

- **WHEN** the user has installed `auth-better-auth`
- **AND** the user manually removes `@forgeailab/anvil-auth-better-auth` from `package.json`
- **AND** the user runs `anvil check`
- **THEN** the exit code is non-zero
- **AND** the output lists `auth-better-auth: helper package @forgeailab/anvil-auth-better-auth missing from package.json` under a drift section
- **AND** `check` does NOT repair the drift

#### Scenario: Helper present produces no false positive

- **WHEN** the user has installed `auth-better-auth`
- **AND** `@forgeailab/anvil-auth-better-auth` is present in `package.json`
- **THEN** `anvil check` does not flag the pack under any helper-related drift section
