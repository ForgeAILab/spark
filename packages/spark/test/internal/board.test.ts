import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type AggregatedTask,
  BoardTaskStatus,
  packInstallChangeId,
  parseTasksMarkdown,
  readAllChangeTasks,
  renderBuildStatus,
  seedTasks,
  updateStatus,
} from '../../src/internal/board.ts';

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), 'spark-board-'));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

function changeDir(changeId: string): string {
  return join(tmpRoot, 'docs', 'spark', 'changes', changeId);
}

async function writeTasksFile(changeId: string, content: string): Promise<void> {
  const dir = changeDir(changeId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'tasks.md'), content);
}

// ---------------------------------------------------------------------------
// parseTasksMarkdown
// ---------------------------------------------------------------------------

describe('parseTasksMarkdown', () => {
  test('parses numbered id style', () => {
    const raw = '## 1. Setup\n- [ ] 1.1 Create project\n- [x] 1.2 Install deps\n';
    const board = parseTasksMarkdown('tasks.md', raw);
    expect(board.epics).toHaveLength(1);
    expect(board.epics[0].name).toBe('1. Setup');
    expect(board.epics[0].tasks[0]).toMatchObject({
      id: '1.1',
      title: 'Create project',
      status: BoardTaskStatus.Todo,
    });
    expect(board.epics[0].tasks[1]).toMatchObject({
      id: '1.2',
      title: 'Install deps',
      status: BoardTaskStatus.Done,
    });
  });

  test('parses stable-id style with colon', () => {
    const raw = '## Payments\n- [ ] PAY-001: Wire checkout\n- [~] PAY-002: Add webhook\n';
    const board = parseTasksMarkdown('tasks.md', raw);
    expect(board.epics[0].tasks[0]).toMatchObject({ id: 'PAY-001', title: 'Wire checkout' });
    expect(board.epics[0].tasks[1].status).toBe(BoardTaskStatus.InProgress);
  });

  test('parses blocked and cut markers', () => {
    const raw = '## Work\n- [!] T-1: Blocked task\n- [-] T-2: Cut task\n';
    const board = parseTasksMarkdown('tasks.md', raw);
    expect(board.epics[0].tasks[0].status).toBe(BoardTaskStatus.Blocked);
    expect(board.epics[0].tasks[1].status).toBe(BoardTaskStatus.Cut);
  });

  test('parses inline Blocked:/Cut: annotations on a todo line', () => {
    const raw =
      '## Work\n- [ ] 1.1 Wire API  Blocked: waiting on key\n- [ ] 1.2 Old idea  Cut: descoped\n';
    const board = parseTasksMarkdown('tasks.md', raw);
    expect(board.epics[0].tasks[0].status).toBe(BoardTaskStatus.Blocked);
    expect(board.epics[0].tasks[1].status).toBe(BoardTaskStatus.Cut);
  });

  test('skips YAML frontmatter', () => {
    const raw =
      '---\ncreated_at: 2026-05-25T00:00:00.000Z\nupdated_at: 2026-05-25T00:00:00.000Z\ncompleted_at:\n---\n\n## Work\n- [ ] T-1: Do thing\n';
    const board = parseTasksMarkdown('tasks.md', raw);
    expect(board.epics).toHaveLength(1);
    expect(board.epics[0].tasks).toHaveLength(1);
    expect(board.epics[0].tasks[0].id).toBe('T-1');
  });

  test('captures sub-bullet description lines', () => {
    const raw =
      '## Section\n- [ ] PAY-001: Pay task\n  - Status: Clarifying\n  - requires_pack: payments-stripe\n';
    const task = parseTasksMarkdown('tasks.md', raw).epics[0].tasks[0];
    expect(task.description).toContain('Status: Clarifying');
    expect(task.description).toContain('requires_pack: payments-stripe');
  });

  test('rejects duplicate task ids', () => {
    const raw = '## Section\n- [ ] PAY-001: First\n- [ ] PAY-001: Duplicate\n';
    expect(() => parseTasksMarkdown('tasks.md', raw)).toThrow(/duplicate task id/);
  });

  test('rejects a task before any section heading', () => {
    expect(() => parseTasksMarkdown('tasks.md', '- [ ] PAY-001: Orphan\n')).toThrow(
      /before any section heading/,
    );
  });

  test('handles an empty file', () => {
    expect(parseTasksMarkdown('tasks.md', '').epics).toHaveLength(0);
  });

  test('round-trips raw via toMarkdown', () => {
    const raw = '## 1. Setup\n- [ ] 1.1 Task\n';
    expect(parseTasksMarkdown('tasks.md', raw).toMarkdown()).toBe(raw);
  });
});

