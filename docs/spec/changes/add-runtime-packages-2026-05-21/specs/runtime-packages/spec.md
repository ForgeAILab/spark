## ADDED Requirements

### Requirement: Workflow Primitive Packages

The system SHALL ship three workflow-primitive packages under the `@forgeailab` npm scope as monorepo workspace packages under `packages/`:

- `@forgeailab/anvil-state` at `packages/anvil-state/` — typed wrapper around `<projectRoot>/.anvil/state.json` IO. Depends on `@forgeailab/anvil-schema` for the schema. Exports `readState`, `writeState`, `withState`.
- `@forgeailab/anvil-skill-utils` at `packages/anvil-skill-utils/` — skill markdown frontmatter parsing and Claude↔Codex transforms. Exports `parseSkillFrontmatter`, `toCodexFrontmatter`, `toClaudeFrontmatter`.
- `@forgeailab/anvil-board` at `packages/anvil-board/` — typed `.ai/board.md` IO. Exports `readBoard`, `seedTasks`, `updateStatus`.

Each package MUST have its own `package.json` declaring `name`, `version`, `type: "module"`, an `exports` map, a `tsconfig.json` extending the monorepo's `tsconfig.base.json`, an `src/` tree, a `test/` tree, and a `README.md` documenting the public API. The CLI (`@forgeailab/anvil`) and the initializer (`@forgeailab/create-anvil`) SHALL be refactored to consume these primitives — they MUST NOT duplicate the logic these packages own.

#### Scenario: Workflow primitives are published as workspace packages

- **WHEN** the monorepo is built
- **THEN** `packages/anvil-state/package.json` declares `name: "@forgeailab/anvil-state"`
- **AND** `packages/anvil-skill-utils/package.json` declares `name: "@forgeailab/anvil-skill-utils"`
- **AND** `packages/anvil-board/package.json` declares `name: "@forgeailab/anvil-board"`
- **AND** each package's `bun test` suite passes

#### Scenario: CLI consumes the primitives, not its own copies

- **WHEN** the CLI's state-file IO is invoked
- **THEN** the code path imports `readState` / `writeState` from `@forgeailab/anvil-state`
- **AND** does NOT contain a parallel JSON-validation routine
- **AND** the same is true for skill mirroring (uses `@forgeailab/anvil-skill-utils`) and board seeding (uses `@forgeailab/anvil-board`)

### Requirement: Pack Runtime Helper Packages

The system SHALL ship four pack runtime helper packages under the `@forgeailab` npm scope as monorepo workspace packages under `packages/`:

- `@forgeailab/anvil-auth-better-auth` at `packages/anvil-auth-better-auth/` — Better Auth instance factory + Next.js App Router handler + session helpers.
- `@forgeailab/anvil-sync-zero` at `packages/anvil-sync-zero/` — Zero schema builder + client factory + typed React provider.
- `@forgeailab/anvil-stripe-helpers` at `packages/anvil-stripe-helpers/` — Stripe checkout + webhook verification + billing portal helpers.
- `@forgeailab/anvil-anthropic` at `packages/anvil-anthropic/` — Anthropic SDK client wrapper + SSE streaming helper.

Each MUST have its own `package.json`, `tsconfig.json`, `src/`, `test/`, and `README.md`. Each MUST declare its direct npm dependencies (e.g. `better-auth`, `@rocicorp/zero`, `stripe`, `@anthropic-ai/sdk`) in its own `dependencies` — they MUST NOT be redeclared in the consuming pack's manifest.

The four corresponding packs (`auth-better-auth`, `sync-zero`, `payments-stripe`, `ai-anthropic`) SHALL be classified `hybrid` by declaring `[runtime_package]` in their `pack.toml`, and their `[[files]]` MUST be trimmed to wiring/config/example-UI only.

#### Scenario: Helper packages declare their own SDK dependencies

- **WHEN** `packages/anvil-auth-better-auth/package.json` is read
- **THEN** `dependencies` includes `better-auth`
- **AND** `packs/auth-better-auth/pack.toml` `[dependencies].runtime` does NOT include `better-auth`

#### Scenario: Hybrid packs ship wiring only

- **WHEN** the files under `packs/auth-better-auth/files/` are inspected
- **THEN** every file is either: a thin route handler that imports from `@forgeailab/anvil-auth-better-auth`, a configuration file (e.g. `lib/auth.ts` wiring), or an example UI component
- **AND** none of the files re-implement logic that the helper package exports

### Requirement: Helper Packages Are Independently Versioned

Each helper package MUST track its own semver. There is no lockstep release across `@forgeailab/anvil-*`. A pack manifest's `[runtime_package].version` field uses a standard semver range (e.g. `"^0.1"`) and bun/npm resolves it at install time. A breaking change to a helper requires a major-version bump of the helper AND a corresponding update to the consuming pack manifest's version range.

#### Scenario: Helper package version drift is allowed within range

- **WHEN** `packs/auth-better-auth/pack.toml` declares `[runtime_package].version = "^0.1"`
- **AND** `@forgeailab/anvil-auth-better-auth@0.1.5` is the latest matching version on npm
- **THEN** `anvil add auth-better-auth` installs `@forgeailab/anvil-auth-better-auth@0.1.5`
- **AND** the pack manifest is not modified

#### Scenario: Helper major version requires manifest update

- **WHEN** `@forgeailab/anvil-auth-better-auth@1.0.0` is released with a breaking change
- **AND** `packs/auth-better-auth/pack.toml` still declares `[runtime_package].version = "^0.1"`
- **THEN** `anvil add auth-better-auth` installs the latest 0.1.x — NOT 1.0.0
- **AND** a separate change to the pack manifest is required to opt into the new major
