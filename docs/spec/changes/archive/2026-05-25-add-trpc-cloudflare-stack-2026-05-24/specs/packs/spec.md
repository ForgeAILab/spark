## MODIFIED Requirements

### Requirement: Pack-Capability Enum and Exclusivity

The v1 pack-capability enum SHALL be closed and equal to: `db`, `auth`, `payments`, `email`, `ui-kit`, `local-runtime`, `deploy-target`, `e2e`, `ai-sdk`, `blob-storage`, `analytics`, `data-api`. Each capability MUST be classified as either **exclusive** (only one pack may provide it in a project) or **non-exclusive** (any number of packs may provide it). The classification for v1 is:

- **Exclusive:** `db`, `auth`, `payments`, `ui-kit`, `data-api`
- **Non-exclusive:** `ai-sdk`, `analytics`, `email`, `blob-storage`, `e2e`, `deploy-target`, `local-runtime`

`data-api` is exclusive because a project can sensibly have only one client/server data-layer contract — realtime sync (e.g. Zero), typed RPC (e.g. tRPC), or any future GraphQL/REST equivalent — driving the wire format and the typed client. The resolver MUST enforce exclusivity at install time. Adding a new pack-capability tag, changing its classification, or adding a new value requires a registry-wide change.

The previous capability name `sync` is no longer accepted; any manifest declaring `sync` in `provides`, `requires`, or `conflicts` MUST be rejected with an error naming the unknown capability tag.

#### Scenario: Two exclusive providers cannot coexist

- **WHEN** `sync-zero` is installed (it provides the exclusive capability `data-api`)
- **AND** the user runs `spark add api-trpc` (which also provides `data-api`)
- **THEN** the install aborts before writing any file
- **AND** the error names both packs and the exclusive capability they both provide
- **AND** suggests the user run `git reset` or remove the existing pack via revert before installing the alternative

#### Scenario: Two non-exclusive providers coexist

- **WHEN** `ai-anthropic` is installed (it provides the non-exclusive capability `ai-sdk`)
- **AND** the user runs `spark add ai-openai` (which also provides `ai-sdk`)
- **THEN** both installs succeed
- **AND** the resolver does not flag a conflict on `ai-sdk`

#### Scenario: Legacy `sync` capability is rejected

- **WHEN** the CLI parses a manifest declaring `provides = ["sync"]`
- **THEN** the manifest is rejected with an error naming the unknown capability tag `sync`
- **AND** the error message points the user at `data-api` as the replacement
- **AND** no filesystem changes are made

## ADDED Requirements

### Requirement: data-api Provider Pack Shape

A pack providing the `data-api` capability SHALL ship a typed router or sync engine that exposes a single fetch handler suitable for mounting on the active template's server runtime. The pack MUST declare `requires = ["db", ...]` because every data-api provider is read/write over the project's database, and MUST declare `conflicts = ["data-api"]` so the resolver names the conflict cleanly when a second provider is attempted.

#### Scenario: api-trpc declares the contract

- **WHEN** the CLI parses `packs/api-trpc/pack.toml`
- **THEN** `provides` includes `"data-api"`
- **AND** `requires` includes `"db"`
- **AND** `conflicts` includes `"data-api"`
- **AND** the pack ships at least one file under `files/server/` that exports a fetch-compatible handler

#### Scenario: sync-zero declares the contract after rename

- **WHEN** the CLI parses `packs/sync-zero/pack.toml`
- **THEN** `provides` includes `"data-api"` and does not include `"sync"`
- **AND** `requires` includes `"db"`
- **AND** `conflicts` includes `"data-api"`
