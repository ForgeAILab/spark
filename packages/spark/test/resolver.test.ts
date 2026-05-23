import { describe, expect, test } from 'bun:test';
import type { PackCapability, PackManifest, TemplateCapability } from '@forgeailab/spark-schema';
import { resolveInstallPlan, type PackRegistryEntry, type ResolverRegistry } from '../src/resolver.ts';

function manifest(
  name: string,
  overrides: Partial<PackManifest> = {},
): PackManifest {
  return {
    name,
    version: '1.0.0',
    category: 'db',
    description: `${name} test pack`,
    provides: [],
    requires: [],
    conflicts: [],
    requires_runtime: [],
    compatible_scaffolds: [],
    dependencies: {
      runtime: [],
      dev: [],
    },
    env: {
      required: [],
      optional: [],
    },
    files: [],
    ...overrides,
  };
}

function registry(entries: readonly PackRegistryEntry[]): ResolverRegistry {
  return {
    packs: new Map(entries.map((entry) => [entry.name, entry])),
  };
}

function entry(name: string, overrides: Partial<PackManifest>): PackRegistryEntry {
  return {
    name,
    manifest: manifest(name, overrides),
  };
}

const nextTemplate = {
  name: 'nextjs',
  provides: ['server', 'static'] as TemplateCapability[],
};

describe('resolveInstallPlan', () => {
  test('reports missing capability and provider suggestions', () => {
    const result = resolveInstallPlan(
      ['payments-stripe'],
      [],
      registry([
        entry('payments-stripe', {
          category: 'payments',
          provides: ['payments'],
          requires: ['auth'],
        }),
        entry('auth-basic', {
          category: 'auth',
          provides: ['auth'],
        }),
      ]),
      nextTemplate,
    );

	    expect(result.ok).toBe(false);
	    if (!result.ok) {
	      expect(result.error.type).toBe('missing-capability');
	      if (result.error.type !== 'missing-capability') throw new Error('unexpected');
	      expect(result.error.capability).toBe('auth');
	      expect(result.error.providers).toEqual(['auth-basic']);
	    }
  });

  test('rejects two exclusive providers', () => {
    const result = resolveInstallPlan(
      ['db-postgres'],
      ['db-sqlite'],
      registry([
        entry('db-sqlite', {
          provides: ['db'],
        }),
        entry('db-postgres', {
          provides: ['db'],
        }),
      ]),
      nextTemplate,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('exclusive-conflict');
      expect(result.error).toMatchObject({
        capability: 'db' satisfies PackCapability,
        packs: ['db-sqlite', 'db-postgres'],
        source: 'exclusive-capability',
      });
    }
  });

  test('rejects declared capability conflicts', () => {
    const result = resolveInstallPlan(
      ['payments-polar'],
      ['payments-stripe'],
      registry([
        entry('payments-stripe', {
          category: 'payments',
          provides: ['payments'],
          conflicts: ['payments'],
        }),
        entry('payments-polar', {
          category: 'payments',
          provides: ['payments'],
          conflicts: ['payments'],
        }),
      ]),
      nextTemplate,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('exclusive-conflict');
      expect(result.error).toMatchObject({
        capability: 'payments',
        packs: ['payments-stripe', 'payments-polar'],
        source: 'declared-conflict',
      });
    }
  });

  test('allows non-exclusive providers to coexist', () => {
    const result = resolveInstallPlan(
      ['ai-openai'],
      ['ai-anthropic'],
      registry([
        entry('ai-anthropic', {
          category: 'ai',
          provides: ['ai-sdk'],
        }),
        entry('ai-openai', {
          category: 'ai',
          provides: ['ai-sdk'],
        }),
      ]),
      nextTemplate,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.packs.map((pack) => pack.name)).toEqual(['ai-openai']);
    }
  });

  test('rejects incompatible scaffolds', () => {
    const result = resolveInstallPlan(
      ['docs-only'],
      [],
      registry([
        entry('docs-only', {
          compatible_scaffolds: ['astro-starlight'],
        }),
      ]),
      nextTemplate,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('scaffold-incompat');
    }
  });

  test('rejects missing runtime capability', () => {
    const result = resolveInstallPlan(
      ['native-ui'],
      [],
      registry([
        entry('native-ui', {
          requires_runtime: ['native'],
        }),
      ]),
      nextTemplate,
    );

	    expect(result.ok).toBe(false);
	    if (!result.ok) {
	      expect(result.error.type).toBe('runtime-incompat');
	      if (result.error.type !== 'runtime-incompat') throw new Error('unexpected');
	      expect(result.error.missingRuntime).toBe('native');
	    }
  });

  test('detects circular capability dependencies', () => {
    const result = resolveInstallPlan(
      ['db-cycle', 'auth-cycle'],
      [],
      registry([
        entry('db-cycle', {
          provides: ['db'],
          requires: ['auth'],
        }),
        entry('auth-cycle', {
          category: 'auth',
          provides: ['auth'],
          requires: ['db'],
        }),
      ]),
      nextTemplate,
    );

	    expect(result.ok).toBe(false);
	    if (!result.ok) {
	      expect(result.error.type).toBe('circular');
	      if (result.error.type !== 'circular') throw new Error('unexpected');
	      expect(result.error.cycle.length).toBeGreaterThan(2);
	    }
  });

  test('reports unknown packs', () => {
    const result = resolveInstallPlan(['missing-pack'], [], registry([]), nextTemplate);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toEqual({
        type: 'unknown-pack',
        pack: 'missing-pack',
      });
    }
  });
});
