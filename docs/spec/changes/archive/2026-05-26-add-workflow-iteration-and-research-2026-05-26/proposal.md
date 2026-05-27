---
created_at: 2026-05-26T12:00:00Z
updated_at: 2026-05-26T12:00:00Z
---

## Why

`/start` today encodes a single **cold-start** pipeline: every request — even a small
post-MVP tweak — is grilled, then run through proposal → architecture → visual → specs →
tasks before the gate. A founder iterating on a shipped MVP gets re-grilled and
re-architected for changes that only tune already-grilled scope on a fixed stack. The grill
exists to lock scope once; replaying it on iteration N is friction, not rigor.

Separately, both spec-driven tools spark draws from have an **investigation step** before a
spec is committed — OpenSpec's `explore` (investigate the existing codebase) and spec-kit's
Phase 0 `research.md` (resolve technical unknowns). spark jumps from grill straight to the
proposal, so prior art, rapidly-changing tech choices, and existing-code context get guessed
at instead of checked.

This change adds two capabilities to the conductor: an auto-detected **light route** for
modifications, and a **conditional explore/research** phase. Both keep spark's defining
property — one founder-facing approval gate — and both are inferred from workspace state so
the founder never has to name a mode or a command.

## What Changes

- **Iteration light route.** `/start` detects cold start vs iteration from `docs/spark/`
  state (a north star in `project.md` plus shipped `specs/` ⇒ iteration). For
  bug/polish/feature on a shipped MVP it authors `proposal.md` + the open EARS `specs/`
  deltas + `tasks.md` and stops once at `/board-review` — **no re-grill, no technical
  `design.md`** (the stack is inherited). It escalates to the full chain only on a
  scope-change, a non-goal breach, or a large-scale change the user explicitly asks for.
- **Conditional explore/research.** A new `references/research.md` phase produces a bounded
  `research.md` in the active change folder, run **only** when a real unknown blocks the
  proposal/architecture (prior art, a rapidly-changing tech/API choice, or existing
  code/specs the agent has not read). It is skipped when nothing is genuinely unknown, and
  it never picks the stack or writes tasks.
- **Already landed in the skills this session** (see tasks banner): `start/SKILL.md`,
  `start/references/research.md`, and root `AGENTS.md`. This change formalizes that behavior
  as `agent-workflow` truth, mirrors the new reference into `.codex/skills/`, and documents
  both in the README.

## Impact

- **Affected specs:** `agent-workflow`
- **Affected code:**
  - `.claude/skills/start/SKILL.md` (two-entry-modes section, light-route routing table,
    conditional research rows, `Research` status marker, design rule scoped to the full chain)
  - `.claude/skills/start/references/research.md` (new phase guide)
  - `AGENTS.md` (iteration-vs-cold-start section; research as a conditional sub-step of phase 1;
    `research.md` added to source-of-truth artifacts)
  - `.codex/skills/start/**` re-mirrored via `scripts/sync-skills.ts`
  - `README.md` (Operating model)
- **Process note:** the `.claude/skills` + `AGENTS.md` edits were made ahead of this proposal
  during a live design session. This change exists to bring truth, the Codex mirror, and the
  docs back in line with the repo's "specs first" contract — it does not introduce new
  unreviewed behavior beyond what the deltas below describe.
- **Non-goals:** no new top-level command or skill (the conductor stays the single front
  door); research is never made mandatory; the approval gate is never relaxed or skipped.
