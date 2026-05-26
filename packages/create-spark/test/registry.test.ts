import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { loadTemplateRegistry } from '../src/registry.ts';

const templates = [
  {
    name: 'nextjs',
    status: 'stable',
    provides: ['server', 'static', 'react'],
    description: 'Next.js application template.',
  },
  {
    name: 'astro',
    status: 'planned',
    provides: ['server', 'static', 'mdx-content'],
    description: 'Astro content site template.',
  },
  {
    name: 'astro-starlight',
    status: 'planned',
    provides: ['static', 'mdx-content'],
    description: 'Astro Starlight documentation template.',
  },
  {
    name: 'vite-react',
    status: 'planned',
    provides: ['static', 'react'],
    description: 'Vite React SPA template.',
  },
  {
    name: 'one',
    status: 'planned',
    provides: ['server', 'static', 'react', 'native'],
    description: 'One full-stack web and native template.',
  },
] as const;

async function createTemplateRegistry(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'create-spark-registry-'));

  await Promise.all(
    templates.map(async (template) => {
      const dir = join(root, template.name);
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, 'template.toml'),
        [
          `name = "${template.name}"`,
          `status = "${template.status}"`,
          `provides = [${template.provides.map((capability) => `"${capability}"`).join(', ')}]`,
          `description = "${template.description}"`,
          '',
        ].join('\n'),
      );
    }),
  );

  return root;
}

describe('loadTemplateRegistry', () => {
  test('registry walk picks up all 5 v1 templates', async () => {
    const root = await createTemplateRegistry();

    try {
      const registry = await loadTemplateRegistry(root);
      expect(registry.map((template) => template.name).toSorted()).toEqual([
        'astro',
        'astro-starlight',
        'nextjs',
        'one',
        'vite-react',
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test('distinguishes stable and planned template statuses', async () => {
    const root = await createTemplateRegistry();

    try {
      const registry = await loadTemplateRegistry(root);
      const statuses = Object.fromEntries(
        registry.map((template) => [template.name, template.status]),
      );

      expect(statuses.nextjs).toBe('stable');
      expect(statuses.astro).toBe('planned');
      expect(statuses['astro-starlight']).toBe('planned');
      expect(statuses['vite-react']).toBe('planned');
      expect(statuses.one).toBe('planned');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
