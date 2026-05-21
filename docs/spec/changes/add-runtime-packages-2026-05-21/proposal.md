---
created_at: 2026-05-21T00:00:00Z
updated_at: 2026-05-21T19:08:50Z
---

## Why

v1 packs are all **file-copy**: every `[[files]]` entry is duplicated into the consumer project, and the user becomes the owner of that code (shadcn-style). This is the right model for stable, framework-specific glue (Tailwind config, route handlers, env wiring) where the user benefits from being able to read and edit the code in place.

It is the wrong model for runtime logic that is the same across every project — Better Auth session middleware, Zero schema/client factories, Stripe webhook signature verification, Anthropic SSE streaming wrappers. In v1 those patterns are duplicated into each project as files, so every bug fix has to be re-applied by hand across consumer apps and the catalog. The user's instinct is correct: some packs should be `import`-style (npm-published runtime helper plus a thin wiring scaffold), while others stay `copy`-style.

Separately, internal workflow logic that today lives only inside the CLI — reading and writing `.ai/board.md`, parsing skill frontmatter, transforming Claude↔Codex skill formats — needs to be reusable by future tools (Forge, downstream `anvil` consumers, third-party scripts). Extracting these into typed npm packages under `@forgeailab/anvil-*` lets every consumer share the same primitives.

## What Changes

- **NEW** Two install modes per pack: `copy` (current behavior; default) and `hybrid` (copies thin scaffold + adds an npm runtime helper to `[dependencies].runtime`).
- **MODIFIED** `pack.toml` schema — optional `[runtime_package]` section with `package` (full npm name) and `version` (semver range). When present, the CLI installs it via `bun add` and the pack is classified `hybrid`.
- **NEW** Three workflow-primitive packages, monorepo-internal, published to npm under `@forgeailab/anvil-*`:
  - `@forgeailab/anvil-board` — typed read/write for `.ai/board.md` (parse epics + tasks, status enum, mutate without losing user prose).
  - `@forgeailab/anvil-skill-utils` — parse SKILL.md frontmatter, transform Claude↔Codex, validate against a typed schema.
  - `@forgeailab/anvil-state` — typed read/write for `.anvil/state.json` (already covered by `@forgeailab/anvil-schema`; this is an ergonomic helper that wraps schema + IO).
- **NEW** Four pack runtime helper packages, each published under `@forgeailab/anvil-<pack>`:
  - `@forgeailab/anvil-auth-better-auth` — Better Auth handler factory, session helpers, adapter-agnostic wiring.
  - `@forgeailab/anvil-sync-zero` — Zero schema builder, client factory, server-cache helpers, typed React provider.
  - `@forgeailab/anvil-stripe-helpers` — checkout session factory, webhook signature verifier, billing portal helper.
  - `@forgeailab/anvil-anthropic` — typed Claude client wrapper, SSE streaming helper, cost-tracking middleware.
- **MODIFIED** Four packs reclassified from `copy` to `hybrid` to consume the new runtime helpers: `auth-better-auth`, `sync-zero`, `payments-stripe`, `ai-anthropic`. The other ten packs stay `copy`.
- **MODIFIED** `anvil` CLI — `info` shows the runtime helper (if any), `add` resolves `[runtime_package]` and adds it as a runtime dep, `check` audits that the helper package is still installed in `package.json`.
- **MODIFIED** Internal CLI code refactored to consume the new workflow primitives where the duplication exists today (board seeding from `packs/<name>/tasks.yaml`, skill-folder copying with frontmatter transform).
- **MODIFIED** Skills — `new-pack` adds a choice of `copy` vs `hybrid`, `pack-resolve` notes which mode each recommended pack uses, `risk-check` audits that hybrid packs' helper versions are not stale.

**BREAKING:** none for consumers (anvil is pre-publish). Internal: four packs change their `[[files]]` content because logic is moved into the helper package. The pack name and capability tags do not change.

## Impact

- Affected specs: `packs`, `pack-cli`, `runtime-packages` (new), `agent-workflow`
- Affected code (to be created or modified):
  - `packages/anvil-board/` — new workspace package
  - `packages/anvil-skill-utils/` — new workspace package
  - `packages/anvil-state/` — new workspace package
  - `packages/anvil-auth-better-auth/` — new workspace package
  - `packages/anvil-sync-zero/` — new workspace package
  - `packages/anvil-stripe-helpers/` — new workspace package
  - `packages/anvil-anthropic/` — new workspace package
  - `packages/anvil/` — consumes anvil-board, anvil-skill-utils, anvil-state; resolves `[runtime_package]` during install; reports in `info` / `check`
  - `packages/create-anvil/` — consumes anvil-board, anvil-skill-utils (when seeding board / mirroring skills)
  - `packages/anvil-schema/` — adds `[runtime_package]` Zod block
  - `packs/auth-better-auth/`, `packs/sync-zero/`, `packs/payments-stripe/`, `packs/ai-anthropic/` — reclassified, `[[files]]` trimmed to wiring only, `[runtime_package]` added
  - `scripts/sync-skills.ts` — refactored to use anvil-skill-utils
  - `.claude/skills/new-pack/SKILL.md`, `.claude/skills/pack-resolve/SKILL.md`, `.claude/skills/risk-check/SKILL.md` — updated to reflect dual install model
- Affected docs: `docs/pack-spec.md` (document the two install modes), `packs/README.md` (classification), `packages/anvil/README.md` (info/check changes)

## Out of scope (for this change)

- Extracting runtime helpers for the remaining packs (`ai-openai`, `db-supabase`, `analytics-posthog`). These follow as a separate change once the v1 four-pack pattern is proven.
- Publishing the npm packages. v1 of this change ships them as workspace packages only; first publication is a separate release step.
- Versioning policy across helper packages (lockstep vs independent). Defaults to independent semver per package; revisit if it becomes painful.
- A `migrate` subcommand that converts an existing project's copied files to use a helper package. Users move forward by reinstalling the pack on a fresh git branch.
- Splitting any **copy** pack (`ui-shadcn`, `db-sqlite`, `email-resend`, `docker-compose-dev`, `testing-playwright`, `deploy-vercel`, `auth-supabase`, `ai-openai`, `db-supabase`, `analytics-posthog`) into a helper package. They stay copy-only in this change.
- A runtime-helper plugin protocol (e.g. "anvil auth providers must implement this interface"). Each helper exports what it exports; there is no cross-helper contract in v1.
