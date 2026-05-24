## Context

This change does three things at once: (1) splits the v1 pack catalog into two install modes (`copy` and `hybrid`), (2) extracts shared logic into versioned npm packages under `@forgeailab/spark-*`, and (3) introduces a reference app that drives the build order and serves as the acceptance harness for the extracted libraries.

Three pressures motivate the bundle. **Pressure one:** several v1 packs duplicate the same runtime logic across every consumer (Better Auth session middleware, Zero schema definitions, Stripe webhook verification, Anthropic SSE streaming). File-copy means a bug fix in those patterns takes a `pack-update` migration we have not built and do not want to build. **Pressure two:** internal CLI primitives (`.ai/board.md` parsing, skill frontmatter transforms, `.spark/state.json` IO) need to be reused by `create-spark`, future tooling, and Forge — extracting them into typed packages is overdue. **Pressure three:** we have not yet proved that the planned hybrid pack libraries cohere into a real working app. Without a reference, we are extracting libraries based on guesses. Building one complete integrated app first turns those guesses into observations.

Reference: `~/codes/fursion/app-project/takeout2` for the pattern of shipping `better-auth-utils` and `on-zero` as monorepo-internal packages that consumer scaffolds import directly. We adopt that shape under `libs/`.

## Goals / Non-Goals

- **Goals:**
  - A working `reference/full-stack-saas/` Next.js app boots and demos every planned hybrid pack capability before any extraction begins.
  - Extracting from a working reference is mechanical — `mv` + workspace dep + import path swap — not design.
  - One additive manifest field (`[runtime_package]`) cleanly expresses "this pack imports from a versioned npm helper".
  - The CLI's install code path stays a single function — `hybrid` packs are just `copy` packs with one extra step (the `bun add`).
  - Workflow primitives (`spark-board`, `spark-skill-utils`, `spark-state`) replace ad-hoc duplication inside the CLI.
  - After extraction, scaffolding from `templates/nextjs` + `spark preset saas-classic-plus` (or equivalent) converges on the reference app's behavior. The reference app is the test.
- **Non-Goals:**
  - A formal "this is a copy pack" / "this is a hybrid pack" classification field. The model is inferred from presence/absence of `[runtime_package]`.
  - Pinning pack manifest version to helper package version. Each is semver-independent.
  - Stripping copied files from a pack on upgrade. There is no `pack-update` story; users `git revert` and reinstall.
  - Making helper packages framework-agnostic if the runtime they wrap is framework-specific. `spark-stripe-helpers` will assume Next.js App Router for v1; framework abstraction comes if a second framework adopts the pack.
  - Multiple reference apps in v1.

## Decisions

### Decision 1: Three top-level workspace directories — `packages/`, `libs/`, `packs/`

- **Decision:** The monorepo grows a `libs/` directory alongside `packages/` and `packs/`.
  - `packages/` holds platform tooling: `@forgeailab/spark` (CLI), `@forgeailab/create-spark` (initializer), `@forgeailab/spark-schema` (Zod schemas — the only "library" colocated with tooling because tooling owns the schema source of truth).
  - `libs/` holds runtime libraries: workflow primitives (`spark-board`, `spark-skill-utils`, `spark-state`) and pack helpers (`spark-auth-better-auth`, `spark-sync-zero`, `spark-stripe-helpers`, `spark-anthropic`).
  - `packs/` holds pack manifests and the file-copy trees the user takes ownership of (unchanged role; smaller content for hybrid packs).
  - Root `package.json` workspaces pattern becomes `["packages/*", "libs/*", "reference/*"]`.
- **Alternatives considered:**
  - Single `packages/` directory for everything. Hides the conceptual line between "platform" and "library" and "user-owned scaffold". Reviewers can't tell at a glance whether a workspace is for the tool, for consumers to import from, or both.
  - Two directories — `packages/` for everything published, `packs/` for user-owned. Mixes tooling and libraries; would require naming conventions or prefixes to disambiguate.
- **Why chosen:** Each directory's purpose is unambiguous. `libs/` reads as "things you import from"; `packages/` reads as "the tool itself"; `packs/` reads as "code you'll own once installed". This also matches how a reader navigates: looking for "what does spark ship as a library?" → `libs/`. Looking for "what does the CLI do?" → `packages/`.

