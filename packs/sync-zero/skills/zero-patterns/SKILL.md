---
name: zero-patterns
description: Use when implementing Rocicorp Zero client-first sync, schema changes, queries, mutators, or zero-cache setup in an spark project.
---

# Zero Patterns

## Core Model

Zero is client-first. Reads should feel local because the client queries its
local store first, then syncs with `zero-cache` and the upstream Postgres
database in the background.

Do not treat Zero as a REST wrapper. Keep query definitions and mutators as
the product contract. Components consume those contracts through Zero React
helpers instead of hand-building fetch calls for synced data.

## Before Coding

1. Check which `db` pack is installed.
2. Find the authoritative database schema and migrations.
3. Read `lib/zero/schema.ts`.
4. Identify the smallest set of rows the UI needs.
5. Confirm auth context before exposing user-scoped data.

## Schema Authoring

Zero schema mirrors the subset of Postgres that clients can query. Keep it
small, explicit, and aligned with the database.

Use table builders from `@rocicorp/zero`, for example `table`, `string`,
`boolean`, `number`, `json`, and `enumeration`.

Every table must have an explicit primary key. Prefer stable string IDs for
client-created records. Avoid auto-increment IDs for records created from the
client because mutators may run more than once.

When adding fields, use an expand deploy order: database first, then server
query or mutate code, then client usage. When removing fields, reverse that:
client stops using it, then server stops exposing it, then database removes it.

## Queries

Clients should call named query helpers, not arbitrary server endpoints. Keep
queries narrow enough that Zero can cache and update them efficiently.

## Mutators

Mutators are optimistic. They can run on the client and again on the server, so
they must be deterministic and safe to replay.

Generate IDs before calling the mutator and pass them as arguments. Do not
generate random IDs, timestamps, or external side effects inside a mutator.

Validate mutator arguments at the boundary. Keep authorization checks on the
server path, even if the client path also hides unauthorized actions.

## Local Development

`zero-cache` needs a Postgres upstream with logical replication enabled. Keep
`ZERO_UPSTREAM_DB` pointed at the same database your app server uses.

## Review Checklist

- Schema matches current migrations.
- Client-visible rows are scoped by query and auth context.
- Mutators are deterministic and replay-safe.
- Query shape is indexed or intentionally small.
- Local setup documents `ZERO_UPSTREAM_DB` and cache reset steps.
