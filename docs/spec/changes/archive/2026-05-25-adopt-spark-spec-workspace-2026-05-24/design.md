## Context

spark's planning layer (`.ai/*.md` + a hand-maintained `board.md`) is freeform and has no single legible "plan" artifact. This repo already operates an OpenSpec-style workflow at `docs/spec/`. This change ports that workflow into generated projects as `docs/spark/`, and reframes the skills around it. It is cross-cutting (skills + libs + CLI + templates + docs) and breaking, so it warrants a design doc.

## Goals / Non-Goals

- **Goals:**
  - One legible, validatable plan per iteration (`proposal.md` + `design.md`) that the founder reads before building.
  - Testable acceptance criteria as EARS `#### Scenario` WHEN/THEN steps that `/code-review` and `/qa-verify` check one-by-one.
  - A single execution source of truth (`tasks.md`) with the kanban as a rendered view.
  - A durable, product-wide visual design document.
- **Non-Goals:**
  - Building a new CLI for the spec workflow inside generated projects (the skills author plain Markdown; no external dependency).
  - Changing the planner/implementer/evaluator operating model or the status vocabulary — only where it is recorded.
  - Remote spec storage, spec versioning, or multi-product workspaces.

## Decisions

### Decision: `docs/spark/` mirrors the OpenSpec layout this repo already uses

- **Layout:** `project.md`, `design.md`, `AGENTS.md`, `specs/<capability>/spec.md`, `changes/<id>-YYYY-MM-DD/{proposal.md, design.md?, tasks.md, specs/<cap>/spec.md}`.
- **Why:** zero new concepts for anyone who has seen `docs/spec/`; the founder's product workspace and spark's own dev workspace are structurally identical.
- **Alternatives considered:** keep `.ai/` and only enrich acceptance criteria (rejected — leaves three freeform files and no reviewable plan); unify onto `docs/spec/` naming (rejected — `docs/spark/` brands the founder's product workspace and avoids confusion with spark-the-tool's own specs).

### Decision: `.ai/` → `docs/spark/` mapping

| `.ai/` (old) | `docs/spark/` (new) |
| --- | --- |
| `product-spec.md` | `changes/<id>/proposal.md` (Why/What/Impact) + `specs/<cap>/spec.md` (EARS truth) |
| `architecture.md` | `changes/<id>/design.md` (technical) + `project.md` (durable stack summary) |
| `ux-theme.md` | `design.md` (durable product-wide visual language) |
| `board.md` | `changes/<id>/tasks.md` (inline status) + rendered build-status view |
| `decision-log.md` | `changes/<id>/proposal.md` + `design.md` Decisions; archived into `specs/` on completion |
| `execution-log.md` | git history + `tasks.md` checkbox state (dropped as a separate artifact) |

### Decision: `tasks.md` is the single source of truth; the board is rendered

- Status lives inline: `- [ ]` todo, `- [~]` in progress, `- [x]` done. `Blocked: <reason>` / `Cut: <reason>` annotated on the line. Rich metadata (owner, depends-on, parallel-safe, PR) lives as sub-bullets under the task.
- `libs/spark-board` is reworked from "parse/write `.ai/board.md`" to "parse `tasks.md` across active changes and **render** the kanban / build-status view." No stored board file exists, so it cannot drift from the tasks.
- The status vocabulary (`Clarifying → Approved for planning → Approved for execution → In progress → Needs review → Validated`, plus `Blocked`/`Cut`) is preserved; only its storage moves. Approval gates still bind: a task is not built until its change is approved; `Validated` still needs `/code-review` + `/qa-verify`.

### Decision: two `design.md` files, disambiguated by path

- `docs/spark/design.md` — durable, product-wide **visual/frontend** design language. Always present. Founder-facing.
- `docs/spark/changes/<id>/design.md` — **optional technical** "how" for a complex change (per OpenSpec).
- They share a basename but never the same directory. If review prefers distinct names, the change-level file can be renamed (e.g. `tech-design.md`) without affecting the product-level one. Left as an open question below.

### Decision: skill responsibilities re-pointed, not rewritten

- `/start` = understand + document: drives grill → `proposal.md` → `design.md`/`docs/spark/design.md` → `specs/` → `tasks.md`, pausing at the approval gate; renders build-status.
- `/build-loop` = build toward the goal: for each `tasks.md` item, implement → test against the linked `#### Scenario` steps → update status → loop until the change's specs pass.
- `/capture-feedback` = feedback → `tasks.md` items or a new `changes/<id>/` proposal; flags non-goal violations.
- Existing skills keep their intent and recommended models; only their input/output paths and artifact shapes change.

## Risks / Trade-offs

- **Bigger first-run footprint.** A founder sees a `docs/spark/` tree instead of a couple of stub files. Mitigated by a short `docs/spark/AGENTS.md` and `/start` guiding the first step.
- **EARS friction for tiny apps.** Writing SHALL/Scenario for a weekend toy may feel heavy. Mitigation: `/start` keeps the first change small (one `proposal.md` + a handful of scenarios) and only grows specs as capabilities land.
- **Breaking for in-flight `.ai/` projects.** Mitigated by `spark migrate` (below).
- **Coordination with `add-trpc-cloudflare-stack`** on the `scaffold` capability — sequence after archive or merge scenarios carefully.

## Migration Plan

1. Land schema/lib first: `libs/spark-board` learns to read/render `tasks.md`.
2. Re-point skills + re-mirror `.codex/skills/`.
3. Switch `create-spark` + templates to seed `docs/spark/`.
4. Move pack task-seeding + `spark check` to the active change's `tasks.md`.
5. Add `spark migrate` (or a documented manual recipe): read `.ai/product-spec.md` → `docs/spark/changes/migrated-<date>/proposal.md`; convert `.ai/board.md` tasks → that change's `tasks.md`; lift `.ai/ux-theme.md` → `docs/spark/design.md`; then delete `.ai/`.
6. Update `AGENTS.md`, `CLAUDE.md`, `docs/pack-spec.md`, `README.md`.

## Open Questions

- Keep the change-level technical file named `design.md` (path-disambiguated) or rename it (e.g. `tech-design.md`) to remove any overlap with the product-level visual `design.md`?
- Should `spark migrate` be built in this change, or is a documented manual recipe enough for v1 (few in-flight projects)?
- Do pack-seeded tasks land in the *currently active* change's `tasks.md`, or in a dedicated `changes/pack-install-<date>/` so an in-progress feature change stays clean? (Leaning: a dedicated pack-install change.)
