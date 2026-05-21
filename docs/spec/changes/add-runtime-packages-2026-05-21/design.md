## Context

This change splits the v1 pack catalog into two install modes — `copy` and `hybrid` — and extracts shared logic into versioned npm packages under `@forgeailab/anvil-*`. The unit of distribution stays the same (the `pack.toml` manifest); what changes is how a pack's runtime behavior gets into a consumer project.

Two pressures motivate the split. First, several v1 packs duplicate the same runtime logic across every consumer (Better Auth session middleware, Zero schema definitions, Stripe webhook verification, Anthropic SSE streaming). File-copy means a bug fix in those patterns takes a `pack-update` migration we have not built and do not want to build. Second, internal CLI primitives (`.ai/board.md` parsing, skill frontmatter transforms, `.anvil/state.json` IO) need to be reused by `create-anvil`, future tooling, and Forge — extracting them into typed packages is overdue.

Reference: `~/codes/fursion/app-project/takeout2` for the pattern of shipping `better-auth-utils` and `on-zero` as monorepo-internal packages that consumer scaffolds import directly. We adopt that shape.

## Goals / Non-Goals

- **Goals:**
  - One additive manifest field (`[runtime_package]`) cleanly expresses "this pack imports from a versioned npm helper".
  - The CLI's install code path stays a single function — `hybrid` packs are just `copy` packs with one extra step (the `bun add`).
  - Workflow primitives (`anvil-board`, `anvil-skill-utils`, `anvil-state`) replace ad-hoc duplication inside the CLI without changing CLI behavior.
  - Four pack helpers ship in v1 to prove the model; the rest of the catalog migrates later, one pack at a time.
  - A pack author looking at `pack.toml` can tell at a glance whether the pack ships a runtime helper.
- **Non-Goals:**
  - A formal "this is a copy pack" / "this is a hybrid pack" classification field. The model is inferred from presence/absence of `[runtime_package]`.
  - Pinning pack manifest version to helper package version. Each is semver-independent.
  - Republishing helper packages as ESM-only or CJS-only — both shapes are supported via standard `exports` map.
  - Stripping copied files from a pack on upgrade. There is no `pack-update` story; users `git revert` and reinstall.
  - Making helper packages framework-agnostic if the runtime they wrap is framework-specific. `anvil-stripe-helpers` will assume Next.js App Router for v1; framework abstraction comes if a second framework adopts the pack.

## Decisions

### Decision 1: One additive manifest field — `[runtime_package]`

- **Decision:** A pack manifest MAY declare an optional `[runtime_package]` table with two fields: `package` (full npm package name, e.g. `"@forgeailab/anvil-auth-better-auth"`) and `version` (semver range, e.g. `"^0.1"`). When present, the CLI treats the pack as `hybrid`: it adds the named package to `[dependencies].runtime` for the install and verifies its presence in `check`.
- **Alternatives considered:**
  - Add a `mode = "copy" | "hybrid"` field that defaults to `"copy"`. Redundant — `[runtime_package]` presence already carries that signal, and a separate field could disagree with reality.
  - Allow listing multiple runtime helpers per pack. Defeats the "one package, one source of truth" intent; YAGNI for v1.
- **Why chosen:** Single optional block keeps the schema small. Pack authors and reviewers can read `pack.toml` and immediately see whether the pack is hybrid. The CLI's branching is `if (manifest.runtime_package) { … add it … }` — one conditional, not a strategy pattern.

### Decision 2: Runtime helpers live in `packages/anvil-<name>/`, not `packs/<name>/runtime/`

- **Decision:** Each runtime helper is a first-class workspace package under `packages/`, with its own `package.json`, `src/`, `test/`, and `README.md`. The pack's `pack.toml` references it by npm name, not by relative path.
- **Alternatives considered:**
  - Co-locate the helper under `packs/<name>/runtime/` and publish from there. Couples the helper's release cadence to the pack's catalog. Reuse across multiple packs becomes awkward.
  - Single `packages/anvil-helpers/` package that re-exports everything. Pack authors would lose the ability to add a pack helper without touching a giant central package. Tree-shaking matters less than maintainability.
