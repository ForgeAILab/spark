import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runStatus } from '../src/commands/status.ts';

async function project(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'spark-status-'));
}

async function writeTasks(root: string, changeId: string, body: string): Promise<void> {
  const dir = join(root, 'docs', 'spark', 'changes', changeId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'tasks.md'), body);
}

const TASKS_A = `## 1. Section A
- [ ] 1.1 Todo task
- [~] 1.2 In progress task
- [x] 1.3 Done task
`;
const TASKS_B = `## 1. Section B
- [ ] B-001: Another todo
- [x] B-002: Another done
`;

describe('spark status', () => {
  test('aggregates build status across changes', async () => {
    const root = await project();
    await writeTasks(root, 'feat-a-2026-05-26', TASKS_A);
    await writeTasks(root, 'feat-b-2026-05-26', TASKS_B);
    const view = await runStatus(root);
    expect(view).toContain('Todo: 2');
    expect(view).toContain('In progress: 1');
    expect(view).toContain('Done: 2');
    expect(view).toContain('1.2');
  });

  test('scopes to a single change', async () => {
    const root = await project();
    await writeTasks(root, 'feat-a-2026-05-26', TASKS_A);
    await writeTasks(root, 'feat-b-2026-05-26', TASKS_B);
    const view = await runStatus(root, { change: 'feat-a-2026-05-26' });
    expect(view).toContain('1.1');
    expect(view).not.toContain('B-001');
  });

  test('empty workspace returns an empty state', async () => {
    const root = await project();
    const view = await runStatus(root);
    expect(view).toContain('Todo: 0');
    expect(view).toContain('Done: 0');
  });
});
