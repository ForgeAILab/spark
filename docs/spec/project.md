# Project Overview

`anvil` is a board-driven AI MVP pipeline: a minimal AI-ready scaffold plus a composable feature-pack registry. Founders start with `create-anvil`, get a bare Next.js + TypeScript app already wired with `AGENTS.md`, `CLAUDE.md`, `.ai/` artifacts, and `.claude/` / `.codex/` skill packs, then add capabilities (auth, db, payments, email, UI, etc.) by installing **packs** through a small Rust CLI.

The system mirrors the operating model documented in `docs/deep-research-pipeline.md` (planner / implementer / evaluator) and the scaffold thinking in `docs/deep-research-scaffold.md`, but rejects the batteries-included template approach in favor of pick-what-you-need composition.

## Tech Stack

- Language: TypeScript (scaffold + initializer); Rust (pack manager CLI)
- Runtime: Bun ≥ 1.3 for the generated app and for workspace tooling
- Package manager: Bun workspaces (monorepo at the registry root)
- Frontend framework (v1): Next.js 15 (App Router)
- Pack manifest format: TOML (`pack.toml`)
- Rust CLI distribution: prebuilt binaries published to npm with platform packages, in the style of `oxlint`, `oxfmt`, and `biome`
- Reference project structure: `~/codes/fursion/app-project/takeout2` — Bun workspaces, `citty` for command parsing, `@clack/prompts` for interactive prompts, two-package split between runtime CLI and `create-*` initializer

## Conventions

- Code style: `oxlint` + `oxfmt` for TS/JS; `rustfmt` + `clippy` for Rust
- Tests: Bun's built-in test runner for TS; `cargo test` for Rust; Playwright for end-to-end
- The board (`.ai/board.md`) is the source of truth. Chat steers; the board decides.
- Status flow is `Clarifying → Approved for planning → Approved for execution → In progress → Needs review → Validated`, with `Blocked` and `Cut from MVP` as side states.
- Skills are authored once and mirrored. The canonical copy lives in `.claude/skills/`; `.codex/skills/` is generated from it.
- Packs are units of capability, not units of code organization. A pack is allowed to ship code, env requirements, board tasks, and skills together.