### Decision 2: Reference app drives the build order — extract from a working integration, not toward one

- **Decision:** Phase 0 of this change is building `reference/full-stack-saas/` as a complete, runnable Next.js 15 app that integrates Better Auth + Zero + Stripe + Anthropic + Resend + shadcn end-to-end on top of SQLite. No `libs/spark-*` exists yet; the reference app contains all the logic inline. Phase 1 extracts that logic, one library at a time, with the reference app's continued boot-and-test as the acceptance bar. Phase 2 authors the pack manifests from the thin wiring left in the reference app after each extraction. Phase 3 validates by scaffolding a fresh app and installing the packs.
- **Alternatives considered:** Extract libraries directly from the existing per-pack `files/` content, no reference app. Faster start, but each library is designed in isolation and may fail to compose. We already did the inverse on `payments-stripe`'s current files — they look fine in isolation but have not been exercised next to a real `auth-better-auth` flow.
- **Why chosen:** Working integrated code is the cheapest design tool. Extracting from it is mechanical; designing toward an unknown target is not. The reference app also becomes a durable artifact: future contributors run it to understand the integrated experience, and it serves as the e2e test for the catalog.

### Decision 3: Reference app uses bun workspaces — extracted libs are imported as `workspace:*`

- **Decision:** During Phases 0–2, `reference/full-stack-saas/package.json` lists `@forgeailab/spark-auth-better-auth`, `spark-sync-zero`, etc. with `workspace:*` once the corresponding libraries exist. Bun's workspace resolver links them automatically. After every Phase 1 extraction, the reference app's test command (`bun dev`, `bun test`, or a smoke route) must continue passing.
- **Alternatives considered:** Have the reference app `bun add @forgeailab/spark-*` against a published or canary npm registry. Adds publish friction to every extraction step. Slower iteration.
- **Why chosen:** Local workspace resolution makes the extraction loop tight (edit lib → reference app sees it on save). Publishing comes only when v1 ships.

### Decision 4: One additive manifest field — `[runtime_package]`

- **Decision:** A pack manifest MAY declare an optional `[runtime_package]` table with two fields: `package` (full npm package name, e.g. `"@forgeailab/spark-auth-better-auth"`) and `version` (semver range, e.g. `"^0.1"`). When present, the CLI treats the pack as `hybrid`: it adds the named package to `[dependencies].runtime` for the install and verifies its presence in `check`.
- **Alternatives considered:**
  - Add a `mode = "copy" | "hybrid"` field that defaults to `"copy"`. Redundant — `[runtime_package]` presence already carries that signal.
  - Allow multiple runtime helpers per pack. YAGNI for v1.
- **Why chosen:** One optional block. Pack authors and reviewers can read `pack.toml` and immediately see whether the pack is hybrid. The CLI's branching is one conditional.

### Decision 5: Hybrid packs ship wiring only — substantive logic stays in `libs/`

- **Decision:** For `hybrid` packs, the pack's `[[files]]` entries copy ONLY: (a) thin route handlers / API endpoints that wire the helper to the consumer's framework, (b) config files (e.g. `auth.config.ts`), (c) example UI components (e.g. login form), (d) types re-exports if useful. They MUST NOT duplicate logic that the helper library owns. The library is the single source of truth for that logic.
- **Why chosen:** Otherwise the bug-fix problem reappears at the seam between the copied wiring and the imported helper. If the helper's signature changes, the wiring is one file to update per consumer instead of one whole module.

### Decision 6: Helper is an implicit dep added by the CLI; `[dependencies].runtime` MUST NOT redeclare it

- **Decision:** For a hybrid pack, the helper package is declared exactly once — inside the `[runtime_package]` table. The CLI implicitly adds it to the install batch (`bun add <helper>@<version-range>`) at install time. The pack manifest's `[dependencies].runtime` array MUST NOT also list the helper package. Transitive deps of the helper (`better-auth`, `stripe`, `@rocicorp/zero`, `@anthropic-ai/sdk`) live in the helper's own `package.json` dependencies and resolve through bun — they MUST NOT appear in the pack manifest either.
- **Alternatives considered:**
  - Have the pack manifest's `[dependencies].runtime` include the helper alongside `[runtime_package]`. Two declarations, two places to forget to update, double-install risk if the CLI doesn't dedupe.
  - Have the pack manifest enumerate the helper's transitive deps as a "peer deps" hint. Duplication of the helper's own `package.json`, drifts the moment the helper's deps change.
