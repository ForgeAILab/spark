---
created_at: 2026-05-21T00:00:00Z
updated_at: 2026-05-21T18:37:55Z
---

## Why

Founders building MVPs with AI agents currently choose between two bad options: (a) batteries-included templates like KolbySisk's `next-supabase-stripe-starter` that ship features they may never use, or (b) bare scaffolds that force them to wire up auth, billing, db, email, and AI from scratch every time. Neither path treats the scaffold as something an agent should reason about. We want a third path: a **minimal AI-ready scaffold** that already speaks the board-driven workflow encoded in `.claude/skills/`, plus a **composable feature-pack registry** so capabilities are picked, not pre-installed — Manus-style composition rather than Lovable-style fixed template.

## What Changes

- **NEW** `create-app-skills` initializer (TypeScript, Bun, `citty` + `@clack/prompts`) that scaffolds a minimal app preloaded with `AGENTS.md`, `CLAUDE.md`, `.ai/` artifacts, `.claude/skills/`, and `.codex/skills/`. No auth, no db, no UI lib, no billing by default.
- **NEW** Multi-scaffold model. The initializer accepts a `--template <name>` flag and the system is designed so that any number of base templates can plug in. Five templates are **registered as supported categories** of v1: `nextjs` (full app, App Router), `astro` (content sites with partial hydration), `astro-starlight` (pure documentation sites), `vite-react` (SPAs / internal tools), and `one` (full-stack web + native via the One framework). **v1 ships `nextjs` as the reference implementation**; the other four are listed in the template registry so packs can declare compatibility with them, but their base scaffolds land in follow-up changes. Expo is intentionally not registered in v1 — `one` covers the web + native case for now. The AI-workflow artifacts (`.ai/`, `.claude/skills/`, `.codex/skills/`, `AGENTS.md`, `CLAUDE.md`) are identical across every template.
- **NEW** Pack registry under `packs/` in this monorepo. Each pack is a self-contained directory with `pack.toml`, optional `files/`, optional `skills/`, optional `tasks.yaml`. Packs declare what they `provides`, `requires` (by capability tag), `conflicts` with, and `compatible_scaffolds` (which base templates they can install on).
- **NEW** `app-skills` CLI written in TypeScript and run by Bun. No Rust, no cross-platform binary release pipeline, no native addon. Subcommands for v1: `add`, `list`, `info`, `check`, `preset`. **No `remove` subcommand** — uninstall is intentionally not supported in v1 because reliable reversal is too brittle; users revert via `git`.
- **NEW** State file `.app-skills/state.json` tracking installed packs, written files, env vars, and seeded tasks, for the sole purpose of `check` (drift detection). Not used for uninstall.
- **NEW** Skills bundled with packs. The canonical skill copy lives in `.claude/skills/`; `.codex/skills/` is generated from it via a single transform and checked into git for PR review. Stack-memory skills (`supabase-patterns`, `stripe-patterns`, `shadcn-dashboard-patterns`, …) are pack-delivered rather than pre-shipped.
- **NEW** Presets — named bundles of packs in `presets/*.toml` (e.g. `saas-classic`, `local-ai-mvp`, `internal-tool`, `docs-site`) so founders can opt into "the usual" without per-pack decisions. Each preset declares which scaffolds it is compatible with.
- **NEW** Client-first sync model supported as a pack rather than a stack swap. `sync-zero` (the Zero sync engine from Rocicorp) provides a new exclusive `sync` capability and requires any `db` provider (Supabase Postgres, self-hosted Postgres, etc.). Zero does not replace Supabase — it sits in front of any Postgres. v1 ships `sync-zero` as a pack so founders can opt into "client-first realtime" without changing the rest of the stack.
- **NEW** Two `auth` providers in v1 so founders are not forced into Supabase. `auth-supabase` (requires the Supabase db host, includes OAuth + email) and `auth-better-auth` (thin, framework-agnostic, works with any `db` provider). Both are exclusive providers of the `auth` capability — only one installed at a time, but the catalog gives the choice up front.
- **MODIFIED** `architecture-cutline` skill — output structured pack lists rather than free-form prose, so the architecture phase produces directly executable pack-install commands.
- **MODIFIED** `risk-check` skill — detect installed packs whose capabilities are not referenced by the spec (pack-level drift).
- **NEW** Agent skills: `pack-resolve` (recommend a scaffold + packs from spec + architecture), `pack-add` (dry-run + install + board sync), `new-pack` (scaffold a new pack directory).

**BREAKING:** none. This is a greenfield change. The existing 15 skills under `.claude/skills/` continue to work unchanged; the new model adds packs and scaffolds as orthogonal capabilities.

## Impact

- Affected specs: `scaffold`, `packs`, `pack-cli`, `agent-workflow`
- Affected code (to be created):
  - `packages/create-app-skills/` — TypeScript initializer
  - `packages/cli/` — `app-skills` CLI (TypeScript, run by Bun)
  - `packages/pack-schema/` — TOML schema + types shared between CLI and skills
  - `templates/nextjs/` — v1 reference scaffold
  - `templates/astro/`, `templates/astro-starlight/`, `templates/vite-react/` — directory stubs registered as supported templates (full scaffolds land in follow-up changes)
  - `packs/` — pack catalog (v1: ~12 packs)
  - `presets/` — preset definitions
  - `scripts/sync-skills.ts` — generates `.codex/skills/` from `.claude/skills/`
  - `.claude/skills/architecture-cutline/SKILL.md` — modified
  - `.claude/skills/risk-check/SKILL.md` — modified
  - `.claude/skills/pack-resolve/SKILL.md` — new
  - `.claude/skills/pack-add/SKILL.md` — new
  - `.claude/skills/new-pack/SKILL.md` — new
- Affected docs: `AGENTS.md` (extend with pack workflow), `CLAUDE.md` (to be authored as part of this change)

## Out of scope (for this change)

- Remote pack registry (npm tarballs or git-backed catalog). v1 ships in-monorepo packs only.
- Pack versioning and `update` subcommand.
- A `remove` subcommand. Uninstall is intentionally not supported; users revert via git. State tracking exists only for `check`-style drift detection.
- A Rust-based CLI or any native-addon path. The CLI is a Bun TypeScript script.
- Full base scaffolds for `astro`, `astro-starlight`, `vite-react`, and `one`. Those templates are **registered** in v1 (so packs can declare compatibility) but their concrete base files land in follow-up changes.
- Expo as a registered template. The mobile-native path is deferred to a later change; `one` covers the web + native case in the meantime.
- Signed packs / supply-chain verification.
- A GUI / web frontend for the pack catalog.
