# Reference Apps

`reference/` contains runnable integration apps used to prove that hybrid packs compose before their reusable logic is extracted.

The reference app has three jobs:

- Integration proof: one runnable app exercises every planned hybrid pack together.
- Extraction source: future `libs/` packages are extracted from working code in this app.
- Acceptance harness: smoke tests gate the extracted libraries as the change progresses.

This directory is not a template registry. Users should not start projects by copying `reference/full-stack-saas/`; it is intentionally built as a validation target for the pack and runtime-library workflow.

See the change proposal for the full build order: [add-runtime-packages-2026-05-21](../docs/spec/changes/add-runtime-packages-2026-05-21/proposal.md).
