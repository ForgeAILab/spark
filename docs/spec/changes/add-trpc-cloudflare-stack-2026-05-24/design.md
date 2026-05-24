## Context

spark's data-layer story today is "you get Zero or you wire it yourself." Builders who want a normal typed-RPC client/server boundary, or who want to deploy to Cloudflare Workers, have to assemble tRPC, Hono, wrangler, and the matching env wiring by hand. This change makes that path first-class.

## Goals / Non-Goals

- **Goals**
  - Land a `data-api` capability that any client/server contract pack can provide (Zero, tRPC, future GraphQL).
  - Ship one tRPC pack that runs unmodified on Next App Router, Vite dev, and Cloudflare Workers.
  - Promote `vite-react` to a stable template with a working `bun dev` and a working `wrangler dev`.
  - Make `ui-shadcn` the "everything shadcn ships" default so consumers prune, not pad.
- **Non-Goals**
  - GraphQL or REST data-api packs (out of scope; the capability slot accommodates them later).
  - Multi-region or Durable Objects on Cloudflare.
  - Migrating other deploy targets (Vercel stays the default for Next.js).
  - Adding sticker-pack capabilities (image-gen, maps, voice-to-text).

## Decisions

### Decision 1: Capability rename, not addition

Rename `sync` → `data-api` rather than adding `data-api` as a sibling and deprecating `sync`. The closed-enum policy means adding+deprecating doubles the surface area for one release cycle without buying anything — `sync-zero` is the only producer today and migrates in this same change. The rename is breaking only at the schema level; the only on-disk artifact that referenced `sync` was `packs/sync-zero/pack.toml`, which this change rewrites.

**Alternative considered:** add `data-api` and keep `sync` for one release. Rejected — adds churn for an enum that has one consumer.

### Decision 2: `api-trpc` ships a Hono fetch handler, not three runtime adapters

The router is exported as a Hono `app.fetch` handler. Next.js mounts it from `app/api/trpc/[trpc]/route.ts` via Hono's `nextjs` adapter. Vite mounts it from a `server/dev.ts` Hono+Node entrypoint. Cloudflare Workers mounts it as the default `fetch` export of `worker.ts`. One router, three thin entrypoints.

**Alternative considered:** ship `@trpc/server/adapters/next`, `/standalone`, and `/fetch` separately. Rejected — three code paths to keep in sync; Hono normalises this.

### Decision 3: `storage-s3` covers R2 via a single endpoint env var

R2 is S3-API compatible. Switching between AWS S3 and R2 is one env var (`S3_ENDPOINT` empty = AWS default, set = R2 or other). No separate `storage-r2` pack.

**Alternative considered:** split into `storage-aws-s3` and `storage-cloudflare-r2`. Rejected — same SDK, same code, only env differs; a single pack with clear `[env]` documentation is simpler.

### Decision 4: `ui-shadcn` becomes the full kit, not a separate "-full" pack

shadcn's whole model is "copy what you want." A second pack for the same kit creates a choice that doesn't matter. Consumers who want a leaner UI prune `pack.toml` deps on their own checkout.

### Decision 5: `lean-saas` reassigned to tRPC, Zero version becomes `lean-saas-zero`

Defaults teach. The new builder reads `lean-saas` first; tRPC is the better default for someone who hasn't yet learned why they'd want sync. Existing users referencing `lean-saas` will get the new bundle on their next preset install — flagged as **BREAKING** in the proposal.

**Alternative considered:** add `lean-saas-trpc` alongside, keep `lean-saas` on Zero. Rejected — leaves Zero as the default forever despite tRPC being the simpler starting point.

### Decision 6: `vite-react` ships wouter, not React Router

Wouter is in the Manus dep list, is 1.5kB, and matches the "lean Vite starter" framing. React Router can land later as a separate template variant if demand emerges.

## Risks / Trade-offs

- **Enum rename is a schema-version-bumping change.** Any external script reading `pack.toml` capability values needs an update. Mitigated by closed-enum validation: the schema parser rejects unknown values, so the change surfaces immediately.
- **Hono adds a dependency to every project that installs `api-trpc`.** ~12kB gzipped, justified by the one-handler-three-targets payoff. Documented in the pack README.
- **`ui-shadcn` install size grows substantially.** Acceptable because the user explicitly opted into the UI kit; the alternative is the same install via 12 separate adds.
- **Promoting `vite-react` to `stable` without an `astro` follow-up makes the "planned templates" set look stale.** Out of scope to fix here; tracked separately.

## Migration Plan

1. Land the schema enum rename and `sync-zero` `provides` update in the same commit so the registry is never in an invalid intermediate state.
2. Land `api-trpc`, `storage-s3`, `deploy-cloudflare`, and `ui-shadcn` expansion in subsequent commits.
3. Land `templates/vite-react/` base files.
4. Reassign presets last so the `lean-saas` swap lands only after every referenced pack exists.
5. CI: `bun test packages` covers schema; add a smoke test that every preset's `packs` array resolves to extant manifests.

## Open Questions

- Should `api-trpc` ship a `tasks.yaml` seeding a "wire your first router" board task, or is the pack README enough? Default: README only, mirror what `sync-zero` does.
- Does `deploy-cloudflare` need to be `compatible_scaffolds = ["nextjs", "vite-react"]` or capability-gated via `requires_runtime`? Default: capability-gated on `edge-runtime` so any future edge-capable template works.