- **Why chosen:** Helpers are independent npm units. A consumer with `bun add @forgeailab/anvil-auth-better-auth` should not also drag `anvil-stripe-helpers` into their bundle. Separation matches the Forge precedent (Forge's `crates/forge-*` are sibling crates, not sub-modules of one parent).

### Decision 3: Workflow primitives are extracted *during* this change, not after

- **Decision:** `anvil-board`, `anvil-skill-utils`, and `anvil-state` ship as part of this change, and the CLI is refactored to consume them. The pack helpers (`anvil-auth-better-auth`, etc.) can technically land later, but the workflow primitives go in this change because four downstream tasks (board seeding, skill frontmatter transforms, state-file drift detection) all touch the same ad-hoc code today and will collide if we wait.
- **Alternatives considered:** Ship pack helpers first, leave primitives as TODO. Risks repeated rebases on the affected CLI files as multiple pack-helper extractions land.
- **Why chosen:** One refactor, one diff. Future work consumes already-stable internal packages.

### Decision 4: v1 helper roster is exactly four packs

- **Decision:** Four packs gain runtime helpers in this change: `auth-better-auth`, `sync-zero`, `payments-stripe`, `ai-anthropic`. The other ten packs stay `copy`.
- **Alternatives considered:**
  - Convert all 7 candidates (the above plus `ai-openai`, `db-supabase`, `analytics-posthog`). Doubles the surface area of this change without proving the model further.
  - Convert only 2 (`auth-better-auth`, `sync-zero`). Helper packages would feel like a special case rather than a pattern.
- **Why chosen:** Four packs is enough to prove that the install path scales (auth + sync + payments + AI cover the most divergent shapes — request/response handlers, schema definitions, webhook verification, streaming) without doubling the change size. Remaining packs migrate in a follow-up after we see the v1 four-pack experience.

### Decision 5: Pack copied files for hybrid packs contain wiring only

- **Decision:** For `hybrid` packs, the pack's `[[files]]` entries copy ONLY: (a) thin route handlers / API endpoints that wire the helper to the consumer's framework, (b) config files (e.g. `auth.config.ts`), (c) example UI components (e.g. login form), (d) types re-exports if useful. They MUST NOT duplicate logic that the helper package owns. The helper package is the single source of truth for that logic.
- **Why chosen:** Otherwise the bug-fix problem reappears at the seam between the copied wiring and the imported helper. If the helper's signature changes, the wiring is one file to update per consumer instead of one whole module.

### Decision 6: Helper packages take dependencies in their own `package.json`, not in the pack manifest

- **Decision:** `@forgeailab/anvil-auth-better-auth` declares its own `dependencies` (e.g. `better-auth`). The pack's `pack.toml [dependencies].runtime` list only the runtime helper itself; transitive deps come along through npm/bun. The pack manifest does NOT redeclare `better-auth`.
- **Alternatives considered:** Have the pack manifest list `better-auth` as a peer dep so version skew is explicit at install time. Adds review burden and divergence between pack manifest and helper package.lock.
- **Why chosen:** npm/bun already handle transitive dep resolution. Duplicating the dep list in the pack manifest is one more place to forget to update.

### Decision 7: `anvil-state` exists as an ergonomic wrapper, not a re-implementation

- **Decision:** `@forgeailab/anvil-state` wraps the `StateFile` Zod schema (already in `@forgeailab/anvil-schema`) with typed `readState(projectRoot)`, `writeState(projectRoot, state)`, and `withState(projectRoot, mutator)` helpers. It does NOT duplicate the schema. Callers who only need the type continue to import directly from `@forgeailab/anvil-schema`.
- **Alternatives considered:** Fold state IO into `anvil-board` since both touch project filesystem. Conflates two concerns — board state is user-editable, `.anvil/state.json` is machine-managed.
- **Why chosen:** State IO is a tiny, repeated operation across CLI and downstream tooling. Wrapping it in five lines saves dozens of duplicated reads downstream. Keeping it separate from `anvil-schema` preserves "schema package has no IO" as an invariant.

### Decision 8: Skills do not move to a workspace package

- **Decision:** Skills stay as files under `.claude/skills/` (canonical) mirrored to `.codex/skills/`. They are NOT extracted into an `@forgeailab/anvil-skills` package. The two existing distribution mechanisms (templates ship skills baked-in via the initializer copy; packs ship skills under `packs/<name>/skills/`) continue.
- **Alternatives considered:** Publish skills as an npm package and have the initializer/CLI fetch from it. Lets shared skills update independently of the scaffold release.
- **Why chosen:** Skills are markdown for AI agents to read in-place — they aren't imported as code, they're discovered by directory scan. Wrapping them in an npm package adds packaging overhead with no payoff (no compiler, no version-pinning, no tree-shaking). The `scripts/sync-skills.ts` mirror already covers the cross-tool surface.

### Decision 9: The classification "copy vs hybrid" is documented per pack, not enforced at the registry level

- **Decision:** No new field, enum, or category to flag a pack as `copy` or `hybrid`. The classification is whatever `[runtime_package]` presence says. `packs/README.md` documents the v1 split for readers.
- **Why chosen:** One source of truth per pack. Two would drift.

## Risks / Trade-offs

- **Version skew at install time.** Pack manifest pins helper version (`version = "^0.1"`). If the helper has a v0.2 with breaking changes and the pack manifest hasn't been updated, consumers get the latest matching v0.1.x. We accept this — it's how every npm dep already works. Pack authors must bump their manifest's version range alongside helper breaking releases.
- **Pre-publish friction.** Helpers don't exist on npm yet; `bun add @forgeailab/anvil-auth-better-auth` from a scaffolded project will fail until publish. Mitigation: while developing, `anvil add` on a project inside the monorepo resolves the workspace dep locally. For external testing, an npm dry-run step or a private registry is needed. Documented in `packages/<helper>/README.md`.
- **Pack helper boundary is hard to police.** Nothing structurally prevents a pack author from copying logic into the pack's `[[files]]` even when a helper exists. Mitigation: PR review + a `risk-check` rule that flags hybrid packs whose copied files exceed a size threshold.
- **Helper-per-pack proliferation.** Long term this could become dozens of small packages. Mitigation: keep the bar high — extract only when the pack repeats meaningful logic across consumers. The four v1 candidates are explicitly the ones that crossed the bar.
- **Reusing helpers across Forge / future products.** `@forgeailab/anvil-board` is named `anvil-board` because it owns `.ai/board.md`. If Forge later wants the same primitive, the naming is right but the home-of-truth is anvil. If Forge needs different semantics, it gets its own package; we don't fork by adding flags.
- **No `pack-update` story.** A consumer who installed `auth-better-auth` at helper v0.1 and wants v0.2's bug fixes runs `bun add @forgeailab/anvil-auth-better-auth@latest` manually. The pack manifest is not what flows the update. We accept this — it's how every npm dep already works.

## Migration Plan

This change is greenfield with respect to consumers (anvil is pre-publish). Internal migration steps:

1. Land the three workflow-primitive packages (`anvil-board`, `anvil-skill-utils`, `anvil-state`) and refactor CLI to consume them.
2. Land each pack helper (`anvil-auth-better-auth`, `anvil-sync-zero`, `anvil-stripe-helpers`, `anvil-anthropic`) one PR at a time. Each PR updates exactly one pack from `copy` to `hybrid` and trims `[[files]]` to wiring only.
3. Update `docs/pack-spec.md`, `packs/README.md`, and the affected skills in one final docs pass.

Existing scaffolded projects (only `/tmp/demo` exists in dev) are not migrated; they predate the rename and will be re-scaffolded.

## Resolved decisions (locked)

- **Install-mode signal:** presence/absence of `[runtime_package]` block — no separate `mode` field.
- **Helper package location:** `packages/anvil-<name>/`, sibling to existing workspace packages.
- **v1 helper roster:** `anvil-auth-better-auth`, `anvil-sync-zero`, `anvil-stripe-helpers`, `anvil-anthropic`. Plus workflow primitives `anvil-board`, `anvil-skill-utils`, `anvil-state`.
- **Other pack changes:** the ten remaining packs stay `copy` in this change.
- **Skills:** stay markdown, not extracted into a workspace package.

## Open Questions

- Should `anvil info <hybrid-pack>` print the resolved helper version (looked up from the helper's `package.json`) or just the version range from `pack.toml`? **Tentative answer:** both — show `range "^0.1"` from the manifest and `resolved 0.1.4` from `bun pm`.
- For `auth-better-auth`, the helper needs the consumer's db adapter wired in. Does the helper export a `createAuth({ adapter })` factory, or does the copied wiring construct the auth instance with a pack-shipped factory? **Tentative answer:** helper exports the factory; copied wiring is `import { createAuth } from '@forgeailab/anvil-auth-better-auth'; export const auth = createAuth({ adapter: drizzleAdapter(db) });`.
- Should the helper packages have their own `tasks.yaml` board seeds, or do the pack manifests stay the only source of seeded tasks? **Tentative answer:** packs only. Helpers are libraries, not workflow units.
