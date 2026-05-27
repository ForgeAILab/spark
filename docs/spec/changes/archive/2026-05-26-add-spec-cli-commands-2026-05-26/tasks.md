---
created_at: 2026-05-26T12:00:00Z
updated_at: 2026-05-26T13:30:00Z
completed_at:
---

> **Applied 2026-05-26.** Implementation written by Codex (GPT-5.3) via the shared runtime and
> verified by Claude: `bun test` 60 pass / 0 fail (incl. new `status` + `validate` suites),
> `tsc --noEmit` clean, `spark validate docs/spec` → OK (exit 0), `spark status` → empty-state
> (exit 0). Only the truth merge (5.3) remains, which happens at archive.

## 1. Specs (this change)

- [x] 1.1 Author `proposal.md`, the `pack-cli` MODIFIED delta (subcommand list), and the `spec-cli` ADDED delta (`validate` + `status` behavior).

## 2. `status` command

- [x] 2.1 `packages/spark/src/commands/status.ts`: render via `readAllChangeTasks` / `renderBuildStatus`; support `--change <id>` (scope to one change); empty workspace prints the empty state and exits 0.
- [x] 2.2 Register `status` in `cli.ts` `subCommands`.
- [x] 2.3 Tests: aggregated render across changes, `--change` scope, empty-state.

## 3. `validate` command

- [x] 3.1 `packages/spark/src/commands/validate.ts`: lint delta operation headers, `### Requirement:` → ≥1 `#### Scenario:`, scenario WHEN/THEN bullets; reuse `parseTasksMarkdown` for `tasks.md`; collect violations as `{file, line, message}`.
- [x] 3.2 Register `validate` in `cli.ts`; accept an optional `[path]` (default `docs/spark`); exit non-zero when any violation is found.
- [x] 3.3 Tests: valid workspace passes; requirement-without-scenario, bad-operation-header, and `tasks.md` parse error each fail.

## 4. Docs

- [x] 4.1 `README.md`: add `validate` + `status` to the CLI subcommand row.
- [x] 4.2 Recorded the pre-existing `pack-cli` truth path discrepancy (`packages/cli/` vs `packages/spark/`) in `proposal.md` Impact for archive-time cleanup.

## 5. Truth + verification

- [x] 5.1 `bun test` green (60 pass / 0 fail, incl. new status + validate suites).
- [x] 5.2 Smoke: `spark status` renders empty-state on this repo; `spark validate docs/spec` passes on the repo's own specs (and validates the two new change folders); `validate.test.ts` covers the broken-fixture failure cases.
- [ ] 5.3 At archive: merge the `pack-cli` MODIFIED requirement and the `spec-cli` capability into `docs/spec/specs/`.
