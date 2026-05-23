import { describe, expect, test } from 'bun:test';
import { PackManifestSchema, type RuntimePackageBlock } from '../src/pack.ts';
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

const validManifestObject = {
  name: 'payments-stripe',
  version: '1.0.0',
  category: 'payments',
  provides: ['payments'],
  requires: [],
  conflicts: [],
  requires_runtime: ['server'],
};

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

  test('hybrid manifest with runtime_package parses', () => {
    const result = parsePackToml(`
name = "local-runtime-nextjs"
version = "1.0.0"
category = "infra"
description = "Next.js runtime adapter."
provides = ["local-runtime"]
requires = []
conflicts = []
requires_runtime = ["server"]

[runtime_package]
package = "@anvil/runtime-nextjs"
version = "^1.0.0"
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const runtimePackage: RuntimePackageBlock | undefined = result.data.runtime_package;
      const packageName: string | undefined = result.data.runtime_package?.package;

      expect(runtimePackage?.package).toBe(packageName);
      expect(packageName).toBe('@anvil/runtime-nextjs');
    }
  });

  test('runtime_package is optional', () => {
    const result = parsePackToml(`
name = "payments-stripe"
version = "1.0.0"
category = "payments"
provides = ["payments"]
requires = []
conflicts = []
requires_runtime = ["server"]
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.runtime_package).toBeUndefined();
    }
  });

  test('runtime_package package name must be valid npm package name', () => {
    const result = PackManifestSchema.safeParse({
      ...validManifestObject,
      runtime_package: {
        package: 'not a valid name!',
        version: '^1.0.0',
      },
    });

    expect(result.success).toBe(false);
  });

  test('runtime_package rejects unknown keys', () => {
    const result = PackManifestSchema.safeParse({
      ...validManifestObject,
      runtime_package: {
        package: '@anvil/runtime-nextjs',
        version: '^1.0.0',
        foo: 'bar',
      },
    });

    expect(result.success).toBe(false);
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
