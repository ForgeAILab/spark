---
name: pack-add
description: Safely install feature packs by dry-running `spark add`, showing the plan, waiting for explicit approval, running the real install, and reconciling `tasks.md`. Use when the user asks to add one or more packs.
allowed-tools:
  - Read
  - Bash
---

# Skill: pack-add

## Goal

Install packs through the workspace-aware workflow: dry-run first, show the plan, get explicit confirmation, install, then reconcile `tasks.md` so seeded tasks appear.

## Recommended model

Sonnet 4.6 or GPT-5 family executor.

## Inputs

Read these if present:

- `spark.config.json`
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/design.md`
- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/tasks.md`
- `.spark/state.json`

The user must provide one or more pack names. If no pack is named, stop and ask for the pack list or recommend `/pack-resolve`.

## Rules

- Always run `spark add <pack...> --dry-run` before any real install.
- Present the dry-run diff or plan to the user in compact form: packs, dependencies, files, env vars, skills, and board tasks.
- Wait for explicit confirmation before installing. Accept only clear approval such as "yes", "approved", or "install".
- If the dry-run fails, stop. Do not attempt the real install.
- If the user declines or gives an ambiguous answer, stop with no filesystem changes.
- On approval, run `spark add <pack...>` with the same pack arguments as the dry-run.
- After a successful install, invoke `/sync-board` so seeded tasks are reflected in the active change's `tasks.md`.
- Do not mark any seeded task `Approved for execution` or `Validated`; board-review and review skills own those transitions.

## Workflow

1. Confirm the pack arguments exactly as provided.
2. Run `spark add <pack...> --dry-run`.
3. Summarize the plan and ask the user for explicit approval.
4. If approved, run `spark add <pack...>`.
5. If install succeeds, run `/sync-board`.
6. Report the installed packs, changed files summary, and board sync result.

## Output format

Before approval:

- Dry-run command
- Planned pack order
- Files/env/skills/tasks summary
- Confirmation question

After install:

- Install command
- Result
- `/sync-board` result
- Any follow-up tasks or blockers
