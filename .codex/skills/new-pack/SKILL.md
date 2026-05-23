---
name: new-pack
description: Scaffold a new local feature-pack directory under `packs/` with a minimal manifest, empty files and skills directories, and an empty task stub. Prompts for install mode (`copy` or `hybrid`); a `hybrid` pack additionally scaffolds a companion `libs/spark-<name>/` workspace package and writes a `[runtime_package]` block into the new manifest. Use when a needed capability has no v1 pack.
# Generated from .claude/skills/new-pack/SKILL.md — DO NOT EDIT directly
---

# Skill: new-pack

## Goal

Create a minimal pack skeleton that a human or executor can fill in later. This skill only scaffolds the pack directory (and, in `hybrid` mode, a companion workspace package under `libs/`); it does not implement the integration.

## Recommended model

Sonnet 4.6 or GPT-5 family executor.

## Inputs

Required from the user:

- `<name>` — pack directory name, for example `realtime-supabase`
- `category=<category>` — one of the v1 category values
- `mode=<mode>` — install mode, either `copy` or `hybrid`

If any of these values is missing, ask for it before writing files. When asking for `mode`, explain the difference:

- `copy` — pack ships its full runtime logic as files copied into the consumer project. The user owns the code in place. This is the right default for stable framework glue (config files, route handlers, env wiring).
- `hybrid` — pack ships only thin wiring files and imports its runtime logic from a versioned npm helper package `@forgeailab/spark-<name>` published from `libs/spark-<name>/`. Choose this when the logic is the same across every consumer project and bug fixes should land in one place.

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
- Validate that `mode` is exactly `copy` or `hybrid`.
- Pack scaffold (both modes) creates only these paths:
  - `packs/<name>/pack.toml`
  - `packs/<name>/files/`
  - `packs/<name>/skills/`
  - `packs/<name>/tasks.yaml`
- Additionally in `hybrid` mode, validate that `libs/spark-<name>/` does not already exist, then create the companion workspace package:
  - `libs/spark-<name>/package.json`
  - `libs/spark-<name>/tsconfig.json`
  - `libs/spark-<name>/src/index.ts`
  - `libs/spark-<name>/test/index.test.ts`
  - `libs/spark-<name>/README.md`
- `tasks.yaml` must be an empty stub file.
- Leave `provides`, `requires`, and `conflicts` empty. Do not guess capability tags.
- The pack's `[dependencies].runtime` MUST NOT redeclare the helper package — the CLI adds it implicitly from `[runtime_package]`.

## `pack.toml` skeleton — `copy` mode

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

## `pack.toml` skeleton — `hybrid` mode

In `hybrid` mode, the manifest gains a `[runtime_package]` table pointing at the companion helper:

```toml
name = "<name>"
version = "0.1.0"
category = "<category>"
description = "TODO: describe what this pack adds."
provides = []
requires = []
conflicts = []

[runtime_package]
package = "@forgeailab/spark-<name>"
version = "^0.1"
```

## `libs/spark-<name>/` skeleton — `hybrid` mode only

`package.json`:

```json
{
  "name": "@forgeailab/spark-<name>",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "sideEffects": false,
  "devDependencies": {
    "bun-types": "latest",
    "typescript": "latest"
  }
}
```

`tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*", "test/**/*"]
}
```

`src/index.ts`: empty `export {};` placeholder.
`test/index.test.ts`: minimal `test('placeholder', () => expect(true).toBe(true));`.
`README.md`: one-line description plus a "Why is this in libs/ vs packages/?" note (it is a library consumers import from, not internal CLI plumbing).

## Output format

After creating the skeleton, return:

```md
## New pack scaffolded

- Pack: `<name>`
- Category: `<category>`
- Install mode: `<mode>`
- Created:
  - `packs/<name>/pack.toml`
  - `packs/<name>/files/`
  - `packs/<name>/skills/`
  - `packs/<name>/tasks.yaml`
  <!-- hybrid mode only -->
  - `libs/spark-<name>/package.json`
  - `libs/spark-<name>/tsconfig.json`
  - `libs/spark-<name>/src/index.ts`
  - `libs/spark-<name>/test/index.test.ts`
  - `libs/spark-<name>/README.md`

Next: fill in `provides`, `requires`, files, tasks, and any pack-shipped skills before installing it.
In hybrid mode, also implement the runtime helper under `libs/spark-<name>/src/` and re-run `bun install`.
```
