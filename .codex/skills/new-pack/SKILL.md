---
name: new-pack
description: Scaffold a new local feature-pack directory under `packs/` with a minimal manifest, empty files and skills directories, and an empty task stub. Use when a needed capability has no v1 pack.
# Generated from .claude/skills/new-pack/SKILL.md — DO NOT EDIT directly
---

# Skill: new-pack

## Goal

Create a minimal pack skeleton that a human or executor can fill in later. This skill only scaffolds the pack directory; it does not implement the integration.

## Recommended model

Sonnet 4.6 or GPT-5 family executor.

## Inputs

Required from the user:

- `<name>` — pack directory name, for example `realtime-supabase`
- `category=<category>` — one of the v1 category values

If either value is missing, ask for it before writing files.

## Valid categories

- `db`
- `auth`
- `payments`
- `email`
- `ui`
- `ai`
- `infra`
- `testing`
- `deploy`
- `analytics`
- `storage`

## Rules

- Validate that `<name>` is a single directory segment. Reject names containing `/`, `..`, spaces, or shell metacharacters.
- Validate that `packs/<name>/` does not already exist. If it exists, stop and report the collision.
- Validate that `category` is exactly one of the allowed categories above.
- Create only these paths:
  - `packs/<name>/pack.toml`
  - `packs/<name>/files/`
  - `packs/<name>/skills/`
  - `packs/<name>/tasks.yaml`
- `tasks.yaml` must be an empty stub file.
- Leave `provides`, `requires`, and `conflicts` empty. Do not guess capability tags.

## `pack.toml` skeleton

Write this manifest, replacing `<name>` and `<category>`:

```toml
name = "<name>"
version = "0.1.0"
category = "<category>"
description = "TODO: describe what this pack adds."
provides = []
requires = []
conflicts = []
```

## Output format

After creating the skeleton, return:

```md
## New pack scaffolded

- Pack: `<name>`
- Category: `<category>`
- Created:
  - `packs/<name>/pack.toml`
  - `packs/<name>/files/`
  - `packs/<name>/skills/`
  - `packs/<name>/tasks.yaml`

Next: fill in `provides`, `requires`, files, tasks, and any pack-shipped skills before installing it.
```