- **Why chosen:** Single source of truth for "this pack uses helper X at range Y" is `[runtime_package]`. Single source of truth for "the helper needs `better-auth`" is the helper's `package.json`. The CLI's install path becomes: collect explicit `[dependencies].runtime`, append the resolved helper from `[runtime_package]` (if any), call `bun add` once. No deduplication logic needed because no duplication is allowed.

### Decision 7: `spark-state` is an ergonomic wrapper, not a re-implementation

- **Decision:** `@forgeailab/spark-state` wraps the `StateFile` Zod schema (already in `@forgeailab/spark-schema`) with typed `readState(projectRoot)`, `writeState(projectRoot, state)`, and `withState(projectRoot, mutator)` helpers. It does NOT duplicate the schema.
- **Why chosen:** State IO is a tiny, repeated operation across CLI and downstream tooling. Wrapping it saves duplicated reads downstream while keeping schema and IO concerns separate.

### Decision 8: Skills do not move to a workspace package

- **Decision:** Skills stay as files under `.claude/skills/` (canonical) mirrored to `.codex/skills/`. They are NOT extracted into an `@forgeailab/spark-skills` package. The `scripts/sync-skills.ts` mirror already covers the cross-tool surface.
- **Why chosen:** Skills are markdown for AI agents to read in-place — they aren't imported as code, they're discovered by directory scan. Wrapping them in an npm package adds packaging overhead with no payoff.

### Decision 9: The classification "copy vs hybrid" is documented per pack, not enforced at the registry level

- **Decision:** No new field, enum, or category to flag a pack as `copy` or `hybrid`. The classification is whatever `[runtime_package]` presence says. `packs/README.md` documents the v1 split for readers.
- **Why chosen:** One source of truth per pack. Two would drift.

### Decision 10: Reference app uses SQLite + Better Auth, not Supabase

- **Decision:** `reference/full-stack-saas/` installs `db-sqlite` (copy pack), `auth-better-auth` (hybrid via `libs/spark-auth-better-auth`), `sync-zero` (hybrid), `payments-stripe` (hybrid), `email-resend` (copy), `ai-anthropic` (hybrid), `ui-shadcn` (copy), and `deploy-vercel` (copy).
- **Alternatives considered:** Use Supabase + auth-supabase. Reasonable but adds an external service dependency at run time. SQLite + Better Auth boots offline.
- **Why chosen:** Reference app must boot on `bun dev` without any external account setup. SQLite + Better Auth is self-contained. Supabase variants can be a second reference later.

### Decision 11: CLI uses workspace `file:` links for unpublished helpers in dev mode

- **Decision:** When `spark add` resolves a hybrid pack's `[runtime_package]` and `SPARK_ROOT` points at a monorepo where `libs/<helper-name>/` exists, the CLI MUST link the helper into the consumer's `package.json` using a `file:` dep pointing at the absolute (or `..`-relative) path of the workspace package, NOT using the manifest's `version` range. The version range is only consulted when no local copy is found — i.e., when running against a published catalog. This lets `spark add` work end-to-end pre-publish.
- **Alternatives considered:**
  - Spin up a local Verdaccio registry per validation run. Adds CI/dev complexity for a step that is purely about pre-publish smoke testing.
  - Skip the fresh-scaffold acceptance entirely; let the reference app's `workspace:*` integration be the only acceptance bar. Acceptable, but loses the "install path also works" guarantee.
  - Always use `file:` (drop the range concept entirely). Breaks the published case — a downstream consumer who runs `spark add auth-better-auth` should get the version from npm, not a `file:` link to a path that doesn't exist on their machine.
- **Why chosen:** A two-mode resolver is small, well-bounded, and matches how monorepo tools already think about `workspace:*` vs npm specifiers. The dev path becomes: `SPARK_ROOT` set + `libs/<name>/` exists → `file:` link. The published path becomes: `SPARK_ROOT` not set OR `libs/<name>/` absent → `<helper>@<range>` from the manifest. Both paths exercise the same install code; only the version specifier differs.

## Risks / Trade-offs

