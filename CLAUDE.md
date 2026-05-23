# CLAUDE.md

This repo builds a board-driven AI MVP pipeline with composable feature packs.
Founders start from a minimal scaffold, then add only the capabilities their
approved plan needs: database, auth, payments, email, UI, deployment, analytics,
AI SDKs, and related workflow skills.

## Runtime

- Bun TypeScript is the runtime and package-management baseline.
- Keep package scripts runnable through Bun.
- Do not introduce npm, pnpm, Node-only APIs, native addons, or Rust tooling for
  the pack registry work unless a later approved spec changes the cutline.

## Package Layout

- `packages/spark` hosts the future `spark` pack CLI.
- `packages/create-spark` hosts the future initializer.
- `packages/spark-schema` hosts shared TOML schemas and parser helpers.

Only implement packages that are in the currently approved task scope.

## Working Contract

Read `AGENTS.md` for the portable operating contract. It defines the planner,
implementer, evaluator loop, board status gates, source-of-truth artifacts, and
scope-control rules. This file is only Claude-facing project memory; it should
not duplicate those rules.

## Packs

Packs are declarative units of capability. A pack can declare dependencies,
environment variables, file operations, skills, and seeded board tasks, but it
must not run arbitrary install hooks.

Use the pack workflow documented in `AGENTS.md` and the manifest reference in
`docs/pack-spec.md`.
