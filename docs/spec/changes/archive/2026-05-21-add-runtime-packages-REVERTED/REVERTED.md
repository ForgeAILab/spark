# REVERTED

This change proposed splitting pack runtime code into `libs/spark-*` workspace packages with a hybrid install model (a pack's runtime helper lives in `libs/`, manifest `[runtime_package]` block, CLI auto-installs the helper alongside the copied files).

It was implemented and then **reverted** in commit `5587916` (2026-05-23, "0.2.0 — drop runtime helpers, shadcn-style copy-only model") in favor of a single copy-only install model that mirrors how shadcn ships components. Deltas in this folder were **NOT merged** into `docs/spec/specs/`.

Archived in place for historical reference only. Do not treat as a valid pending or shipped change.
