---
created_at: 2026-05-25T17:59:35Z
updated_at: 2026-05-25T18:20:49Z
---

## Why

spark can stand up the SaaS substrate — auth, db, payments, UI, analytics — but
every founder then hand-builds the same internal back-office: *who are my users,
who's paying, let me find and edit a user, am I growing.* There is no spark pack
for it and no way to express "this app has one admin area."

open-saas demonstrates the pattern as a first-class feature: a TailAdmin shell
gated by an `isAdmin` flag, a users table (view / search / filter / edit), and a
stats overview fed by a `dailyStatsJob`. We want that value inside spark's
declarative, copy-only pack model — rendered in the shadcn kit spark already
standardizes on, not a second admin template.

This change adds `admin` as a first-class, **exclusive** pack-capability and
ships a lean `admin-dashboard` pack: a **server-gated** `/admin` area with a
users table (list / search / role toggle) and an empty stats shell. Live metric
wiring (revenue, signups, page views) is intentionally **out of scope** for v1
and left to a later change once the founder has a payments/analytics pack
installed.

## What Changes

- **BREAKING (registry-wide enum change):** add `admin` to the closed
  pack-capability enum as an **exclusive** capability — a project may have only
  one admin surface. This change is **sequenced after**
  `add-trpc-cloudflare-stack-2026-05-24` (the `sync`→`data-api` rename, already
  in code); its enum baseline therefore includes `data-api`.
- Add `admin` to the closed pack-**category** enum (catalog bucket).
- New pack `admin-dashboard`:
  - `provides = ["admin"]`, `requires = ["auth", "ui-kit", "db"]`,
    `conflicts = ["admin"]`, `requires_runtime = ["server"]`,
    `compatible_scaffolds = ["nextjs"]`.
  - Ships a **server-side** `requireAdmin()` guard, an `/admin` route group
    (layout + users table page + stats overview shell), all built from shadcn
    primitives, and expects a `role` field on the user record.
- Admin gating is **server-side and normative** — the
  [open-saas #492](https://github.com/wasp-lang/open-saas/issues/492) lesson: the
  admin shell must not render for non-admins, not merely hide client-side.
- `[env] optional = ["ADMIN_EMAILS"]` — comma-separated emails auto-granted
  admin (mirrors open-saas).
- Seed tasks (`tasks.yaml`): (1) add a `role` column to the user schema +
  migration; (2) promote your first admin; (3, Clarifying) wire real metrics
  into the stats shell when a payments/analytics pack is present.
- Ship a pack skill `skills/admin-dashboard-patterns` (server-gating, role
  checks, table/filter patterns).

## Impact

- Affected specs: `packs`
- **Sequencing:** shares the "Pack-Capability Enum and Exclusivity" requirement
  with `add-trpc-cloudflare-stack-2026-05-24`. This change's delta is a
  **superset** of add-trpc's enum block (carries `data-api` + all its scenarios,
  adds `admin`). Archive order MUST be add-trpc → add-admin-pack so no enum
  content is lost.
- Affected code:
  - `packages/spark-schema/src/capabilities.ts` — add `admin` to
    `PACK_CAPABILITY_VALUES` and `EXCLUSIVE_CAPABILITIES`
  - `packages/spark-schema/src/pack.ts` — add `admin` to `PackCategory`
  - `packages/spark-schema/test/pack.test.ts` — `admin` parses; `admin` is
    exclusive
  - `packs/admin-dashboard/` (new) — `pack.toml`, `files/` (the `/admin` routes,
    `requireAdmin`, users table, stats shell, `env.example`),
    `skills/admin-dashboard-patterns/`, `tasks.yaml`
  - `docs/pack-spec.md` — capability + category tables gain `admin`
  - `README.md` — pack count + catalog entry
- **Not in scope (deferred to a later change):** live metric aggregation
  (revenue / signups / page-views), background jobs, additional admin pages
  (messages / settings), and non-nextjs scaffolds.
