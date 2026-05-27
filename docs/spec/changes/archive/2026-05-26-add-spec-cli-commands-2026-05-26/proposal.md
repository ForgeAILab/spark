---
created_at: 2026-05-26T12:00:00Z
updated_at: 2026-05-26T12:00:00Z
---

## Why

The `spark` CLI ships `list`, `info`, `check`, `add`, and `preset`, but a founder has no way
to (a) confirm their `docs/spark/` spec workspace is well-formed, or (b) see build progress
without driving an agent. Both are gaps spark's source tools already close: OpenSpec ships
`validate` (and `validate --strict`), and progress is the whole point of a board.

The progress engine **already exists** internally — `renderBuildStatus()`, `readBoard()`,
and `parseTasksMarkdown()` in `packages/spark/src/internal/board.ts` aggregate every change's
`tasks.md` and render the build-status view — but it is not exposed as a command. And the CLI
surface is **spec-locked**: `pack-cli` declares "exactly the following subcommands in v1",
so adding commands requires amending that requirement. Spec-format validation matters because
the `/build-loop` trusts `#### Scenario` steps as acceptance criteria — a malformed spec
silently weakens the whole loop.

## What Changes

- **`spark validate [path]`** — a spec-workspace linter that exits non-zero on any violation
  without modifying files. It checks: every delta file begins with a valid operation header
  (`## ADDED|MODIFIED|REMOVED|RENAMED Requirements`); every `### Requirement:` has descriptive
  text and ≥1 `#### Scenario:`; every scenario uses WHEN/THEN bullet steps; every change's
  `tasks.md` parses (well-formed sections, task lines, unique ids). Each violation is reported
  with file and line. `[path]` lets it target `docs/spark/` (generated projects) or
  `docs/spec/` (this repo).
- **`spark status [--change <id>]`** — renders the on-demand build-status view from `tasks.md`
  across active (non-archived) changes by exposing the existing board engine; scoped to one
  change with `--change`. No board file is persisted.
- **Amend the spec-locked surface** — `pack-cli`'s "CLI Subcommands" requirement gains
  `validate` and `status`; a new `spec-cli` capability specifies their behavior.

## Impact

- **Affected specs:** `pack-cli` (MODIFIED — subcommand list), `spec-cli` (new capability)
- **Affected code:**
  - `packages/spark/src/commands/status.ts` (new) — wraps `readBoard` / `renderBuildStatus`
  - `packages/spark/src/commands/validate.ts` (new) — reuses `parseTasksMarkdown`; adds the spec-format checks
  - `packages/spark/src/cli.ts` — register both subcommands
  - `README.md` — CLI subcommand row + "Status" out-of-scope line (subcommands are no longer all out of scope)
- **Pre-existing discrepancy (note, do not silently fix):** `pack-cli` truth says the CLI
  lives in `packages/cli/`, but the code is in `packages/spark/`. The deltas and tasks use the
  real path; flag the truth-spec path for cleanup at archive.
- **Non-goals:** no `--strict`/`--json`/`--watch` flags beyond the checks above; no auto-repair
  (`validate` only reports, like `check`); no `remove`/`update` (still forbidden).
