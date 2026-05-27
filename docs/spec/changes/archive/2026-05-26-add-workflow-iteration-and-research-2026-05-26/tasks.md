---
created_at: 2026-05-26T12:00:00Z
updated_at: 2026-05-26T12:00:00Z
completed_at:
---

> **Note (2026-05-26).** The `.claude/skills` and `AGENTS.md` edits in section 1 were
> authored during the design session that produced this change, ahead of the proposal.
> Sections 2–4 (Codex mirror, README, truth merge, verification) are the outstanding work.
> Truth specs under `docs/spec/specs/agent-workflow/` are merged only at archive time.

## 1. Conductor + reference (landed this session)

- [x] 1.1 `start/SKILL.md`: add "Two entry modes" detection, the light-route routing table, conditional research rows in both tables, the `Research` pipeline marker (`n/a` when skipped), and scope the "Design is an unordered pair" rule to the full chain.
- [x] 1.2 `start/references/research.md`: author the conditional explore/research phase guide (Unknowns → Findings+Decisions → Codebase notes → Open questions; bounded; never picks stack or writes tasks).
- [x] 1.3 `AGENTS.md`: add the "Iteration vs cold start" section, the conditional research sub-step under phase 1 (no renumbering), and `research.md` in the source-of-truth artifact list.

## 2. Mirror + docs

- [x] 2.1 `bun run scripts/sync-skills.ts` mirrored `start/references/research.md` into `.codex/skills/start/references/`; `bun run check:skills` green (17 skills in sync).
- [x] 2.2 `README.md` Operating model: added a "One conductor, two modes" bullet noting the iteration light route and the conditional research phase.

## 3. Truth (at archive)

- [ ] 3.1 Merge the `agent-workflow` deltas (Conductor Detects Cold Start vs Iteration; Conductor Resolves Unknowns via Conditional Research) into `docs/spec/specs/agent-workflow/spec.md`.

## 4. Verification (manual / human-in-the-loop — deferred to a live session)

- [ ] 4.1 Walk a modification request through `/start` against a fixture with shipped `specs/`: confirm it takes the light route (no re-grill, no technical `design.md`) and stops at exactly one gate.
- [ ] 4.2 Confirm the research phase fires only on a named unknown and renders `Research n/a` otherwise.
- [ ] 4.3 Confirm a scope-change / non-goal-breach request escalates to the full chain.
