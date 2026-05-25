---
name: risk-check
description: Detect whether the project is drifting — scope creep, architecture creep, hidden dependencies, missing tests, unclear tasks, plus stale hybrid-pack helper versions (more than two minor versions behind the latest published). Use every few sessions, when the user says "are we on track?", "is this getting out of hand?", or before a demo. The anti-overthinking and anti-feature-creep skill.
# Generated from .claude/skills/risk-check/SKILL.md — DO NOT EDIT directly
---

# Skill: risk-check

## Goal

Be the brake. Compare the current state of the project to the `docs/spark/` workspace, and call out where reality is drifting. Recommend concrete cuts.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these (required):

- `docs/spark/project.md` — product north star and non-goals
- `docs/spark/specs/<capability>/spec.md` — EARS truth specs
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/design.md` — technical "how"
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/tasks.md`
- `.spark/state.json` if it exists
- `packs/*/pack.toml` if pack state exists and the registry is available

Sample reality:

- `git log --oneline -30`
- top-level directory listing
- list of dependencies in `package.json` / `pyproject.toml` / equivalent

## Rules

- Compare **what is in the code now** to **what the workspace says**. Highlight gaps in both directions: missing must-haves, plus things built that the workspace did not ask for.
- Treat the non-goals in `project.md` and any `proposal.md` as a checklist of things that should NOT be present in code. Violations are creep, not features.
- Recommend cuts, not additions. The default fix is "remove or defer," not "build more."
- Distinguish **drift** (planned scope grew quietly) from **discovery** (new task properly added to `tasks.md`). Discovery is fine; silent drift is not.
- For pack-level drift, inspect `.spark/state.json` when present. For each installed pack, determine its provided capabilities from state or from `packs/<name>/pack.toml`; if none of those capabilities are referenced anywhere in the `docs/spark/` workspace, flag it as drift.
- The pack-level drift recommendation is exactly: **justify it by updating the workspace, or revert the pack-install commit via git**. Do not suggest a CLI removal command; there is no `spark remove`.
- For each installed pack whose manifest declares `[runtime_package]` (hybrid pack), inspect the consumer project's `package.json` (`dependencies` + `devDependencies`) for the named helper. Compare the installed version against the latest published version on the npm registry (use `bun pm view <pkg> version` or `npm view <pkg> version` via Bash). If the installed version is more than two minor versions behind the latest, flag it under "Stale helper". A `file:` specifier counts as "local dev link" and is NOT stale.

## Checklist

- **Scope creep** — features in code that are not in `docs/spark/project.md` MVP feature list, or are in Non-goals.
- **Architecture creep** — services / dependencies / abstractions beyond what the active change's `design.md` declared.
- **Pack-level drift** — installed packs whose provided capabilities are not referenced anywhere in the `docs/spark/` workspace.
- **Stale helper** — hybrid packs whose helper package is more than two minor versions behind the latest on npm.
- **Unclear tasks** — open `tasks.md` tasks without observable acceptance criteria.
- **Missing tests / verification** — tasks marked `[x]` / Validated with no run command or no review.
- **Hidden dependencies** — packages added not justified by a task or decision.
- **Stalled tasks** — tasks `[~]` In progress for more than ~2 sessions with no commits.

## Output format

```md
## Pack-level drift
- no drift detected
- <pack-name>: provides <capability tag(s)>; none are referenced in the `docs/spark/` workspace — **recommend: justify by updating the workspace, or revert the pack-install commit via git**

## Stale helper
- no stale helpers
- <pack-name>: helper `<helper-package>` installed at <installed-version>, latest is <latest-version> — **recommend: `bun update <helper-package>`**

## Risk check

### Scope creep
- <thing built / in progress> — not in `project.md` / in non-goals — **recommend: cut | defer | justify in `proposal.md`**

### Architecture creep
- <new service / dep / abstraction> — **recommend: revert | document in the active change's `design.md`**

### Unclear tasks
- <TASK-ID>: criteria are vague — **recommend: rewrite or send to `/board-review`**

### Hidden dependencies
- <package> added in <commit> — justification: <none | <task>>

### Stalled tasks
- <TASK-ID>: in progress since <when> — **recommend: split | unblock | drop**

### Summary
- Drift severity: low | medium | high
- Suggested next action: <one line>
```
