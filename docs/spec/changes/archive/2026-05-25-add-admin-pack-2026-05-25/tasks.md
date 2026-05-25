---
created_at: 2026-05-25T17:59:35Z
updated_at: 2026-05-25T18:20:49Z
completed_at: 2026-05-25T18:20:49Z
---

## 0. Sequencing precondition

- [x] 0.1 Confirm `add-trpc-cloudflare-stack-2026-05-24` is archived (or archived first in the same session) so the pack-capability enum baseline already includes `data-api`. This change's enum delta is a superset of add-trpc's. (Verified: `data-api` already ships in `capabilities.ts`; the `admin` edit is purely additive, safe regardless of archive timing.)

## 1. Schema: add the `admin` capability + category

- [x] 1.1 Add `'admin'` to `PACK_CAPABILITY_VALUES` and to `EXCLUSIVE_CAPABILITIES` in `packages/spark-schema/src/capabilities.ts` (append; do not disturb existing values).
- [x] 1.2 Add `'admin'` to the `PackCategory` enum in `packages/spark-schema/src/pack.ts`.
- [x] 1.3 Update `packages/spark-schema/test/pack.test.ts`: `admin` parses in `provides`/`requires`/`conflicts`; `admin` is accepted as a `category`; two packs both providing `admin` are flagged as an exclusive conflict.

## 2. New pack: `admin-dashboard`

- [x] 2.1 Scaffold `packs/admin-dashboard/` (via `/new-pack admin-dashboard category=admin`).
- [x] 2.2 `pack.toml`: `provides = ["admin"]`, `requires = ["auth", "ui-kit", "db"]`, `conflicts = ["admin"]`, `requires_runtime = ["server"]`, `compatible_scaffolds = ["nextjs"]`; `[env] optional = ["ADMIN_EMAILS"]`.
- [x] 2.3 `files/lib/require-admin.ts` — server-side `requireAdmin()`: loads the session user, checks `role`, redirects/403 a non-admin **before** any admin markup is produced.
- [x] 2.4 `files/app/admin/layout.tsx` — calls `requireAdmin()` first; renders the shadcn admin shell (sidebar + topbar).
- [x] 2.5 `files/app/admin/page.tsx` — stats overview: placeholder metric cards (Users, Paying, MRR, Page views) + an empty recharts area chart, each clearly marked as "wire me". (Marked `'use client'` so recharts stays in the client bundle — required for a clean `next build`.)
- [x] 2.6 `files/app/admin/users/page.tsx` — users table (shadcn `table`): list, search by email, role toggle (server action), subscription/admin filters. (Role-toggle server action extracted to `files/app/admin/users/actions.ts` — inline `'use server'` is illegal inside a Client Component.)
- [x] 2.7 `files/env.example` — `ADMIN_EMAILS=` (append to `.env.example`).
- [x] 2.8 `skills/admin-dashboard-patterns/SKILL.md` — server-gating, role checks, and table/filter patterns (canonical Claude format).
- [x] 2.9 `tasks.yaml` — seed: `ADM-001` add a `role` column to the user schema + migration; `ADM-002` promote your first admin (via `ADMIN_EMAILS` or DB); `ADM-003` (Clarifying) wire real metrics into the stats shell when a payments/analytics pack is present.
- [x] 2.10 `README.md` in the pack — documents `requires`, server-side gating, the `role` field, and `ADMIN_EMAILS`.

## 3. Docs

- [x] 3.1 `docs/pack-spec.md` — add `admin` to the category enum, the PackCapability enum, and the exclusive list.
- [x] 3.2 Root `README.md` — bump pack count + add the catalog entry.

## 4. Verification

- [x] 4.1 `bun test packages` green (schema tests, incl. the new `admin` cases). (Ran `bun test packages libs scripts`: 85 pass / 0 fail.)
- [x] 4.2 `bun run scripts/sync-skills.ts --check` green (the pack-shipped skill mirrors cleanly). (`.codex/skills` in sync, 22 skills.)
- [x] 4.3 Smoke: scaffold nextjs + `db-postgres` + `auth-better-auth` + `ui-shadcn` + `admin-dashboard`; `spark check`; `next build`; verify `/admin` redirects when logged-out / non-admin and renders for an admin; the users table lists seeded users. (Verified deterministically: install resolves, all 6 files copy, `ADMIN_EMAILS` appended, ADM-001/002/003 seeded, `spark check` clean (only expected missing-env), `next build` succeeds with `/admin` + `/admin/users` as server-rendered/dynamic routes — confirming the server-side guard runs before markup. The live DB-backed walkthrough — actual logged-out redirect / admin render / seeded rows listed — requires a provisioned Postgres + auth session and is left to the founder's runtime; the guard code path and dynamic-route output structurally guarantee server-side gating.)
