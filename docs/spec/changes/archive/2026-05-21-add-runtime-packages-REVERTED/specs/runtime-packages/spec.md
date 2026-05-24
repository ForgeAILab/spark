## ADDED Requirements

### Requirement: Three-Directory Workspace Layout

The monorepo SHALL maintain three top-level workspace directories with the following purposes:

- `packages/` — platform tooling. Contains exactly the workspace packages users interact with through the CLI or initializer surface: `@forgeailab/spark` (CLI), `@forgeailab/create-spark` (initializer), `@forgeailab/spark-schema` (Zod schemas; colocated with tooling because tooling is the source of truth for the schema).
- `libs/` — runtime libraries. Contains workspace packages designed to be `import`-ed at runtime by consumer applications. Both internal workflow primitives (`@forgeailab/spark-board`, `spark-skill-utils`, `spark-state`) and pack runtime helpers (`@forgeailab/spark-auth-better-auth`, `spark-sync-zero`, `spark-stripe-helpers`, `spark-anthropic`) live here.
- `packs/` — pack manifests and file-copy trees. Unchanged in role from v1: each `packs/<name>/` directory contains a `pack.toml`, optional `files/`, optional `skills/`, optional `tasks.yaml`. Hybrid packs have less content under `files/` than v1 copy packs because logic moves to `libs/`.

Root `package.json` `workspaces` MUST include `packages/*`, `libs/*`, and `reference/*` (the reference-app pattern, see next requirement).

#### Scenario: Workspace patterns resolve all three directories

- **WHEN** `bun install` runs at the repo root
- **THEN** every directory matching `packages/*`, `libs/*`, or `reference/*` with a valid `package.json` is registered as a workspace
- **AND** workspace deps with `workspace:*` resolve across the three directories

#### Scenario: Library boundary is enforced by location

- **WHEN** a contributor authors a new internal workflow primitive
- **THEN** it lives under `libs/spark-<name>/`, not `packages/`
- **AND** the CLI imports it as `@forgeailab/spark-<name>` (workspace dep), not via a relative path

### Requirement: Reference App for Validation

The system SHALL ship exactly one reference app at `reference/full-stack-saas/` — a complete, runnable Next.js 15 + TypeScript application integrating Better Auth, Zero sync, Stripe (checkout + webhook + portal), Anthropic chat, Resend transactional email, and shadcn/ui on top of SQLite + drizzle. The reference app exists for three purposes: (1) prove the integrated experience boots before any extraction happens, (2) provide the source from which `libs/` packages are extracted, (3) serve as the acceptance harness — after extractions complete, the reference app's smoke tests must still pass with libraries imported via `workspace:*`.

The reference app MUST NOT be registered as a template selectable via `create-spark --template`. It is a reference, not a scaffold.

#### Scenario: Reference app exists and boots

- **WHEN** the change is complete
- **THEN** `reference/full-stack-saas/` contains a runnable Next.js app
- **AND** `bun install && bun dev` in that directory starts the dev server without prompting for env vars beyond what `.env.example` documents
- **AND** the app's smoke test (`bun test` in `reference/full-stack-saas/test/`) passes

#### Scenario: Reference app imports extracted libraries via workspace deps

- **WHEN** Phase 1 extractions complete
- **THEN** `reference/full-stack-saas/package.json` lists `@forgeailab/spark-auth-better-auth`, `spark-sync-zero`, `spark-stripe-helpers`, `spark-anthropic` with `workspace:*`
- **AND** the reference app's source files import from those packages
- **AND** the reference app's smoke test still passes

#### Scenario: Reference app is not a scaffold template

- **WHEN** the user runs `bunx create-spark my-app --template full-stack-saas`
- **THEN** the CLI exits non-zero with "unknown template" — `full-stack-saas` is not in the template registry

### Requirement: Workflow Primitive Packages

The system SHALL ship three workflow-primitive packages under `libs/`, each published to npm as `@forgeailab/spark-*`:

- `@forgeailab/spark-state` at `libs/spark-state/` — typed wrapper around `<projectRoot>/.spark/state.json` IO. Depends on `@forgeailab/spark-schema`. Exports `readState`, `writeState`, `withState`.
- `@forgeailab/spark-skill-utils` at `libs/spark-skill-utils/` — skill markdown frontmatter parsing and Claude↔Codex transforms. Exports `parseSkillFrontmatter`, `toCodexFrontmatter`, `toClaudeFrontmatter`.
- `@forgeailab/spark-board` at `libs/spark-board/` — typed `.ai/board.md` IO. Exports `readBoard`, `seedTasks`, `updateStatus`.

