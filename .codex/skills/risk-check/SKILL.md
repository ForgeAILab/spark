---
name: risk-check
description: Detect whether the project is drifting — scope creep, architecture creep, hidden dependencies, missing tests, unclear tasks. Use every few sessions, when the user says "are we on track?", "is this getting out of hand?", or before a demo. The anti-overthinking and anti-feature-creep skill.
# Generated from .claude/skills/risk-check/SKILL.md — DO NOT EDIT directly
---

# Skill: risk-check

## Goal

Be the brake. Compare the current state of the project to the spec and architecture, and call out where reality is drifting. Recommend concrete cuts.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these (required):

- `.ai/product-spec.md`
- `.ai/architecture.md`
- `.ai/board.md`
- `.ai/decision-log.md` if it exists
- `.app-skills/state.json` if it exists
- `packs/*/pack.toml` if pack state exists and the registry is available

Sample reality:

- `git log --oneline -30`
- top-level directory listing
- list of dependencies in `package.json` / `pyproject.toml` / equivalent

## Rules

- Compare **what is in the code now** to **what the spec said**. Highlight gaps in both directions: missing must-haves, plus things built that the spec did not ask for.
- Treat the spec's non-goals list as a checklist of things that should NOT be present in code. Violations are creep, not features.
- Recommend cuts, not additions. The default fix is "remove or defer," not "build more."
- Distinguish **drift** (planned scope grew quietly) from **discovery** (new task properly added to the board). Discovery is fine; silent drift is not.
- For pack-level drift, inspect `.app-skills/state.json` when present. For each installed pack, determine its provided capabilities from state or from `packs/<name>/pack.toml`; if none of those capabilities are referenced in `.ai/product-spec.md` or `.ai/architecture.md`, flag it as drift.
- The pack-level drift recommendation is exactly: **review or revert the pack-install commit via git**. Do not suggest a CLI removal command; v1 has no pack uninstall flow.

## Checklist

- **Scope creep** — features in code that are not in `MVP feature list`, or are in `Non-goals`.
- **Architecture creep** — services / dependencies / abstractions beyond what `architecture.md` declared.
- **Pack-level drift** — installed packs whose provided capabilities are not justified by the spec or architecture.
- **Unclear tasks** — open board tasks without observable acceptance criteria.
- **Missing tests / verification** — tasks marked `Validated` with no run command or no review.
- **Hidden dependencies** — packages added not justified by a task or decision.
- **Stalled tasks** — tasks in `In progress` for more than ~2 sessions with no commits.

## Output format

```md
## Pack-level drift
- no drift detected
- <pack-name>: provides <capability tag(s)>; none are referenced in `.ai/product-spec.md` or `.ai/architecture.md` — **recommend: review or revert the pack-install commit via git**

## Risk check

### Scope creep
- <thing built / in progress> — not in spec / in non-goals — **recommend: cut | defer | keep with decision log entry**

### Architecture creep
- <new service / dep / abstraction> — **recommend: revert | document in architecture.md**

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