// ---------------------------------------------------------------------------
// renderBuildStatus
// ---------------------------------------------------------------------------

describe('renderBuildStatus', () => {
  function makeTask(
    id: string,
    title: string,
    status: BoardTaskStatus,
    changeId: string,
  ): AggregatedTask {
    return { id, title, status, changeId, description: '', raw: '', startLine: 1, endLine: 1 };
  }

  test('summary counts and sections', () => {
    const result = renderBuildStatus([
      makeTask('PAY-001', 'Checkout', BoardTaskStatus.Done, 'pack-install-2026-05-24'),
      makeTask('PAY-002', 'Webhook', BoardTaskStatus.InProgress, 'pack-install-2026-05-24'),
      makeTask('AUTH-001', 'Login', BoardTaskStatus.Todo, 'feat-auth-2026-05-23'),
      makeTask('AUTH-002', 'Session', BoardTaskStatus.Blocked, 'feat-auth-2026-05-23'),
    ]);
    expect(result).toContain('Todo: 1 · In progress: 1 · Done: 1 · Blocked: 1');
    expect(result).toContain('### In progress');
    expect(result).toContain('### Blocked');
    expect(result).toContain('### Todo');
    expect(result).toContain('### Done');
    expect(result).not.toContain('### Cut');
  });

  test('sorts within a group by changeId then id', () => {
    const result = renderBuildStatus([
      makeTask('Z-1', 'Z', BoardTaskStatus.Todo, 'b-change'),
      makeTask('A-1', 'A', BoardTaskStatus.Todo, 'b-change'),
      makeTask('M-1', 'M', BoardTaskStatus.Todo, 'a-change'),
    ]);
    const taskLines = result.split('\n').filter((l) => l.startsWith('- ['));
    expect(taskLines[0]).toContain('a-change');
    expect(taskLines[1]).toContain('A-1');
    expect(taskLines[2]).toContain('Z-1');
  });

  test('cut section appears only with cut tasks', () => {
    expect(renderBuildStatus([makeTask('C-1', 'Cut', BoardTaskStatus.Cut, 'c')])).toContain(
      '### Cut',
    );
  });

  test('empty input renders just the summary', () => {
    expect(renderBuildStatus([])).toBe('Todo: 0 · In progress: 0 · Done: 0 · Blocked: 0');
  });
});

// ---------------------------------------------------------------------------
// seedTasks
// ---------------------------------------------------------------------------

