import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyFileOperation } from '../src/io/files.ts';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'spark-files-'));
  const projectRoot = join(root, 'project');
  const packRoot = join(root, 'pack');
  await mkdir(join(packRoot, 'files'), { recursive: true });
  await mkdir(projectRoot, { recursive: true });

  return { projectRoot, packRoot };
}

describe('file operation modes', () => {
  test('append mode is idempotent', async () => {
    const { projectRoot, packRoot } = await fixture();
    await writeFile(join(packRoot, 'files', 'block.txt'), 'hello=world\n');

    const operation = {
      mode: 'append',
      from: 'block.txt',
      to: 'target.txt',
    } as const;
    const options = {
      projectRoot,
      packRoot,
      packName: 'demo-pack',
      config: { template: 'nextjs', appName: 'demo' },
    };

    await applyFileOperation(options, operation);
    await applyFileOperation(options, operation);

    const target = await readFile(join(projectRoot, 'target.txt'), 'utf8');
    expect(target.match(/# >>> spark:demo-pack >>>/g)?.length).toBe(1);
    expect(target.match(/hello=world/g)?.length).toBe(1);
  });

  test('create mode refuses to overwrite', async () => {
    const { projectRoot, packRoot } = await fixture();
    await writeFile(join(packRoot, 'files', 'new.txt'), 'from pack\n');
    await writeFile(join(projectRoot, 'new.txt'), 'already here\n');

    expect(
      applyFileOperation(
        {
          projectRoot,
          packRoot,
          packName: 'demo-pack',
          config: { template: 'nextjs' },
        },
        {
          mode: 'create',
          from: 'new.txt',
          to: 'new.txt',
        },
      ),
    ).rejects.toThrow('refuses to overwrite');
  });

  test('merge-json produces deterministic ordering', async () => {
    const { projectRoot, packRoot } = await fixture();
    await writeFile(join(packRoot, 'files', 'patch.json'), '{"m":3,"a":{"b":2}}\n');
    await writeFile(join(projectRoot, 'package.json'), '{"z":1,"a":{"z":1}}\n');

    await applyFileOperation(
      {
        projectRoot,
        packRoot,
        packName: 'demo-pack',
        config: { template: 'nextjs' },
      },
      {
        mode: 'merge-json',
        from: 'patch.json',
        to: 'package.json',
      },
    );

    expect(readFile(join(projectRoot, 'package.json'), 'utf8')).resolves.toBe(
      '{\n  "a": {\n    "b": 2,\n    "z": 1\n  },\n  "m": 3,\n  "z": 1\n}\n',
    );
  });

  test('template mode substitutes config variables', async () => {
    const { projectRoot, packRoot } = await fixture();
    await writeFile(join(packRoot, 'files', 'client.ts.hbs'), 'export const name = "{{appName}}";\n');

    await applyFileOperation(
      {
        projectRoot,
        packRoot,
        packName: 'demo-pack',
        config: { template: 'nextjs', appName: 'demo' },
      },
      {
        mode: 'template',
        from: 'client.ts.hbs',
        to: 'client.ts',
      },
    );

    expect(readFile(join(projectRoot, 'client.ts'), 'utf8')).resolves.toBe(
      'export const name = "demo";\n',
    );
  });
});
