# admin-dashboard

`admin-dashboard` adds a server-gated `/admin` surface for Next.js apps. It
provides the exclusive `admin` capability and expects auth, UI, and database
packs to already be installed.

Installed files:

- `lib/require-admin.ts` exports the server-only `requireAdmin()` guard.
- `app/admin/layout.tsx` mounts the admin shell and must call `requireAdmin()`
  before rendering admin markup.
- `app/admin/page.tsx` provides the stats overview shell.
- `app/admin/users/page.tsx` provides the users table surface.
- `env.example` appends `ADMIN_EMAILS=` to `.env.example`.

## Requirements

The pack declares `requires = ["auth", "ui-kit", "db"]`,
`requires_runtime = ["server"]`, and `compatible_scaffolds = ["nextjs"]`.

## Server-Side Gating

Call `requireAdmin()` before the admin layout or any admin-only data renders.
Unauthenticated users and non-admin users redirect to `/`, so privileged markup
is never sent to the client.

## User Role Field

The guard expects authenticated user records to expose a `role` string. Seeded
task `ADM-001` adds a `user | admin` role column with default `user`; the pack
does not edit auth-pack-owned schema files directly.

## First Admin

Set `ADMIN_EMAILS` to a comma-separated list of bootstrap admin emails, or
promote a user directly in the database. Seeded task `ADM-002` records that at
least one user must resolve as admin before the route is useful.
