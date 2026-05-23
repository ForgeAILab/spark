import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BoardTaskStatus, readBoard, seedTasks, updateStatus } from '../src/index.ts';

async function tempProject(): Promise<string> {
  const projectRoot = await mkdtemp(join(tmpdir(), 'anvil-board-'));
  await mkdir(join(projectRoot, '.ai'), { recursive: true });
  return projectRoot;
}

function trimTrailingNewline(value: string): string {
  return value.replace(/\n+$/u, '');
}

function changedLineIndexes(before: string, after: string): number[] {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const count = Math.max(beforeLines.length, afterLines.length);
  const changed: number[] = [];

  for (let index = 0; index < count; index += 1) {
    if (beforeLines[index] !== afterLines[index]) {
      changed.push(index);
    }
  }

  return changed;
}

describe('anvil-board', () => {
  test('round-trips a board fixture byte-for-byte modulo trailing newline', async () => {
    const projectRoot = await tempProject();
    const boardPath = join(projectRoot, '.ai', 'board.md');
    const fixture = `# Board

Introductory user prose stays untouched.

## Core

Epic-level notes stay opaque.

- [ ] CORE-001: Build the core loop
  Preserve this task description.
  - Including nested prose.

- [~] CORE-002: Wire state updates
  Owner note: keep local.

## Follow-up

- [!] FOLLOW-001: Unblock deployment
`;

    await writeFile(boardPath, fixture);

    const board = await readBoard(projectRoot);

    expect(board.epics).toHaveLength(2);
    expect(board.epics[0].tasks[0].status).toBe(BoardTaskStatus.Todo);
    expect(trimTrailingNewline(board.toMarkdown())).toBe(trimTrailingNewline(fixture));
  });

  test('seedTasks is idempotent for the same pack and tasks', async () => {
    const projectRoot = await tempProject();
    const boardPath = join(projectRoot, '.ai', 'board.md');
    const tasks = [
      {
        id: 'DEMO-001',
        title: 'Install demo pack',
        description: 'Acceptance:\n- Demo pack task is visible',
      },
      {
        id: 'DEMO-002',
        title: 'Verify demo pack',
        status: BoardTaskStatus.Blocked,
      },
    ];
    await writeFile(boardPath, '# Board\n');

    await seedTasks(projectRoot, 'demo-pack', tasks);
    const afterFirst = await readFile(boardPath, 'utf8');
    await seedTasks(projectRoot, 'demo-pack', tasks);
    const afterSecond = await readFile(boardPath, 'utf8');

    expect(afterSecond).toBe(afterFirst);
    expect(afterSecond.match(/DEMO-001/g)).toHaveLength(1);
    expect(afterSecond.match(/DEMO-002/g)).toHaveLength(1);
  });

  test('updateStatus changes only the target task marker', async () => {
    const projectRoot = await tempProject();
    const boardPath = join(projectRoot, '.ai', 'board.md');
    const before = `# Board

## demo-pack

- [ ] DEMO-001: Install demo pack
  Keep this description.

- [ ] DEMO-002: Verify demo pack
  Keep this description too.
`;
    await writeFile(boardPath, before);

    await updateStatus(projectRoot, 'DEMO-001', BoardTaskStatus.Done);

    const after = await readFile(boardPath, 'utf8');
    expect(after).toContain('- [x] DEMO-001: Install demo pack');
    expect(after).toContain('- [ ] DEMO-002: Verify demo pack');
    expect(changedLineIndexes(before, after)).toEqual([4]);
  });

  test('malformed board names the board file path', async () => {
    const projectRoot = await tempProject();
    const boardPath = join(projectRoot, '.ai', 'board.md');
    await writeFile(
      boardPath,
      `# Board

## Broken

- [?] BAD-001: Invalid marker
`,
    );

    await expect(readBoard(projectRoot)).rejects.toThrow(boardPath);
  });
});
