## Context

This change introduces three coordinated systems that together replace the "fork a SaaS template" approach with a "scaffold then compose" approach:

1. A **multi-template scaffold system** produced by `create-app-skills`, where the user selects a base template (`nextjs` ships in v1; `astro`, `astro-starlight`, and `vite-react` are registered for compatibility but their concrete base files land later).
2. A **pack registry** describing units of capability (auth, db, payments, UI, etc.) in `pack.toml` manifests, with each pack declaring which scaffold templates it is compatible with.
3. A **Bun TypeScript CLI** that resolves capability dependencies, applies pack files, manages env stubs, and seeds board tasks. State is tracked only to support drift detection (`check`); there is no `remove` subcommand because reliable uninstall is too brittle to ship in v1.

The design must hold up under two pressures: agent legibility (planner skills must reason about scaffolds + packs together) and idempotency (a second `add` of the same pack must be a no-op, not a duplicate write).

Reference: `~/codes/fursion/app-project/takeout2` (Bun workspaces, `citty`, `@clack/prompts`, two-package CLI split). We copy that shape directly — both the CLI runtime and the `create-app-skills` initializer are TypeScript packages run by Bun. No Rust, no platform binaries, no native addon.

## Goals / Non-Goals

- **Goals:**
  - Generated app boots with no auth, db, UI lib, or billing — but board workflow is live from minute one.
  - A pack install is a single command and idempotent: running `add` twice produces the same result as running it once.
  - The pack manifest is human-authorable in 5–10 minutes for a new pack.
  - Capability resolution and scaffold-compatibility checks reject ambiguous selections before touching the filesystem.
  - Planning skills emit machine-readable scaffold + pack lists, not prose.
  - Skills authored once propagate to both Claude and Codex without manual mirroring.
  - The scaffold system is open-ended: adding a new template (e.g. `astro`) does not require changes to the CLI core or to existing packs that already declare compatibility.
- **Non-Goals:**
  - Hosting packs outside this monorepo in v1.
  - Shipping concrete `astro`, `astro-starlight`, or `vite-react` base scaffolds in this change. They are registered as supported template names; their files land later.
  - A `remove` / `uninstall` subcommand. Users revert via git.
  - Replacing npm / Bun. Packs do not redo dependency resolution; they enumerate npm deps and let Bun install them.
  - Rust, native addons, or cross-platform binary distribution.
  - GUI tooling.

## Decisions

### Decision 1: CLI is a Bun TypeScript script

- **Decision:** The `app-skills` CLI is a TypeScript package in `packages/cli/` that runs under Bun. `citty` for command parsing, `@clack/prompts` for interactive prompts, `smol-toml` (or equivalent) for `pack.toml` parsing. No Rust, no native addon, no cross-platform binary release pipeline.
- **Alternatives considered:**
  - **Rust binary distributed via npm platform packages** (the `oxlint`/`oxfmt`/`biome` pattern) — fast, single-binary, but doubles the release matrix and adds CI complexity disproportionate to v1 needs.
  - **napi-rs native addon** — callable from JS as a function, but ties releases to Node ABI versions and adds another cross-platform release surface.
- **Why chosen:** Filesystem work in TypeScript on Bun is fast enough for pack-install workloads (tens of files, not gigabytes). The release pipeline is one `bun publish`, not five platform binaries. If hot-path performance ever matters, the script boundary is a clean place to swap in Rust later — but day 1 does not need it.

### Decision 2: Capability tags, not pack names, in `requires` and `conflicts`

- **Decision:** Packs declare relationships using capability strings — including `conflicts`. `requires`, `provides`, and `conflicts` all reference pack-capability tags, never pack names. A pack with `conflicts = ["payments"]` will not coexist with any installed pack that has `payments` in its `provides`. This works in combination with Decision 8 (exclusivity): for capabilities classified exclusive, the resolver automatically rejects double-providers even when packs do not explicitly list each other in `conflicts`.
- **Alternatives considered:**
  - **Hard pack-name requires** (e.g. `requires = ["db-supabase"]`) — simpler resolver but locks the matrix. Swapping `db-supabase` for `db-drizzle-postgres` would require editing every dependent pack.
- **Why chosen:** Keeps the catalog open. New db providers can be added without touching the packs that depend on a `db` capability.

### Decision 3: Manifest format is TOML

- **Decision:** `pack.toml` per pack.
- **Alternatives considered:** JSON (machine-friendly but lousy for human authors), YAML (whitespace footguns, multiple parser dialects).
- **Why chosen:** Rust ecosystem first-class TOML support, no quoting hell, easy to hand-author and diff.

### Decision 4: State file for drift detection only — no uninstall

- **Decision:** `.app-skills/state.json` records every installed pack, the files it wrote, env vars it added, and tasks it seeded — but **only for the purpose of `check`** (drift detection). v1 does not expose a `remove` subcommand. Users who want to undo a pack install do so via git.
- **Alternatives considered:**
  - **Exact uninstall** with content fingerprints and `--force` overrides — designed and rejected. Reversal is brittle in practice: append modes hard to undo cleanly, user edits between install and remove explode into a permissions UX, and the testing surface for "every pack must round-trip" is large.
  - **No state file at all** — would lose `check`. We want drift detection from day 1 (e.g. surfacing missing env vars).
