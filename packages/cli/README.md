# `app-skills` CLI

The `app-skills` CLI manages feature packs in a project scaffolded with `create-app-skills`. Run it from your project root.

## Install

`app-skills` is invoked through Bun. Inside this monorepo:

```bash
bun packages/cli/src/cli.ts <command>
```

After publishing:

```bash
bunx app-skills <command>
```

A scaffolded project has `app-skills` available in scripts; in dev you can also alias it locally.

## Commands

### `list`

Show all known packs grouped by category. Marks installed packs from `.app-skills/state.json` and shows scaffold compatibility.

```bash
app-skills list
```

### `info <pack>`

Print everything the install would do — files touched, env vars added, deps installed, skills shipped, tasks seeded. Same surface as `add --dry-run` for a single pack.

```bash
app-skills info payments-stripe
```

### `add <pack...> [--dry-run]`

Resolve the requested packs against the registry + installed set + active scaffold, then apply. Idempotent: running it twice with the same args is a no-op.

```bash
app-skills add db-sqlite ui-shadcn
app-skills add payments-stripe --dry-run
```

The resolver enforces:

- **Closed capability enums.** `requires` / `provides` / `conflicts` reference pack-capability tags; `requires_runtime` references template-capability tags. Unknown values are rejected.
- **Exclusivity.** Capabilities classified exclusive (`db`, `auth`, `payments`, `ui-kit`, `sync`) reject double-installs. Non-exclusive caps (`ai-sdk`, `analytics`, `email`, `blob-storage`, `e2e`, `deploy-target`, `local-runtime`) coexist.
- **Scaffold compatibility.** A pack with `compatible_scaffolds = ["nextjs"]` refuses to install on a `vite-react` project.

### `preset <name>`

Apply a named bundle from `presets/<name>.toml`. Refuses if the active scaffold is not in the preset's `compatible_scaffolds`.

```bash
app-skills preset lean-saas
```

### `check`

Audit `.app-skills/state.json` against the filesystem. Reports missing files, missing env vars in `.env.local`, deleted seeded tasks. **Does not repair.**

```bash
app-skills check
```

## What's not here

- No `remove` / `uninstall` / `update`. v1 trusts git for reversal; `git revert` undoes a pack install.
- No `post_install` / shell hooks in pack manifests — installs are fully declarative.

## How state works

`.app-skills/state.json` records, per installed pack: files written, env vars appended, tasks seeded. The CLI never deletes project files based on this — its sole purpose is drift detection via `check`.

## See also

- `docs/pack-spec.md` — writing a new pack
- `templates/README.md` — registering a new scaffold template
- `docs/spec/AGENTS.md` — spec-driven workflow contract
