# Full Stack SaaS Reference

This is the Phase 0 reference app for `add-runtime-packages-2026-05-21`. It integrates Next.js 15 App Router, React 19, strict TypeScript, Tailwind v4, shadcn-style Button/Card/login UI, Drizzle ORM on SQLite (via `bun:sqlite`), Better Auth email/password plus GitHub OAuth, Zero schema/client wiring, Stripe Checkout/portal/webhook handlers, Resend transactional email, and an Anthropic SSE chat endpoint.

The **visible UI surface is intentionally tiny** — a public landing and one authed page — because the reference app exists to prove the hybrid pack stack composes. Every other integration stays wired as API routes and `lib/` helpers so Phases 5-8 can extract them into `libs/` packages without UI churn.

## Boot

Run install from the monorepo root, then start the app from this directory:

```sh
bun install
cd reference/full-stack-saas
cp .env.example .env.local
bun dev
```

Run `bun run db:push` from this directory before exercising signed-in database flows.

## Visible UI Surface

- `app/page.tsx` — Public landing. App name, one-sentence tagline, "Sign in" CTA.
- `app/(auth)/login/page.tsx` — Email/password + GitHub OAuth via Better Auth. `?mode=signup` toggles to account creation.
- `app/(app)/home/page.tsx` — Authed page (server component; redirects to `/login` if no session). Renders `Hello {user.name}`, a sign-out button, and the posts panel.
- `app/(app)/home/posts-panel.tsx` — Client panel with a "title + body" form and a list of the signed-in user's posts.

The `(app)` route group mounts `ZeroProvider` once for all authed routes. The Zero schema in `lib/zero/schema.ts` mirrors the Drizzle `posts` table 1:1 (id/userId/title/body/createdAt), so swapping the panel to live Zero queries / mutators is a typed drop-in once a Zero cache server is running.

## Smoke Routes (kept inline for Phase 5-8 extraction)

- `app/api/auth/[...all]/route.ts` asserts the Better Auth catch-all handler is wired to the inline auth instance.
- `app/api/ai/chat/route.ts` asserts Anthropic streaming is exposed as SSE from `/api/ai/chat`.
- `app/api/email/test/route.ts` asserts the Resend transactional helper can send a test message.
- `app/api/stripe/checkout/route.ts` asserts subscription Checkout session creation returns `sessionUrl`.
- `app/api/stripe/portal/route.ts` asserts billing portal session creation returns `portalUrl`.
- `app/api/stripe/webhook/route.ts` asserts Stripe webhook signatures are verified before event logging.

`test/smoke.test.ts` uses inline mocks for external SDKs and is the Phase 0 acceptance check for the helper logic. The Stripe, Anthropic, and Resend integrations have no visible UI by design — the smoke tests and API routes are their surface area.

## Tests

Unit / helper smoke tests (bun's built-in runner; filtered to `./test`):

```sh
bun test
```

End-to-end via Playwright (drives the real Next.js dev server against an isolated SQLite file):

```sh
bunx playwright install chromium   # one-time browser download
bunx playwright test
```

`e2e/global-setup.ts` deletes `./.data/e2e.db`, recreates the Drizzle schema with raw DDL (no migration step required), and Playwright's `webServer` boots `bun dev` with `DATABASE_URL=file:./.data/e2e.db`. The single spec covers:

1. Public landing renders with the Sign in link.
2. `/login` renders the email + password + GitHub form.
3. `/login?mode=signup` creates an account and lands on `/home` with the personalized greeting.
4. The signed-in user creates a post; title + body appear in the list.

## Extraction Path

All integration logic is inline on purpose. Phases 5-8 in [tasks.md](../../docs/spec/changes/add-runtime-packages-2026-05-21/tasks.md) will extract the Better Auth, Zero, Stripe, and Anthropic helpers into `libs/` packages and replace this code with `workspace:*` imports.

This app is a reference and acceptance harness, not a starter template. See the root [reference README](../README.md).
