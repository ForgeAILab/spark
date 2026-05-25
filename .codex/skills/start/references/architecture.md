# Reference: Architecture cutline (technical design + Pack plan)

The conductor (`/start`) follows this when it reaches the architecture phase — writing the
active change's technical `design.md`. (Formerly the standalone `/architecture-cutline`
skill.) Model: Opus 4.7 / GPT-5.5. Do this **before** the visual phase: it surfaces pack
gaps and constrains layout.

## Goal

Produce `docs/spark/changes/<id>-YYYY-MM-DD/design.md` — the smallest viable technical plan
that can ship the proposal. Aggressively **cut**; do not design a beautiful system. The
durable one-line stack summary belongs in `docs/spark/project.md`; the per-change "how"
lives here.

## Inputs

Required: the active change's `proposal.md` and its `specs/<capability>/spec.md`, plus
`docs/spark/project.md` (existing stack summary). If present: `templates/*/template.toml`,
`packs/*/pack.toml`, `presets/*.toml`. If the proposal is missing, the conductor returns to
the spec phase first.

## Rules

- **Default to boring.** Pick the stack the user already knows over the one that scores
  higher on Twitter.
- **One database.** No microservices, event bus, or queues unless the spec literally
  requires async work.
- For every decision, also write what you are **NOT building yet**. This is the cutline.
- If the spec implies something exotic (realtime collab, ML inference, search, multi-tenancy),
  call it out and propose a faked version for v1.
- Respect prior decisions in earlier proposals / design docs unless they conflict with the spec.
- Choose a scaffold template before packs. **Default to `vite-react`** (SPA + minimal Hono
  API; deploys to Cloudflare Workers or Bun). Choose `nextjs` only when the spec needs SSR,
  server-rendered routes, or SEO-critical pages. Note the choice in the Pack plan so
  `/scaffold` can flag a mismatch with what `create-spark` laid down.
- Recommend only packs that exist in `packs/*/pack.toml`. If a needed capability has no v1
  pack, name the gap explicitly in `## Pack plan` and suggest `/new-pack`.

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

After writing, update the one-line stack summary in `docs/spark/project.md`.
