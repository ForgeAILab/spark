---
created_at: 2026-05-24T23:39:11Z
updated_at: 2026-05-25T00:10:00Z
completed_at:
---

> **Apply-time decisions (2026-05-25).** Grounding showed no `libs/` dir exists; the
> board logic lives in `packages/spark/src/{internal,io}/board.ts` (+ `commands/check.ts`,
> `commands/add.ts`). Open questions resolved: (a) keep change-level `design.md` name,
> path-disambiguated; (b) `spark migrate` **Cut** for v1 — manual recipe documented instead
> (pre-1.0, ~no in-flight `.ai/` projects); (c) pack tasks seed into a dedicated
> `changes/pack-install-<date>/tasks.md`. `create-spark` needs no seeding-code change —
> `copyTemplate` is generic, so the `.ai/`→`docs/spark/` swap is template-only.

## 1. Board module → tasks.md (`packages/spark/src/{internal,io}/board.ts`)

- [x] 1.1 Rework the board module to parse `tasks.md` (frontmatter, `## N. Section`, `- [ ] N.M Title` / `- [ ] ID: Title` with inline status `[ ]`/`[~]`/`[x]`, `[!]`/`[-]` markers + `Blocked:`/`Cut:` inline annotations, sub-bullet metadata) across `docs/spark/changes/*/`.
- [x] 1.2 Add `renderBuildStatus()` that produces the kanban / build-status view from parsed tasks (no stored board file).
- [x] 1.3 Unit tests: parse round-trip, both id styles, inline annotations, multi-change aggregation, render snapshot, idempotent seeding (67 spark tests pass).

## 2. docs/spark workspace seed

- [x] 2.1 Author the `docs/spark/` seed: `project.md`, `design.md` (visual), `AGENTS.md`, empty `specs/`, empty `changes/` (with `.gitkeep`).
- [x] 2.2 Write `docs/spark/AGENTS.md` mirroring `docs/spec/AGENTS.md` (delta rules, stages, status flow) but founder-facing.
- [x] 2.3 Replace `.ai/` with the `docs/spark/` seed in `templates/nextjs/` and `templates/vite-react/` (incl. root `AGENTS.md`/`CLAUDE.md`/`README.md`).

## 3. create-spark + CLI

- [x] 3.1 `packages/create-spark`: template-driven copy seeds `docs/spark/` (no `.ai/` in code; idempotency fixture de-`.ai`-ed; tests pass).
- [x] 3.2 `spark check` audits seeded tasks via `missingBoardTasks` scanning `docs/spark/changes/*/tasks.md` (not `.ai/board.md`).
- [x] 3.3 Pack task-seeding writes to `docs/spark/changes/pack-install-<date>/tasks.md` with `## <pack>` sections, `Status: Clarifying` + `requires_pack:`; `add.ts` records that path.
- [x] 3.4 ~~`spark migrate`~~ **Cut** for v1 — manual recipe documented in `docs/pack-spec.md`/README instead.

## 4. Skills re-point

- [x] 4.1 Revise `start`, `build-loop`, `capture-feedback` to the `docs/spark/` model (start = conductor that drafts proposal + drives to approval; build-loop = converge on EARS scenarios; capture-feedback = tasks.md or new change proposal).
- [x] 4.2 Re-point planning skills (`mvp-grill`, `mvp-spec`, `architecture-cutline`, `ux-theme`, `mvp-board`, `board-review`) to author `proposal.md` / `design.md` / `docs/spark/design.md` / `specs/` / `tasks.md`.
- [x] 4.3 Re-point execution/eval skills (`implementation-brief`, `execute-task`, `code-review`, `qa-verify`, `sync-board`, `next-task`, `parallel-execution`, `risk-check`) to `tasks.md` + `specs/`.
- [x] 4.4 Re-point pack-bundled skills + `pack.toml` examples (`packs/payments-stripe`, `packs/ai-anthropic`, `packs/example`, `packs/README.md`).
- [x] 4.5 `bun run scripts/sync-skills.ts` re-mirrored `.codex/skills/` (21 skills); `bun run check:skills` green.

## 5. Docs

- [x] 5.1 Update root `AGENTS.md` (source-of-truth list, workflow phases, skill table + new rows) to `docs/spark/`; keep the `docs/spec/` SPEC block for this repo's own dev.
- [x] 5.2 Update `README.md` quickstart + operating model, and the template `CLAUDE.md` files, to `docs/spark/`. (Also updated `docs/skill-authoring.md`.)
- [x] 5.3 Update `docs/pack-spec.md` `[tasks]` seeding to the `docs/spark/changes/pack-install-YYYY-MM-DD/tasks.md` target.
- [x] 5.4 Update `docs/spec/project.md` Conventions (workspace is source of truth; rendered build-status; note this repo uses `docs/spec/`).

## 6. Verification

- [x] 6.1 `bun test packages scripts` green — 82 pass / 0 fail (no `libs/` exists in this repo).
- [x] 6.2 `bun run check:skills` green (21 skills in sync).
- [x] 6.3 Smoke: local `create-spark … --template nextjs --no-packs --yes` → `docs/spark/` present, no `.ai/`, 21 skills mirrored, scaffold files intact. (`bun dev` boot unchanged by this change — not re-run.)
- [ ] 6.4 Manual: a full `/start` → approve → `/build-loop` cycle on a one-feature demo. Interactive (human-in-the-loop) acceptance test — deferred to a live session; all skills/runtime are in place for it.
- [x] 6.5 Grep: no `.ai/` references remain in skills, templates, libs, or docs (outside `docs/spec/specs/` truth — those merge at archive — and intentional "there is no `.ai/`" mentions).
