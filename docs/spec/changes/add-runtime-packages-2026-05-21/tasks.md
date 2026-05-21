---
created_at: 2026-05-21T00:00:00Z
updated_at: 2026-05-21T19:08:50Z
completed_at:
---

## 1. Schema extension

- [ ] 1.1 Add `RuntimePackageBlock` Zod schema to `packages/anvil-schema/src/pack.ts` — `{ package: string (full npm name, allows scope), version: string (semver range) }`. Make it optional on `PackManifest` as `runtime_package`.
- [ ] 1.2 Strict-reject any unknown key inside `[runtime_package]`. Strict-reject `[runtime_package]` whose `package` is not a valid npm package name.
- [ ] 1.3 Add test fixtures: valid hybrid pack with `[runtime_package]` parses; manifest without `[runtime_package]` still parses as `copy`; invalid `package` value rejected.
- [ ] 1.4 Update `docs/pack-spec.md` to document the two install modes and the new field.

## 2. `@forgeailab/anvil-state` (ergonomic state IO wrapper)

- [ ] 2.1 Scaffold `packages/anvil-state/` (`package.json`, `tsconfig.json`, `src/index.ts`, `test/`). Workspace dep on `@forgeailab/anvil-schema`.
- [ ] 2.2 Export `readState(projectRoot)`, `writeState(projectRoot, state)`, `withState(projectRoot, mutator)`. All operate on `<projectRoot>/.anvil/state.json` and validate against the `StateFile` schema.
- [ ] 2.3 Add tests: round-trip, missing-file returns initial state, malformed-file throws with a clear error.
- [ ] 2.4 Refactor `packages/anvil/src/io/state.ts` to consume `@forgeailab/anvil-state`. The CLI module becomes a thin re-export plus any CLI-specific logging.

## 3. `@forgeailab/anvil-skill-utils` (skill frontmatter parser + Claude↔Codex transform)

- [ ] 3.1 Scaffold `packages/anvil-skill-utils/`.
- [ ] 3.2 Export `parseSkillFrontmatter(text): { meta, body }` (typed `meta` with `name`, `description`, optional `allowed-tools`, optional `model`).
- [ ] 3.3 Export `toCodexFrontmatter(meta)` and `toClaudeFrontmatter(meta)` — pure transforms producing the YAML+body string for the other tool's flavor.
- [ ] 3.4 Tests: parse round-trips, Claude→Codex drops Claude-specific keys, malformed frontmatter throws with a clear error.
- [ ] 3.5 Refactor `scripts/sync-skills.ts` to consume `@forgeailab/anvil-skill-utils`. Refactor `packages/anvil/src/io/skills.ts` to consume it.

## 4. `@forgeailab/anvil-board` (typed `.ai/board.md` IO)

- [ ] 4.1 Scaffold `packages/anvil-board/`.
- [ ] 4.2 Export `readBoard(projectRoot): Board` — parses `.ai/board.md` into typed sections (epics with task lists). Status enum from the AGENTS.md status flow.
- [ ] 4.3 Export `seedTasks(projectRoot, packName, tasks: TaskSeed[])` — inserts new tasks under the appropriate epic with status `Clarifying` and a `requires_pack:` field. Idempotent: re-seeding the same task IDs is a no-op.
- [ ] 4.4 Export `updateStatus(projectRoot, taskId, status)` — mutates one task's status block, preserving surrounding user prose verbatim.
- [ ] 4.5 Tests: parse a sample board with mixed status, seed produces deterministic output, idempotency, malformed sections produce a clear error.
- [ ] 4.6 Refactor `packages/anvil/src/io/board.ts` to consume `@forgeailab/anvil-board`.

## 5. `@forgeailab/anvil-auth-better-auth` (Better Auth runtime helper)

- [ ] 5.1 Scaffold `packages/anvil-auth-better-auth/`. Deps: `better-auth` (latest stable).
- [ ] 5.2 Export `createAuth({ adapter, basePath?, plugins? })` factory — returns a Better Auth instance configured for the consumer's adapter.
- [ ] 5.3 Export `createAuthHandler(auth)` — produces the Next.js App Router catch-all handler.
- [ ] 5.4 Export typed session helpers (`getSession`, `requireSession`).
- [ ] 5.5 Tests: factory accepts a mock adapter; handler produces a Response on a sample request; session helpers narrow types correctly.
- [ ] 5.6 Update `packs/auth-better-auth/pack.toml` — add `[runtime_package] package = "@forgeailab/anvil-auth-better-auth"`, version `"^0.1"`. Trim `[[files]]` to: `lib/auth.ts` (wiring only), `app/api/auth/[...all]/route.ts` (one-line handler import), `app/(auth)/login/page.tsx`.

## 6. `@forgeailab/anvil-sync-zero` (Zero sync helper)

- [ ] 6.1 Scaffold `packages/anvil-sync-zero/`. Deps: `@rocicorp/zero` (latest), peer dep on `react`.
- [ ] 6.2 Export `defineZeroSchema(builder)` — wraps Zero's schema builder with anvil-friendly defaults.
- [ ] 6.3 Export `createZeroClient({ schema, authToken, server })` — browser client factory.
- [ ] 6.4 Export `ZeroProvider` React component — typed wrapper around Zero's provider.
- [ ] 6.5 Tests: schema builder produces a valid Zero schema; client factory configuration is forwarded correctly; provider renders children.
- [ ] 6.6 Update `packs/sync-zero/pack.toml` — add `[runtime_package]`. Trim `[[files]]` to: `zero.config.ts` (config-only), `lib/zero/schema.ts` (consumer schema using `defineZeroSchema`), `components/ZeroProvider.tsx` (one-line re-export wrapper).

