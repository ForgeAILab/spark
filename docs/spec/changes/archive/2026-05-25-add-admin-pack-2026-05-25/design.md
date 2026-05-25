## Context

spark already ships the SaaS substrate (auth / db / payments / ui / analytics)
but has no internal admin surface, so founders rebuild the same back-office each
time. open-saas shows the target shape: a TailAdmin shell, `isAdmin` gating, a
users table, and a stats overview populated hourly by a `dailyStatsJob`. We want
the same value expressed in spark's declarative, copy-only pack model.

## Goals / Non-Goals

- Goals:
  - A first-class way to say "this project has exactly one admin area" → a new
    **exclusive** `admin` pack-capability.
  - A lean, immediately-bootable `/admin` for the nextjs scaffold: server-gated,
    a working users table, and an empty stats shell — all in shadcn.
  - Stay 100% declarative: no install hooks; contextual/manual steps become
    seeded tasks.
- Non-Goals:
  - Live metrics (revenue / signups / page-views), background jobs, multi-page
    TailAdmin parity, and non-nextjs support. Those are later changes.

## Decisions

- **Decision: `admin` is an exclusive pack-capability, not just a ui-category
  pack.** A project should have one canonical admin surface; exclusivity lets the
  resolver reject a second admin pack cleanly and lets future packs declare
  `requires = ["admin"]` to extend it.
  - Alternatives considered: model as a `category = "ui"` consumer pack with
    `provides = []`. Smaller change, but it cannot express the single-admin-surface
    invariant and nothing can depend on it. Rejected for the first-class goal the
    user chose.

- **Decision: render in shadcn, not TailAdmin.** spark standardizes on
  `ui-shadcn` (now the full kit: table, card, chart/recharts, dropdown, dialog,
  form). Adopting TailAdmin would fork the UI system. The admin UI is built from
  shadcn primitives; hence `requires = ["ui-kit"]`.

- **Decision: server-side gating is normative.** open-saas issue #492 leaked the
  admin shell to any logged-in user because gating was client-side only. The pack
  ships a `requireAdmin()` that runs on the server before the admin layout
  renders; a non-admin receives a redirect/403 and never receives admin markup.
  This is a spec scenario, not just a doc note.

- **Decision: role storage via a seeded task, not a schema merge.** The user
  schema is owned by the auth pack and differs per provider; the admin pack
  cannot safely edit it (`create`-mode collisions, provider-specific shapes).
  Instead it ships a `requireAdmin()` that expects a `role` field and **seeds a
  task** to add the column + migration, plus `ADMIN_EMAILS` for auto-promotion.
  - Alternatives considered: `merge-json` / `append` into a schema file — too
    provider-specific and fragile. Rejected.

- **Decision: ship the stats shell, defer the data.** v1 ships the stats
  overview page with placeholder metric cards + an empty chart so the surface
  exists and boots; a `Clarifying` seeded task records wiring real metrics when a
  payments/analytics pack is present. A declarative pack cannot branch on what
  else is installed, so the build-loop / founder wires it with full context.

## Sequencing / Conflict

This change and `add-trpc-cloudflare-stack-2026-05-24` both MODIFY the
"Pack-Capability Enum and Exclusivity" requirement. add-trpc renames
`sync`→`data-api` and is already implemented in code (`capabilities.ts` ships
`data-api`), just not yet archived. This change's MODIFIED block is a strict
**superset**: it carries add-trpc's `data-api` enum + all three of its scenarios
and adds `admin`. Therefore the archive order MUST be add-trpc → add-admin-pack;
recorded as task 0. (Implementation in `capabilities.ts` is additive — append
`admin` to whatever the enum currently holds — so it is safe regardless of the
archive timing.)

## Risks / Trade-offs

- The enum change is registry-wide (schema + tests + docs). Mitigated by being
  purely additive (only adds `admin`).
- An "empty stats shell" can read as unfinished. Mitigated by explicit
  placeholders + a seeded wiring task; honest for an MVP.
- The admin pack is nextjs-only in v1 (matching `auth-better-auth`,
  `payments-stripe`, `ui-shadcn`). A vite-react admin surface is a later change.

## Open Questions

- Field name `role` (enum: `user` | `admin`) vs a boolean `isAdmin`. Leaning
  toward a `role` string for future expansion (support / billing roles); to be
  fixed in the seeded task wording during implementation. Not blocking.
