---
created_at: 2026-05-26T18:00:00Z
updated_at: 2026-05-26T18:00:00Z
completed_at:
---

> Sections 1–2 are implemented this session. Sections 3–4 (truth merge at archive, manual
> human-in-the-loop verification) remain. Truth specs under `docs/spec/specs/agent-workflow/`
> are merged only at archive time.

## 1. Conductor + references

- [x] 1.1 `start/SKILL.md`: added **Adopt** to the entry-modes section (now "Three entry modes" — existing code, no spark workspace; conservative, confirm before adopting), added the **adopt-bootstrap routing table**, widened iteration detection so `project.md` north star + `specs/capabilities.md` counts as shipped truth, added `capabilities.md` to Inputs + `references/adopt.md` to the phase-reference list, and noted the adopt gate render in Output format.
- [x] 1.2 `start/references/adopt.md` (new): the bootstrap procedure — explore (read-only) → infer north star + conventions + detected stack into `project.md` → write `specs/capabilities.md` (one line per capability, no scenarios) → record template + packs in `spark.config.json` / `.spark/state.json` → stop at one confirmation gate. Bounded; never back-fills full specs; never re-scaffolds.
- [x] 1.3 `start/references/spec.md`: added the "first touch of an adopted (mapped-only) capability = capture current behavior as a `spec.md` before recording the delta" rule.
- [x] 1.4 `AGENTS.md`: replaced the two-mode framing with three entry modes (cold start / adopt / iteration); added `capabilities.md` to the source-of-truth artifacts; noted adopt is a one-time bootstrap into iteration.

## 2. Mirror + docs

- [x] 2.1 `bun run scripts/sync-skills.ts` mirrored `start/references/adopt.md` (and the edited `SKILL.md` / `spec.md`) into `.codex/skills/start/`; `bun run check:skills` green (17 skills in sync).
- [x] 2.2 `README.md` Operating model: the conductor bullet now describes all three modes, including adopt for existing projects.

## 3. Truth (at archive)

- [ ] 3.1 Merge the `agent-workflow` deltas (Conductor Detects and Adopts an Existing Project; Adopted Workspace Behaves as an Iteration) into `docs/spec/specs/agent-workflow/spec.md`.

## 4. Verification (manual / human-in-the-loop — deferred to a live session)

- [ ] 4.1 Run `/start` against a fixture with real source but no `docs/spark/`: confirm it detects an existing project, confirms before adopting, and produces `project.md` + `specs/capabilities.md` (no per-capability `spec.md`), recording the stack as installed.
- [ ] 4.2 Run `/start` against a bare `create-spark` scaffold: confirm it is not silently adopted.
- [ ] 4.3 Confirm a post-adopt "change X" request takes the light route, and that the first change to a mapped-only capability writes its `spec.md` from current behavior before recording the delta.
