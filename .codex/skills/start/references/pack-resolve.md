# Reference: Pack resolution (planning only)

The conductor (`/start`) follows this when the design names a capability with no installed
pack and it needs to settle the scaffold template + concrete pack set. (Formerly the
standalone `/pack-resolve` skill.) Model: Opus 4.7 / GPT-5.5. **Planning only — never
install here; installation is `/scaffold`'s job.**

## Goal

Recommend a scaffold template and a concrete pack set from the current proposal and
technical design. The output should be directly actionable, but this step must not execute
any install.

## Inputs

Required: the active change's `proposal.md` and `design.md`. If present:
`templates/*/template.toml`, `packs/*/pack.toml`, `presets/*.toml`, `spark.config.json`. If
the proposal or design is missing, the conductor returns to the spec / architecture phase.

## Rules

- Do not run `bunx create-spark`, `spark add`, or `spark preset`. Planning only.
- Resolve from the registry, not from memory. Pack names must come from `packs/*/pack.toml`;
  templates from `templates/*/template.toml`.
- **Default the scaffold to `vite-react`** (SPA + Hono API; pairs with Cloudflare/Bun).
  Recommend `nextjs` only when the spec needs SSR, server-rendered routes, or SEO pages.
- Prefer the smallest pack set that satisfies the spec and architecture. Do not install
  "usual SaaS" packs unless the capability is actually required.
- Group packs by manifest `category`, and map each to the capability tags it provides.
- Annotate each recommended pack as `copy`. Since v0.2.0 all packs use the copy model.
- Respect `requires`, `conflicts`, `compatible_scaffolds`, and `requires_runtime`.
- If a needed capability has no v1 pack, name the gap and suggest `/new-pack`; do not invent
  a pack name or include the missing capability in the command.
- If a preset exactly matches the recommended fresh-project pack set, the final command may
  be `bunx create-spark <name> --template <t> --preset <p>`. Otherwise the final command must
  be `spark add <pack...>` using only real pack names.

## Capability hints

Use only as hints; the registry still wins:

- Paid SaaS: `db`, `auth`, `payments`, `email`, `ui-kit`, `deploy-target`.
- Internal tool: `db`, `auth`, `ui-kit`, optionally `local-runtime`.
- Admin / back-office surface: `admin` via `admin-dashboard` (requires `auth`, `ui-kit`, `db`).
- AI workflow: `ai-sdk`, optional `db`, optional `ui-kit`.
- Typed RPC (client → server functions): `data-api` via `api-trpc`. Default for most SaaS.
- Realtime client-first sync: `data-api` via `sync-zero`. Only when live propagation is required.
- File / object storage (S3 or Cloudflare R2): `blob-storage` via `storage-s3`.
- Cloudflare Workers deploy: `deploy-target` via `deploy-cloudflare` (needs `edge-runtime`).

## Output format

Return these sections:

- `## Scaffold` — recommended template, status, why it fits, interim alternative if planned.
- `## Packs` — grouped by category. Each bullet `<pack-name> (copy)` + `provides:` + tags.
- `## Gaps` — missing capabilities and a `/new-pack` suggestion, or `none`.
- `## Command` — the last section, exactly one executable fenced `sh` block, nothing after it.