Each package MUST have its own `package.json`, `tsconfig.json` extending the monorepo's `tsconfig.base.json`, an `src/` tree, a `test/` tree, and a `README.md` documenting the public API. The CLI (`@forgeailab/spark`) and initializer (`@forgeailab/create-spark`) SHALL be refactored to consume these primitives.

#### Scenario: Workflow primitives are workspace packages under libs/

- **WHEN** the monorepo is built
- **THEN** `libs/spark-state/package.json` declares `name: "@forgeailab/spark-state"`
- **AND** `libs/spark-skill-utils/package.json` declares `name: "@forgeailab/spark-skill-utils"`
- **AND** `libs/spark-board/package.json` declares `name: "@forgeailab/spark-board"`
- **AND** each package's `bun test` suite passes

#### Scenario: CLI consumes primitives, not its own copies

- **WHEN** the CLI's state-file IO is invoked
- **THEN** the code path imports `readState` / `writeState` from `@forgeailab/spark-state`
- **AND** does NOT contain a parallel JSON-validation routine

### Requirement: Pack Runtime Helper Packages

The system SHALL ship four pack runtime helper packages under `libs/`, each published as `@forgeailab/spark-*`:

- `@forgeailab/spark-auth-better-auth` at `libs/spark-auth-better-auth/` — Better Auth instance factory, Next.js App Router catch-all handler, session helpers.
- `@forgeailab/spark-sync-zero` at `libs/spark-sync-zero/` — Zero schema builder, client factory, typed React provider.
- `@forgeailab/spark-stripe-helpers` at `libs/spark-stripe-helpers/` — checkout session factory, webhook signature verifier, billing portal helper.
- `@forgeailab/spark-anthropic` at `libs/spark-anthropic/` — Anthropic SDK client wrapper, SSE streaming helper.

Each MUST have its own `package.json`, `tsconfig.json`, `src/`, `test/`, and `README.md`. Each MUST declare its direct npm dependencies (e.g. `better-auth`, `@rocicorp/zero`, `stripe`, `@anthropic-ai/sdk`) in its own `dependencies` — they MUST NOT be redeclared in the consuming pack's manifest.

The four corresponding packs (`auth-better-auth`, `sync-zero`, `payments-stripe`, `ai-anthropic`) SHALL be classified `hybrid` by declaring `[runtime_package]` in their `pack.toml`, and their `[[files]]` MUST be trimmed to wiring/config/example-UI only.

#### Scenario: Helper packages live under libs/ and declare their own SDK deps

- **WHEN** `libs/spark-auth-better-auth/package.json` is read
- **THEN** the package directory is `libs/spark-auth-better-auth/`, NOT `packages/spark-auth-better-auth/`
- **AND** `dependencies` includes `better-auth`
- **AND** `packs/auth-better-auth/pack.toml` `[dependencies].runtime` does NOT include `better-auth`

#### Scenario: Hybrid packs ship wiring only

- **WHEN** the files under `packs/auth-better-auth/files/` are inspected
- **THEN** every file is either: a thin route handler that imports from `@forgeailab/spark-auth-better-auth`, a configuration file, or an example UI component
- **AND** none of the files re-implement logic that the helper package exports
- **AND** the file set is the same set of files that remains in `reference/full-stack-saas/` after the corresponding library extraction

### Requirement: Helper Packages Are Independently Versioned

Each helper package MUST track its own semver. There is no lockstep release across `@forgeailab/spark-*`. A pack manifest's `[runtime_package].version` field uses a standard semver range (e.g. `"^0.1"`) and bun/npm resolves it at install time. A breaking change to a helper requires a major-version bump of the helper AND a corresponding update to the consuming pack manifest's version range.

#### Scenario: Helper version drift is allowed within range

- **WHEN** `packs/auth-better-auth/pack.toml` declares `[runtime_package].version = "^0.1"`
- **AND** `@forgeailab/spark-auth-better-auth@0.1.5` is the latest matching version
- **THEN** `spark add auth-better-auth` installs `@forgeailab/spark-auth-better-auth@0.1.5`
- **AND** the pack manifest is not modified

#### Scenario: Helper major version requires manifest update

- **WHEN** `@forgeailab/spark-auth-better-auth@1.0.0` is released with a breaking change
- **AND** `packs/auth-better-auth/pack.toml` still declares `[runtime_package].version = "^0.1"`
- **THEN** `spark add auth-better-auth` installs the latest 0.1.x — NOT 1.0.0
- **AND** a separate change to the pack manifest is required to opt into the new major
