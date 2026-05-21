---
name: supabase-patterns
description: Apply Supabase client, server, and RLS patterns in Next.js apps without leaking authorization into the browser.
---

# Skill: supabase-patterns

## Goal

Use Supabase as the database boundary for a Next.js app while keeping data
access explicit, RLS-backed, and easy to review. Client code may improve user
experience, but database authorization belongs in Postgres policies.

## Client Choice

- Use the browser client only inside Client Components and browser utilities.
- Use the server client inside Server Components, Server Actions, and Route Handlers.
- Use the service role key only in server-only code.
- Never expose the service role key through `NEXT_PUBLIC_` variables.
- Keep client creation in `lib/supabase/client.ts` and `lib/supabase/server.ts`.
- Import those helpers instead of constructing clients throughout the app.

## RLS Baseline

- Enable RLS on every user-facing table before shipping.
- Write one policy per action: select, insert, update, delete.
- Start restrictive, then add policies for real workflows.
- Prefer `auth.uid()` ownership checks for user-owned rows.
- Prefer membership tables for team or organization access.
- Avoid policies that only check whether a user is signed in.
- Avoid policies that mirror UI visibility without enforcing ownership.

## Schema Patterns

- Add `user_id uuid references auth.users(id)` for personal records.
- Add `organization_id` plus a membership table for multi-tenant data.
- Use `created_at` and `updated_at` consistently.
- Add indexes for policy predicates such as `user_id` and `organization_id`.
- Keep public profile data separate from private account data.
- Do not join to private tables from public views unless the policy is clear.

## Server Reads And Writes

- Prefer server reads when data is needed for initial page render.
- Put writes in Server Actions or Route Handlers when they affect trusted state.
- Re-check authorization in SQL policies, even when the server action checks it.
- Use `select()` projections instead of fetching whole rows by default.
- Return typed view models to Client Components.
- Avoid passing raw Supabase errors directly into user-facing copy.

## Browser Reads

- Browser reads are fine for realtime lists, optimistic UI, and user-owned data.
- Keep filters aligned with RLS policies so results are predictable.
- Treat browser filters as performance hints, not authorization.
- Use loading, empty, and error states for every browser query.
- Do not fetch admin data from the browser, even behind hidden UI.

## Auth And Cookies

- Middleware should refresh auth cookies before protected routes read sessions.
- Use `getUser()` or claims validation on the server before trusted actions.
- Avoid trusting session data that only came from local storage.
- Redirect unauthenticated users at route boundaries.
- Keep callback routes small: exchange the code, then redirect.

## Service Role Use

- Reserve the service role for background jobs and admin workflows.
- Create a separate helper for service-role clients.
- Keep service-role operations narrow and logged.
- Never use the service role to bypass missing user policies in normal flows.
- If a user action needs service role access, reconsider the table design.

## Review Checklist

- Every exposed table has RLS enabled.
- Every policy has a named workflow it supports.
- Server-only keys are not imported by Client Components.
- Client queries cannot reveal another tenant's data.
- Seeded sample data matches the policies.
- Error states do not expose table names or policy details.
