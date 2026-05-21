# Template Authoring

Templates live under `templates/<name>/` and register a base scaffold for `create-app-skills`. Each template directory must contain a `template.toml` manifest and may contain scaffold files when the template is stable.

## `template.toml`

`template.toml` is parsed with `TemplateManifestSchema` from `packages/pack-schema/src/template.ts`.

Required fields:

- `name`: lowercase template id matching `^[a-z][a-z0-9-]*$`.
- `status`: `stable` or `planned`.
- `provides`: array of template capability tags.
- `description`: one-line human-readable summary.

Example:

```toml
name = "nextjs"
status = "stable"
provides = ["server", "static", "spa"]
description = "Next.js App Router scaffold for TypeScript web apps."
```

## Template Capabilities

Template capabilities describe what the base scaffold runtime provides. They are separate from pack capabilities such as `db`, `auth`, or `payments`.

Current accepted template capabilities:

- `server`: can run server-side application code.
- `spa`: supports client-side single-page app behavior.
- `native`: supports native app targets.
- `edge`: supports edge runtime deployment.
- `library`: is intended as a reusable package or library scaffold.
- `monorepo`: is a multi-package workspace scaffold.
- `static`: can emit static assets or static pages.

Use only these exact values until the schema changes. Planned templates should still include a valid `template.toml` so packs and presets can declare compatibility before the full scaffold ships.

## Promoting Planned Templates

To promote a template from `planned` to `stable`, add the runnable scaffold files under `templates/<name>/`, update `status = "stable"`, and run the manifest parser against every template. Stable templates should be copyable into a new project and runnable without requiring auth, database, billing, email, UI libraries, or AI SDK setup by default.
