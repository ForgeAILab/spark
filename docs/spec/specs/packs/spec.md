# packs Specification

## Purpose
TBD - created by archiving change add-scaffold-and-pack-registry. Update Purpose after archive.
## Requirements
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

The v1 pack-capability enum SHALL be closed and equal to: `db`, `auth`, `payments`, `email`, `ui-kit`, `local-runtime`, `deploy-target`, `e2e`, `ai-sdk`, `blob-storage`, `analytics`, `sync`. Each capability MUST be classified as either **exclusive** (only one pack may provide it in a project) or **non-exclusive** (any number of packs may provide it). The classification for v1 is:

- **Exclusive:** `db`, `auth`, `payments`, `ui-kit`, `sync`
- **Non-exclusive:** `ai-sdk`, `analytics`, `email`, `blob-storage`, `e2e`, `deploy-target`, `local-runtime`

`sync` is exclusive because a project can sensibly have only one client-sync engine driving the data layer. The resolver MUST enforce exclusivity at install time. Adding a new pack-capability tag, changing its classification, or adding a new value requires a registry-wide change.

#### Scenario: Two exclusive providers cannot coexist

- **WHEN** `db-supabase` is installed (it provides the exclusive capability `db`)
- **AND** the user runs `app-skills add db-drizzle-postgres` (which also provides `db`)
- **THEN** the install aborts before writing any file
- **AND** the error names both packs and the exclusive capability they both provide
- **AND** suggests the user run `git reset` or remove the existing pack via revert before installing the alternative

#### Scenario: Two non-exclusive providers coexist

- **WHEN** `ai-anthropic` is installed (it provides the non-exclusive capability `ai-sdk`)
- **AND** the user runs `app-skills add ai-openai` (which also provides `ai-sdk`)
- **THEN** both installs succeed
- **AND** the resolver does not flag a conflict on `ai-sdk`

### Requirement: Conflicts Use Capability Tags

`conflicts` SHALL reference pack-capability tags, not pack names. A pack conflicts with any installed pack whose `provides` intersects with the conflicting pack's `conflicts` list. A pack MUST NOT conflict with itself (a pack listing its own provided capability in `conflicts` is allowed as a shorthand for "I am the only X provider," equivalent to declaring the capability exclusive).

#### Scenario: Capability-tag conflict aborts install

- **WHEN** `payments-stripe` is installed and declared `conflicts = ["payments"]`
- **AND** the user attempts `app-skills add payments-polar` (which provides `payments`)
- **THEN** the second install aborts
- **AND** the error names both packs and the conflicting capability

### Requirement: Template-Capability Namespace

Template capabilities SHALL live in a separate closed enum from pack capabilities. The v1 template-capability enum is exactly: `static`, `server`, `react`, `native`, `vue`, `svelte`, `mdx-content`, `edge-runtime`. Templates declare their provided template-capabilities in `template.toml`; packs declare required template-capabilities in `requires_runtime`. The two enums MUST NOT overlap.

#### Scenario: Pack requiring server is rejected on a static-only template

- **WHEN** a pack declares `requires_runtime = ["server"]`
- **AND** the active project's template declares `provides = ["static"]` (no `server`)
- **THEN** the install aborts before writing any file
- **AND** the error names the unmet runtime capability

#### Scenario: Template-capability tag does not collide with pack-capability tag

- **WHEN** any tool reads a manifest or template descriptor
- **THEN** values in `requires_runtime` are validated only against the template-capability enum
- **AND** values in `requires` / `provides` / `conflicts` are validated only against the pack-capability enum
- **AND** a value valid in one enum but absent from the other in its required position causes a rejection

### Requirement: File Operation Modes

