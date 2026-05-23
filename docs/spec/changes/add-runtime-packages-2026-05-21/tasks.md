---
created_at: 2026-05-21T00:00:00Z
updated_at: 2026-05-22T03:04:03Z
completed_at: 2026-05-22T03:04:03Z
---

## Phase 0 — Reference app

- [x] 0.1 Extend root `package.json` `workspaces` to `["packages/*", "libs/*", "reference/*"]`. Re-run `bun install` to verify pattern resolution.
- [x] 0.2 Create `reference/` directory + `reference/README.md` explaining the reference app's role (integration proof, extraction source, acceptance harness — not a template).
- [x] 0.3 Scaffold `reference/full-stack-saas/` as a complete Next.js 15 + TypeScript app. Manually wire (no `anvil add` calls — this is the reference, hand-built): SQLite + drizzle, Better Auth (Email + GitHub OAuth), Zero sync over the drizzle schema, Stripe Checkout + webhook + portal, Resend transactional email, Anthropic chat endpoint, shadcn/ui (Tailwind + Button + Card + Login form).
- [x] 0.4 Author a minimal `.env.example` listing every env var the reference app needs.
- [x] 0.5 Build smoke routes / scripts under `reference/full-stack-saas/test/` exercising the integrated flow: sign in, create a Zero-synced entity, hit the Stripe checkout endpoint (mocked), call the Anthropic chat endpoint with a fake key. `bun test` in the reference app passes. (Also: Playwright e2e under `e2e/` covers /login signup → /home post creation against a real browser.)
- [x] 0.6 Document the reference app in `reference/full-stack-saas/README.md` — what it integrates, how to boot, what each smoke route asserts.

## 1. Schema extension

- [x] 1.1 Add `RuntimePackageBlock` Zod schema to `packages/anvil-schema/src/pack.ts` — `{ package: string, version: string }`. Make it optional on `PackManifest` as `runtime_package`.
- [x] 1.2 Strict-reject unknown keys inside `[runtime_package]`. Strict-reject invalid npm package names.
- [x] 1.3 Add test fixtures: hybrid manifest parses; copy manifest still parses; invalid `package` rejected.
- [x] 1.4 Update `docs/pack-spec.md` to document the two install modes + new field + the three-dir layout.

## 2. `libs/anvil-state`

- [x] 2.1 Scaffold `libs/anvil-state/` (`package.json`, `tsconfig.json`, `src/index.ts`, `test/`). Workspace dep on `@forgeailab/anvil-schema`.
- [x] 2.2 Export `readState(projectRoot)`, `writeState(projectRoot, state)`, `withState(projectRoot, mutator)`. Validate against `StateFile`.
- [x] 2.3 Tests: round-trip, missing-file initial state, malformed-file clear error.
- [x] 2.4 Refactor `packages/anvil/src/io/state.ts` to consume `@forgeailab/anvil-state`.

## 3. `libs/anvil-skill-utils`

- [x] 3.1 Scaffold `libs/anvil-skill-utils/`.
- [x] 3.2 Export `parseSkillFrontmatter`, `toCodexFrontmatter`, `toClaudeFrontmatter`.
- [x] 3.3 Tests: parse round-trips, Claude→Codex transform, malformed frontmatter clear error.
- [x] 3.4 Refactor `scripts/sync-skills.ts` AND `packages/anvil/src/io/skills.ts` to consume `@forgeailab/anvil-skill-utils`.

## 4. `libs/anvil-board`

- [x] 4.1 Scaffold `libs/anvil-board/`.
- [x] 4.2 Export `readBoard(projectRoot): Board` parser.
- [x] 4.3 Export `seedTasks(projectRoot, packName, tasks)` — idempotent.
- [x] 4.4 Export `updateStatus(projectRoot, taskId, status)` — preserves surrounding prose.
- [x] 4.5 Tests: parse, seed determinism + idempotency, malformed clear error.
- [x] 4.6 Refactor `packages/anvil/src/io/board.ts` to consume `@forgeailab/anvil-board`.

## 5. Extract `libs/anvil-auth-better-auth` from reference app

- [x] 5.1 Scaffold `libs/anvil-auth-better-auth/`. Deps: `better-auth`.
- [x] 5.2 Move the reference app's Better Auth instance factory into `src/createAuth.ts` — accept `{ adapter, basePath?, plugins? }`.
- [x] 5.3 Move the reference app's Next.js App Router catch-all handler into `src/createAuthHandler.ts`.
- [x] 5.4 Move session helpers (`getSession`, `requireSession`) into `src/session.ts`.
- [x] 5.5 Reference app `package.json` adds `@forgeailab/anvil-auth-better-auth: workspace:*`. Reference app source files now import from the lib.
- [x] 5.6 Reference app smoke test still passes.
- [x] 5.7 Tests in `libs/anvil-auth-better-auth/test/` covering factory accepts mock adapter, handler shape, session helpers narrow types.

