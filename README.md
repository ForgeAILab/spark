# spark

spark is a project of [ForgeAILab](https://github.com/ForgeAILab).

A minimal AI-ready scaffold plus a composable feature-pack registry for technical founders building MVPs with AI agents.

`spark` gives you two things:

1. A **minimal Next.js scaffold** preloaded with a spec-driven workflow (`AGENTS.md`, a `docs/spark/` spec workspace, `.claude/skills/`, `.codex/skills/`). No auth, no db, no UI library out of the box — just the workflow.
2. A **composable feature-pack registry** (auth, db, payments, UI, AI SDKs, email, deploy, …) you bolt on as needed. Picks are explicit; nothing is force-installed.

## Quickstart

```bash
bunx create-spark my-app --template nextjs --preset lean-saas
cd my-app
bun dev
```

That scaffolds Next.js 15 + TypeScript, then installs `api-trpc`, `db-postgres`, `auth-better-auth`, `payments-stripe`, `ui-shadcn`, `email-resend`, and `deploy-vercel` on top. From there your `docs/spark/` workspace is the source of truth — run `/start` to plan, and `spark add <pack>` to extend.

For a Cloudflare Workers deploy (Vite + tRPC + R2 + Workers):

```bash
bunx create-spark my-app --template vite-react --preset lean-cloudflare
```

## What's in the monorepo

| Path | What |
|---|---|
| `packages/spark/` | `spark` CLI — `list`, `info`, `check`, `add`, `preset`, `validate`, `status` |
| `packages/create-spark/` | `create-spark` initializer |
| `packages/spark-schema/` | Shared Zod schemas for `pack.toml`, `template.toml`, `preset.toml`, `state.json` |
| `templates/` | Base scaffolds. `nextjs` and `vite-react` are stable; `astro`, `astro-starlight`, `one` are registered for follow-up |
| `packs/` | The pack catalog. See [`packs/README.md`](packs/README.md) |
| `presets/` | Named pack bundles (`saas-classic`, `lean-saas`, `lean-saas-zero`, `lean-cloudflare`, `local-ai-mvp`, `internal-tool`, `docs-site`) |
| `reference/` | Runnable reference apps. v1 ships `reference/full-stack-saas/` as an integration harness — not a template |
| `.claude/skills/` | Canonical board-workflow skills. `.codex/skills/` is mirrored from here by `scripts/sync-skills.ts` |
| `docs/pack-spec.md` | Human-author guide to writing a `pack.toml` (copy install model) |
| `docs/spec/` | Spec-driven workflow — proposals, deltas, decisions |
| `AGENTS.md` | Operating contract for AI agents in this repo |

## Operating model

- **Specs first.** Significant changes are written as proposals under `docs/spec/changes/` before code lands. See `AGENTS.md` and `docs/spec/AGENTS.md`. The spec format and the proposal → delta → archive workflow are adapted from [OpenSpec](https://github.com/Fission-AI/OpenSpec) — spark integrates it as its own board-driven variant (a single founder-facing approval gate, capability packs, and a rendered build-status view on top).
- **Workspace-driven.** Each change's `docs/spark/changes/<id>/tasks.md` holds the task list (inline `- [ ]` / `- [~]` / `- [x]` status) with a clear status flow (`Clarifying → Approved for planning → Approved for execution → In progress → Needs review → Validated`); the build-status view is rendered from it.
- **Skill-mediated.** Planning, implementation, review, and risk-check all run through skills under `.claude/skills/`.
- **One conductor, three modes.** `/start` is the single entry point and auto-detects which mode it is in. *Cold start*: a fresh idea — grill once, run the full plan. *Iteration*: a later change on a shipped MVP — a lighter route (`proposal.md` + spec deltas + `tasks.md` behind one approval gate, no re-grill or architecture re-cut), escalating to the full flow only for scope-changes or large changes. *Adopt*: an existing codebase spark didn't build — a one-time bootstrap that reverse-engineers `project.md` + a `specs/capabilities.md` map and records the detected stack, then hands off to iteration (full specs are written lazily as changes touch each capability). Any mode first explores/researches a genuine unknown (a bounded `research.md`) before proposing.

## Why not a batteries-included template?

Lovable-style templates ship every feature; you delete what you don't use. Bare scaffolds give you nothing; you wire everything from scratch. `spark` is the third path: a minimal scaffold + a composable catalog of capability packs. You pick the stack you actually need.

## Status

v1 ships:

- 2 base templates (`nextjs`, `vite-react`); 3 registered for follow-up (`astro`, `astro-starlight`, `one`).
- 20 packs across `db`, `auth`, `payments`, `email`, `ui`, `ai`, `infra`, `testing`, `deploy`, `analytics`, `storage`, `admin`.
- 6 presets.
- 17 skills mirrored into both Claude and Codex skill formats (the planning phases ship as `start/references/`).

Out of scope for v1: a remote pack registry, `remove`/`update` subcommands, pack versioning, base scaffolds for non-Next.js templates.

## Contributing

- New packs: `/new-pack <name> category=<cat>` scaffolds the directory; fill in `pack.toml`. See `docs/pack-spec.md`.
- New templates: see `templates/README.md`.
- Spec workflow: see `docs/spec/AGENTS.md`.

## Releasing

All 3 publishable packages (`@forgeailab/spark-schema`, `@forgeailab/spark`, `@forgeailab/create-spark`) ship together at a single locked version. CI publishes — humans only bump + tag.

**One-time setup**: create an npm automation token at <https://www.npmjs.com/settings/~/tokens/granular-access-tokens> with publish access for `@forgeailab/*`, then add it as `NPM_TOKEN` at <https://github.com/ForgeAILab/spark/settings/secrets/actions>.

**Cutting a release:**

```bash
bun run release 0.1.1 --tag       # bumps all 10 package.json files + commits + tags
git push --follow-tags             # CI takes over from here
```

The `release` workflow (`.github/workflows/release.yml`) runs on any `v*` tag push: it installs deps, runs `bun test`, asserts every package.json matches the tag, then publishes in topological order (`spark-schema` → `spark` → `create-spark`). Already-published versions are skipped, so re-runs after a partial failure are safe.

To review the bump before tagging:

```bash
bun run release 0.1.1
# inspect git status, then:
git commit -am 'release v0.1.1' && git tag v0.1.1 && git push --follow-tags
```
