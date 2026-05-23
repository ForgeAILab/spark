import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import type { PackManifest, TemplateManifest } from '@forgeailab/spark-schema';
import { runAdd } from '../src/commands/add.ts';
import type { Registry } from '../src/io/registry.ts';

async function snapshotTree(root: string): Promise<Record<string, string>> {
  const snapshot: Record<string, string> = {};

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
      } else if (entry.isFile()) {
        snapshot[relative(root, path)] = await readFile(path, 'utf8');
      }
    }
  }

  await walk(root);
  return snapshot;
}

async function setupProject() {
  const root = await mkdtemp(join(tmpdir(), 'spark-idempotency-'));
  const projectRoot = join(root, 'project');
  const registryRoot = join(root, 'registry');
  const packRoot = join(registryRoot, 'packs', 'demo-pack');
  await mkdir(join(projectRoot, '.ai'), { recursive: true });
  await mkdir(join(packRoot, 'files', 'lib'), { recursive: true });
  await mkdir(join(packRoot, 'skills', 'demo-skill'), { recursive: true });

  await writeFile(join(projectRoot, 'spark.config.json'), '{"template":"nextjs","appName":"demo"}\n');
  await writeFile(join(projectRoot, '.env.example'), '');
  await writeFile(join(projectRoot, '.env.local'), '');
  await writeFile(join(projectRoot, '.ai', 'board.md'), '# Board\n');
  await writeFile(join(projectRoot, 'package.json'), '{}\n');
  await writeFile(join(projectRoot, 'README.md'), 'base\n');

  await writeFile(join(packRoot, 'files', 'lib', 'demo.ts'), 'export const demo = true;\n');
  await writeFile(join(packRoot, 'files', 'readme-block.md'), 'installed demo pack\n');
  await writeFile(join(packRoot, 'files', 'package.patch.json'), '{"scripts":{"demo":"bun run demo"}}\n');
  await writeFile(join(packRoot, 'files', 'lib', 'config.ts.hbs'), 'export const appName = "{{appName}}";\n');
  await writeFile(
    join(packRoot, 'tasks.yaml'),
    'epic: Demo\n tasks:\n  - id: DEMO-001\n    title: Wire demo pack\n    acceptance:\n      - Demo pack works\n',
  );
  await writeFile(
    join(packRoot, 'skills', 'demo-skill', 'SKILL.md'),
    '---\nname: demo-skill\ndescription: Demo skill\nallowed-tools:\n  - Read\n---\n\n# Demo\n',
  );

  const manifest: PackManifest = {
    name: 'demo-pack',
    version: '1.0.0',
    category: 'db',
    description: 'Demo pack',
    provides: ['db'],
    requires: [],
    conflicts: [],
    requires_runtime: ['server'],
    compatible_scaffolds: ['nextjs'],
    dependencies: {
      runtime: [],
      dev: [],
    },
    env: {
      required: ['DEMO_KEY'],
      optional: [],
    },
    files: [
      {
        mode: 'create',
        from: 'lib/demo.ts',
        to: 'lib/demo.ts',
      },
      {
        mode: 'append',
        from: 'readme-block.md',
        to: 'README.md',
      },
      {
        mode: 'merge-json',
        from: 'package.patch.json',
        to: 'package.json',
      },
      {
        mode: 'template',
        from: 'lib/config.ts.hbs',
        to: 'lib/config.ts',
      },
    ],
    skills: {
      copy: ['skills/demo-skill'],
    },
    tasks: {
      file: 'tasks.yaml',
    },
  };
  const template: TemplateManifest = {
    name: 'nextjs',
    status: 'stable',
    provides: ['server', 'static'],
    description: 'Next.js test template',
  };
  const registry: Registry = {
    root: registryRoot,
    packs: new Map([
      [
        'demo-pack',
        {
          name: 'demo-pack',
          manifest,
          dir: packRoot,
        },
      ],
    ]),
    presets: new Map(),
    templates: new Map([
      [
        'nextjs',
        {
          name: 'nextjs',
          manifest: template,
          dir: join(registryRoot, 'templates', 'nextjs'),
        },
      ],
    ]),
  };

  return { projectRoot, registry };
}

describe('add idempotency', () => {
  test('full add followed by same add leaves the project unchanged', async () => {
    const { projectRoot, registry } = await setupProject();
    const output = {
      log() {},
      error() {},
    };

    const first = await runAdd(['demo-pack'], {
      projectRoot,
      registry,
      config: { template: 'nextjs', appName: 'demo' },
      yes: true,
      output,
      dependencyRunner: async () => {},
    });
    const afterFirst = await snapshotTree(projectRoot);

    const second = await runAdd(['demo-pack'], {
      projectRoot,
      registry,
      config: { template: 'nextjs', appName: 'demo' },
      yes: true,
      output,
      dependencyRunner: async () => {},
    });
    const afterSecond = await snapshotTree(projectRoot);

    expect(first.status).toBe('installed');
    expect(second.status).toBe('already-installed');
    expect(afterSecond).toEqual(afterFirst);
    expect(afterSecond['.env.local']).toContain('DEMO_KEY=');
    expect(afterSecond['.codex/skills/demo-skill/SKILL.md']).not.toContain('allowed-tools');
    expect(afterSecond['.spark/state.json']).toContain('"demo-pack"');
  });
});
