# Reference: Adopt an existing project

The conductor (`/start`) follows this in **adopt** mode — a real codebase with no spark
workspace. It is a **one-time bootstrap** that reverse-engineers the baseline so the project
lands where a shipped MVP sits, then hands off to **iteration**. Inspired by OpenSpec's
`init` in an existing repo: drop a workspace in, grow specs per capability as changes touch
them, rather than back-filling the whole system. Model: Opus 4.7 / GPT-5.5 (inferring a
product's north star from code is judgement work).

## Goal

Produce the baseline a shipped MVP would already have — `docs/spark/project.md` (inferred
north star + conventions + the detected stack) and `docs/spark/specs/capabilities.md` (a
one-line capability map) — and record the existing stack as already-installed, so the very
next request is a normal iteration on the light route. **Read-only until the gate:** you
never write app code, run `/scaffold`, or migrate the stack here.

## When to run (adopt mode only)

Run this when `/start` detects an existing project: substantive product code (real
dependencies plus `src/` / `app/` / `server/`) but **no** spark workspace (no real
`project.md`, no shipped `specs/` or `specs/capabilities.md`). Detection is **conservative**:

- A bare `create-spark` scaffold — files but no product code — is a **cold start**, not an
  adopt. When in doubt, the single gate below lets the founder send it to cold start.
- A repo that already has a spark workspace is an **iteration**, never an adopt.

## Steps

1. **Explore (read-only).** Reuse `references/research.md` against the codebase. Capture, with
   `path:line` evidence: the runtime/stack, the scaffold template, project conventions
   (structure, naming, test setup), the apparent product purpose, and the **capability
   surface** (auth? payments? db? the discrete things the app does).
2. **Infer the north star → `project.md`.** Write vision, primary user, core loop, and
   non-goals as your best read of the *existing* product — clearly flagged as inferred for the
   founder to correct. Add a conventions section and the **detected** stack. Do not invent
   ambition the code does not show.
3. **Map capabilities → `specs/capabilities.md`.** One line per capability, **no scenarios**.
   This is the index the iteration router reads; it counts as shipped truth.
4. **Record the stack.** Write the detected scaffold template and present packs into
   `spark.config.json` / `.spark/state.json` so the inherited stack reads as already-installed
   and `/scaffold` is not re-run.
5. **Gate (the one stop).** Present the inferred north star + conventions + capability map and
   ask the founder to confirm spark should adopt this codebase. If they say it is actually a
   fresh start, discard the drafts and fall to **cold start**.
6. **Hand off.** Once confirmed, switch to **iteration** and handle the founder's actual
   request via the light-route table. The first change to touch a mapped-only capability
   writes that capability's `spec.md` from current behavior (see `references/spec.md`).

## Rules

- **Detect, don't choose.** The stack is whatever the code already uses — record it, never
  re-pick or "upgrade" it. That would be a scope-change, escalated through iteration later.
- **Infer, then flag the inference.** The north star is your reading of someone else's
  product; present it as a draft the founder ratifies, not as settled truth.
- **Never back-fill full specs.** `capabilities.md` is a map. A capability's full EARS
  `spec.md` is written lazily by the first iteration that touches it — keeping specs honest
  (written when someone actually reads the code) and the bootstrap cheap.
- **Read-only until the gate.** No app edits, no `/scaffold`, no migrations. Adopt only writes
  inside `docs/spark/` and the config/state files.
- **Bounded.** Map the capability surface; do not audit every file or document behavior nobody
  is changing.

## Output format

`docs/spark/project.md` (inferred — mark it so):

```md
# <Product> — north star

> Adopted <date> from the existing codebase. Inferred from code; correct anything wrong.

## Vision
<one paragraph — what the product is, read from the code>

## User & core loop
<who it is for and the main loop the code supports>

## Non-goals
<boundaries the code implies (or "none observed — confirm")>

## Conventions
<structure, naming, test setup, anything an iteration must respect — with `path:line`>

## Stack (detected)
<runtime, framework, scaffold template, key deps — recorded, not chosen>
```

`docs/spark/specs/capabilities.md` (the map — no scenarios):

```md
# Capabilities

Adopt-time map of what this codebase already does. Full EARS `spec.md` for a capability is
written the first time an iteration touches it.

- **<capability>** — <one line of current behavior> (`<path>`)
```

When the gate is confirmed, record the baseline, then hand control back to `/start`. Do not
name the next phase — the order lives in `/start`.