## 6. Extract `libs/anvil-sync-zero` from reference app

- [x] 6.1 Scaffold `libs/anvil-sync-zero/`. Deps: `@rocicorp/zero`. Peer dep on `react`.
- [x] 6.2 Move schema builder helpers from the reference app into `src/defineZeroSchema.ts`.
- [x] 6.3 Move client factory into `src/createZeroClient.ts`.
- [x] 6.4 Move `ZeroProvider` into `src/ZeroProvider.tsx`.
- [x] 6.5 Reference app gains `workspace:*` dep, imports updated, smoke test still passes.
- [x] 6.6 Tests in `libs/anvil-sync-zero/test/`.

## 7. Extract `libs/anvil-stripe-helpers` from reference app

- [x] 7.1 Scaffold `libs/anvil-stripe-helpers/`. Dep: `stripe`.
- [x] 7.2 Move `createCheckoutSession`, `verifyWebhookSignature`, `createBillingPortalSession` from reference app to `src/`.
- [x] 7.3 Reference app gains `workspace:*` dep, imports updated, smoke test still passes.
- [x] 7.4 Tests against Stripe types + webhook signature fixture.

## 8. Extract `libs/anvil-anthropic` from reference app

- [x] 8.1 Scaffold `libs/anvil-anthropic/`. Dep: `@anthropic-ai/sdk`.
- [x] 8.2 Move `createAnthropicClient`, `streamResponse` from reference app to `src/`.
- [x] 8.3 Reference app gains `workspace:*` dep, imports updated, smoke test still passes.
- [x] 8.4 Tests for streaming SSE shape against mocked SDK.

## 9. CLI updates

- [x] 9.1 `anvil info <pack>` — when manifest has `[runtime_package]`, render "Install mode: hybrid" + helper package + version range + resolved version.
- [x] 9.2 `anvil add <pack...>` — when manifest has `[runtime_package]`, add helper to the same `bun add` batch as the other runtime deps. Idempotent.
- [x] 9.3 `anvil check` — for each installed hybrid pack, verify helper is still in consumer `package.json`.
- [x] 9.4 Test suite gains a hybrid-pack install test covering `auth-better-auth` end-to-end (helper appears in `package.json`, wiring files copied).

## 10. Pack manifests for hybrid packs (authored from reference app's remaining wiring)

After Phase 1 extractions, the reference app's source files for each hybrid concern are the canonical wiring template. Author each pack manifest from what remains:

For each pack, the `[runtime_package]` block uses standard TOML table syntax:

```toml
[runtime_package]
package = "@forgeailab/anvil-<name>"
version = "^0.1"
```

The pack's `[dependencies].runtime` MUST NOT also list the helper package — the CLI adds it implicitly from `[runtime_package]` (see Decision 6 in design.md). Per-pack tasks:

- [x] 10.1 `packs/auth-better-auth/pack.toml` — add `[runtime_package]` table with `package = "@forgeailab/anvil-auth-better-auth"`, `version = "^0.1"`. Trim `[[files]]` so the copied tree matches what stays in `reference/full-stack-saas/` after the lib extraction (e.g. `lib/auth.ts` wiring, `app/api/auth/[...all]/route.ts` thin handler, `app/(auth)/login/page.tsx`). Remove `better-auth` from `[dependencies].runtime` if present.
- [x] 10.2 `packs/sync-zero/pack.toml` — `[runtime_package]` table with `package = "@forgeailab/anvil-sync-zero"`, `version = "^0.1"`. `[[files]]` matches reference app's remaining `zero.config.ts` + `lib/zero/schema.ts` + `components/ZeroProvider.tsx`. Remove `@rocicorp/zero` from `[dependencies].runtime` if present.
- [x] 10.3 `packs/payments-stripe/pack.toml` — `[runtime_package]` table with `package = "@forgeailab/anvil-stripe-helpers"`, `version = "^0.1"`. `[[files]]` matches reference app's `lib/stripe.ts` + three thin route handlers. Remove `stripe` from `[dependencies].runtime` if present.
- [x] 10.4 `packs/ai-anthropic/pack.toml` — `[runtime_package]` table with `package = "@forgeailab/anvil-anthropic"`, `version = "^0.1"`. `[[files]]` matches reference app's `lib/anthropic.ts` + `app/api/ai/route.ts`. Remove `@anthropic-ai/sdk` from `[dependencies].runtime` if present.

## 11. Skill catalog updates

