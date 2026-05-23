# Pack Manifest Reference

`pack.toml` is the human-authored manifest for an spark feature pack.
A pack is a declarative unit of product capability: it can add files,
dependencies, env vars, skills, and board tasks, but it cannot run arbitrary
install code.

Manifests are TOML. The installer parses them with `smol-toml`, validates them
with the shared Zod schemas in `packages/spark-schema`, rejects unknown top-level
fields, and rejects shell-hook fields before normal validation.

## Required Fields

Every installable pack declares these top-level fields:

- `name`: lowercase kebab-case pack id matching `/^[a-z][a-z0-9-]*$/`.
- `version`: semver string, such as `1.0.0` or `1.2.3-beta.1`.
- `category`: closed catalog enum.
- `provides`: pack capabilities this pack adds.
- `requires`: pack capabilities needed before install or in the same plan.
- `conflicts`: pack capabilities that cannot coexist with this pack.
- `requires_runtime`: template capabilities required from the active scaffold.

`description` is a recommended one-line summary for catalog display.

The closed `category` enum is:

- `db`
- `auth`
- `payments`
- `email`
- `ui`
- `ai`
- `infra`
- `testing`
- `deploy`
- `analytics`
- `storage`

## PackCapability

Pack capabilities describe product features added by packs.
The v1 `PackCapability` enum is closed and exactly:

- `db`
- `auth`
- `payments`
- `email`
- `ui-kit`
- `local-runtime`
- `deploy-target`
- `e2e`
- `ai-sdk`
- `blob-storage`
- `analytics`
- `sync`

Exclusive capabilities allow only one provider in a project:

- `db`
- `auth`
- `payments`
- `ui-kit`
- `sync`

Non-exclusive capabilities can have multiple providers:

- `ai-sdk`
- `analytics`
- `email`
- `blob-storage`
- `e2e`
- `deploy-target`
- `local-runtime`

Use capability tags, not pack names, in `requires` and `conflicts`.
For example, a payments pack should require `auth`, not `auth-supabase`.

## TemplateCapability

Template capabilities describe what the base scaffold can run.
They are separate from pack capabilities and must not overlap.
The v1 `TemplateCapability` enum is closed and exactly:

- `server`
- `spa`
- `native`
- `edge`
- `library`
- `monorepo`
- `static`

Use `requires_runtime` when a pack needs a scaffold trait.
For example, server-route code should set `requires_runtime = ["server"]`.
A browser-only pack can use `["spa"]`, and a pack with no runtime constraint can
use an empty array.

## compatible_scaffolds

`compatible_scaffolds` is optional and defaults to `[]`.
An empty array means no named scaffold restriction; the pack can install on any
scaffold that satisfies `requires_runtime`.

Use named scaffolds only when the pack depends on framework-specific paths,
conventions, or APIs.

## Install Modes — `copy` and `hybrid`

Every pack is one of two install modes. The mode is **inferred** from the
manifest — there is no `mode` field.

- **`copy` (default)**: the pack's `[[files]]` entries are copied into the
  consumer project. The user owns the resulting code in place. This is the
  right model for stable framework glue (Tailwind config, route handlers,
  env wiring) where the user benefits from being able to read and edit
  files directly.
- **`hybrid`**: the pack declares an optional `[runtime_package]` block
  pointing at a versioned npm helper published from `libs/spark-<name>/`.
  The CLI implicitly installs the helper alongside the pack's other runtime
  dependencies. The pack's `[[files]]` are trimmed to thin wiring
  (config, route handlers, type re-exports, example UI). Substantive logic
  lives in the helper, so bug fixes ship as a `bun update` of the helper
  rather than a project-by-project file re-copy.

A pack is `hybrid` if and only if its manifest contains a `[runtime_package]`
table. Otherwise it is `copy`.

### `[runtime_package]`

```toml
[runtime_package]
package = "@forgeailab/spark-auth-better-auth"
version = "^0.1"
```

- `package`: the full npm name of the helper (scoped form supported).
- `version`: a semver range used when resolving against npm.

The pack's `[dependencies].runtime` array MUST NOT also list the helper
package — the CLI adds it implicitly. Transitive deps of the helper
(`better-auth`, `stripe`, etc.) live in the helper's own `package.json`.

