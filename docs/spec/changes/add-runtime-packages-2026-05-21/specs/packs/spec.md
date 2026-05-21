## MODIFIED Requirements

### Requirement: Pack Manifest Format

A pack SHALL be a directory containing a `pack.toml` manifest, an optional `files/` tree, an optional `skills/` tree, and an optional `tasks.yaml`. The manifest MUST declare the following fields:

- `name` — string, must equal the directory name
- `version` — semver string
- `category` — string from the closed category enum (`db`, `auth`, `payments`, `email`, `ui`, `ai`, `infra`, `testing`, `deploy`, `analytics`, `storage`)
- `description` — one-line string
- `provides` — array of pack-capability tags from the closed pack-capability enum
- `requires` — array of pack-capability tags
- `conflicts` — array of pack-capability tags (NOT pack names)
- `requires_runtime` — array of template-capability tags from a separate closed template-capability enum
- `compatible_scaffolds` — array of registered template names; empty/missing means works on any template that satisfies `requires_runtime`
- `[dependencies]` — table with `runtime` and `dev` arrays of npm package specs
- `[env]` — table with `required` and `optional` arrays of env var names
- `[[files]]` — array of file operations, each with `mode`, `from`, `to`
- `[skills]` — optional table with a `copy` array of skill folder paths
- `[tasks]` — optional table with a `file` field pointing to a `tasks.yaml`
- `[runtime_package]` — **OPTIONAL** table with `package` (full npm name, e.g. `"@forgeailab/anvil-auth-better-auth"`) and `version` (semver range). Presence of this block classifies the pack as **hybrid**; absence classifies it as **copy** (the default).

The manifest MUST NOT contain any `post_install` field or any other mechanism for executing arbitrary shell commands. Installs are declarative. The two install modes — `copy` and `hybrid` — are inferred from `[runtime_package]` presence; no separate `mode` field exists in the manifest.

#### Scenario: Valid copy-mode manifest parses

- **WHEN** the CLI parses a `pack.toml` declaring all required fields with no `[runtime_package]` block
- **THEN** the manifest is accepted as valid
- **AND** the resolver classifies the pack as `copy`

#### Scenario: Valid hybrid-mode manifest parses

- **WHEN** the CLI parses a `pack.toml` declaring all required fields plus `[runtime_package] package = "@forgeailab/anvil-auth-better-auth"`, `version = "^0.1"`
- **THEN** the manifest is accepted as valid
- **AND** the resolver classifies the pack as `hybrid`
- **AND** the helper package is treated as an implicit member of `[dependencies].runtime` at install time

#### Scenario: Manifest with arbitrary shell hook is rejected

- **WHEN** the CLI parses a manifest containing a `post_install` field or any other shell-command field
- **THEN** the manifest is rejected with an error naming the unsupported field
- **AND** no filesystem changes are made

#### Scenario: Manifest with unknown pack capability is rejected

- **WHEN** the CLI parses a manifest declaring `requires = ["quantum-storage"]`
- **THEN** the pack is rejected with an error naming the unknown capability tag
- **AND** no filesystem changes are made

#### Scenario: Manifest with unknown template capability is rejected

- **WHEN** the CLI parses a manifest declaring `requires_runtime = ["edge-functions"]`
- **AND** `edge-functions` is not in the template-capability enum
- **THEN** the pack is rejected with an error naming the unknown template-capability tag
- **AND** no filesystem changes are made

#### Scenario: Manifest with unknown scaffold is rejected

- **WHEN** the CLI parses a manifest declaring `compatible_scaffolds = ["svelte-kit"]`
- **AND** no `templates/svelte-kit/` exists in the registry
- **THEN** the pack is rejected with an error naming the unknown template
- **AND** no filesystem changes are made

#### Scenario: Manifest with malformed runtime_package is rejected

- **WHEN** the CLI parses a manifest with `[runtime_package] package = "not a valid npm name"` or with an unknown field inside `[runtime_package]`
- **THEN** the manifest is rejected with an error naming the offending field
- **AND** no filesystem changes are made

## ADDED Requirements

### Requirement: Hybrid Packs Use Runtime Helper Packages

A pack with a `[runtime_package]` block is **hybrid**: its copied `[[files]]` MUST contain only wiring, configuration, and integration code, NOT the substantive runtime logic that the helper package owns. The helper package is the single source of truth for that logic. A pack author MUST NOT duplicate logic into the pack's `[[files]]` when an equivalent export exists in the helper package.

#### Scenario: Hybrid pack file content stays within the wiring boundary

- **WHEN** a pack declares `[runtime_package] package = "@forgeailab/anvil-auth-better-auth"`
- **THEN** every file in `packs/<name>/files/` is either a thin route handler that imports from the helper, a configuration file, an example UI component, or a types re-export
- **AND** no file re-implements logic that the helper exports (e.g. session validation, OAuth callback parsing)

#### Scenario: Helper transitive dependencies are not redeclared

- **WHEN** a pack declares `[runtime_package] package = "@forgeailab/anvil-auth-better-auth"`
- **AND** `@forgeailab/anvil-auth-better-auth` already depends on `better-auth` in its own `package.json`
- **THEN** the pack manifest's `[dependencies].runtime` MUST NOT list `better-auth`
- **AND** transitive deps are resolved by bun/npm at install time
