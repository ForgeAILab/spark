# agent-workflow Specification

## Purpose
TBD - created by archiving change add-scaffold-and-pack-registry. Update Purpose after archive.
## Requirements
### Requirement: Architecture Cutline Output Includes Pack List

The `architecture-cutline` skill SHALL produce `.ai/architecture.md` that, in addition to the existing stack / repo structure / data model / API surface / non-goals sections, includes a `## Pack plan` section enumerating the recommended packs by name, the capabilities each satisfies, and a single fenced code block containing the exact `spark add ...` command. The skill MUST refuse to recommend capabilities for which no pack exists in the registry, instead naming the gap and suggesting `/new-pack`.

#### Scenario: Cutline emits an executable pack plan

- **WHEN** `/architecture-cutline` runs against a spec for a paid SaaS
- **THEN** `.ai/architecture.md` contains a `## Pack plan` section
- **AND** that section lists at least one pack per required capability
- **AND** contains exactly one fenced code block whose contents are a single line beginning with `spark add`

#### Scenario: Cutline reports missing pack for a needed capability

- **WHEN** the spec implies a `realtime` capability
- **AND** no v1 pack provides `realtime`
- **THEN** the `## Pack plan` section explicitly names the missing capability
- **AND** suggests running `/new-pack` to author one

### Requirement: Risk Check Detects Pack-Level Drift

The `risk-check` skill SHALL, in addition to its existing checks, inspect `.spark/state.json` (if present) and flag any installed pack whose capabilities are not referenced by `.ai/product-spec.md` or `.ai/architecture.md`. Such packs are reported under a new "Pack-level drift" section as candidates for human review. Because v1 has no `remove` subcommand, the recommendation is to review intent and, if the pack is genuinely unused, revert the pack-install commit via git.

#### Scenario: Unused pack is flagged as drift

- **WHEN** `analytics-posthog` is installed
- **AND** neither `.ai/product-spec.md` nor `.ai/architecture.md` mentions analytics or PostHog
- **THEN** the risk-check output contains a "Pack-level drift" section
- **AND** lists `analytics-posthog` with a recommendation to either justify the install by updating the spec or revert the pack-install commit via git
- **AND** the recommendation MUST NOT reference any `spark remove` command

#### Scenario: All installed packs are justified

- **WHEN** every installed pack's capability appears in the spec or architecture
- **THEN** the "Pack-level drift" section reports "no drift detected"
