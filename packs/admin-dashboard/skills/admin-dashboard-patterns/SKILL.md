---
name: admin-dashboard-patterns
description: Build server-gated admin dashboard surfaces with role-aware access and practical user management tables.
---

# Skill: admin-dashboard-patterns

## Goal

Build admin screens that protect privileged data before any markup renders,
then keep the workflow dense, searchable, and easy to audit. Treat `/admin` as
an operational surface, not a marketing page.

## Server Gating

- Call `requireAdmin()` before the admin layout renders.
- Never rely on client-side hiding for access control.
- Redirect or return a server response before loading admin-only data.
- Do not stream admin shell markup until the guard has passed.
- Keep the guard in a server-only module and import it only from server routes,
  layouts, pages, or server actions.

## Role Checks

- Use the user `role` field as the primary source of truth.
- Treat `role === "admin"` as the durable admin grant.
- Use `ADMIN_EMAILS` as bootstrap configuration for the first admin.
- Trim and lowercase configured admin emails before comparing.
- Keep role migration and first-admin promotion as explicit seeded tasks.
- Do not patch auth-pack-owned schema files from the admin pack.

## Users Tables

- Use a table when admins compare many users across email, role, plan, and dates.
- Put search and filters directly above the table they affect.
- Search by email first; add name search only when the data exists.
- Use compact role and subscription filters instead of separate pages.
- Keep role toggles as deliberate row actions with pending and error states.
- Show admin role changes in a way that can be audited later.
- Do not expose bulk role changes until the product has a clear recovery path.

## Empty, Loading, Error

- Empty states should say which filter or search produced no users.
- Loading states should preserve table columns and row height.
- Error states should identify whether auth, database, or role update failed.
- Avoid placeholder metrics that look real before analytics or payments are wired.
