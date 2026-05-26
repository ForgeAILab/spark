# Reference: Explore / research

The conductor (`/start`) follows this when an idea or modification carries **real unknowns**
that would otherwise be guessed at in the proposal or architecture. It produces a short
`research.md` in the active change folder. Inspired by OpenSpec's `explore` (investigate the
codebase before proposing) and spec-kit's Phase 0 `research.md` (resolve technical unknowns
before planning). Model: Opus 4.7 / GPT-5.5.

## Goal

De-risk the decisions the proposal and architecture will bake in — **before** they are
written — by gathering only the facts that change those decisions. The artifact is a
`docs/spark/changes/<id>-YYYY-MM-DD/research.md` that the conductor reads when it drafts the
proposal (cold start) or the light-route proposal (iteration).

## When to run (conditional — never mandatory)

Run this phase only when there is a genuine unknown. Skip it for anything obvious. Triggers:

- **Cold start** — the idea depends on prior art, a market/format convention, a regulatory
  constraint, or a technical choice (library, API, rapidly-changing tech) that the grill
  could not settle.
- **Iteration / light route** — the modification touches **existing code the agent has not
  yet read**. Do a bounded scan of the affected files/specs so the proposal extends reality
  instead of guessing (this is OpenSpec's "analyze the current X setup").
- A `#### Scenario` or pack choice hinges on a fact nobody in the room knows.

Do **not** run it to second-guess a settled decision, to re-grill scope, or to pad the
change with options nobody asked for. If you cannot name the specific unknown a finding will
resolve, skip the phase.

## Inputs

- The active change's `proposal.md` (if started) and the user's stated idea/ask.
- For iteration: the shipped `specs/<capability>/spec.md` and the actual source files the
  ask touches — read them; do not assume.
- The web / docs **only** for a named technical unknown (pin versions for rapidly-changing
  tech, confirm an API surface). Cite what you used.

## Rules

- **Bounded.** Time-box it; `research.md` is findings + decisions, not a survey. spark is
  anti-overthinking (`/risk-check`) — a long research doc is itself drift.
- **Every finding must resolve a named unknown** and end in a decision or an open question
  carried into the proposal. No findings-for-findings'-sake.
- **Read before you read about.** For iteration, the codebase is the primary source; reach
  for the web only for genuinely external unknowns.
- **No decisions out of scope.** Research informs the proposal/architecture; it does not pick
  the stack (that is the architecture phase) or write tasks.
- Cite sources for any external claim (URL or `path:line` for code).

## Output format

`docs/spark/changes/<id>-YYYY-MM-DD/research.md`:

```md
---
created_at: <iso8601>
updated_at: <iso8601>
---

## Unknowns
- <the specific questions this research must answer, each tied to a proposal/architecture decision>

## Findings
- **<unknown>** → <finding>. Source: <url or `path:line`>. **Decision:** <what it implies>.

## Codebase notes (iteration only)
- `<path:line>` — <what already exists that the change must extend or respect>

## Open questions for the user
- <anything research could not settle that needs a human call — surfaced at the next pause>
```

When research ends, record `research.md`, fold its decisions into the proposal you draft
next, and hand control back to `/start`. Do not name the next phase — the order lives in
`/start`.