When the CLI runs inside the spark monorepo (`SPARK_ROOT` set and
`libs/<helper-dir>/` present), it links the helper as a `file:` dep instead
of an npm version range. Published consumers get the version range from
`[runtime_package].version`.

## Directory layout

The spark monorepo has three top-level workspace directories:

- `packages/` — platform tooling: the CLI, the initializer, the shared
  schema package.
- `libs/` — runtime libraries published under `@forgeailab/spark-*`. Hybrid
  packs reference these via `[runtime_package]`; internal tools (CLI,
  `create-spark`) consume the workflow primitives (`spark-board`,
  `spark-skill-utils`, `spark-state`).
- `packs/` — pack manifests + the file trees that copy into consumer
  projects.

Reference apps (e.g. `reference/full-stack-saas/`) live under `reference/`
and serve as integration/extraction sources, not user-facing templates.

## Dependencies

The optional `[dependencies]` table declares npm package specs.
`runtime` maps to production dependencies.
`dev` maps to development dependencies.
The installer uses Bun package operations for these lists and must not run
unrelated shell commands.

For hybrid packs, the helper named in `[runtime_package]` MUST NOT also
appear in `runtime` — the CLI handles it implicitly.

Omit the table when the pack has no dependencies.

## Environment Variables

The optional `[env]` table documents environment variables.
`required` values are needed for the feature to work.
`optional` values unlock optional behavior.

The installer appends required variables with empty values to `.env.example`.
It also appends them to `.env.local` when that file exists, without overwriting
existing local values.

## File Modes

`[[files]]` is an optional array of declarative file operations.
Each entry has `mode`, `from`, and `to`.
`from` is relative to the pack's `files/` directory.
`to` is relative to the target project root.

The four modes are:

- `create`
- `append`
- `merge-json`
- `template`

`create` copies a new file and fails if the destination exists.
Use it for complete files the pack owns.

`append` appends a marked block idempotently.
Re-running the pack must not duplicate the block.

`merge-json` deep-merges JSON with deterministic key ordering.
Use it for `package.json`, `tsconfig.json`, and tool config JSON.

`template` renders a file with Handlebars-style variables from
`spark.config.json`.
Use it when output needs the app name, template name, or scaffold variables.

## Skills

The optional `[skills]` table copies pack-shipped workflow skills.
`copy` is an array of skill folder paths under the pack.
Skills are authored in canonical Claude format and mirrored into both
`.claude/skills/` and `.codex/skills/`.

## Tasks

The optional `[tasks]` table points to board tasks seeded by the pack.
`file` points to a YAML file in the pack directory.
Seeded tasks enter `.ai/board.md` as `Clarifying` and should include stable IDs
and acceptance criteria.

## Forbidden Fields

Pack installs are declarative. These fields are forbidden:

- `post_install`
- `hooks`
- `pre_add`
- `pre_install`
- `post_add`
- `scripts`

Do not hide shell commands under another field name.
Do not rely on install-time JavaScript hooks.
When a feature needs manual setup, seed a board task instead.

## Worked Example

```toml
name = "payments-stripe"
version = "1.0.0"
category = "payments"
description = "Stripe checkout, portal, and webhook support."
provides = ["payments"]
requires = ["db", "auth"]
conflicts = ["payments"]
requires_runtime = ["server"]
compatible_scaffolds = ["nextjs"]

[dependencies]
runtime = ["stripe@^17"]
dev = ["stripe-cli@^1"]

[env]
required = ["STRIPE_SECRET_KEY"]
optional = ["STRIPE_WEBHOOK_SECRET"]

[[files]]
mode = "create"
from = "lib/stripe.ts"
to = "lib/stripe.ts"

[[files]]
mode = "append"
from = "env.example"
to = ".env.example"

[[files]]
mode = "merge-json"
from = "package.patch.json"
to = "package.json"

[[files]]
mode = "template"
from = "app/checkout/page.tsx.hbs"
to = "app/checkout/page.tsx"

[skills]
copy = ["skills/stripe-patterns"]

[tasks]
file = "tasks.yaml"
```

This pack provides the exclusive `payments` capability, requires any installed
`db` and `auth` provider, is limited to Next.js because its paths are App Router
specific, and remains fully declarative.
