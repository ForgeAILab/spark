---
name: architecture-cutline
description: Pick the simplest architecture that can ship the MVP. Use after `.ai/product-spec.md` exists, when the user says "what stack?", "design the architecture", or before scaffolding code. Do NOT use for greenfield exploration without a spec — run `/mvp-spec` first.
allowed-tools:
  - Read
  - Write
---

# Skill: architecture-cutline

## Goal

Produce `.ai/architecture.md` — the smallest viable technical plan that can ship the spec. Your job is to **aggressively cut**, not to design a beautiful system.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these (required):

- `.ai/product-spec.md`
- `.ai/decision-log.md`

Read these if present:

- `templates/*/template.toml`
- `packs/*/pack.toml`
- `presets/*.toml`

If `product-spec.md` is missing, stop and tell the user to run `/mvp-spec` first.

## Rules

- **Default to boring.** Pick the stack the user already knows over the one that scores higher on Twitter.
- **One database.** No microservices. No event bus. No queues unless the spec literally requires async work.
- For every decision, also write what you are **NOT building yet**. This is the cutline.
- If the spec implies something exotic (realtime collab, ML inference, search, multi-tenancy), call it out and propose a faked version for v1.
- Respect prior choices in `.ai/decision-log.md` unless they conflict with the spec.
- Choose a scaffold template before choosing packs. Prefer `nextjs` for v1 unless the spec clearly fits a registered planned template; if a planned template is the right destination, name it as planned and give the `nextjs` interim path.
- Recommend only packs that exist in `packs/*/pack.toml`. Do not recommend a capability if no v1 pack provides it.
- If the spec implies a capability with no v1 pack, name the gap explicitly in the pack plan and suggest `/new-pack` to author one.

## Output format

Write `.ai/architecture.md` with these sections:

````md
# Architecture — <name>

## Decision summary
<one paragraph: the shape of the system in plain English>

## Stack
- Frontend:
- Backend / API:
- Database:
- Auth:
- Storage:
- Payments:
- Deployment:
- Testing:

For each, one line on WHY this choice over the obvious alternative.

## Pack plan
- Chosen scaffold: <template name> (<stable | planned, not yet implemented; use nextjs as interim>)
- Recommended packs:
  - <pack-name>: provides <capability tag(s)>; satisfies <spec need>
- Gaps:
  - <capability tag>: no v1 pack exists — run `/new-pack` to author one
  - none

```sh
app-skills add <pack-1> <pack-2>
```

## Repo structure
<tree of top-level folders only>

## Data model (concrete)
<tables/collections with columns and types — short>

## API surface (concrete)
<routes or actions, grouped by feature>

## What we are NOT building yet
- <thing>: <reason — "fake with X for MVP" or "v2">
(at least 5 entries; this is the cutline)

## Risks and rollback
<2–4 risks with a simpler fallback for each>
````

After writing, append the key choices to `.ai/decision-log.md` and recommend `/ux-theme` or `/mvp-board` next.
