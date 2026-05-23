---
created_at: 2026-05-21T00:00:00Z
updated_at: 2026-05-22T03:04:03Z
---

## Why

v1 packs are all **file-copy**: every `[[files]]` entry is duplicated into the consumer project, and the user becomes the owner of that code (shadcn-style). This is the right model for stable, framework-specific glue (Tailwind config, route handlers, env wiring) where the user benefits from being able to read and edit the code in place.

It is the wrong model for runtime logic that is the same across every project — Better Auth session middleware, Zero schema/client factories, Stripe webhook signature verification, Anthropic SSE streaming wrappers. In v1 those patterns are duplicated into each project as files, so every bug fix has to be re-applied by hand across consumer apps and the catalog. Some packs should be `import`-style (npm-published runtime helper plus a thin wiring scaffold), while others stay `copy`-style.

Separately, internal workflow logic that today lives only inside the CLI — reading and writing `.ai/board.md`, parsing skill frontmatter, transforming Claude↔Codex skill formats — needs to be reusable by future tools (Forge, downstream `anvil` consumers, third-party scripts). Extracting these into typed npm packages under `@forgeailab/anvil-*` lets every consumer share the same primitives.

**Validation strategy.** Before extracting anything into packs and helper libraries, we build one complete working **reference app** that integrates Better Auth + Zero + Stripe + Anthropic + shadcn + Resend end-to-end inside a Next.js 15 + SQLite scaffold. Once that app boots and the demo flows work, we extract its reusable logic into `libs/anvil-*` packages, leaving the reference app importing from local workspaces. Each pack's manifest is then authored from the thin wiring files that remain in the reference app. Finally we validate by scaffolding a fresh project from `templates/nextjs`, running `anvil add` for the same set of packs, and asserting the result converges on the reference app's behavior. The reference app does triple duty: integration proof, extraction source, acceptance harness.

## What Changes

- **NEW** Three top-level workspace directories instead of two:
  - `packages/` — platform tooling (`@forgeailab/anvil`, `@forgeailab/create-anvil`, `@forgeailab/anvil-schema`).
  - `libs/` — runtime libraries that hybrid packs import from and that internal tooling consumes (`@forgeailab/anvil-board`, `anvil-skill-utils`, `anvil-state`, `anvil-auth-better-auth`, `anvil-sync-zero`, `anvil-stripe-helpers`, `anvil-anthropic`).
  - `packs/` — pack manifests + file-copy trees. Unchanged in role, content shrinks for hybrid packs as logic moves to `libs/`.
- **NEW** `reference/` directory at repo root holding the validation app(s). v1 ships exactly one: `reference/full-stack-saas/`.
- **NEW** Two install modes per pack: `copy` (current behavior; default) and `hybrid` (copies thin scaffold + adds an npm runtime helper to `[dependencies].runtime`).
- **MODIFIED** `pack.toml` schema — optional `[runtime_package]` section with `package` (full npm name) and `version` (semver range). When present, the CLI installs it via `bun add` and the pack is classified `hybrid`.
- **NEW** Three workflow-primitive packages under `libs/`, published to npm under `@forgeailab/anvil-*`:
  - `@forgeailab/anvil-board` — typed read/write for `.ai/board.md` (parse epics + tasks, status enum, mutate without losing user prose).
  - `@forgeailab/anvil-skill-utils` — parse SKILL.md frontmatter, transform Claude↔Codex.
  - `@forgeailab/anvil-state` — typed read/write for `.anvil/state.json` (wraps `@forgeailab/anvil-schema` with IO).
- **NEW** Four pack runtime helper packages under `libs/`:
  - `@forgeailab/anvil-auth-better-auth` — Better Auth handler factory, session helpers, adapter-agnostic wiring.
  - `@forgeailab/anvil-sync-zero` — Zero schema builder, client factory, server-cache helpers, typed React provider.
  - `@forgeailab/anvil-stripe-helpers` — checkout session factory, webhook signature verifier, billing portal helper.
  - `@forgeailab/anvil-anthropic` — typed Claude client wrapper, SSE streaming helper, cost-tracking middleware.
