# anvil

anvil is a project of [ForgeAILab](https://github.com/ForgeAILab).

A minimal AI-ready scaffold plus a composable feature-pack registry for technical founders building MVPs with AI agents.

`anvil` gives you two things:

1. A **minimal Next.js scaffold** preloaded with a board-driven workflow (`AGENTS.md`, `.ai/`, `.claude/skills/`, `.codex/skills/`). No auth, no db, no UI library out of the box — just the workflow.
2. A **composable feature-pack registry** (auth, db, payments, UI, AI SDKs, email, deploy, …) you bolt on as needed. Picks are explicit; nothing is force-installed.

## Quickstart

```bash
bunx create-anvil my-app --template nextjs --preset lean-saas
cd my-app
bun dev
```

That scaffolds Next.js 15 + TypeScript, then installs `db-sqlite`, `auth-better-auth`, `ui-shadcn`, and `deploy-vercel` on top. From there your `.ai/board.md` is the source of truth, and `anvil add <pack>` is how you extend.

## What's in the monorepo

| Path | What |
|---|---|
| `packages/anvil/` | `anvil` CLI — `list`, `info`, `check`, `add`, `preset` |
| `packages/create-anvil/` | `create-anvil` initializer |
| `packages/anvil-schema/` | Shared Zod schemas for `pack.toml`, `template.toml`, `preset.toml`, `state.json` |
| `libs/` | Workspace libraries published under `@forgeailab/anvil-*`. Workflow primitives (`anvil-board`, `anvil-skill-utils`, `anvil-state`) used internally by the CLI, plus pack runtime helpers (`anvil-auth-better-auth`, `anvil-sync-zero`, `anvil-stripe-helpers`, `anvil-anthropic`) imported by hybrid packs |
| `templates/` | Base scaffolds. v1 ships `nextjs`; `astro`, `astro-starlight`, `vite-react`, `one` are registered for compatibility, base files land in follow-ups |
| `packs/` | The pack catalog. See [`packs/README.md`](packs/README.md) |
| `presets/` | Named pack bundles (`saas-classic`, `lean-saas`, `local-ai-mvp`, `internal-tool`, `docs-site`) |
| `reference/` | Runnable reference apps that integrate hybrid packs end-to-end. v1 ships `reference/full-stack-saas/` as the acceptance harness for the `libs/` runtime helpers — not a template |
| `.claude/skills/` | Canonical board-workflow skills. `.codex/skills/` is mirrored from here by `scripts/sync-skills.ts` |
| `docs/pack-spec.md` | Human-author guide to writing a `pack.toml` (covers both `copy` and `hybrid` install modes) |
| `docs/spec/` | Spec-driven workflow — proposals, deltas, decisions |
| `AGENTS.md` | Operating contract for AI agents in this repo |

## Operating model

- **Specs first.** Significant changes are written as proposals under `docs/spec/changes/` before code lands. See `AGENTS.md` and `docs/spec/AGENTS.md`.
- **Board-driven.** `.ai/board.md` holds the task list with a clear status flow (`Clarifying → Approved for planning → Approved for execution → In progress → Needs review → Validated`).
- **Skill-mediated.** Planning, implementation, review, and risk-check all run through skills under `.claude/skills/`.

## Why not a batteries-included template?

Lovable-style templates ship every feature; you delete what you don't use. Bare scaffolds give you nothing; you wire everything from scratch. `anvil` is the third path: a minimal scaffold + a composable catalog of capability packs. You pick the stack you actually need.

## Status

v1 ships:

- 1 base template (`nextjs`); 4 registered for follow-up (`astro`, `astro-starlight`, `vite-react`, `one`).
- 14 packs across `db`, `auth`, `payments`, `email`, `ui`, `ai`, `infra`, `testing`, `deploy`, `analytics`.
- 5 presets.
- 18 skills mirrored into both Claude and Codex skill formats.

Out of scope for v1: a remote pack registry, `remove`/`update` subcommands, pack versioning, base scaffolds for non-Next.js templates.

## Contributing

- New packs: `/new-pack <name> category=<cat>` scaffolds the directory; fill in `pack.toml`. See `docs/pack-spec.md`.
- New templates: see `templates/README.md`.
- Spec workflow: see `docs/spec/AGENTS.md`.