- **Reference app expands scope.** Building one complete app first looks like a bigger change. Mitigation: the reference app's code mostly becomes `libs/` content via straightforward `mv` — it isn't throwaway work. The integration time we'd spend later debugging mismatched library APIs collapses into the reference-app build phase.
- **Version skew at install time.** Pack manifest pins helper version (`version = "^0.1"`). If the helper has a v0.2 with breaking changes and the pack manifest hasn't been updated, consumers get the latest matching v0.1.x. We accept this — it's how every npm dep already works.
- **Pre-publish friction.** Helpers don't exist on npm yet; `bun add @forgeailab/spark-auth-better-auth` from a scaffolded project will fail until publish. Mitigation: while developing, `spark add` on a project inside the monorepo resolves the workspace dep locally. For external testing during this change, the reference app exercises every helper directly via `workspace:*` resolution.
- **Pack helper boundary is hard to police.** Nothing structurally prevents a pack author from copying logic into the pack's `[[files]]` even when a helper exists. Mitigation: PR review + a `risk-check` rule that flags hybrid packs whose copied files exceed a size threshold.
- **Helper-per-pack proliferation.** Long term this could become dozens of small packages. Mitigation: keep the bar high — extract only when the pack repeats meaningful logic across consumers.
- **`libs/` vs `packages/` is a soft boundary.** Some libraries (spark-schema) are arguably both library and platform component. We pick a home and document it. Mitigation: every library has a one-line "Why is this in libs/ vs packages/?" note in its README.

## Migration Plan

This change is greenfield with respect to consumers (spark is pre-publish). Internal migration steps follow the four-phase build order:

1. **Phase 0 — Build the reference app.** `reference/full-stack-saas/` is created as a complete Next.js 15 + SQLite + Better Auth + Zero + Stripe + Anthropic + Resend + shadcn integration. All logic lives inline. App boots, login works, a test checkout flow works, a Zero-synced demo entity round-trips.
2. **Phase 1 — Extract libraries one by one.** For each planned library, the reference app's relevant code is moved into `libs/<name>/`, the reference app gains a `workspace:*` dep, imports are swapped. After each extraction the reference app's smoke test must pass.
3. **Phase 2 — Author/update pack manifests.** For each hybrid pack, its `pack.toml` is updated with `[runtime_package]` pointing at the new `libs/` package, and its `[[files]]` are trimmed to the thin wiring that remains in the reference app.
4. **Phase 3 — Validate via fresh scaffold.** From `/tmp/spark-smoke`, run `bunx create-spark demo --template nextjs`, then `spark add` each pack. The resulting app's behavior must match the reference app on the smoke routes.

Existing scaffolded projects (only `/tmp/demo-spark` exists in dev) are not migrated.

## Resolved decisions (locked)

- **Directory layout:** three top-level dirs — `packages/` (platform), `libs/` (libraries), `packs/` (user-owned scaffold trees). Plus `reference/` for the validation app.
- **Build order:** reference-app-first, then extract, then update manifests, then validate by fresh scaffold.
- **Install-mode signal:** presence/absence of `[runtime_package]` block — no separate `mode` field.
- **v1 helper roster:** `spark-auth-better-auth`, `spark-sync-zero`, `spark-stripe-helpers`, `spark-anthropic`. Plus workflow primitives `spark-board`, `spark-skill-utils`, `spark-state`.
- **Other pack changes:** the ten remaining packs stay `copy` in this change.
- **Reference app stack:** Next.js 15 + SQLite + Better Auth + Zero + Stripe + Anthropic + Resend + shadcn. One reference, not multiple.

## Open Questions

- Should `spark info <hybrid-pack>` print the resolved helper version (looked up from `bun pm ls`) or just the version range from `pack.toml`? **Tentative answer:** both.
- For `auth-better-auth`, does the helper export a `createAuth({ adapter })` factory, or does the copied wiring construct the auth instance with a pack-shipped factory? **Tentative answer:** helper exports the factory; copied wiring is the one-line `export const auth = createAuth({ adapter: drizzleAdapter(db) });`.
- Does the reference app live in git or get gitignored once the libs are extracted? **Tentative answer:** lives in git permanently; it is the e2e test harness.
- Should the reference app be a registered template (selectable via `create-spark --template full-stack-saas`)? **Tentative answer:** no — it is a reference, not a scaffold. Users should not start projects from it.
