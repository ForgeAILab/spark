---
name: architecture-cutline
description: Pick the simplest architecture that can ship the change, and write it as the active change's technical `design.md` (stack, repo structure, data model, API surface, non-goals, and a `## Pack plan` with the exact `spark add` command). Use after the active change's `proposal.md` exists, when the user says "what stack?", "design the architecture", or before scaffolding code. Do NOT use without a proposal — run `/mvp-spec` first.
allowed-tools:
  - Read
  - Write
---

# Skill: architecture-cutline

## Goal

Produce the active change's `docs/spark/changes/<id>-YYYY-MM-DD/design.md` — the smallest
viable technical plan that can ship the proposal. Your job is to **aggressively cut**, not to
design a beautiful system. The durable one-line stack summary belongs in `docs/spark/project.md`;
the per-change "how" lives here.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these (required):

- the active change's `proposal.md` and its `specs/<capability>/spec.md`
- `docs/spark/project.md` (existing stack summary, if any)

Read these if present:

- `templates/*/template.toml`
- `packs/*/pack.toml`
- `presets/*.toml`

If the proposal is missing, stop and tell the user to run `/mvp-spec` first.

## Rules

- **Default to boring.** Pick the stack the user already knows over the one that scores higher on Twitter.
- **One database.** No microservices, no event bus, no queues unless the spec literally requires async work.
- For every decision, also write what you are **NOT building yet**. This is the cutline.
- If the spec implies something exotic (realtime collab, ML inference, search, multi-tenancy), call it out and propose a faked version for v1.
- Respect prior decisions recorded in earlier proposals / design docs unless they conflict with the spec.
- Choose a scaffold template before choosing packs. Prefer `nextjs` for v1 unless the spec clearly fits a registered template.
- Recommend only packs that exist in `packs/*/pack.toml`. Do not recommend a capability if no v1 pack provides it.
- If the spec implies a capability with no v1 pack, name the gap explicitly in the `## Pack plan` and suggest `/new-pack`.

## Output format

Write `design.md` with these sections:

````md
# Design — <change name>

## Decision summary
<one paragraph: the shape of the system in plain English>

## Stack
- Frontend / Backend / Database / Auth / Storage / Payments / Deployment / Testing
  (one line each, with WHY this over the obvious alternative)

## Pack plan
- Chosen scaffold: <template> (<stable | planned — use nextjs interim>)
- Recommended packs:
  - <pack-name>: provides <capability tag(s)>; satisfies <spec need>
- Gaps:
  - <capability tag>: no v1 pack — run `/new-pack` | none

```sh
spark add <pack-1> <pack-2>
```

## Repo structure
<tree of top-level folders only>

## Data model (concrete)
<tables / collections with columns and types — short>

## API surface (concrete)
<routes or actions, grouped by feature>

## Non-goals (the cutline)
- <thing>: <reason — "fake with X for MVP" or "v2">

## Risks and rollback
<2–4 risks with a simpler fallback for each>
````

After writing, update the one-line stack summary in `docs/spark/project.md` and recommend
`/ux-theme` (if UI is in scope) or `/mvp-board`.
