## MODIFIED Requirements

### Requirement: `pack-resolve` Skill

The system SHALL provide a `pack-resolve` skill that, given an existing `.ai/product-spec.md` and `.ai/architecture.md`, recommends both a scaffold template and a concrete set of packs along with the reasoning. The skill MUST NOT execute any install. It SHALL output the recommended template, a structured list of packs grouped by category mapped to the capability tags they satisfy, and conclude with the exact `bunx create-anvil` (for fresh projects) or `anvil add ...` (for existing projects) command the user can run.

The output SHALL annotate each recommended pack as either `copy` or `hybrid` based on the pack manifest's `[runtime_package]` presence — readers should immediately know which packs ship a runtime helper they will be importing from versus which copy source into the project.

#### Scenario: Skill recommends template + packs with install-mode annotations

- **WHEN** the user invokes `/pack-resolve`
- **AND** `.ai/product-spec.md` describes a paid SaaS with user accounts, subscriptions, and a dashboard
- **THEN** the skill output recommends the `nextjs` template
- **AND** names packs covering `db`, `auth`, `payments`, `ui-kit`, and `deploy-target` at minimum
- **AND** each recommended pack is annotated as either `copy` or `hybrid`
- **AND** ends with a single executable command block

#### Scenario: Skill recommends a planned template with a caveat

- **WHEN** the spec describes a documentation site
- **AND** `astro-starlight` is the best-fit template but its `status` is `planned` in v1
- **THEN** the skill output recommends `astro-starlight` as the destination
- **AND** explicitly notes the template is planned and not yet implemented
- **AND** suggests `nextjs` as the interim alternative

#### Scenario: Skill flags unmet capabilities

- **WHEN** the spec implies realtime collaboration
- **AND** no v1 pack provides a `realtime` capability
- **THEN** the skill output names the gap explicitly
- **AND** suggests authoring a new pack via `/new-pack`

### Requirement: `new-pack` Skill

The system SHALL provide a `new-pack` skill that scaffolds a new pack directory under `packs/<name>/` with a `pack.toml` skeleton, empty `files/` and `skills/` directories, and a `tasks.yaml` stub. The skill MUST validate that `<name>` does not already exist and that the requested `category` is one of the v1 enum values.

The skill SHALL prompt the author to choose an install mode: `copy` or `hybrid`. When the author selects `hybrid`, the skill additionally scaffolds `libs/anvil-<name>/` with a minimal workspace package skeleton (`package.json`, `tsconfig.json`, `src/index.ts`, `test/index.test.ts`, `README.md`) AND writes a `[runtime_package]` block into the new `pack.toml` referencing `@forgeailab/anvil-<name>` with an initial version range of `"^0.1"`.

#### Scenario: Skill scaffolds a copy-mode pack

- **WHEN** the user invokes `/new-pack realtime-supabase category=db mode=copy`
- **AND** no directory `packs/realtime-supabase` exists
- **THEN** the skill creates `packs/realtime-supabase/pack.toml` with `name`, `version`, `category = "db"`, and empty `provides`/`requires`/`conflicts` arrays
- **AND** creates `packs/realtime-supabase/files/`, `packs/realtime-supabase/skills/`, `packs/realtime-supabase/tasks.yaml` as empty stubs
- **AND** does NOT create `libs/anvil-realtime-supabase/`

#### Scenario: Skill scaffolds a hybrid-mode pack with companion helper package

- **WHEN** the user invokes `/new-pack realtime-supabase category=db mode=hybrid`
- **THEN** the skill creates the pack directory as in the copy-mode scenario
- **AND** the new `pack.toml` includes a `[runtime_package]` table with `package = "@forgeailab/anvil-realtime-supabase"` and `version = "^0.1"`
- **AND** creates `libs/anvil-realtime-supabase/` with a minimal workspace package skeleton
- **AND** the new workspace package declares `name = "@forgeailab/anvil-realtime-supabase"` and `version = "0.1.0"`

### Requirement: Risk Check Detects Pack-Level Drift

The `risk-check` skill SHALL, in addition to its existing checks, inspect `.anvil/state.json` (if present) and flag any installed pack whose capabilities are not referenced by `.ai/product-spec.md` or `.ai/architecture.md`. Such packs are reported under a "Pack-level drift" section as candidates for human review. Because v1 has no `remove` subcommand, the recommendation is to review intent and, if the pack is genuinely unused, revert the pack-install commit via git.

The skill SHALL additionally check, for every installed hybrid pack, whether the corresponding helper package in the consumer's `package.json` is more than two minor versions behind the latest available. Such cases are surfaced under a new "Stale helper" section with a recommendation to `bun update <helper-package>`.

#### Scenario: Unused pack is flagged as drift

- **WHEN** `analytics-posthog` is installed
- **AND** neither `.ai/product-spec.md` nor `.ai/architecture.md` mentions analytics or PostHog
- **THEN** the risk-check output contains a "Pack-level drift" section
- **AND** lists `analytics-posthog` with a recommendation to either justify the install by updating the spec or revert the pack-install commit via git
- **AND** the recommendation MUST NOT reference any `anvil remove` command

#### Scenario: All installed packs are justified

- **WHEN** every installed pack's capability appears in the spec or architecture
- **THEN** the "Pack-level drift" section reports "no drift detected"

#### Scenario: Stale hybrid helper is surfaced

- **WHEN** `auth-better-auth` is installed with `@forgeailab/anvil-auth-better-auth@0.1.0` in the consumer's `package.json`
- **AND** `@forgeailab/anvil-auth-better-auth@0.3.5` is the latest version on the npm registry
- **THEN** the risk-check output contains a "Stale helper" section
- **AND** lists `auth-better-auth` with the suggested command `bun update @forgeailab/anvil-auth-better-auth`

#### Scenario: Helper version within tolerance produces no false positive

- **WHEN** `auth-better-auth` is installed with `@forgeailab/anvil-auth-better-auth@0.2.0`
- **AND** the latest version is `0.2.1`
- **THEN** the "Stale helper" section reports "no stale helpers"
