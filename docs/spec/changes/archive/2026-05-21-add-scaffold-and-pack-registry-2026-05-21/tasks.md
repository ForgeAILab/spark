---
created_at: 2026-05-21T00:00:00Z
updated_at: 2026-05-21T18:37:55Z
completed_at:
---

## 1. Repository foundations

- [x] 1.1 Convert this repo to a Bun workspaces monorepo. Author root `package.json` with `workspaces: ["packages/*"]` and `"packageManager": "bun@1.3.x"`.
- [x] 1.2 Add `oxlint` + `oxfmt` configs at repo root (`.oxlintrc.json`, `.oxfmtrc.jsonc`) copied from the takeout2 reference.
- [x] 1.3 Add root `tsconfig.base.json` consumed by all TypeScript workspaces.
- [x] 1.4 Author `CLAUDE.md` at repo root with Claude-specific memory complementary to existing `AGENTS.md`.
- [x] 1.5 Extend `AGENTS.md` with a "Packs" section pointing to the pack workflow.

## 2. Pack manifest schema

- [x] 2.1 Author `docs/pack-spec.md` documenting the `pack.toml` schema in human terms.
- [x] 2.2 Define the closed enum of capability tags for v1 (`db`, `auth`, `payments`, `email`, `ui-kit`, `local-runtime`, `deploy-target`, `e2e`, `ai-sdk`, `blob-storage`, `analytics`).
- [x] 2.3 Define the four file modes (`create`, `append`, `merge-json`, `template`) and their semantics.
- [x] 2.4 Add the `compatible_scaffolds` field to the manifest schema (array of template names; empty/missing means works everywhere).
- [x] 2.5 Author Zod schemas in `packages/pack-schema/` for `pack.toml`, `template.toml`, `preset.toml`, and `state.json`.
- [x] 2.6 Add `packs/_example/pack.toml` covering every manifest field as documentation-by-example.

## 3. Template registry