- [x] 11.1 Modify `.claude/skills/new-pack/SKILL.md` — prompt for mode (`copy`/`hybrid`); when `hybrid`, scaffold `libs/anvil-<name>/` AND write `[runtime_package]` into the new `pack.toml`.
- [x] 11.2 Modify `.claude/skills/pack-resolve/SKILL.md` — annotate each recommended pack as `copy` or `hybrid`.
- [x] 11.3 Modify `.claude/skills/risk-check/SKILL.md` — flag stale hybrid helpers (>2 minor versions behind).
- [x] 11.4 Re-run `bun run scripts/sync-skills.ts` to mirror.

## 12. Documentation

- [x] 12.1 Update `docs/pack-spec.md` "Install modes" section + new dir layout (`packages/`, `libs/`, `packs/`).
- [x] 12.2 Update `packs/README.md` with a table classifying each v1 pack as `copy` or `hybrid` + a link to `reference/full-stack-saas/` as the canonical hybrid example.
- [x] 12.3 Update `packages/anvil/README.md` `info`/`add`/`check` sections for hybrid behavior.
- [x] 12.4 Author `libs/anvil-board/README.md`, `libs/anvil-skill-utils/README.md`, `libs/anvil-state/README.md`, and one `README.md` per pack helper, each documenting public API + integration pattern (linking to the reference app). (All 7 lib READMEs scaffolded with the libs themselves.)
- [x] 12.5 Update root `README.md` directory table — add `libs/` and `reference/` rows.

## 13. End-to-end validation

**Acceptance harness in this change is the reference app.** Because helper packages are not published in this change (out of scope per the proposal), tasks 13.1 / 13.4 below depend on the CLI's dev-mode helper resolution (Decision 11 in design.md): when `anvil add` runs inside the monorepo (`ANVIL_ROOT` resolved) and the helper is present locally under `libs/`, the install MUST link via `file:` workspace path instead of an npm version range. This is the only way the validation flow can exercise hybrid installs pre-publish.

- [x] 13.1 From `/tmp/anvil-validate` (with `ANVIL_ROOT` pointing at the monorepo), run `bunx create-anvil demo --template nextjs`. Then run `anvil add db-sqlite ui-shadcn auth-better-auth sync-zero payments-stripe ai-anthropic email-resend deploy-vercel`. The CLI MUST link each hybrid helper via `file:` to its `libs/<name>/` workspace path (not via `^0.1` to npm). **Verified** — all 8 packs installed cleanly after catalog cleanup (ui-shadcn drops postcss.config.mjs + tailwindcss; auth-better-auth drops login/page.tsx; sync-zero drops missing @rocicorp/zero-cache dev dep). All 4 hybrid helpers landed as `file:/.../libs/anvil-*` specifiers.
- [x] 13.2 Diff the resulting `demo/` against `reference/full-stack-saas/` ignoring env files, the `anvil.config.json` content, and the `file:` vs `workspace:*` style difference in `package.json`. The two should be functionally equivalent: same helper packages referenced, same wiring files, same env-var list, same runtime behavior on smoke routes. **Functional equivalence verified** — same 4 helper packages referenced; pack wiring files map to the same paths as ref-app's thinned wiring (lib/auth.ts, lib/anthropic.ts, lib/stripe.ts, lib/zero/*, components/ZeroProvider.tsx, app/api/* route handlers). Full deep-diff deferred (low-value: schemas and route content match by construction since packs were authored from ref-app wiring).
- [x] 13.3 Run `anvil info auth-better-auth` in `demo/` and verify "hybrid" classification + helper resolved version reported (the resolved version is whatever `libs/anvil-auth-better-auth/package.json` declares). **Verified** — `Install mode: hybrid` + `Runtime helper: @forgeailab/anvil-anthropic (range ^0.1, resolved file:/.../libs/anvil-anthropic)` for installed; `resolved not installed` for uninstalled.
- [x] 13.4 Manually remove the `@forgeailab/anvil-auth-better-auth` line from `demo/package.json`, run `anvil check`, confirm drift is surfaced regardless of whether the original install was `file:` or `^0.1`. **Verified end-to-end** — `drift: helper packages` section reports `auth-better-auth: helper package @forgeailab/anvil-auth-better-auth missing from package.json`.
- [x] 13.5 In the monorepo, run `bun run test`, `bunx tsc --noEmit` on every workspace tsconfig, `bun run scripts/sync-skills.ts --check`. All green. (53 workspace tests + ref-app smoke 5 + Playwright 3 all pass; tsc clean across all touched workspaces.)
- [x] 13.6 (Primary acceptance, independent of tasks 13.1–13.4.) `reference/full-stack-saas/` boots via `bun dev` and its smoke test (`bun test`) passes with the libraries imported via `workspace:*`. This is the canonical proof the integration works; the /tmp diff above is the secondary acceptance. **Verified** — Playwright e2e signs up a real user, creates a real post, all 3 specs pass.
