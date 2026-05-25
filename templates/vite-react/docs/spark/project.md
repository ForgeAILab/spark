# {{appName}} — Product

> The north star for this product. Keep it short and true. `/start` fills this in
> by interviewing you; everything else in `docs/spark/` serves what you write here.
> If an answer isn't in this workspace, an agent should ask you — not invent it.

## Vision

<One or two sentences: what this product is and why it should exist.>

## Target user

<Who has the problem? Be specific — "indie makers shipping side projects",
not "everyone".>

## Core loop

<The one flow that delivers the value, start to finish. If a feature does not
serve this loop, it is a candidate for Non-goals.>

## Non-goals

<What you are deliberately NOT building for the MVP. This is a do-not-build list,
not a backlog. Treat anything here as scope creep until a change promotes it.>

## Stack summary

- Runtime: Bun + TypeScript
- Client: Vite + React 19, wouter routing, Tailwind CSS v4
- API: minimal Hono entrypoint (local Bun dev or Cloudflare Workers)
- Capabilities (auth, db, payments, email, UI, AI, deploy) are added later as
  packs via `spark add ...`; each change's `design.md` records the pack plan.
