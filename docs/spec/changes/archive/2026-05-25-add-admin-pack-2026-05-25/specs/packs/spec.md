## MODIFIED Requirements

### Requirement: Pack Manifest Format

A pack SHALL be a directory containing a `pack.toml` manifest, an optional `files/` tree, an optional `skills/` tree, and an optional `tasks.yaml`. The manifest MUST declare the following fields:

- `name` — string, must equal the directory name
- `version` — semver string
- `category` — string from the closed category enum (`db`, `auth`, `payments`, `email`, `ui`, `ai`, `infra`, `testing`, `deploy`, `analytics`, `storage`, `admin`)
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

The manifest MUST NOT contain any `post_install` field or any other mechanism for executing arbitrary shell commands. Installs are declarative.

#### Scenario: Valid manifest parses

- **WHEN** the CLI parses a `pack.toml` declaring all required fields with `name = "payments-stripe"`, `category = "payments"`, `provides = ["payments"]`, `requires = ["db", "auth"]`, `conflicts = ["payments"]`, `requires_runtime = ["server"]`, and `compatible_scaffolds = ["nextjs"]`
- **THEN** the manifest is accepted as valid
- **AND** every pack-capability tag resolves against the pack-capability enum
- **AND** `server` resolves against the template-capability enum
- **AND** `nextjs` resolves against the registered template set

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

### Requirement: Pack-Capability Enum and Exclusivity

The v1 pack-capability enum SHALL be closed and equal to: `db`, `auth`, `payments`, `email`, `ui-kit`, `local-runtime`, `deploy-target`, `e2e`, `ai-sdk`, `blob-storage`, `analytics`, `data-api`, `admin`. Each capability MUST be classified as either **exclusive** (only one pack may provide it in a project) or **non-exclusive** (any number of packs may provide it). The classification for v1 is:

- **Exclusive:** `db`, `auth`, `payments`, `ui-kit`, `data-api`, `admin`
- **Non-exclusive:** `ai-sdk`, `analytics`, `email`, `blob-storage`, `e2e`, `deploy-target`, `local-runtime`

`data-api` is exclusive because a project can sensibly have only one client/server data-layer contract — realtime sync (e.g. Zero), typed RPC (e.g. tRPC), or any future GraphQL/REST equivalent — driving the wire format and the typed client. `admin` is exclusive because a project has a single canonical admin/back-office surface; allowing two admin packs would mean two competing `/admin` route trees and gating models. The resolver MUST enforce exclusivity at install time. Adding a new pack-capability tag, changing its classification, or adding a new value requires a registry-wide change.

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

#### Scenario: Two admin providers cannot coexist

- **WHEN** `admin-dashboard` is installed (it provides the exclusive capability `admin`)
- **AND** the user runs `spark add <another-admin-pack>` (which also provides `admin`)
- **THEN** the install aborts before writing any file
- **AND** the error names both packs and the exclusive capability `admin`

## ADDED Requirements

### Requirement: Admin Capability Provider Pack Shape

A pack providing the `admin` capability SHALL ship an internal admin surface — at minimum a `/admin` route group with a server-side access guard and a users table — built from the project's installed `ui-kit`. Because the admin surface reads and edits authenticated users out of the database, the pack MUST declare `requires = ["auth", "ui-kit", "db"]` and MUST declare `conflicts = ["admin"]` so the resolver names the conflict cleanly when a second provider is attempted. Access control MUST be enforced **server-side before the admin layout renders**: a request from a non-admin user MUST NOT receive admin markup. The pack MUST NOT edit the auth pack's user-schema files directly; the `role`/admin field and the first-admin promotion MUST be delivered as seeded tasks.

#### Scenario: admin-dashboard declares the contract

- **WHEN** the CLI parses `packs/admin-dashboard/pack.toml`
- **THEN** `provides` includes `"admin"`
- **AND** `requires` includes `"auth"`, `"ui-kit"`, and `"db"`
- **AND** `conflicts` includes `"admin"`
- **AND** `requires_runtime` includes `"server"`
- **AND** the pack ships a server-side admin guard file and at least one file under an `app/admin/` route group

#### Scenario: Non-admin is blocked before the admin layout renders

- **WHEN** a request reaches an `/admin` route from a user whose `role` is not admin (or from an unauthenticated request)
- **THEN** the server-side guard redirects or returns a 403 before producing any admin layout markup
- **AND** no admin-only data is sent to the client

#### Scenario: Role field and first admin arrive as seeded tasks

- **WHEN** `admin-dashboard` is installed
- **THEN** the seeded tasks include adding a `role` column to the user schema with a migration
- **AND** the seeded tasks include promoting the first admin (via `ADMIN_EMAILS` or the database)
- **AND** the install does not modify any auth-pack-owned user-schema file