## 7. `@forgeailab/anvil-stripe-helpers` (Stripe checkout/webhook/portal helpers)

- [ ] 7.1 Scaffold `packages/anvil-stripe-helpers/`. Deps: `stripe`.
- [ ] 7.2 Export `createCheckoutSession({ stripe, customer, priceId, returnUrl })`.
- [ ] 7.3 Export `verifyWebhookSignature({ payload, signature, secret })`.
- [ ] 7.4 Export `createBillingPortalSession({ stripe, customer, returnUrl })`.
- [ ] 7.5 Tests against the Stripe TypeScript types; webhook signature verifier produces correct success/failure paths against a known fixture.
- [ ] 7.6 Update `packs/payments-stripe/pack.toml` — add `[runtime_package]`. Trim `[[files]]` to: `lib/stripe.ts` (client init), thin route handlers under `app/api/{checkout,billing-portal,webhooks/stripe}/route.ts` (each route imports from `@forgeailab/anvil-stripe-helpers`).

## 8. `@forgeailab/anvil-anthropic` (Claude SDK streaming helper)

- [ ] 8.1 Scaffold `packages/anvil-anthropic/`. Deps: `@anthropic-ai/sdk`.
- [ ] 8.2 Export `createAnthropicClient({ apiKey?, defaultModel? })`.
- [ ] 8.3 Export `streamResponse({ client, messages, model, ... })` — produces a `ReadableStream<Uint8Array>` of SSE-formatted tokens for use in route handlers.
- [ ] 8.4 Optional: export `withCostTracking(stream, callback)` middleware for token-count accumulation.
- [ ] 8.5 Tests: client factory accepts API key from env; stream produces well-formed SSE frames against a mock SDK response.
- [ ] 8.6 Update `packs/ai-anthropic/pack.toml` — add `[runtime_package]`. Trim `[[files]]` to: `lib/anthropic.ts` (one-line re-export wrapper), `app/api/ai/route.ts` (uses `streamResponse`).

## 9. CLI updates

- [ ] 9.1 `anvil info <pack>` — when manifest has `[runtime_package]`, render an "Install mode: hybrid" section with the helper package + version range + resolved version (looked up via `bun pm ls`).
- [ ] 9.2 `anvil add <pack...>` — when manifest has `[runtime_package]`, add the helper package to the same `bun add` batch as the other runtime deps. Behavior must remain idempotent: re-running adds nothing.
- [ ] 9.3 `anvil check` — for each installed pack with `[runtime_package]`, verify the helper package is still in the consumer project's `package.json`. Flag as drift if missing.
- [ ] 9.4 Update the test suite: at least one hybrid-pack install test (probably `auth-better-auth`) showing that the helper ends up in `package.json` and the wiring files are copied.

## 10. Skill catalog updates

- [ ] 10.1 Modify `.claude/skills/new-pack/SKILL.md` — when scaffolding a new pack, ask the author whether the pack should ship a runtime helper. If yes, also scaffold `packages/anvil-<name>/` with a minimal skeleton and write `[runtime_package]` into the new `pack.toml`.
- [ ] 10.2 Modify `.claude/skills/pack-resolve/SKILL.md` — output annotates each recommended pack with `copy` or `hybrid` based on the manifest.
- [ ] 10.3 Modify `.claude/skills/risk-check/SKILL.md` — when a hybrid pack is installed and its helper package is more than two minor versions behind latest, surface as a "stale helper" drift item.
- [ ] 10.4 Re-run `bun run scripts/sync-skills.ts` to mirror into `.codex/skills/`.

## 11. Documentation

- [ ] 11.1 Update `docs/pack-spec.md` with a "Install modes" section describing `copy` vs `hybrid`.
- [ ] 11.2 Update `packs/README.md` with a table classifying each v1 pack as `copy` or `hybrid`.
- [ ] 11.3 Update `packages/anvil/README.md` `info`/`add`/`check` sections to mention hybrid behavior.
- [ ] 11.4 Author `packages/anvil-board/README.md`, `packages/anvil-skill-utils/README.md`, `packages/anvil-state/README.md`, and one `README.md` per pack helper, each documenting the public API + integration pattern.

## 12. End-to-end validation

- [ ] 12.1 From `/tmp/anvil-smoke`, run `bunx create-anvil demo --template nextjs --preset lean-saas`. Among the installed packs `auth-better-auth` should now drag in `@forgeailab/anvil-auth-better-auth` as a dep in `package.json` and the wiring files should be present.
- [ ] 12.2 Run `anvil info auth-better-auth` and verify the "hybrid" classification + helper version are reported.
- [ ] 12.3 Manually remove `@forgeailab/anvil-auth-better-auth` from the consumer's `package.json`, run `anvil check`, confirm drift is surfaced.
- [ ] 12.4 In the monorepo, run `bun run test` — all workspace + script test suites green. Run `bunx tsc --noEmit` against every workspace tsconfig. Run `bun run scripts/sync-skills.ts --check` and confirm in-sync.
