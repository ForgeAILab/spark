---
created_at: 2026-05-24T23:39:11Z
updated_at: 2026-05-25T18:14:16Z
---

## Why

A founder who runs `create-spark` today lands in a project with 18 skills and a set of freeform `.ai/` stub files (`product-spec.md`, `architecture.md`, `board.md`, …) and no obvious entry point. The planning artifacts are prose with no enforced structure, so acceptance criteria are vague, the "plan" the founder approves is spread across three files, and there is no single legible document they can read to **validate the idea before building**.

Meanwhile this repo already runs a rigorous, legible spec workflow for its *own* development at `docs/spec/` — OpenSpec-style: `specs/` as truth, `changes/<id>/` as reviewable proposals, `### Requirement:` (SHALL) + `#### Scenario:` (WHEN/THEN) as testable acceptance criteria. The founder gets none of that rigor for their product.

This change gives the founder the same workflow, shipped in their generated project under `docs/spark/`. The proposal and design documents become the surface where the founder validates the idea; the EARS specs and `tasks.md` become the build contract and the well-defined to-do list. It also adds the missing conductor (`/start`) and the live build-toward-the-spec loop (`/build-loop`) so the experience feels like Manus: tell it what to build, review the plan, watch it build against a clear goal.

## What Changes

- **BREAKING** — replace the `.ai/` artifact set with a `docs/spark/` spec workspace in every generated project. There is no `.ai/board.md`, `.ai/product-spec.md`, `.ai/architecture.md`, `.ai/ux-theme.md`, `.ai/decision-log.md`, or `.ai/execution-log.md` after this change.
- `docs/spark/` layout shipped by the scaffold:
  - `project.md` — product north star (vision, target user, core loop, non-goals).
  - `design.md` — the product's durable **visual / frontend design language**: color, typography, layout style, component conventions, and empty/loading/error patterns. (Elevated, durable replacement for `.ai/ux-theme.md`.)
  - `AGENTS.md` — how agents use the workspace (mirrors `docs/spec/AGENTS.md`).
  - `specs/<capability>/spec.md` — truth specs in EARS form (`### Requirement:` SHALL + `#### Scenario:` WHEN/THEN).
  - `changes/<id>-YYYY-MM-DD/` — each iteration: `proposal.md` (Why/What/Impact, founder-facing), optional `design.md` (technical "how"), `tasks.md`, and `specs/<capability>/spec.md` deltas.
- **`tasks.md` is the single source of truth for execution.** Tasks carry inline status (`- [ ]` todo, `- [~]` in progress, `- [x]` done; `Blocked`/`Cut` annotated inline). The kanban / build-status "cockpit" view is **rendered on demand** from `tasks.md` across active changes — it is not a stored file.
- Reframe the workflow skills around the workspace:
  - `/start` — understand the user, then **build the documentation**: grill, then author the active `docs/spark/changes/<id>/` (proposal → design → specs → tasks). Stops at the approval gate; routes between phases; renders the build-status view.
  - `/build-loop` — **build and test toward the spec as the goal**: implement a task, test it against its `#### Scenario` WHEN/THEN steps, update `tasks.md`, and loop until the change's specs are satisfied.
  - `/capture-feedback` — turn live-preview feedback into either appended `tasks.md` items or a new `changes/<id>/` proposal, flagging anything that breaks a documented non-goal.
  - The existing planning/execution/evaluation skills (`mvp-grill`, `mvp-spec`, `architecture-cutline`, `ux-theme`, `mvp-board`, `board-review`, `implementation-brief`, `execute-task`, `code-review`, `qa-verify`, `sync-board`, `next-task`, `parallel-execution`, `risk-check`) are re-pointed from `.ai/*` to the `docs/spark/` workspace. Where a skill maps onto an OpenSpec artifact it produces that artifact (e.g. `mvp-spec` → `proposal.md` + EARS specs; `architecture-cutline`/`ux-theme` → `design.md` + `docs/spark/design.md`; `mvp-board` → `tasks.md`).
- Pack task-seeding and `spark check` move from `.ai/board.md` to the active change's `tasks.md`.
- The base templates (`nextjs`, `vite-react`) ship `docs/spark/` instead of `.ai/`; root `AGENTS.md`, `CLAUDE.md`, and `docs/pack-spec.md` are updated to describe the workspace.

## Impact

- **Affected specs:** `agent-workflow`, `scaffold`, `pack-cli`, `packs`
- **Affected code:**
  - `.claude/skills/*` (all 21 skills re-pointed; `start`, `build-loop`, `capture-feedback` revised) → `.codex/skills/*` re-mirrored via `scripts/sync-skills.ts`
  - `libs/spark-board/` — reworked to read/write/render `tasks.md` instead of `.ai/board.md`
  - `packages/create-spark/` — seed `docs/spark/` instead of `.ai/`
  - `packages/spark/` — `check` and pack task-seeding target the active change's `tasks.md`
  - `templates/nextjs/`, `templates/vite-react/` — replace `.ai/` stubs with a `docs/spark/` seed
  - `AGENTS.md`, `CLAUDE.md`, `docs/pack-spec.md`, `README.md`
- **Migration:** breaking for any in-flight project on `.ai/`. A one-time `spark migrate` shim (or documented manual move) converts `.ai/product-spec.md` + `.ai/board.md` into a `docs/spark/` workspace; detailed in `design.md`.
- **Naming note (resolved in `design.md`):** product-level `docs/spark/design.md` (visual language) and change-level `docs/spark/changes/<id>/design.md` (optional technical "how") share a basename but are path-disambiguated.
- **Coordination:** overlaps the `scaffold` capability with the active `add-trpc-cloudflare-stack` change (which adds the `vite-react` reference). This change must be sequenced after that one archives, or merged carefully so both sets of scaffold scenarios survive.
