# Packs

A **pack** is a self-contained unit of capability — auth, db, payments, UI, AI SDK, email, deploy target, … — that the `spark` CLI can install into a scaffolded project. Packs are TOML-manifested, declarative (no shell hooks), and capability-resolved.

## Directory layout

```
packs/<name>/
├── pack.toml         # manifest (REQUIRED)
├── files/            # tree of files to copy into the project (optional)
├── skills/           # SKILL.md folders shipped with this pack (optional)
└── tasks.yaml        # board tasks seeded into .ai/board.md on install (optional)
```

## `pack.toml`

See [`docs/pack-spec.md`](../docs/pack-spec.md) for the full schema. The Zod source of truth is `packages/spark-schema/src/pack.ts`.

A minimum-viable pack:

```toml
name = "db-sqlite"
version = "0.1.0"
category = "db"
description = "Local SQLite database via bun:sqlite + drizzle-orm."

provides = ["db"]
requires = []
conflicts = ["db"]
requires_runtime = ["server"]
compatible_scaffolds = ["nextjs"]

[dependencies]
runtime = ["drizzle-orm"]
dev = ["drizzle-kit"]

[env]
required = ["DATABASE_URL"]

[[files]]
mode = "create"
from = "files/lib/db.ts"
to = "lib/db.ts"

[tasks]
file = "tasks.yaml"
```

## File modes

| Mode | Behavior |
|---|---|
| `create` | Fails if the destination already exists |
| `append` | Idempotent; uses `# >>> spark:<pack> >>>` / `# <<<` markers |
| `merge-json` | Deep-merges into an existing JSON file with deterministic key order |
| `template` | Handlebars-style substitution from `spark.config.json` (e.g. `{{appName}}`) |

## Capability enums (closed)

**Pack capabilities** (`provides` / `requires` / `conflicts`):
`db, auth, payments, email, ui-kit, local-runtime, deploy-target, e2e, ai-sdk, blob-storage, analytics, sync`

Exclusive (one provider per project): `db, auth, payments, ui-kit, sync`
Non-exclusive (multiple providers OK): `ai-sdk, analytics, email, blob-storage, e2e, deploy-target, local-runtime`

**Template capabilities** (`requires_runtime`):
`static, server, react, native, vue, svelte, mdx-content, edge-runtime`

The two enums are separate and never overlap. Adding a new value requires a registry-wide change.

## What is NOT allowed

- `post_install`, `hooks`, `pre_add`, `scripts` — packs MUST be declarative. If your pack needs a setup step that can't be expressed in `[[files]]`, ship it as a seeded board task the user runs manually.
- Pack-name conflicts (`conflicts = ["other-pack-name"]`). Use capability tags only.
- Cross-pack file ownership. Two packs MUST NOT write the same `to` path with `create` mode.

## Adding a new pack

```bash
# In Claude Code:
/new-pack realtime-supabase category=db
```

Then fill in the generated `packs/realtime-supabase/pack.toml`. Validate with:

```bash
bun -e "import {parsePackToml} from './packages/spark-schema/src/parse.ts'; import {readFileSync} from 'node:fs'; const r = parsePackToml(readFileSync('packs/realtime-supabase/pack.toml','utf8')); console.log(r.ok ? 'OK' : r.error);"
```

See `packs/example/pack.toml` for a manifest that exercises every field.

## v1 catalog

Each pack is either **copy** (ships file trees the user owns) or **hybrid** (ships thin wiring + imports runtime logic from a versioned `@forgeailab/spark-*` helper under `libs/`). The mode is inferred from the presence of a `[runtime_package]` block in the manifest.

| Pack | Category | Mode | Runtime helper |
|---|---|---|---|
| `auth-better-auth` | auth | **hybrid** | `@forgeailab/spark-auth-better-auth` (SQLite) |
| `auth-better-auth-pg` | auth | **hybrid** | `@forgeailab/spark-auth-better-auth` (Postgres) |
| `auth-supabase` | auth | copy | — |
| `db-sqlite` | db | copy | — |
| `db-postgres` | db | copy | — |
| `db-supabase` | db | copy | — |
| `sync-zero` | infra | **hybrid** | `@forgeailab/spark-sync-zero` |
| `payments-stripe` | payments | **hybrid** | `@forgeailab/spark-stripe-helpers` |
| `ai-anthropic` | ai | **hybrid** | `@forgeailab/spark-anthropic` |
| `ai-openai` | ai | copy | — |
| `ui-shadcn` | ui | copy | — |
| `email-resend` | email | copy | — |
| `analytics-posthog` | analytics | copy | — |
| `docker-compose-dev` | infra | copy | — |
| `testing-playwright` | testing | copy | — |
| `deploy-vercel` | deploy | copy | — |

### Picking a db + auth pair

`auth-better-auth` and `auth-better-auth-pg` share the same runtime helper
(`@forgeailab/spark-auth-better-auth`) — they differ only in the `provider:`
their generated `lib/auth.ts` template hands to `drizzleAdapter`. Pair them:

- `db-sqlite` + `auth-better-auth` — fastest path, single file db, no infra.
- `db-postgres` + `auth-better-auth-pg` — production-shaped, **required for `sync-zero`** (Zero needs Postgres logical replication).
- `db-supabase` + `auth-better-auth-pg` — Supabase-hosted Postgres + Better Auth on top.

The two auth packs both `conflicts = ["auth"]`, so the resolver prevents
installing both. Mixing wrong pairs (e.g. `db-sqlite` + `auth-better-auth-pg`)
typechecks but fails at runtime — the drizzle adapter will reject sqlite tables
with `provider: 'pg'`.

The hybrid packs were authored against [`reference/full-stack-saas/`](../reference/full-stack-saas/) — the canonical integration showing all four helpers working together. When debugging a hybrid pack, start there.

See the root `README.md` for the catalog summary.
