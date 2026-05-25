---
created_at: 2026-05-24T19:46:04Z
updated_at: 2026-05-25T00:53:47Z
---

## Why

Today the spark catalog ships realtime data via `sync-zero` and a Next-only base scaffold. Builders who want the simpler RPC shape (typed client → server function) or who want to deploy to Cloudflare Workers have to wire everything themselves. We also have `ui-shadcn` shipping a thin subset of the kit, which forces builders to re-add Radix primitives, forms, charts, and toasts pack-by-pack.

This change closes those gaps:
- A tRPC pack as the **alternative** to Zero (both occupy the same exclusive data-api slot, so projects pick one).
- A Cloudflare deploy target plus the long-registered `vite-react` template made stable, so the tRPC server can run on Workers.
- `ui-shadcn` expanded to the full kit so the default UI install is "everything shadcn ships."
- `storage-s3` to cover the file-storage capability slot (works against AWS S3 and Cloudflare R2 via the same SDK).

## What Changes

- **BREAKING** rename pack-capability `sync` → `data-api`. `sync-zero` migrates its `provides` from `sync` to `data-api`; exclusivity is preserved.
- New pack `api-trpc` providing `data-api`, requiring `db`, with a Hono fetch adapter so the same router handles Next route handlers, Vite dev (Node), and Cloudflare Workers.
- New pack `storage-s3` providing `blob-storage`, with env wiring for `S3_ENDPOINT` so the same pack covers AWS S3 and Cloudflare R2.
- New pack `deploy-cloudflare` providing `deploy-target`, shipping `wrangler.toml` + a Workers entrypoint that mounts the tRPC router.
- Expand `ui-shadcn` to ship the full Radix primitive set + `react-hook-form`, `zod`, `@hookform/resolvers`, `cmdk`, `sonner`, `vaul`, `lucide-react`, `framer-motion`, `recharts`, `embla-carousel-react`, `react-day-picker`, `input-otp`, `next-themes`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, `date-fns`.
- Promote `templates/vite-react/` from `planned` to `stable` and land base files (Vite + React 19 + wouter + Tailwind + Hono dev API entrypoint).
- New preset `lean-cloudflare` = `vite-react` + `api-trpc` + `db-postgres` + `auth-better-auth` + `storage-s3` + `email-resend` + `deploy-cloudflare`.
- Rename existing `lean-saas` preset to `lean-saas-zero` (keeps the Zero-flavored bundle); the name `lean-saas` is reassigned to a tRPC-flavored bundle: `nextjs` + `api-trpc` + `db-postgres` + `auth-better-auth` + `payments-stripe` + `ui-shadcn` + `email-resend` + `deploy-vercel`.

## Impact

- Affected specs: `packs`, `scaffold`
- Affected code:
  - `packages/spark-schema/src/pack.ts` — capability enum rename
  - `packs/sync-zero/pack.toml` — provides update
  - `packs/api-trpc/` (new), `packs/storage-s3/` (new), `packs/deploy-cloudflare/` (new)
  - `packs/ui-shadcn/` — expanded `pack.toml` dependencies + `files/`
  - `templates/vite-react/` — base files + `template.toml` status flip
  - `presets/lean-saas.toml`, `presets/lean-saas-zero.toml` (new), `presets/lean-cloudflare.toml` (new)
  - `packages/spark/src/commands/preset.ts` — surface new presets
- Migration: the `sync` → `data-api` rename is a closed-enum change. Any project that committed an installed pack listing `sync` keeps working because pack provides are read from `pack.toml` (only `sync-zero` ships it, and it migrates in this change). The schema parser MUST reject `sync` to keep the enum closed.
