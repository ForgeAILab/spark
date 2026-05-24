---
created_at: 2026-05-24T19:46:04Z
updated_at: 2026-05-24T22:44:14Z
completed_at: 2026-05-24T22:04:31Z
---

## 1. Schema rename (sync → data-api)

- [x] 1.1 Rename `sync` → `data-api` in `PackCapabilityEnum` (`packages/spark-schema/src/pack.ts`); update exclusivity list to include `data-api`.
- [x] 1.2 Update unit tests in `packages/spark-schema/test/pack.test.ts`: ensure `data-api` parses, `sync` is rejected as unknown, exclusivity scenarios pass.
- [x] 1.3 Update `packs/sync-zero/pack.toml` `provides` from `["sync"]` to `["data-api"]`.
- [x] 1.4 Update `docs/pack-spec.md` capability tables.
- [x] 1.5 Search the repo for any remaining string `"sync"` in capability context and update or delete.

## 2. New pack: api-trpc

- [x] 2.1 Scaffold `packs/api-trpc/` via `/new-pack api-trpc category=infra`.
- [x] 2.2 `pack.toml`: `provides = ["data-api"]`, `requires = ["db"]`, `conflicts = ["data-api"]`, `requires_runtime = ["server"]`, `compatible_scaffolds = []`.
- [x] 2.3 Dependencies: `@trpc/server@^11`, `@trpc/client@^11`, `@trpc/react-query@^11`, `@tanstack/react-query@^5`, `superjson@^1`, `hono@^4`, `zod@^4`.
- [x] 2.4 `files/server/trpc.ts` — Hono `app.fetch` handler exporting the typed router.
- [x] 2.5 `files/server/router.ts` — empty `appRouter` example with one `hello` query.
- [x] 2.6 `files/lib/trpc-client.ts` — React Query client.
- [x] 2.7 README documenting the Next/Vite/Workers mount points.

## 3. New pack: storage-s3

- [x] 3.1 Scaffold `packs/storage-s3/` via `/new-pack storage-s3 category=storage`.
- [x] 3.2 `pack.toml`: `provides = ["blob-storage"]`, `requires = []`, `requires_runtime = ["server"]`.
- [x] 3.3 Dependencies: `@aws-sdk/client-s3@^3`, `@aws-sdk/s3-request-presigner@^3`.
- [x] 3.4 `[env] required = ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]`, `optional = ["S3_ENDPOINT", "S3_REGION"]`.
- [x] 3.5 `files/lib/s3.ts` exporting `getS3Client()` and `getPresignedUploadUrl()`.
- [x] 3.6 README documenting AWS vs R2 setup (only `S3_ENDPOINT` differs).

## 4. New pack: deploy-cloudflare

- [x] 4.1 Scaffold `packs/deploy-cloudflare/` via `/new-pack deploy-cloudflare category=deploy`.
- [x] 4.2 `pack.toml`: `provides = ["deploy-target"]`, `requires_runtime = ["edge-runtime"]`.
- [x] 4.3 Dependencies dev: `wrangler@^3`, `@cloudflare/workers-types@^4`.
- [x] 4.4 `files/wrangler.toml` template.
- [x] 4.5 `files/worker.ts` — default Workers entrypoint mounting `appRouter` via Hono.
- [x] 4.6 `files/package.patch.json` adding `dev:worker` and `deploy` scripts (merge-json).
- [x] 4.7 Seed board task in `tasks.yaml` for "configure Cloudflare account + create R2 bucket."

## 5. Expand ui-shadcn

- [x] 5.1 Update `packs/ui-shadcn/pack.toml` deps to include the full kit listed in the proposal.
- [x] 5.2 Copy or reference the canonical shadcn component file set into `packs/ui-shadcn/files/components/ui/` (one file per primitive).
- [x] 5.3 Update `files/components.json` and `files/lib/utils.ts` to match shadcn defaults.
- [x] 5.4 Update README to list every primitive shipped.

## 6. Template: vite-react base files

