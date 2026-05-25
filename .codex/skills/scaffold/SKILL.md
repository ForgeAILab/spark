---
name: scaffold
description: Stand up the approved change's stack — read its `design.md` Pack plan, install the packs with `spark add`, and verify the app boots. The bridge between approval and building. Use right after `/board-review` approves a change, when the user says "set it up", "install the stack", "scaffold it", or before the first `/build-loop`. Do NOT choose packs here (that's `/architecture-cutline` / `/pack-resolve`) or build feature code (that's `/build-loop`).
# Generated from .claude/skills/scaffold/SKILL.md — DO NOT EDIT directly
---

# Skill: scaffold

## Goal

Turn an approved plan into a running, capability-complete project before any feature
work starts. The template scaffold already exists (created by `create-spark`); this
skill stands up the **capabilities** the plan calls for — it runs the change's Pack
plan, confirms the app still boots, and hands a ready project to `/build-loop`. It
conducts existing skills; it does not invent install logic or write feature code.

## Recommended model

Sonnet 4.6 / GPT-5 family — this is orchestration, not design. Escalate to Opus 4.7 /
GPT-5.5 only if the Pack plan is ambiguous or a pack install touches auth/payments.

## Inputs

Read these (required):

- the active `docs/spark/changes/<id>-YYYY-MM-DD/design.md` — its `## Pack plan` (the
  exact `spark add …` line and the chosen scaffold template)
- `spark.config.json` — the template this project was scaffolded with
- `.spark/state.json` if present — packs already installed (so this is idempotent)

If the change is not approved (no `/board-review` approval banner in `tasks.md`), stop
and route to `/start`. If there is no `## Pack plan`, route to `/architecture-cutline`.

## Rules

- **Only after approval.** Do not stand up a stack for an unapproved change.
- **Install via the plan, not by hand.** Run the Pack plan through `/pack-add` (which
  dry-runs, shows the plan, installs, and reconciles `tasks.md`). Never hand-edit
  dependencies or copy capability code yourself.
- **Confirm the template fits.** Compare `design.md`'s chosen template against
  `spark.config.json`. If they differ (e.g. the plan needs SSR but the project is
  `vite-react`), **flag it** and ask the user — re-scaffolding is destructive; do not
  silently re-template.
- **Verify it boots.** After installing, run the app (prefer `/run`, else `bun dev`)
  and confirm it starts without missing-env prompts. A clean type-check is not enough.
- **No feature code.** Building screens/logic is `/build-loop`. This skill stops once
  the stack is installed and the app boots.
- **Idempotent.** Re-running with everything already installed is a no-op that just
  re-verifies the boot.

## Workflow

1. Read the active change's `design.md` Pack plan and `spark.config.json`.
2. If no Pack plan exists, route to `/architecture-cutline`; if packs aren't chosen,
   `/pack-resolve`.
3. Check the template matches the plan; flag a mismatch and stop if so.
4. Install the stack via `/pack-add` (runs the `spark add …` from the plan).
5. Run `spark check` to confirm no drift (missing files / env / tasks).
6. Start the dev server and confirm it boots; capture the local URL.
7. Render the build-status view (from `/start`) and hand off to `/build-loop`.

## Output format

```md
## Stack scaffolded — <change id>

### Installed
- `spark add <packs>` → <pack-1>, <pack-2>, … (or "already installed")

### Checks
- `spark check`: OK | drift: <…>
- Template: `<template>` matches plan ✅ | ⚠ plan wants `<other>` — re-scaffold? (y/n)
- Boot: http://localhost:<port> ✅ | failed: <reason>

<build-status view from /start>

### Next
- Booted and clean → run `/build-loop` to build the first batch.
- Mismatch or boot failure above needs a decision first.
```
