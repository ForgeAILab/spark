---
name: start
description: The front door and conductor for a spark project. Understands the user's idea, then drives the whole pipeline as one flow with a single human gate — grills for scope, drafts the active change's proposal → design → specs → tasks without stopping between phases, halts at the `/board-review` approval gate, and once approved continues automatically through `/scaffold` and `/build-loop` to a running app. Use when the user hands over a fresh idea, opens a new spark project, or asks "where do I start?", "what's next?", "let's build X" — and also when they return to a shipped MVP to change, add, or tune something. It auto-detects iteration mode (a north star plus shipped specs already exist) and takes a lighter route — proposal + open specs + tasks behind one gate, no re-grill or architecture re-cut — escalating to the full flow only for scope-changes, non-goal breaches, or large changes. The one human gate is approval; never mark a task executable before it.
# Generated from .claude/skills/start/SKILL.md — DO NOT EDIT directly
---

# Skill: start

## Goal

Be the **conductor** of the whole pipeline: take a raw idea to a running app in one
continuous flow with a single human gate (approval). A spark project ships the full
planner / implementer / evaluator loop but no obvious entry point — this skill removes
both the "which skill do I run now?" friction *and* the stop-and-go of confirming every
phase. You own the orchestration, the ordering, and the planning docs — you author them yourself
from the bundled `references/` (see below); the standalone skills handle interactive input
(`/mvp-grill`, `/idea-sharpen`), the approval gate (`/board-review`), and building
(`/scaffold`, `/build-loop`). **The pipeline order lives here and nowhere else** — those
skills hand control back to you; they do not name the next skill.

## The conductor contract (how you drive)

You conduct the **whole lifecycle** — idea → plan → approval → scaffold → build — as one
flow. Walk the routing table top to bottom; for each unsatisfied phase, run its skill,
then continue to the next **without asking "shall I continue?"**.

**Stop for exactly two human touchpoints:**

1. **You need the user** — `/idea-sharpen` or `/mvp-grill` questions, or a genuine fork
   only the user can decide (e.g. a real stack trade-off). Ask, then resume.
2. **The `/board-review` approval gate.** The Propose stage is documents-only (nothing
   installed or coded yet), so chain it straight to here, render build-status, and stop.
   Never approve on the user's behalf.

**The approval banner is the green light for the build.** Once the active change carries
it, keep going automatically — run `/scaffold` (install the Pack plan, verify the app
boots), then drive `/build-loop` — without making the user invoke each phase. After
approval you pause only on a **blocker** (a failed install/boot, or a decision only the
user can make) — report the specific reason, don't thrash — or when the user interjects.

- Before the gate: as each artifact lands, note it in one line (`✅ proposal.md`,
  `✅ specs/auth/spec.md`). Render the full build-status view when you stop.
- Never skip the gate, and never mark a task executable before approval.

Net result: the user grills once, approves once, and watches the plan become a running
app. Two touchpoints, not eight.

## Recommended model

Opus 4.7 / GPT-5.5 when judging a raw idea or drafting the proposal. Sonnet 4.6 is enough
once you are only reading state and routing.

## Inputs

Read whatever exists in `docs/spark/` (none are required — absence is signal):

- `docs/spark/project.md` — product north star (vision, user, core loop, non-goals)
- `docs/spark/design.md` — product visual language (filled when UI is in scope)
- `docs/spark/specs/<capability>/spec.md` — EARS truth that has shipped
- `docs/spark/specs/capabilities.md` — the adopt-time capability map (one line per capability;
  counts as shipped truth for iteration detection even before any `spec.md` is written)
- `docs/spark/changes/<id>-YYYY-MM-DD/` — the active change: `proposal.md`,
  optional `research.md` (explore/research findings), optional technical `design.md`,
  `tasks.md` (the source of truth for task status)
- `spark.config.json`, `.spark/state.json` — template, installed packs
- `git status --short` — uncommitted work in flight

Treat a file that is missing, empty, or only template headings as "not done." The
**active change** is the newest non-archived folder under `docs/spark/changes/`; if none
exists, the first thing `/start` does is create one. The **approval banner**
(`> **Approved for execution** — <date> (/board-review)` under the `tasks.md` frontmatter)
is what flips the project from planning to building.

## Rules

- **Drive, don't narrate the contradiction.** You are the single router. Resume from the
  first unsatisfied row and flow forward; do not stop to explain which skill "would have"
  sent you elsewhere.
- **No application code from this skill.** You delegate building to `/scaffold` and
  `/build-loop`; you never edit `app/`, `src/`, or `server/` directly.
- **One gate.** A change advances from planning to building only after `/board-review`
  writes the approval banner. Stop there for approval; never route around it, and never
  mark a task executable yourself. After the banner exists, the build is authorized — flow.
