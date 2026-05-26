---
created_at: 2026-05-26T18:00:00Z
updated_at: 2026-05-26T18:00:00Z
---

## Why

`/start` reads its situation from `docs/spark/` and resolves to one of two modes — **cold
start** (no real `project.md`, no shipped `specs/`) or **iteration** (a north star plus
shipped specs already exist). An **existing codebase that spark did not build** matches
neither and falls through to cold start, which is wrong twice over: it re-grills a product
that already exists, and it drives `/scaffold` to stand up a stack that is already running.
The stack and the product are *given* — they are just not written down in spark's language
yet.

Both spec-driven tools spark draws from treat brownfield onboarding as a first-class step:
OpenSpec's `init` drops a workspace into an existing repo and grows specs per capability as
changes touch them, rather than back-filling the whole system. spark has no equivalent path,
so a founder with a real app cannot get onto the board-driven loop without pretending their
project is a blank idea.

This change adds an auto-detected **adopt** mode: a one-time bootstrap that reverse-engineers
the baseline workspace from existing code, then hands off to the iteration light route that
already exists. It preserves spark's defining property — one founder-facing approval gate —
and, like the other two modes, is inferred from workspace state so the founder never names a
mode or runs a new command.

## What Changes

- **Adopt as a third entry mode.** `/start` detects an existing project — substantive source
  code present, but no spark workspace (no real `project.md`, no shipped `specs/` or
  `specs/capabilities.md`) — and runs an **adopt bootstrap** instead of cold start. Detection
  is **conservative**: it confirms with the founder before adopting, so a freshly
  `create-spark`'d scaffold (files but no product yet) is never mistaken for a brownfield
  app.
- **Lazy capture.** Adopt explores the codebase (reusing `references/research.md`), then
  writes `project.md` (inferred north star + conventions + the *detected* stack) and
  `specs/capabilities.md` — a one-line index of detected capabilities with **no scenarios**.
  It MUST NOT back-fill full EARS specs; a capability's `spec.md` is written lazily the first
  time an iteration touches it, capturing current behavior alongside the change.
- **Stack is recorded, not re-stood-up.** Adopt records the detected scaffold template and
  present packs in `spark.config.json` / `.spark/state.json`, so the inherited stack reads as
  already-installed and `/scaffold` is not re-run. Adopt stops at **exactly one gate**: the
  founder confirms the inferred north star + conventions.
- **Adopted workspace is an iteration.** After adoption, `project.md` north star +
  `specs/capabilities.md` count as shipped truth, so the next request resolves to **iteration**
  and takes the light route — no special post-adopt mode.

## Impact

- **Affected specs:** `agent-workflow`
- **Affected code:**
  - `.claude/skills/start/SKILL.md` (Adopt added to the entry-modes section, an adopt-bootstrap
    routing table, iteration detection widened to accept `specs/capabilities.md` as shipped
    truth)
  - `.claude/skills/start/references/adopt.md` (new phase guide: explore → infer north star +
    conventions → capability map → record stack → one gate)
  - `.claude/skills/start/references/spec.md` (the "first delta on an un-specced capability is
    a create-from-current-behavior" note)
  - `AGENTS.md` (three entry modes instead of two)
  - `.codex/skills/start/**` re-mirrored via `scripts/sync-skills.ts`
  - `README.md` (Operating model)
- **Non-goals:** no new top-level command or skill (the conductor stays the single front
  door); adopt never back-fills full specs for untouched capabilities; adopt never re-stands-up
  or migrates the existing stack; the approval gate is never relaxed or skipped.