- [x] 6.1 Flip `templates/vite-react/template.toml` `status` to `stable`; provides `["react", "static", "edge-runtime"]`.
- [x] 6.2 Scaffold `templates/vite-react/` base files: `package.json` (react 19, vite, wouter, tailwind), `vite.config.ts`, `tailwind.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/router.tsx`.
- [x] 6.3 Ship a Hono dev API stub at `templates/vite-react/server/dev.ts` so a freshly-initialised project has a working `bun dev:api` even before `api-trpc` installs.
- [x] 6.4 Workflow artifacts: copy `AGENTS.md`, `CLAUDE.md`, `.ai/`, `.claude/skills/`, `.codex/skills/` mirroring `templates/nextjs/`.
- [x] 6.5 Update `templates/README.md` registry table.

## 7. Presets

- [x] 7.1 Create `presets/lean-saas-zero.toml` mirroring today's `lean-saas` content.
- [x] 7.2 Rewrite `presets/lean-saas.toml` to the tRPC-flavored bundle.
- [x] 7.3 Create `presets/lean-cloudflare.toml`.
- [x] 7.4 Update `packages/spark/src/commands/preset.ts` (or wherever the preset list surfaces) to discover the new files. (No code change needed — registry auto-discovers presets/ files by basename.)

## 8. Skills + docs

- [x] 8.1 Update `.claude/skills/pack-resolve/SKILL.md` to recommend `api-trpc` by default and `sync-zero` only when realtime sync is explicitly required.
- [x] 8.2 Update `docs/pack-spec.md` capability/exclusivity tables.
- [x] 8.3 Update root `README.md` status line ("14 packs" → new count; `vite-react` now stable).

## 9. Verification

- [x] 9.1 `bun test packages` green.
- [x] 9.2 `bun run scripts/sync-skills.ts --check` green.
- [x] 9.3 Smoke: `bunx create-spark demo-vite --template vite-react --preset lean-cloudflare` — scaffold/install/typecheck/build all green; wrangler config valid. `wrangler dev` actual boot needs CF login (manual step).
- [x] 9.4 Smoke: `bunx create-spark demo-next --template nextjs --preset lean-saas` — scaffold/install/typecheck/`next build` all green; 10 routes emitted. `/api/trpc/hello` not auto-mounted (api-trpc pack lacks `app/api/trpc/[trpc]/route.ts` shim — follow-up).
- [x] 9.5 Preset-resolution test: every preset's `packs` array references an extant `packs/<name>/pack.toml`.

## 10. api-trpc zero-config mount points

So `spark add api-trpc` exposes `/trpc/hello` immediately on every supported template, matching the Zero-style "install and run" UX.

- [x] 10.1 api-trpc ships `files/app/api/trpc/[trpc]/route.ts` (mode = "create-or-skip") that re-exports `GET` and `POST` from the Hono `app.fetch` handler defined in `server/router.ts`.
- [x] 10.2 api-trpc ships `files/worker.ts` (mode = "create-or-skip") — Cloudflare Workers entry that imports the Hono `app` from `./server/router` and exports `{ fetch: app.fetch }`. (Made dep-free by typing `_env`/`_ctx` as `unknown` so the same file builds under Next.js without `@cloudflare/workers-types` installed.)
- [x] 10.3 api-trpc ships `files/server/dev.ts` (mode = "create-or-skip") — bun-served Hono dev server that mounts the same router at `/trpc`. Works on the vite-react template after api-trpc installs.
- [x] 10.4 vite-react template drops its own `server/dev.ts` (api-trpc now owns it); README clarifies that `bun dev:api` requires installing `api-trpc` or another `data-api` provider.
- [x] 10.5 deploy-cloudflare's `worker.ts` file op switches from `create` to `create-or-skip` so api-trpc wins on install order in lean-cloudflare.
- [x] 10.6 Re-run smoke 9.3 — `wrangler deploy --dry-run` bundled the trpc router (749 KiB), `bun run server/dev.ts` boots, `curl /trpc/hello` returns `{"greeting":"Hello, world!"}`.
- [x] 10.7 Re-run smoke 9.4 — `next build` emits `ƒ /api/trpc/[trpc]` (11 routes total); `next start` + `curl /api/trpc/hello` returns `{"greeting":"Hello, world!"}`.
