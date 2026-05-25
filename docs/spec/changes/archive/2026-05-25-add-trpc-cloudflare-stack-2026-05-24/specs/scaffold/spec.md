## MODIFIED Requirements

### Requirement: Template Registry

The system SHALL maintain a registry of base scaffold templates under `templates/<name>/`. Each template directory MUST contain a `template.toml` declaring `name`, `status` (one of `stable` or `planned`), `provides` (an array of **template-capability** tags from the closed template-capability enum — separate from the pack-capability enum), and a one-line `description`. The set of registered templates in this release MUST be exactly `nextjs`, `astro`, `astro-starlight`, `vite-react`, and `one`. The template-capability enum is exactly: `static`, `server`, `react`, `native`, `vue`, `svelte`, `mdx-content`, `edge-runtime`. Template-capabilities MUST NOT overlap with pack-capabilities; a tag valid in one enum is not valid in the other.

The stable set in this release is `nextjs` and `vite-react`. The other three remain `planned`.

#### Scenario: All five templates are registered

- **WHEN** the system is built from this change
- **THEN** `templates/nextjs/template.toml`, `templates/astro/template.toml`, `templates/astro-starlight/template.toml`, `templates/vite-react/template.toml`, and `templates/one/template.toml` all exist
- **AND** each parses as a valid `template.toml`

#### Scenario: nextjs and vite-react are stable

- **WHEN** the registry is loaded
- **THEN** `templates/nextjs/template.toml` declares `status = "stable"`
- **AND** `templates/vite-react/template.toml` declares `status = "stable"`
- **AND** the other three templates declare `status = "planned"`

#### Scenario: Expo is not registered

- **WHEN** the registry is loaded
- **THEN** no `templates/expo/` directory exists
- **AND** `expo` is not an accepted value for the `--template` flag of `create-spark`

## ADDED Requirements

### Requirement: Minimal AI-Ready Scaffold (vite-react reference)

The `create-spark` initializer SHALL generate a minimal Vite + React 19 + TypeScript application when the user selects the `vite-react` template. The generated app MUST be preloaded with the board-driven AI workflow artifacts (`AGENTS.md`, `CLAUDE.md`, `.ai/`, `.claude/skills/`, `.codex/skills/`) and a Hono-based dev API entrypoint at `server/dev.ts` that is wired into the dev script but exposes no routes by default. The generated app MUST NOT include auth, database, UI component library, payments, email, or AI SDK integrations by default; those capabilities are added later via the pack registry. The template MUST declare `provides = ["react", "static", "edge-runtime", "server"]` so that packs requiring `edge-runtime` (e.g. `deploy-cloudflare`) and packs requiring `server` (e.g. `api-trpc`, since the template ships a Hono dev server at `server/dev.ts`) both install cleanly without further user action.

#### Scenario: Fresh init with vite-react and no preset

- **WHEN** the user runs `bunx create-spark my-app --template vite-react` and declines any preset
- **THEN** a directory `my-app/` is created containing a runnable Vite app
- **AND** `my-app/AGENTS.md`, `my-app/CLAUDE.md`, `my-app/.ai/`, `my-app/.claude/skills/`, and `my-app/.codex/skills/` exist
- **AND** `my-app/server/dev.ts` exists and exports a Hono app with no mounted routes
- **AND** `bun dev` starts the Vite dev server successfully without prompting for environment variables
- **AND** no auth, db, UI lib, payments, email, or AI SDK code is present in the generated tree

#### Scenario: vite-react accepts edge-runtime packs out of the box

- **WHEN** a fresh `vite-react` project is created
- **AND** the user runs `spark add deploy-cloudflare`
- **THEN** the runtime-capability check passes because `vite-react` provides `edge-runtime`
- **AND** the install proceeds to copy `wrangler.toml` and `worker.ts` into the project

### Requirement: Cloudflare deploy target for edge-runtime templates

The `deploy-cloudflare` pack SHALL ship a Workers entrypoint and a `wrangler.toml` configured for the project name and a single `assets` binding for the built static output. The pack MUST require `edge-runtime` via `requires_runtime` so it installs cleanly on `vite-react` and on any future template that provides `edge-runtime`. The pack MUST NOT hard-code `compatible_scaffolds`, so future edge-capable templates work without a pack-side change.

#### Scenario: deploy-cloudflare installs on vite-react

- **WHEN** `spark add deploy-cloudflare` runs in a `vite-react` project
- **THEN** the install succeeds
- **AND** the project gains `wrangler.toml` and `worker.ts`
- **AND** `package.json` gains a `deploy` script invoking `wrangler deploy`

#### Scenario: deploy-cloudflare refuses templates without edge-runtime

- **WHEN** the active project's template declares `provides = ["server"]` and does not include `edge-runtime`
- **AND** the user runs `spark add deploy-cloudflare`
- **THEN** the install aborts before writing any file
- **AND** the error names the unmet runtime capability `edge-runtime`