- [x] 3.1 Define `template.toml` schema: `name`, `status = "stable" | "planned"`, `provides` (template-capability tags like `static`, `server`, `react`, `native`), and a one-line `description`.
- [x] 3.2 Create `templates/nextjs/` with `template.toml` (`status = "stable"`, `provides = ["server", "static", "react"]`) plus the full base scaffold: `app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, an unstyled landing page. Includes baked-in `AGENTS.md`, `CLAUDE.md`, `.ai/` stubs, `.claude/skills/`, `.codex/skills/`.
- [x] 3.3 Create `templates/astro/template.toml` with `status = "planned"`, `provides = ["server", "static", "mdx-content"]`, and a `README.md` explaining the planned scope. **No base files in v1.**
- [x] 3.4 Create `templates/astro-starlight/template.toml` with `status = "planned"`, `provides = ["static", "mdx-content"]`, and a planning README. **No base files in v1.**
- [x] 3.5 Create `templates/vite-react/template.toml` with `status = "planned"`, `provides = ["static", "react"]`, and a planning README. **No base files in v1.**
- [x] 3.6 Create `templates/one/template.toml` with `status = "planned"`, `provides = ["server", "static", "react", "native"]`, and a planning README referencing the One framework and the takeout2 reference project. **No base files in v1.**

## 4. `app-skills` CLI (`packages/cli/`)

- [x] 4.1 Set up the TypeScript package run by Bun: `citty` for commands, `@clack/prompts` for prompts, `picocolors` for output, `smol-toml` for `pack.toml` parsing. `bin: { "app-skills": "./src/cli.ts" }`.
- [x] 4.2 Implement `list`: walk `packs/`, parse manifests, render a table grouped by category. Mark installed packs (via state file). Show scaffold-compatibility column.
- [x] 4.3 Implement `info <pack>`: parse manifest, render env requirements, file list, provided skills/tasks, scaffold compatibility. Acts as dry-run.
- [x] 4.4 Implement `check`: validate `.app-skills/state.json` against the filesystem; report missing files, missing env vars, missing tasks.
- [x] 4.5 Implement capability resolver: walk `requires` / `provides` / `conflicts` and `compatible_scaffolds`; return an ordered install plan or a structured error.
- [x] 4.6 Implement `add <pack...> [--dry-run]`: resolve plan, prompt for confirmation, apply each file per its mode, append env vars to `.env.example` and `.env.local` if present, install npm deps via `bun add`, seed tasks into `.ai/board.md`, copy any `skills/` entries into both `.claude/skills/` and `.codex/skills/`, record everything in `.app-skills/state.json`. **`add` MUST be idempotent — re-running with the same args is a no-op.**
- [x] 4.7 Implement `preset <name>`: load `presets/<name>.toml`, validate compatibility with the active scaffold, pass the pack list to `add`.
- [x] 4.8 Implement template-status guard: if the active project was scaffolded with a `status = "planned"` template, refuse `add` with a clear "template not yet implemented" message.
- [x] 4.9 Add `bun test` coverage for the resolver, file-mode operations, idempotency, and scaffold-compatibility checks.

## 5. `create-app-skills` initializer (`packages/create-app-skills/`)

- [x] 5.1 Set up the TypeScript package: `citty` + `@clack/prompts` + `picocolors`. Exposed as `bin: { "create-app-skills": "./src/cli.ts" }`.
- [x] 5.2 Read the template registry from `templates/`. Present an interactive picker; mark planned templates with "(planned)" and refuse selection with a pointer to the follow-up issue.
- [x] 5.3 For a stable template, copy `templates/<name>/` minus `template.toml` into the target directory.
- [x] 5.4 Prompt for app name and an optional preset. Write `app-skills.config.json` with the captured app name, chosen template, and any template vars needed by future pack templating.
- [x] 5.5 If a preset is selected, invoke `app-skills preset <name>` against the new directory before returning.

## 6. Skill mirroring (`scripts/sync-skills.ts`)

- [x] 6.1 Author a Bun script that walks `.claude/skills/`, transforms frontmatter as needed, and writes `.codex/skills/`.
- [x] 6.2 Add a `bun run check:skills` script that regenerates and diffs; non-zero exit if `.codex/skills/` is stale.
- [x] 6.3 Add this check to CI.

## 7. Skill catalog updates

- [x] 7.1 Modify `.claude/skills/architecture-cutline/SKILL.md` to output a structured pack list (with chosen scaffold) including an executable `app-skills add ...` block.
- [x] 7.2 Modify `.claude/skills/risk-check/SKILL.md` to flag installed packs whose capabilities are not used by the spec.
- [x] 7.3 Create `.claude/skills/pack-resolve/SKILL.md` — recommends a scaffold + packs from spec + architecture, no install.
- [x] 7.4 Create `.claude/skills/pack-add/SKILL.md` — wraps `app-skills add` with dry-run, confirm, install, then `/sync-board`.
- [x] 7.5 Create `.claude/skills/new-pack/SKILL.md` — scaffolds `packs/<name>/` with manifest skeleton.
- [x] 7.6 Re-run `bun run check:skills` to mirror into `.codex/skills/`.

## 8. v1 pack catalog (`packs/`)

All v1 packs declare `compatible_scaffolds = ["nextjs"]` unless noted. Adding other scaffolds is a per-pack follow-up after their base templates land.

- [x] 8.1 `db-sqlite` — simplest, no external service. Use as the reference pack while CLI is being built.
- [x] 8.2 `ui-shadcn` — adds shadcn/ui setup, Tailwind config, base components. Ships `shadcn-dashboard-patterns` skill.
- [x] 8.3 `db-supabase` — Supabase client, env vars, RLS-aware patterns. Ships `supabase-patterns` skill.
- [x] 8.4 `auth-supabase` — depends on `db` capability and on the Supabase db host specifically. Email + OAuth.
- [x] 8.4b `auth-better-auth` — thin, framework-agnostic auth using Better Auth (the same library used in the takeout2 reference). Provides exclusive `auth`. Requires any `db`. Email + OAuth + session management. Works equally with `db-sqlite`, `db-supabase`, and future `db-postgres`/`db-drizzle-postgres` packs.
- [x] 8.5 `payments-stripe` — depends on `db` and `auth`. Checkout + portal + webhook. Ships `stripe-patterns` skill.
- [x] 8.6 `ai-anthropic` — Claude SDK setup, env vars, streaming example. Ships `ai-feature-patterns` skill. Scaffold-agnostic (no `compatible_scaffolds` restriction).
- [x] 8.7 `email-resend` — Resend SDK, transactional email templates.
- [x] 8.8 `docker-compose-dev` — local Postgres + Redis (when needed) via docker-compose. Scaffold-agnostic.
- [x] 8.9 `testing-playwright` — Playwright config, example tests.
- [x] 8.10 `deploy-vercel` — `vercel.json`, env-var checklist, deploy doc.
- [x] 8.11 `ai-openai` — parallel to `ai-anthropic`. Scaffold-agnostic.
- [x] 8.12 `analytics-posthog` — PostHog client + opt-in helper. Scaffold-agnostic.
- [x] 8.13 `sync-zero` — Zero sync engine (Rocicorp). Provides exclusive `sync` capability. Requires `db`. Adds the Zero client, schema generation script, and `zero-cache` config. Compatible with `nextjs` in v1; `one` once that template ships.

## 9. Presets (`presets/`)

Each preset declares `compatible_scaffolds` and is rejected if installed against an incompatible template.

- [x] 9.1 `saas-classic.toml` — `compatible_scaffolds = ["nextjs"]`; `packs = [db-supabase, auth-supabase, payments-stripe, email-resend, ui-shadcn, deploy-vercel]`.
- [x] 9.2 `local-ai-mvp.toml` — `compatible_scaffolds = ["nextjs"]`; `packs = [db-sqlite, ai-anthropic, ui-shadcn, testing-playwright]`.
- [x] 9.3 `internal-tool.toml` — `compatible_scaffolds = ["nextjs"]`; `packs = [db-supabase, auth-supabase, ui-shadcn, docker-compose-dev]`.
- [x] 9.4 `docs-site.toml` — `compatible_scaffolds = ["astro-starlight"]`; placeholder preset that will activate once the astro-starlight template ships.
- [x] 9.5 `lean-saas.toml` — `compatible_scaffolds = ["nextjs"]`; `packs = [db-sqlite, auth-better-auth, ui-shadcn, deploy-vercel]`. Demonstrates the no-Supabase path: thin auth + local SQLite for indie / solo founders.

## 10. End-to-end validation

- [x] 10.1 From a clean directory, run `bunx create-app-skills demo --template nextjs --preset saas-classic`. App boots, lint passes, board contains seeded tasks from each pack.
- [x] 10.2 From a clean directory, run `bunx create-app-skills demo --template nextjs` (no preset). Manually `app-skills add db-sqlite ui-shadcn ai-anthropic`. App boots.
- [x] 10.3 Verify `app-skills add db-sqlite` is idempotent: run it twice; second invocation reports "already installed" and exits 0 with no filesystem changes.
- [x] 10.4 Run `app-skills check` after installs and confirm a clean OK report. Manually delete a recorded file; rerun `check` and confirm it surfaces the drift.
- [x] 10.5 Attempt `bunx create-app-skills demo --template astro`. CLI refuses with a clear "planned, not yet implemented" message.
- [ ] 10.6 Run `/mvp-grill` → `/mvp-spec` → `/architecture-cutline` end-to-end against a sample idea. Verify that `architecture-cutline` emits an executable pack-install block scoped to the chosen template. *(Manual interactive workflow — left for user.)*
- [x] 10.7 Update `docs/deep-research-scaffold.md` with a short note that the recommended migration is now `create-app-skills` rather than forking KolbySisk.

## 11. Documentation

- [x] 11.1 Author `README.md` at repo root with the founder-facing quickstart (one paragraph + one code block).
- [x] 11.2 Author `packages/cli/README.md` documenting CLI usage.
- [x] 11.3 Author `packs/README.md` explaining how to write a pack.
- [x] 11.4 Author `templates/README.md` explaining how to author a new template and promote a planned template to stable.