describe('seedTasks', () => {
  test('creates a pack-install tasks.md with frontmatter and a pack section', async () => {
    await seedTasks(tmpRoot, 'payments-stripe', [
      { id: 'PAY-001', title: 'Wire checkout' },
      { id: 'PAY-002', title: 'Add webhook' },
    ]);

    const tasks = await readAllChangeTasks(tmpRoot);
    expect(tasks.map((t) => t.id).sort()).toEqual(['PAY-001', 'PAY-002']);

    const raw = await readFile(join(changeDir(packInstallChangeId()), 'tasks.md'), 'utf8');
    expect(raw.startsWith('---\n')).toBe(true);
    expect(raw).toContain('created_at:');
    expect(raw).toContain('## payments-stripe');
    expect(raw).toContain('- Status: Clarifying');
    expect(raw).toContain('- requires_pack: payments-stripe');
  });

  test('is idempotent for the same task id', async () => {
    await seedTasks(tmpRoot, 'payments-stripe', [{ id: 'PAY-001', title: 'Checkout' }]);
    await seedTasks(tmpRoot, 'payments-stripe', [{ id: 'PAY-001', title: 'Checkout again' }]);
    const tasks = await readAllChangeTasks(tmpRoot);
    expect(tasks.filter((t) => t.id === 'PAY-001')).toHaveLength(1);
  });

  test('does not duplicate a task id already present in another change', async () => {
    await writeTasksFile('feat-x-2026-05-20', '## payments-stripe\n- [ ] PAY-001: Pre-existing\n');
    await seedTasks(tmpRoot, 'payments-stripe', [{ id: 'PAY-001', title: 'Checkout' }]);
    const tasks = await readAllChangeTasks(tmpRoot);
    expect(tasks.filter((t) => t.id === 'PAY-001')).toHaveLength(1);
  });

  test('same-day installs append sections to the same pack-install file', async () => {
    await seedTasks(tmpRoot, 'payments-stripe', [{ id: 'PAY-001', title: 'Checkout' }]);
    await seedTasks(tmpRoot, 'auth-basic', [{ id: 'AUTH-001', title: 'Login' }]);
    const tasks = await readAllChangeTasks(tmpRoot);
    expect(tasks).toHaveLength(2);
    expect([...new Set(tasks.map((t) => t.changeId))]).toEqual([packInstallChangeId()]);
  });

  test('never creates a .ai/board.md file', async () => {
    await seedTasks(tmpRoot, 'payments-stripe', [{ id: 'PAY-001', title: 'Checkout' }]);
    const { stat } = await import('node:fs/promises');
    let exists = false;
    try {
      await stat(join(tmpRoot, '.ai', 'board.md'));
      exists = true;
    } catch {
      exists = false;
    }
    expect(exists).toBe(false);
  });

  test('no tasks is a no-op', async () => {
    await seedTasks(tmpRoot, 'payments-stripe', []);
    expect(await readAllChangeTasks(tmpRoot)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// readAllChangeTasks
// ---------------------------------------------------------------------------

describe('readAllChangeTasks', () => {
  test('returns empty when no changes dir exists', async () => {
    expect(await readAllChangeTasks(tmpRoot)).toHaveLength(0);
  });

  test('skips the archive directory', async () => {
    await writeTasksFile('archive/old', '## Old\n- [ ] OLD-1: Archived\n');
    expect(await readAllChangeTasks(tmpRoot)).toHaveLength(0);
  });

  test('aggregates across change dirs and tags each task with its change id', async () => {
    await writeTasksFile('feat-auth-2026-05-23', '## auth\n- [ ] AUTH-001: Login\n');
    await writeTasksFile('feat-pay-2026-05-24', '## pay\n- [ ] PAY-001: Checkout\n');
    const tasks = await readAllChangeTasks(tmpRoot);
    expect(tasks.map((t) => t.id).sort()).toEqual(['AUTH-001', 'PAY-001']);
    expect(tasks.find((t) => t.id === 'AUTH-001')?.changeId).toBe('feat-auth-2026-05-23');
  });

  test('skips change dirs without a tasks.md', async () => {
    await mkdir(changeDir('empty-change'), { recursive: true });
    expect(await readAllChangeTasks(tmpRoot)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// updateStatus
// ---------------------------------------------------------------------------

describe('updateStatus', () => {
  test('flips a stable-id task marker', async () => {
    await writeTasksFile('feat-x-2026-05-24', '## Section\n- [ ] PAY-001: Checkout\n');
    const path = join(changeDir('feat-x-2026-05-24'), 'tasks.md');
    await updateStatus(path, 'PAY-001', BoardTaskStatus.Done);
    expect(await readFile(path, 'utf8')).toContain('- [x] PAY-001: Checkout');
  });

  test('flips a numbered-id task marker', async () => {
    await writeTasksFile('feat-x-2026-05-24', '## Section\n- [ ] 1.1 Do thing\n');
    const path = join(changeDir('feat-x-2026-05-24'), 'tasks.md');
    await updateStatus(path, '1.1', BoardTaskStatus.InProgress);
    expect(await readFile(path, 'utf8')).toContain('- [~] 1.1 Do thing');
  });

  test('throws when the task id is not found', async () => {
    await writeTasksFile('feat-x-2026-05-24', '## Section\n- [ ] PAY-001: Checkout\n');
    const path = join(changeDir('feat-x-2026-05-24'), 'tasks.md');
    await expect(updateStatus(path, 'NOPE-001', BoardTaskStatus.Done)).rejects.toThrow(/not found/);
  });
});
