# spec-cli Specification

## Purpose
TBD - created by archiving change add-spec-cli-commands. Update Purpose after archive.
## Requirements
### Requirement: `validate` Subcommand Lints the Spec Workspace

`spark validate [path]` SHALL check a spec workspace (default `docs/spark/`, or the given
`path`) for structural conformance and exit non-zero on any violation, without modifying any
file. It MUST verify that: each delta file's first non-empty line is one of
`## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or
`## RENAMED Requirements`; each `### Requirement:` has descriptive text and at least one
`#### Scenario:` (four hashes); each scenario contains WHEN/THEN bullet steps; and each
change's `tasks.md` parses (well-formed `## N. Section` headings, recognizable task lines, and
unique task ids). Each violation MUST be reported with its file and line. `validate` MUST NOT
attempt to repair anything.

#### Scenario: Valid workspace passes

- **WHEN** the user runs `spark validate` against a workspace where every requirement has a scenario, every delta header is valid, and every `tasks.md` parses
- **THEN** the command prints an OK summary
- **AND** exits 0

#### Scenario: Requirement without a scenario fails

- **WHEN** a `### Requirement:` block has no `#### Scenario:`
- **THEN** `spark validate` exits non-zero
- **AND** reports the offending requirement with its file and line

#### Scenario: Malformed delta header fails

- **WHEN** a delta file's first non-empty line is not one of the four operation headers
- **THEN** `spark validate` exits non-zero
- **AND** names the file and the expected headers

#### Scenario: tasks.md parse error is surfaced

- **WHEN** a change's `tasks.md` contains a task line that does not parse, or a duplicate task id
- **THEN** `spark validate` exits non-zero
- **AND** reports the file and line of the malformed task

### Requirement: `status` Subcommand Renders Build Status

`spark status [--change <id>]` SHALL render the build-status view from `tasks.md` across the
active (non-archived) changes — the same on-demand cockpit the skills render — and MUST NOT
persist a board file. It MUST report aggregate counts (todo / in progress / done / blocked)
and list tasks grouped by status. When `--change <id>` is given it MUST scope the view to that
single change. When there are no changes it MUST print an empty state and exit 0.

#### Scenario: status renders aggregated build status

- **WHEN** the user runs `spark status` in a project with tasks across two active changes
- **THEN** the output shows aggregate todo / in-progress / done / blocked counts
- **AND** lists the tasks grouped by status
- **AND** no board file is written

#### Scenario: status scoped to one change

- **WHEN** the user runs `spark status --change auth-2026-05-26`
- **THEN** only that change's tasks are rendered

#### Scenario: empty workspace yields an empty state

- **WHEN** the user runs `spark status` in a project with no non-archived changes
- **THEN** the command prints an empty state
- **AND** exits 0