- **Why chosen:** The state file is cheap and useful for `check`. Uninstall is expensive to get right and confusing when wrong. Git is already the reversal mechanism — leaning into it is the smaller, more honest design. If users start asking for `remove` repeatedly, we can add it as a follow-up change with a proper design.

### Decision 5: File `mode` per `[[files]]` entry

- **Decision:** Each file entry declares `mode = "create" | "append" | "merge-json" | "template"`. `create` fails if dest exists; `append` adds idempotently with markers; `merge-json` deep-merges with deterministic key order; `template` applies Handlebars-style substitution from a small `app-skills.config.json` written at init.
- **Alternatives considered:** Single universal "smart copy" — opaque and surprising. Code generation per file — heavyweight.
- **Why chosen:** Explicit, narrow, predictable. The four modes cover every operation in the v1 catalog.

### Decision 6: Skills are mirrored from `.claude/skills/`

- **Decision:** `.claude/skills/` is the canonical source. A small script (`scripts/sync-skills.ts`) generates `.codex/skills/` by walking the source tree and transforming frontmatter (e.g. `allowed-tools` → Codex equivalent if needed). Packs that ship skills place them under `pack/skills/` in the canonical Claude format; the installer copies into both `.claude/skills/` and `.codex/skills/` via the same transform.
- **Alternatives considered:**
  - **Hand-maintain both trees** — drift guaranteed within weeks.
  - **Submodule the Claude tree into Codex tree** — fragile across OSes.
- **Why chosen:** One source of truth, deterministic generation, easy CI check ("regenerate and diff").

### Decision 7: Planner skills emit structured pack lists

- **Decision:** `architecture-cutline` is modified so its output includes a fenced block with `app-skills add ...` commands and a typed list of `provides:` / `requires:` mappings. `pack-resolve` is a new skill that re-runs the recommendation when scope shifts.
- **Why chosen:** Makes the planner's output directly executable. Removes the slack between "we should use Stripe" and "what's the install command."

### Decision 8: Capability tags are classified exclusive or non-exclusive

- **Decision:** Each pack-capability tag is classified at registry definition as either **exclusive** (only one provider allowed per project) or **non-exclusive** (any number of providers may coexist). v1 exclusive caps: `db`, `auth`, `payments`, `ui-kit`, `sync`. v1 non-exclusive caps: `ai-sdk`, `analytics`, `email`, `blob-storage`, `e2e`, `deploy-target`, `local-runtime`. The resolver automatically rejects two packs providing the same exclusive capability. `sync` is exclusive because a project can only sensibly have one sync engine driving the client data model.
- **Alternatives considered:**
  - **Treat every capability as exclusive** — forces explicit `conflicts` lists for legitimate multi-provider categories like `ai-sdk` (users want both Anthropic and OpenAI installed simultaneously).
  - **No exclusivity, rely purely on `conflicts`** — every pack must enumerate every conflicting pack/capability by hand. Boilerplate and error-prone.
- **Why chosen:** Classification at the capability level expresses the intent once and lets every pack inherit it. `conflicts` becomes a narrow escape hatch for cross-category conflicts (rare in v1).

### Decision 9: Pack capabilities and template capabilities live in separate enums

- **Decision:** Two closed enums. Pack capabilities (`db`, `auth`, `payments`, `email`, `ui-kit`, `local-runtime`, `deploy-target`, `e2e`, `ai-sdk`, `blob-storage`, `analytics`, `sync`) describe what packs add to a project. Template capabilities (`static`, `server`, `react`, `native`, `vue`, `svelte`, `mdx-content`, `edge-runtime`) describe what the scaffold itself provides. Packs use `requires` for pack-capabilities and `requires_runtime` for template-capabilities. Templates declare `provides` against the template-capability enum. `native` is included because the `one` template handles native renderers directly; packs that need native APIs declare `requires_runtime = ["native"]`.
- **Alternatives considered:**
  - **One unified enum** — mixes "what kind of thing is this app" with "what kind of feature does it have," and forces semantic acrobatics (e.g. is `server` a feature you "install"?).
  - **Implicit runtime requirements** (infer from pack content) — works for trivial cases, fails the moment a pack needs SSR but doesn't ship server code itself.
- **Why chosen:** Cleanly separates "what runtime does the framework provide" from "what capability does this pack add." Templates evolve independently of packs. A new pack-capability does not require touching the template-capability enum and vice versa.

### Decision 10: Installs are fully declarative — no arbitrary shell commands

- **Decision:** A pack manifest declares files (`[[files]]`), npm dependencies (`[dependencies]`), env vars (`[env]`), skills (`[skills]`), and tasks (`[tasks]`). The CLI executes exactly the implied operations: file copies / templates, `bun add` for declared deps, env-var appends to `.env.example` / `.env.local`. There is no `post_install`, no `hooks`, no `pre_add`, no mechanism for pack authors to inject arbitrary shell commands.
- **Alternatives considered:**
  - **Allow `post_install` shell scripts** — flexible but turns every pack into an audit risk and makes installs non-reproducible across user environments.
  - **Restricted scripting (e.g. a small DSL or sandboxed JS)** — adds runtime surface area for marginal gain.
