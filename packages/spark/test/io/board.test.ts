import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { missingBoardTasks } from '../../src/io/board.ts';

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), 'spark-io-board-'));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

async function writeTasksFile(changeId: string, content: string): Promise<void> {
  const dir = join(tmpRoot, 'docs', 'spark', 'changes', changeId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'tasks.md'), content);
}

describe('missingBoardTasks', () => {
  test('returns all ids (sorted) when no changes dir exists', async () => {
    expect(await missingBoardTasks(tmpRoot, ['PAY-001', 'AUTH-001'])).toEqual([
      'AUTH-001',
      'PAY-001',
    ]);
  });

  test('returns empty when all ids are present', async () => {
    await writeTasksFile(
      'pack-install-2026-05-24',
      '## payments-stripe\n- [ ] PAY-001: Checkout\n- [ ] AUTH-001: Login\n',
    );
    expect(await missingBoardTasks(tmpRoot, ['PAY-001', 'AUTH-001'])).toEqual([]);
  });

  test('reports only ids absent across all change files', async () => {
    await writeTasksFile('feat-auth-2026-05-23', '## auth\n- [ ] AUTH-001: Login\n');
    await writeTasksFile('feat-pay-2026-05-24', '## pay\n- [ ] PAY-001: Checkout\n');
    expect(await missingBoardTasks(tmpRoot, ['AUTH-001', 'PAY-001', 'GONE-001'])).toEqual([
      'GONE-001',
    ]);
  });

  test('detects a hand-deleted seeded task', async () => {
    await writeTasksFile('pack-install-2026-05-24', '## payments-stripe\n- [ ] PAY-001: Checkout\n');
    // PAY-002 was recorded as installed but is absent from the workspace.
    expect(await missingBoardTasks(tmpRoot, ['PAY-001', 'PAY-002'])).toEqual(['PAY-002']);
  });

  test('returns empty for empty input', async () => {
    expect(await missingBoardTasks(tmpRoot, [])).toEqual([]);
  });
});