Each `[[files]]` entry in a manifest SHALL declare a `mode` of exactly one of `create`, `append`, `merge-json`, or `template`, plus a `from` path (relative to the pack's `files/` tree) and a `to` path (relative to the project root). `create` MUST fail if the destination already exists. `append` MUST be idempotent (re-running it MUST NOT add the content twice). `merge-json` MUST produce deterministic key ordering. `template` MUST expand variables from `app-skills.config.json` using Handlebars-style syntax.

#### Scenario: `create` mode refuses to overwrite

- **WHEN** a pack declares `mode = "create"`, `from = "files/lib/stripe.ts"`, `to = "lib/stripe.ts"`
- **AND** `lib/stripe.ts` already exists in the project
- **THEN** the install aborts with an error pointing at the conflict
- **AND** no other files from the pack are written

#### Scenario: `append` mode is idempotent

- **WHEN** a pack declares an `append` block targeting `.env.example`
- **AND** the user runs `app-skills add <pack>` twice
- **THEN** the appended content appears in `.env.example` exactly once

#### Scenario: `template` mode substitutes config variables

- **WHEN** a template file references `{{appName}}`
- **AND** `app-skills.config.json` contains `"appName": "demo"`
- **THEN** the installed file contains `demo` at every occurrence of `{{appName}}`

### Requirement: Declarative Dependencies and Env

A pack manifest's `[dependencies]` section SHALL be the single source of truth for npm dependencies the pack adds. The CLI SHALL invoke `bun add` (and `bun add -d` for dev deps) with exactly the listed packages and SHALL NOT run any other shell command on install. The `[env]` section SHALL be the single source of truth for env vars the pack uses; the CLI appends `required` entries to `.env.example` (with empty values) and to `.env.local` (with empty values) if those files exist.

#### Scenario: Dependencies are installed via bun add

- **WHEN** a pack declares `[dependencies] runtime = ["stripe@^17"]`
- **AND** the user installs the pack
- **THEN** the CLI invokes `bun add stripe@^17`
- **AND** does not invoke any other shell command beyond declared deps

#### Scenario: Env vars are appended to env files

- **WHEN** a pack declares `[env] required = ["STRIPE_SECRET_KEY"]`
- **AND** the user installs the pack
- **THEN** `.env.example` gains a line `STRIPE_SECRET_KEY=`
- **AND** `.env.local` (if present) gains a line `STRIPE_SECRET_KEY=`
- **AND** existing values for `STRIPE_SECRET_KEY` in `.env.local` are not overwritten

### Requirement: Pack-Shipped Skills

A pack MAY include a `skills/` directory containing one or more skill folders in the canonical Claude format (`SKILL.md` with frontmatter). When the pack is installed, the CLI SHALL copy each shipped skill into both `.claude/skills/` and `.codex/skills/`, applying the same frontmatter transform used by the project-wide skill mirror. Because v1 does not support uninstall, the CLI does not remove skill folders; users who revert a pack install via git also revert the copied skills as part of that revert.

#### Scenario: Pack with shipped skill installs the skill

- **WHEN** `payments-stripe` ships `skills/stripe-patterns/SKILL.md`
- **AND** the user installs `payments-stripe`
- **THEN** `.claude/skills/stripe-patterns/SKILL.md` exists
- **AND** `.codex/skills/stripe-patterns/SKILL.md` exists with the Codex-compatible frontmatter

#### Scenario: Reverting a pack install via git removes its skills

- **WHEN** the user has installed `payments-stripe` and the install added `.claude/skills/stripe-patterns/`
- **AND** the user runs `git revert` on the commit that included the install
- **THEN** `.claude/skills/stripe-patterns/` is removed from the working tree as part of the revert
- **AND** the CLI itself does not perform any skill deletion

### Requirement: Pack-Seeded Board Tasks

A pack MAY include a `tasks.yaml` declaring board tasks to seed into `.ai/board.md` at install time. Each task MUST have a stable ID, a title, acceptance criteria, and an initial status. Seeded tasks SHALL be inserted into `.ai/board.md` with status `Clarifying` and a `requires_pack:` field referencing the installing pack's name.

#### Scenario: Tasks are seeded into the board on install

- **WHEN** `payments-stripe` declares two tasks `PAY-001` and `PAY-002`
- **AND** the user installs `payments-stripe`
- **THEN** `.ai/board.md` contains entries for both tasks under the appropriate epic
- **AND** both tasks have status `Clarifying`
- **AND** both tasks have a `requires_pack: payments-stripe` field

### Requirement: Presets

The system SHALL support **presets** — named bundles of packs defined as TOML files under `presets/`. A preset MUST declare a `name`, a `description`, a `compatible_scaffolds` array, and a `packs = [...]` array referencing pack names. Installing a preset is semantically equivalent to running `app-skills add` with the listed packs. The preset install MUST abort with a clear error if the active project's template is not in `compatible_scaffolds`.

#### Scenario: Preset install resolves to a multi-pack add

- **WHEN** the user runs `app-skills preset saas-classic`
- **AND** `presets/saas-classic.toml` declares `compatible_scaffolds = ["nextjs"]` and `packs = ["db-supabase", "auth-supabase", "payments-stripe", "email-resend", "ui-shadcn", "deploy-vercel"]`
- **AND** the active project's template is `nextjs`
- **THEN** all six packs are installed in dependency order
- **AND** any unresolvable conflict aborts the entire preset install before any pack is applied

#### Scenario: Preset rejected on incompatible template

- **WHEN** the active project's template is `vite-react`
- **AND** the user runs `app-skills preset saas-classic` whose `compatible_scaffolds = ["nextjs"]`
- **THEN** the preset install aborts before any pack is applied
- **AND** the error names the active template and the preset's compatible templates