- **NEW** Reference app `reference/full-stack-saas/` — a complete, runnable Next.js 15 + SQLite + Better Auth + Zero + Stripe + Anthropic + Resend + shadcn application. Built first; extracted from second; used as the acceptance test third.
- **MODIFIED** Four packs reclassified from `copy` to `hybrid` to consume the new runtime helpers: `auth-better-auth`, `sync-zero`, `payments-stripe`, `ai-anthropic`. The other ten packs stay `copy`.
- **MODIFIED** Root `package.json` workspace patterns become `["packages/*", "libs/*", "reference/*"]`.
- **MODIFIED** `anvil` CLI — `info` shows the runtime helper (if any), `add` resolves `[runtime_package]` and adds it as a runtime dep, `check` audits that the helper package is still installed in `package.json`. Internal CLI code refactored to consume the new workflow primitives.
- **MODIFIED** Skills — `new-pack` adds a choice of `copy` vs `hybrid`, `pack-resolve` notes which mode each recommended pack uses, `risk-check` audits that hybrid packs' helper versions are not stale.

**BREAKING:** none for consumers (anvil is pre-publish). Internal: four packs change their `[[files]]` content because logic is moved into `libs/`. The pack name, capability tags, and install command stay the same.

## Impact

- Affected specs: `packs`, `pack-cli`, `runtime-packages` (new), `agent-workflow`
- Affected code (to be created or modified):
  - `reference/full-stack-saas/` — new complete reference app
  - `libs/anvil-board/`, `libs/anvil-skill-utils/`, `libs/anvil-state/` — new workspace packages (workflow primitives)
  - `libs/anvil-auth-better-auth/`, `libs/anvil-sync-zero/`, `libs/anvil-stripe-helpers/`, `libs/anvil-anthropic/` — new workspace packages (pack runtime helpers)
  - `packages/anvil/` — consumes `@forgeailab/anvil-board`, `anvil-skill-utils`, `anvil-state`; resolves `[runtime_package]` during install; reports in `info` / `check`
  - `packages/create-anvil/` — consumes `@forgeailab/anvil-board`, `anvil-skill-utils` when seeding board / mirroring skills
  - `packages/anvil-schema/` — adds `[runtime_package]` Zod block
  - `packs/auth-better-auth/`, `packs/sync-zero/`, `packs/payments-stripe/`, `packs/ai-anthropic/` — reclassified `hybrid`, `[[files]]` trimmed to wiring only, `[runtime_package]` added
  - Root `package.json` — workspaces pattern extended
  - `scripts/sync-skills.ts` — refactored to use `@forgeailab/anvil-skill-utils`
  - `.claude/skills/new-pack/SKILL.md`, `pack-resolve/SKILL.md`, `risk-check/SKILL.md` — updated for dual install model + new dir layout
- Affected docs: `docs/pack-spec.md` (two install modes + dir layout), `packs/README.md` (pack classification table), `packages/anvil/README.md` (info/check changes), `reference/full-stack-saas/README.md` (the reference app's purpose + how to run).

## Out of scope (for this change)

- Extracting runtime helpers for the remaining packs (`ai-openai`, `db-supabase`, `analytics-posthog`). They follow as a separate change once the v1 four-pack pattern is proven.
- A second reference app for, say, the `docs-site` preset. v1 ships exactly one reference (`full-stack-saas`). Adding more references comes later.
- Publishing the npm packages. v1 of this change ships them as workspace packages only; first publication is a separate release step.
- Versioning policy across helper packages (lockstep vs independent). Defaults to independent semver per package; revisit if it becomes painful.
- A `migrate` subcommand that converts an existing project's copied files to use a helper package. Users move forward by reinstalling the pack on a fresh git branch.
- Splitting any **copy** pack (`ui-shadcn`, `db-sqlite`, `email-resend`, `docker-compose-dev`, `testing-playwright`, `deploy-vercel`, `auth-supabase`, `ai-openai`, `db-supabase`, `analytics-posthog`) into a `libs/` helper. They stay copy-only in this change.
- A runtime-helper plugin protocol (e.g. "anvil auth providers must implement this interface"). Each helper exports what it exports; there is no cross-helper contract in v1.
