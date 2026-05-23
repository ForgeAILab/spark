import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readState, writeState } from '../src/index.ts';
import type { StateFile } from '@forgeailab/spark-schema';

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'spark-state-'));
}

describe('spark-state', () => {
  test('round-trips state through disk', async () => {
    const projectRoot = await tempProject();
    const state: StateFile = {
      schema_version: 1,
      installed_packs: [
        {
          name: 'db-sqlite',
          version: '1.0.0',
          files: ['lib/db.ts'],
          appended_blocks: [
            {
              to: '.env.example',
              marker: 'spark:db-sqlite:env',
              content_hash: 'sha256:abc123',
            },
          ],
          env: ['DATABASE_URL'],
          tasks: ['DB-001'],
        },
      ],
    };

    await writeState(projectRoot, state);

    expect(await readState(projectRoot)).toEqual(state);
  });

  test('returns initial state when state file is missing', async () => {
    const projectRoot = await tempProject();

    expect(await readState(projectRoot)).toEqual({
      schema_version: 1,
      installed_packs: [],
    });
  });

  test('names the state file path when JSON is malformed', async () => {
    const projectRoot = await tempProject();
    const statePath = join(projectRoot, '.spark', 'state.json');
    await mkdir(join(projectRoot, '.spark'), { recursive: true });
    await writeFile(statePath, '{"schema_version": 1,');

    await expect(readState(projectRoot)).rejects.toThrow(statePath);
  });
});
