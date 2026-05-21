## ADDED Requirements

### Requirement: `pack-resolve` Skill

The system SHALL provide a `pack-resolve` skill that, given an existing `.ai/product-spec.md` and `.ai/architecture.md`, recommends both a scaffold template and a concrete set of packs along with the reasoning. The skill MUST NOT execute any install. It SHALL output the recommended template, a structured list of packs grouped by category mapped to the capability tags they satisfy, and conclude with the exact `bunx create-app-skills` (for fresh projects) or `app-skills add ...` (for existing projects) command the user can run.

#### Scenario: Skill recommends template + packs for a paid SaaS spec

- **WHEN** the user invokes `/pack-resolve`
- **AND** `.ai/product-spec.md` describes a paid SaaS with user accounts, subscriptions, and a dashboard
- **THEN** the skill output recommends the `nextjs` template
- **AND** names packs covering `db`, `auth`, `payments`, `ui-kit`, and `deploy-target` at minimum
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

### Requirement: `pack-add` Skill

The system SHALL provide a `pack-add` skill that wraps `app-skills add` with the workflow expected by the board: invoke `app-skills add <pack...> --dry-run`, present the diff to the user, request confirmation, run the install on approval, then trigger `/sync-board` so seeded tasks appear in the board state.

#### Scenario: Skill performs dry-run before install

- **WHEN** the user invokes `/pack-add payments-stripe`
- **THEN** the skill runs `app-skills add payments-stripe --dry-run` first
- **AND** prints the planned changes
- **AND** waits for explicit user confirmation before running the real install

#### Scenario: Skill triggers board sync after install

- **WHEN** an install completes successfully via `/pack-add`
- **THEN** the skill invokes `/sync-board`
- **AND** the report shows tasks newly seeded by the pack

### Requirement: `new-pack` Skill

The system SHALL provide a `new-pack` skill that scaffolds a new pack directory under `packs/<name>/` with a `pack.toml` skeleton, empty `files/` and `skills/` directories, and a `tasks.yaml` stub. The skill MUST validate that `<name>` does not already exist and that the requested `category` is one of the v1 enum values.

#### Scenario: Skill scaffolds a new pack

- **WHEN** the user invokes `/new-pack realtime-supabase category=db`
- **AND** no directory `packs/realtime-supabase` exists
- **THEN** the skill creates `packs/realtime-supabase/pack.toml` with `name`, `version`, `category = "db"`, and empty `provides`/`requires`/`conflicts` arrays
- **AND** creates `packs/realtime-supabase/files/`, `packs/realtime-supabase/skills/`, `packs/realtime-supabase/tasks.yaml` as empty stubs

## MODIFIED Requirements

### Requirement: Architecture Cutline Output Includes Pack List

The `architecture-cutline` skill SHALL produce `.ai/architecture.md` that, in addition to the existing stack / repo structure / data model / API surface / non-goals sections, includes a `## Pack plan` section enumerating the recommended packs by name, the capabilities each satisfies, and a single fenced code block containing the exact `app-skills add ...` command. The skill MUST refuse to recommend capabilities for which no pack exists in the registry, instead naming the gap and suggesting `/new-pack`.

#### Scenario: Cutline emits an executable pack plan

- **WHEN** `/architecture-cutline` runs against a spec for a paid SaaS
- **THEN** `.ai/architecture.md` contains a `## Pack plan` section
- **AND** that section lists at least one pack per required capability
- **AND** contains exactly one fenced code block whose contents are a single line beginning with `app-skills add`

#### Scenario: Cutline reports missing pack for a needed capability

- **WHEN** the spec implies a `realtime` capability
- **AND** no v1 pack provides `realtime`
- **THEN** the `## Pack plan` section explicitly names the missing capability
- **AND** suggests running `/new-pack` to author one

### Requirement: Risk Check Detects Pack-Level Drift

The `risk-check` skill SHALL, in addition to its existing checks, inspect `.app-skills/state.json` (if present) and flag any installed pack whose capabilities are not referenced by `.ai/product-spec.md` or `.ai/architecture.md`. Such packs are reported under a new "Pack-level drift" section as candidates for human review. Because v1 has no `remove` subcommand, the recommendation is to review intent and, if the pack is genuinely unused, revert the pack-install commit via git.

#### Scenario: Unused pack is flagged as drift

- **WHEN** `analytics-posthog` is installed
- **AND** neither `.ai/product-spec.md` nor `.ai/architecture.md` mentions analytics or PostHog
- **THEN** the risk-check output contains a "Pack-level drift" section
- **AND** lists `analytics-posthog` with a recommendation to either justify the install by updating the spec or revert the pack-install commit via git
- **AND** the recommendation MUST NOT reference any `app-skills remove` command

#### Scenario: All installed packs are justified

- **WHEN** every installed pack's capability appears in the spec or architecture
- **THEN** the "Pack-level drift" section reports "no drift detected"