- **Why chosen:** Declarative installs are auditable, reproducible, and safe to run from agent-driven workflows. If a pack truly needs a setup step that can't be expressed declaratively (e.g. generate a private key), that step lives in a seeded board task the user runs manually after install — not in the pack itself.

### Decision 11: Multi-template scaffold registry, v1 ships nextjs only

- **Decision:** The system supports multiple base scaffold templates through a registry at `templates/<name>/`. A template is a directory containing the base files for that scaffold plus a `template.toml` declaring its name and capabilities (e.g. `static`, `server`, `react`, `native`). Packs declare `compatible_scaffolds = ["nextjs", "one"]` to limit where they can install. v1 names five supported templates — `nextjs`, `astro`, `astro-starlight`, `vite-react`, and `one` (the One full-stack web + native framework) — but only `nextjs` ships a fully-built base in this change. The other four exist as empty directories with a `template.toml` so packs can declare compatibility against them and the planner can recommend them, even though their base scaffolds land in follow-up changes. Expo is deliberately excluded from the v1 template registry: `one` covers the web + native case for now, and we want the catalog to grow when there is a real use case driving it, not preemptively.
- **Alternatives considered:**
  - **Single template, hard-coded Next.js** — simpler now, but every future template addition becomes a refactor. The user explicitly wants the system to be multi-scaffold from the start, even if implementations land incrementally.
  - **Treat scaffold as just another pack** — would let packs `provides = ["framework-nextjs"]`. Conceptually clean but blurs the "scaffolds are pick-one, packs are pick-many" boundary that founders intuitively expect.
- **Why chosen:** Captures the design decision today without inflating v1 scope. The presence of `templates/astro/template.toml` (with no base files) is enough to register `astro` as a valid `--template` value that the CLI will refuse with a clear "not yet implemented" message until its base is filled in. Packs can already mark themselves compatible with future templates.

## Risks / Trade-offs

- **No uninstall** means users who add the wrong pack must `git reset` or selectively revert. Mitigation: the CLI strongly recommends a clean working tree before `add`, and `info`/`--dry-run` makes mistakes cheap to catch before committing.
- **Capability namespace ownership.** If two unrelated packs both `provides = ["db"]`, semantics are ambiguous. Mitigation: capability tags are a closed enum in v1; new tags require a registry-wide PR.
- **Templates registered but not implemented.** A user could try `--template astro` and hit a "not yet implemented" error. Mitigation: `create-app-skills` clearly marks unimplemented templates in its picker (e.g. "(planned)" suffix) and refuses with a pointer to the open issue.
- **Pack-shipped skills can drift from the canonical pack.** Mitigation: validation rejects a pack whose `skills/` references a skill that exists in `.claude/skills/` with different content.
- **Bun version drift between scaffold and CLI.** Mitigation: scaffold pins Bun version in `package.json#engines`; CLI emits a warning if installed Bun is older.
- **No `remove` may be reversed later.** If users repeatedly ask for uninstall, the state file already records enough to support it — but only the file-write operations. Append-mode reversal would still need a separate design pass.

## Migration Plan

This is a greenfield change. No migration of existing user projects is needed for v1. Existing internal artifacts (the 15 skills already under `.claude/skills/` and root `AGENTS.md`) are absorbed:

1. `.claude/skills/` becomes the canonical skill source baked into the scaffold base.
2. `AGENTS.md` is extended (not rewritten) with a pack workflow section.
3. `CLAUDE.md` is authored fresh as part of this change.

No existing data needs transformation.

## Resolved decisions (locked from the original open-questions set)

- **Dry-run:** both surfaces — `app-skills info <pack>` previews, and `app-skills add --dry-run` is an alias.
- **Preset location:** `presets/*.toml` at repo root, read by the CLI at runtime.
- **Pack uninstall:** explicitly out of scope for v1 (no `remove` subcommand, no `pack-uninstall` skill). Users revert via git.
- **CLI implementation:** Bun TypeScript script — not Rust, not napi-rs, not a native addon.
- **Skill mirroring:** `.codex/skills/` is checked into git, regenerated by `scripts/sync-skills.ts`, validated in CI.
- **Multi-scaffold support:** four templates registered for v1 (`nextjs`, `astro`, `astro-starlight`, `vite-react`); only `nextjs` ships a fully-built base in this change.

## Open Questions

- How should the CLI signal a "registered but not yet implemented" template — a discrete `status = "planned"` field in `template.toml`, or inferred from the absence of base files? **Tentative answer:** explicit `status` field. Easier to reason about.
- Should `template.toml` declare what capabilities the template `provides` (e.g. `nextjs` provides `server`, `astro-starlight` provides `static`), so packs can require capabilities rather than specific template names? **Tentative answer:** yes, but the v1 spec uses both `compatible_scaffolds` (concrete names) and provided capabilities so packs can choose the narrower or broader constraint.
