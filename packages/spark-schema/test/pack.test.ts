import { describe, expect, test } from 'bun:test';
import { EXCLUSIVE_CAPABILITIES } from '../src/capabilities.ts';
import { PackManifestSchema } from '../src/pack.ts';
import { parsePackToml } from '../src/parse.ts';

const validFullManifest = `
name = "payments-stripe"
version = "1.2.3"
category = "payments"
description = "Stripe checkout, portal, and webhook support."
provides = ["payments"]
requires = ["db", "auth"]
conflicts = ["payments"]
requires_runtime = ["server"]
compatible_scaffolds = ["nextjs"]

[dependencies]
runtime = ["stripe@^17"]
dev = ["stripe-cli@^1"]

[env]
required = ["STRIPE_SECRET_KEY"]
optional = ["STRIPE_WEBHOOK_SECRET"]

[[files]]
mode = "create"
from = "lib/stripe.ts"
to = "lib/stripe.ts"

[[files]]
mode = "append"
from = "env.example"
to = ".env.example"

[[files]]
mode = "merge-json"
from = "package.patch.json"
to = "package.json"

[[files]]
mode = "template"
from = "checkout.ts.hbs"
to = "app/checkout.ts"

[skills]
copy = ["skills/stripe-patterns"]

[tasks]
file = "tasks.yaml"
`;

describe('parsePackToml', () => {
  test('valid full manifest parses', () => {
    const result = parsePackToml(validFullManifest);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('payments-stripe');
      expect(result.data.files?.map((file) => file.mode)).toEqual([
        'create',
        'append',
        'merge-json',
        'template',
      ]);
      expect(result.data.compatible_scaffolds).toEqual(['nextjs']);
    }
  });

  test('missing required field rejected', () => {
    const result = parsePackToml(`
name = "payments-stripe"
category = "payments"
provides = ["payments"]
requires = []
conflicts = []
requires_runtime = ["server"]
`);

    expect(result.ok).toBe(false);
  });

  test('unknown capability rejected', () => {
    const result = parsePackToml(`
name = "payments-stripe"
version = "1.0.0"
category = "payments"
provides = ["quantum-storage"]
requires = []
conflicts = []
requires_runtime = ["server"]
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues?.join('\n')).toContain('provides.0');
    }
  });

  test('data-api capability parses', () => {
    const result = parsePackToml(`
name = "api-trpc"
version = "1.0.0"
category = "infra"
provides = ["data-api"]
requires = ["db"]
conflicts = ["data-api"]
requires_runtime = ["server"]
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.provides).toEqual(['data-api']);
      expect(result.data.conflicts).toEqual(['data-api']);
    }
  });

  test('admin capability and category parse', () => {
    const result = parsePackToml(`
name = "admin-dashboard"
version = "1.0.0"
category = "admin"
provides = ["admin"]
requires = ["auth", "ui-kit", "db"]
conflicts = ["admin"]
requires_runtime = ["server"]
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBe('admin');
      expect(result.data.provides).toEqual(['admin']);
      expect(result.data.requires).toEqual(['auth', 'ui-kit', 'db']);
      expect(result.data.conflicts).toEqual(['admin']);
    }
  });

  test('admin capability parses in requires', () => {
    const result = parsePackToml(`
name = "admin-consumer"
version = "1.0.0"
category = "infra"
provides = ["ui-kit"]
requires = ["admin"]
conflicts = []
requires_runtime = ["server"]
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.requires).toEqual(['admin']);
    }
  });

  test('legacy sync capability rejected by manifest schema', () => {
    expect(() =>
      PackManifestSchema.parse({
        name: 'sync-zero',
        version: '1.0.0',
        category: 'infra',
        provides: ['sync'],
        requires: ['db'],
        conflicts: [],
        requires_runtime: ['server'],
      }),
    ).toThrow();
  });

  test('data-api is exclusive', () => {
    expect(EXCLUSIVE_CAPABILITIES.has('data-api')).toBe(true);
  });

  test('admin is exclusive', () => {
    expect(EXCLUSIVE_CAPABILITIES.has('admin')).toBe(true);
  });

  test('unknown template capability rejected', () => {
    const result = parsePackToml(`
name = "payments-stripe"
version = "1.0.0"
category = "payments"
provides = ["payments"]
requires = []
conflicts = []
requires_runtime = ["quantum-runtime"]
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues?.join('\n')).toContain('requires_runtime.0');
    }
  });

  test('post_install key rejected', () => {
    const result = parsePackToml(`
name = "payments-stripe"
version = "1.0.0"
category = "payments"
provides = ["payments"]
requires = []
conflicts = []
requires_runtime = ["server"]
post_install = "bun run setup"
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('post_install');
    }
  });

  test('unknown top-level key rejected', () => {
    const result = parsePackToml(`
name = "payments-stripe"
version = "1.0.0"
category = "payments"
provides = ["payments"]
requires = []
conflicts = []
requires_runtime = ["server"]
extra = true
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues?.join('\n')).toContain('extra');
    }
  });
});
