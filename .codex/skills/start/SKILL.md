---
name: start
description: The front door for a spark project. Understands the user's idea, then builds the validatable planning docs in the `docs/spark/` workspace — drafts the active change's `proposal.md`, drives design/EARS-specs/`tasks.md`, renders the build-status view, and stops at the approval gate. Use when the user hands over a fresh idea, opens a new spark project, or asks "where do I start?", "what's next?", "let's build X". Do NOT write application code or mark tasks executable — that gate is `/board-review`, and building is `/build-loop`.
# Generated from .claude/skills/start/SKILL.md — DO NOT EDIT directly
---

# Skill: start

## Goal

Be the conductor of the **Propose** stage. A spark project ships the full
planner / implementer / evaluator loop but no obvious entry point — this skill
removes the "which skill do I run now?" friction. Understand the idea, build the
one legible artifact the user validates (`proposal.md`), drive the rest of the
documentation (design → EARS specs → `tasks.md`) toward the approval gate, and
always show where the project is on the production line. You own the
orchestration and the proposal; the named planning skills do the deep authoring.

## Recommended model

Opus 4.7 / GPT-5.5 when judging a raw idea or drafting the proposal. Sonnet 4.6
is enough once you are only reading state and routing.

## Inputs

Read whatever exists in `docs/spark/` (none are required — absence is signal):

- `docs/spark/project.md` — product north star (vision, user, core loop, non-goals)
- `docs/spark/design.md` — product visual language (filled when UI is in scope)
- `docs/spark/specs/<capability>/spec.md` — EARS truth that has shipped
- `docs/spark/changes/<id>-YYYY-MM-DD/` — the active change: `proposal.md`,
  optional `design.md`, `tasks.md` (the source of truth for task status)
- `spark.config.json`, `.spark/state.json` — template, installed packs
- `git status --short` — uncommitted work in flight

Treat a file that is missing, empty, or only template headings as "not done."
The **active change** is the newest non-archived folder under `docs/spark/changes/`;
if none exists, the first thing `/start` does is create one.

## Rules

- **Build the proposal, then route.** You may draft `proposal.md` and scaffold the
  active change folder. Hand off deep authoring (EARS specs, task breakdown) to the
  matching planning skill — recommend exactly one next step and stop.
- **No application code.** The Propose stage produces documentation only. Never
  edit `app/`, `src/`, or `server/` from this skill.
- **Never skip a gate.** A change advances from planning to building only after
  `/board-review` approves it. Say so; do not route around it, and never mark a
  task executable yourself.
- **One next step.** If several are possible, pick the earliest unfinished phase.
  Offer at most one optional side-step (e.g. "or run `/risk-check`").
- **Always render the build-status view** (below) so progress is visible every
  time, even on a brand-new project.
- If the user gave an idea but `project.md` / `proposal.md` is empty, capture the
  idea verbatim in your summary and grill before drafting — do not invent scope.

## Routing table

Walk top to bottom; route to the first row that is not yet satisfied.

| State | Next |
| --- | --- |
| Idea is vague or has 2+ directions | `/idea-sharpen` |
| `project.md` empty / idea not grilled | `/mvp-grill` |
| Grilled, no active change or `proposal.md` empty | draft `proposal.md` here, then `/mvp-spec` |
| Proposal drafted, EARS `specs/` deltas empty | `/mvp-spec` |
| UI in scope, product `design.md` empty | `/ux-theme` |
| Stack undecided, change `design.md` empty | `/architecture-cutline` |
| Design names a capability with no installed pack | `/pack-resolve` then `/pack-add` |
| Specs done, `tasks.md` empty | `/mvp-board` |
| `tasks.md` drafted, change not approved | `/board-review` (the approval gate) |
| Change approved, stack not stood up | `/scaffold` (install the Pack plan, verify boot) |
| Stack scaffolded (app boots) | `/build-loop` |
| Tasks `[~]` / needs review | `/build-loop` (drives review + QA) |
| All tasks `[x]` and scenarios pass | `/risk-check`, then archive / deploy |

## Output format

```md
## <Project> — build status

**Pipeline:** Grill <✅|⬜> · Proposal <✅|⬜> · Design <✅|⬜|n/a> · Specs <✅|⬜> · Tasks <✅|⬜> · Approved <✅|⬜> · Scaffolded <✅|⬜> · Building <🔨|⬜>

**Active change:** `<id>-YYYY-MM-DD` (or "none yet")
**Tasks:** <n> total — <n> done · <n> in progress · <n> blocked · <n> todo

### Features
- [x] **<feature>** — <one line> · `<task id>` · ✅ done
- [ ] **<feature>** — <one line> · `<task id>` · 🔨 in progress
- [ ] **<feature>** — <one line> · `<task id>` · ⛔ blocked — <reason>
- [ ] **<feature>** · `<task id>` · 🆕 todo

**Next:** run `/<skill>` — <one sentence why this is the next step>
```

Checkbox = task `[x]` (done); the emoji carries the granular status from the
`tasks.md` markers. On a fresh project the Features list is empty and Next points
at `/mvp-grill` (or `/idea-sharpen`). This build-status view is the canonical
progress/checklist surface — `/build-loop` and `/capture-feedback` re-render it
rather than inventing their own.
