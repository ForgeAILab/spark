---
name: pack-resolve
description: Recommend the right scaffold template and concrete feature packs from `.ai/product-spec.md` and `.ai/architecture.md`. Annotates each recommended pack as `copy` or `hybrid` based on whether its manifest declares `[runtime_package]`. Use when the user asks which packs to install, wants a scaffold/preset recommendation, or scope changed after architecture. This skill only plans; it never installs.
allowed-tools:
  - Read
  - Bash
---

# Skill: pack-resolve

## Goal

Recommend a scaffold template and a concrete pack set from the current product spec and architecture. The output should be directly actionable, but this skill must not execute any install.

## Recommended model

Opus 4.7 or GPT-5.5.

## Inputs

Read these (required):

- `.ai/product-spec.md`
- `.ai/architecture.md`

Read these if present:

- `templates/*/template.toml`
- `packs/*/pack.toml`
- `presets/*.toml`
- `anvil.config.json`

If the spec or architecture is missing, stop and tell the user to run `/mvp-spec` and `/architecture-cutline` first.

## Rules

- Do not run `bunx create-anvil`, `anvil add`, or `anvil preset`. This is a planning skill only.
- Resolve from the registry, not from memory. Pack names must come from `packs/*/pack.toml`; templates must come from `templates/*/template.toml`.
- Prefer the smallest pack set that satisfies the spec and architecture. Do not install "usual SaaS" packs unless the capability is actually required.
- Group packs by manifest `category`, and map each pack to the capability tags it provides or satisfies.
- Annotate each recommended pack as either `copy` or `hybrid`. The classification is derived from the pack's `pack.toml`: presence of a `[runtime_package]` table means `hybrid`; absence means `copy`. Readers must immediately see which packs ship a versioned runtime helper they will import from versus which copy source files into the project.
- Respect `requires`, `conflicts`, `compatible_scaffolds`, and `requires_runtime` when recommending a set.
- If a needed capability has no v1 pack, name the gap explicitly and suggest `/new-pack`. Do not invent a pack name or include the missing capability in the command.
- If the best-fit template has `status = "planned"`, still recommend it as the destination, write `planned, not yet implemented`, suggest `nextjs` as the interim alternative, and make the final command use the executable interim path.
- If a preset exactly matches the recommended fresh-project pack set, the final command may be `bunx create-anvil <name> --template <t> --preset <p>`. Otherwise, or when resolving for an existing project, the final command must be `anvil add <pack...>` using only real pack names from the registry.
- The final answer must end with exactly one fenced `sh` command block and no text after it.

## Capability hints

Use these only as hints; the registry still wins:

- Paid SaaS: `db`, `auth`, `payments`, `email`, `ui-kit`, `deploy-target`.
- Internal tool: `db`, `auth`, `ui-kit`, optionally `local-runtime`.
- AI workflow: `ai-sdk`, optional `db`, optional `ui-kit`.
- Documentation site: `mdx-content` template capability; `astro-starlight` may be the destination but is planned in v1.
- Realtime/client-first sync: `sync`; if the requested capability is broader than the v1 `sync-zero` pack covers, name the gap.

## Output format

Return these sections:

- `## Scaffold` — recommended template, status, why it fits, and interim alternative if the best fit is planned.
- `## Packs` — grouped by category. Each bullet must be `<pack-name> (<copy|hybrid>)` followed by `provides:` and the capability tags. Example: `auth-better-auth (hybrid) — provides: auth, session, oauth`.
- `## Gaps` — missing capabilities and a `/new-pack` suggestion, or `none`.
- `## Command` — the last section, containing exactly one executable fenced `sh` block.

Do not put any other fenced command block anywhere in the response.