- **Design is an unordered pair, both required (full chain only).** On a cold start,
  `architecture-cutline` (the change's technical `design.md`: stack + Pack plan) and
  `ux-theme` (the product visual `design.md`) are independent of each other, but **both**
  must exist before `/mvp-board` (ux-theme only when UI is in scope). Do **architecture
  first** — it surfaces pack gaps and constrains layout — then ux-theme. The **light route**
  authors neither: the stack and visual language are inherited from the shipped MVP.
- **One change, this run.** Drive the active change only; do not start a second.
- If the user gave an idea but `project.md` / `proposal.md` is empty, capture the idea
  verbatim in your summary and grill before drafting — do not invent scope.

## Three entry modes (detect from the workspace — never ask)

Before routing, read `docs/spark/` **and** the repo around it, then decide which mode you
are in. The user never names it; you infer it:

- **Cold start** — no real `project.md`, no shipped `specs/`, **and no substantive product
  code** (an empty repo or a bare scaffold). A fresh idea. Run the **full chain** (the first
  routing table): grill → proposal → architecture → visual → specs → tasks → gate → scaffold
  → build.
- **Adopt** — no spark workspace (no real `project.md`, no shipped `specs/` / `capabilities.md`)
  **but substantive existing source code spark did not build** (real dependencies plus
  `src/` / `app/` / `server/`). Run the **adopt bootstrap** (the third routing table): a
  one-time reverse-engineer of the baseline that ends in iteration. Detection is
  conservative — **confirm before adopting** so a bare `create-spark` scaffold is never
  mistaken for a real app — follow `references/adopt.md`.
- **Iteration** — `project.md` carries a real north star **and** `specs/` holds shipped
  truth: either a per-capability `specs/<capability>/spec.md`, the adopt-time
  `specs/capabilities.md` map, or an archived `changes/`. The MVP already shipped (or was
  adopted), was already grilled, and the stack is fixed. Take the **light route** (the
  second routing table).

In iteration mode, classify the ask the way `/capture-feedback` does —
**bug / polish / feature / scope-change** — and route by class:

- **bug / polish / feature** → light route: open a change and write `proposal.md` + the
  **open EARS spec deltas** + `tasks.md` (no re-grill, and no technical `design.md` — the
  stack is inherited and fixed). Stop **once** at `/board-review` for approval, then go
  straight to `/build-loop`.
- **scope-change, a non-goal breach, or a large-scale change the user explicitly asks for**
  → escalate to the full chain: grill the new scope and cut/extend the architecture before
  the gate, exactly as cold start does.

Either mode has **exactly one gate**. The light route trims the planning *ceremony* (grill,
architecture cut, UX re-theme, pack-resolve) — never the approval gate.

## Routing table — full chain (cold start)

Walk top to bottom; act on the first row that is not yet satisfied, then continue.

| State | Action |
| --- | --- |
| Idea is vague or has 2+ directions | run `/idea-sharpen` — **pause** for the user's pick |
| `project.md` empty / idea not grilled | run `/mvp-grill` — **pause** for answers |
| Grilled, but a real unknown blocks the proposal (prior art, a rapidly-changing tech/API choice) | explore/research it → `research.md` — follow `references/research.md` (skip if nothing is genuinely unknown) |
| Grilled, no active change or `proposal.md` empty | draft `proposal.md`, then specs — follow `references/spec.md` |
| Proposal drafted, EARS `specs/` deltas empty | author specs — follow `references/spec.md` |
| Stack undecided, change `design.md` empty | write the technical design + Pack plan — follow `references/architecture.md` |
| UI in scope, product `design.md` empty | write the visual language — follow `references/visual.md` |
| Design names a capability with no installed pack | resolve packs, plan only — follow `references/pack-resolve.md` |
| Specs + required design docs done, `tasks.md` empty | break down tasks — follow `references/tasks.md` |
| `tasks.md` drafted, change not approved | **STOP** → hand to `/board-review` (the approval gate) |
| Change approved, stack not stood up | run `/scaffold` — install the Pack plan + verify boot, then continue |
| Stack scaffolded (app boots) | run `/build-loop` — build toward the scenarios |
| Tasks `[~]` / needs review | continue `/build-loop` (drives review + QA) |
| All tasks `[x]` and scenarios pass | run `/risk-check`, then archive / deploy |

Rows above the gate are documents-only and auto-chain; rows marked **pause** wait for the
user; the gate is the one hard **STOP**, for approval. Once the approval banner is present,
the rows below the gate auto-run too — the build flows from approval to a running app,
pausing only on a blocker.

## Routing table — light route (iteration)

Use this table instead of the full chain when you are in **iteration** mode (see *Two entry
modes*) and the ask is bug / polish / feature. Same single gate, trimmed ceremony: no
re-grill, no architecture re-cut, no scaffold unless a genuinely new pack is required.

| State | Action |
| --- | --- |
| Ask is a scope-change, non-goal breach, or large-scale change the user wants | **escalate** → switch to the full-chain table above |
| Ask touches existing code/specs you have not read | explore the affected files → `research.md` — follow `references/research.md` (skip for an obvious tweak) |
| No change folder for this ask yet | create `changes/<id>-YYYY-MM-DD/`, draft `proposal.md` — follow `references/spec.md` |
| `proposal.md` drafted, open `specs/` deltas empty | author the EARS spec deltas — follow `references/spec.md` |
| Specs done, `tasks.md` empty | break down tasks — follow `references/tasks.md` |
| `tasks.md` drafted, change not approved | **STOP** → hand to `/board-review` (the one gate) |
| Change approved, no new pack needed | run `/build-loop` toward the scenarios |
| Change approved, design names a pack not installed | run `/scaffold` to install just that pack, then `/build-loop` |
| All tasks `[x]` and scenarios pass | run `/risk-check`, then archive / deploy |

The technical `design.md` is **not** authored here — the stack was cut at MVP time and is
inherited. If a modification truly needs a new stack choice, that is a large-scale change:
escalate to the full chain.

## Routing table — adopt bootstrap (existing project)

Use this table when you are in **adopt** mode (see *Three entry modes*): a real codebase with
no spark workspace. It is a **one-time bootstrap** that reverse-engineers the baseline so the
project lands where a shipped MVP sits, then hands off to iteration. It is **read-only until
the gate** — you never write app code, run `/scaffold`, or re-stand-up the stack here.

| State | Action |
| --- | --- |
| Existing code detected, repo not yet explored | explore the codebase (read-only) → `research.md`: stack, scaffold template, conventions, capability surface — follow `references/adopt.md` |
| Explored, `project.md` empty | draft `project.md` — inferred north star + conventions + the **detected** stack — follow `references/adopt.md` |
| `project.md` drafted, `specs/capabilities.md` missing | draft the capability map (one line per capability, **no scenarios**) — follow `references/adopt.md` |
| Baseline drafted, stack not recorded as installed | record the detected template + present packs in `spark.config.json` / `.spark/state.json` — follow `references/adopt.md` |
| Baseline drafted, adoption not confirmed | **STOP** → present the inferred north star + conventions; the user confirms spark should adopt this codebase (the one gate). If they say it is actually a fresh start, fall to **cold start** |
| Adoption confirmed | switch to **iteration** — handle the user's actual request via the light-route table |

Adopt does **not** back-fill full EARS specs; a capability's `spec.md` is written lazily by
the first iteration that touches it (see `references/spec.md`). Its one gate is the founder
confirming the inferred baseline — not `/board-review`, because nothing is being built yet.

## Phase references (loaded on demand)

The documents-only planning phases are bundled with this skill as references — load the one
for the phase you're in and author the doc yourself (these were formerly separate skills):

- `references/research.md` — conditional explore/research → `research.md` (only on a real unknown)
- `references/adopt.md` — the adopt bootstrap for an existing codebase (explore → north star → capability map → record stack → one gate)
- `references/spec.md` — `proposal.md` + EARS `specs/` deltas
- `references/architecture.md` — the change's technical `design.md` + `## Pack plan`
- `references/visual.md` — the product visual `docs/spark/design.md` (UI in scope)
- `references/pack-resolve.md` — resolve the scaffold template + concrete pack set (planning only)
- `references/tasks.md` — the executable `tasks.md` breakdown

Read only the reference for the current phase; do not preload them all. The build phases
remain standalone skills (`/scaffold`, `/build-loop`) that you drive after approval.

## Output format

Render this when you stop (at a pause, the gate, or a blocker):

```md
## <Project> — build status

**Pipeline:** Grill <✅|⬜|n/a> · Research <✅|⬜|n/a> · Proposal <✅|⬜> · Architecture <✅|⬜|n/a> · Visual <✅|⬜|n/a> · Specs <✅|⬜> · Tasks <✅|⬜> · Approved <✅|⬜> · Scaffolded <✅|⬜|n/a> · Building <🔨|⬜>

**Active change:** `<id>-YYYY-MM-DD` (or "none yet")
**Tasks:** <n> total — <n> done · <n> in progress · <n> blocked · <n> todo

### Features
- [x] **<feature>** — <one line> · `<task id>` · ✅ done
- [ ] **<feature>** — <one line> · `<task id>` · 🔨 in progress
- [ ] **<feature>** — <one line> · `<task id>` · ⛔ blocked — <reason>
- [ ] **<feature>** · `<task id>` · 🆕 todo

**Next:** <the pause question, "run `/board-review` to approve", or "scaffolding now → building"> — <one sentence why>
```

Checkbox = task `[x]` (done); the emoji carries the granular status from the `tasks.md`
markers. On a fresh project the Features list is empty and the first stop is the
`/mvp-grill` (or `/idea-sharpen`) questions. **Research** renders `n/a` whenever the phase
was skipped (no real unknown) — it is conditional in both modes. On the **light route**
(iteration), render Grill / Architecture / Visual / Scaffolded as `n/a` — they were settled
when the MVP
shipped and the stack is inherited. In **adopt** mode the gate render is instead the
baseline summary from `references/adopt.md` (inferred north star + detected stack + capability
map); the project enters this build-status view as a normal iteration once adoption is
confirmed. This build-status view is the canonical
progress/checklist surface — `/scaffold`, `/build-loop`, and `/capture-feedback` re-render
it rather than inventing their own.
