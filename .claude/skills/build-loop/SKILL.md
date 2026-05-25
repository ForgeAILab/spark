---
name: build-loop
description: The live build-test-iterate cycle that converges on the spec. Once a change is approved, it keeps the dev server running and, for each `tasks.md` item, implements the work, tests it against its linked EARS `#### Scenario` (WHEN/THEN), updates the task's inline status, and loops until the change's scenarios pass — then shows the live URL and the build-status view. Use when the user says "build it", "run it and let me see", "ship the next batch", or "let's iterate". Do NOT use before `/board-review` approves the change — run `/start` to find the right gate. To turn live-preview feedback into tasks, use `/capture-feedback`.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Skill: build-loop

## Goal

Make execution feel like Manus's visible production line, with the spec as the
finish line: the app is running, one batch of work lands at a time, each task is
verified against its acceptance scenario, and after each batch the user sees the
live result and decides what happens next. This skill conducts the existing
execution and evaluation skills — it does not replace them or invent build logic.

## Recommended model

Sonnet 4.6 / GPT-5 family to drive the loop and routine tasks. Escalate the
per-task work to Opus 4.7 / GPT-5.5 when a task is high-risk (auth, payments,
migrations, security) — both build and review.

## Inputs

Read these from the active `docs/spark/changes/<id>-YYYY-MM-DD/` (required):

- `tasks.md` — the batch to build and each task's inline status
- `proposal.md` and the change's `specs/<capability>/spec.md` — the EARS
  `#### Scenario` WHEN/THEN steps each task must satisfy (the goal)
- `docs/spark/design.md` if the batch is user-facing (visual direction)

If the change is not approved, stop and route to `/start`. Approval is owned by
`/board-review`, never by this skill. The stack should already be stood up by
`/scaffold` (packs installed, app boots); if it isn't, route to `/scaffold` first.

## Rules

- **Respect every gate.** Only build tasks inside an approved change. Never
  approve a change or mark a task executable yourself.
- **The scenario is the definition of done.** A task linked to a `#### Scenario`
  is `[x]` only when its WHEN/THEN steps actually pass; otherwise leave it `[~]`
  or annotate `Blocked: <failing step>`.
- **One batch at a time.** Build the current parallel-safe batch, show the result,
  and wait for the user before the next batch.
- **Delegate, don't reinvent.** Use the real skills for each step (below). This
  skill only sequences them, tests against scenarios, and renders status.
- **`tasks.md` is the only state.** Update status inline (`[ ]`→`[~]`→`[x]`); never
  create a separate board file. Trust git over claims; reconcile with `/sync-board`.
- **Stay in scope.** Each task stays inside its declared files. New work the user
  asks for mid-loop goes through `/capture-feedback`, not silent edits.
- **Stop on a blocker.** If a task blocks, mark it `Blocked: <reason>`, render
  status, and ask the user — do not thrash.

## Workflow

1. **Pick the batch.** If none is chosen, run `/parallel-execution`; otherwise take
   the next parallel-safe set via `/next-task`. Mark each task `[~]` as it starts.
2. **Start the preview.** Ensure the dev server is up — prefer the built-in `/run`
   skill, else `bun dev` as a background task. Capture the local URL.
3. **Build each task:** `/implementation-brief <id>` → `/execute-task <id>` →
   `/code-review <id>` → `/qa-verify` for user-facing tasks.
4. **Verify against the scenario.** Check the result against the task's linked
   `#### Scenario` WHEN/THEN steps. Mark `[x]` only if they pass; else `[~]` /
   `Blocked:` with the failing step noted.
5. **Reconcile** with `/sync-board` so `tasks.md` matches git reality.
6. **Show the result:** render the build-status view (from `/start`) and the live
   URL, and summarize what changed this batch.
7. **Hand the wheel back.** Ask the user to approve, change, or add. Route any
   plain-English feedback through `/capture-feedback`, then loop from step 1.
8. Stop when the user stops, or when every task in the change is `[x]` and each
   linked scenario passes — then report the change **ready to archive**.

## Output format

After each batch:

```md
## <Project> — batch <n> done

### Built this batch
- `<id>` <title> — <scenario passed ✅ | needs changes | Blocked> (<one line>)

### Live preview
http://localhost:<port> — <what to look at>

<build-status view from /start>

### Your move
- "looks good" → next batch
- "change <x>" / "add <y>" / "<z> is broken" → I'll capture it as a task
- "stop" → I'll leave `tasks.md` synced and the server note here
```

When the last task is `[x]` and all scenarios pass, replace "Your move" with a
note that the change is ready to archive (fold its EARS deltas into
`docs/spark/specs/`).
