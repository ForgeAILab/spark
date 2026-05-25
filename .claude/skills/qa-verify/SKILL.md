---
name: qa-verify
description: Verify the app actually runs and the feature works end-to-end, not just that code compiles. Use after a feature batch lands, before a demo, when the user says "does this actually work?", "run it and check", or before flipping a task to Validated / `[x]`. Do NOT use as a substitute for `/code-review` — they cover different failure modes.
allowed-tools:
  - Read
  - Bash
  - Edit
---

# Skill: qa-verify

## Goal

Boot the app, click through the real user flow, and confirm the acceptance criteria hold when humans actually use the product. Type-checks and unit tests pass != feature works.

## Recommended model

Sonnet 4.6. This is execution, not judgment.

## Inputs

Read these (required):

- The active change's `docs/spark/changes/<id>-YYYY-MM-DD/tasks.md` — task(s) being verified
- `docs/spark/project.md` — the core user journey

Read if useful:

- `docs/spark/design.md` for empty / loading / error patterns
- `README.md` / `package.json` for the run command

## Rules

- Always run the app. If you cannot launch it, report that explicitly — do not claim verification from reading code.
- Walk the **core user journey from `docs/spark/project.md`**, not just the changed feature. Regressions in adjacent flows count.
- Check empty / loading / error / mobile states for every screen touched. MVPs feel broken at the seams, not the happy path.
- Capture exact commands and outputs so the user can reproduce.
- Use a real browser or device when relevant (Playwright MCP if available). Curl-ing an API endpoint is not UI verification.

## Workflow

1. Find the run command (project README, `package.json` scripts, or ask).
2. Boot the app. Note the URL.
3. Walk the core journey step by step from the spec.
4. Re-walk the specific feature(s) from the task(s).
5. Probe empty / loading / error / mobile.
6. Write the report.

## Output format

```md
## QA verification — <TASK-ID(s)> / <feature name>

### Boot
- Command: `<cmd>`
- Result: app running at <url> | failed (<reason>)

### Core user journey (from project.md)
- [x|✗] Step 1: <description> — <observation>
- [x|✗] Step 2: ...

### Feature-specific checks
- [x|✗] <acceptance criterion> — <observation>

### Edge states
- Empty state: <ok | broken | missing>
- Loading state: <ok | broken | missing>
- Error state: <ok | broken | missing>
- Mobile / narrow viewport: <ok | broken>

### Broken flows discovered
- <one-line description> — <repro steps>

### Recommended tasks.md update
- <TASK-ID>: `[~]` Needs review → `[x]` Validated | `[~]` Needs review → `[~]` In progress
- New tasks to add: <list or none>
```
