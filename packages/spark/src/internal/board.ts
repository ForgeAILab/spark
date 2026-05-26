import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export enum BoardTaskStatus {
  Todo = 'todo',
  InProgress = 'in-progress',
  Done = 'done',
  Blocked = 'blocked',
  Cut = 'cut',
}

export type BoardTask = {
  id: string;
  title: string;
  status: BoardTaskStatus;
  description: string;
  raw: string;
  startLine: number;
  endLine: number;
};

export type BoardEpic = {
  name: string;
  description: string;
  tasks: BoardTask[];
  raw: string;
  startLine: number;
  endLine: number;
};

export type Board = {
  path: string;
  raw: string;
  epics: BoardEpic[];
  toMarkdown(): string;
};

export type SeedTask = {
  id?: string;
  title: string;
  status?: BoardTaskStatus;
  description?: string;
};

export type AggregatedTask = BoardTask & { changeId: string };

const statusMarkers: Record<BoardTaskStatus, string> = {
  [BoardTaskStatus.Todo]: ' ',
  [BoardTaskStatus.InProgress]: '~',
  [BoardTaskStatus.Done]: 'x',
  [BoardTaskStatus.Blocked]: '!',
  [BoardTaskStatus.Cut]: '-',
};

function cleanLine(line: string): string {
  return line.endsWith('\r') ? line.slice(0, -1) : line;
}

function boardLines(raw: string): string[] {
  if (raw.length === 0) return [];
  return raw.endsWith('\n') ? raw.slice(0, -1).split('\n') : raw.split('\n');
}

function parseError(path: string, line: number, message: string): Error {
  return new Error(`Malformed tasks file at ${path}:${line}: ${message}`);
}

function statusFromMarker(path: string, lineNumber: number, marker: string): BoardTaskStatus {
  if (marker === ' ') return BoardTaskStatus.Todo;
  if (marker === '~' || marker === '/') return BoardTaskStatus.InProgress;
  if (marker === 'x' || marker === 'X') return BoardTaskStatus.Done;
  if (marker === '!') return BoardTaskStatus.Blocked;
  if (marker === '-') return BoardTaskStatus.Cut;
  throw parseError(path, lineNumber, `unsupported status marker "${marker}"`);
}

function assertStatus(status: BoardTaskStatus, path: string): BoardTaskStatus {
  if ((Object.values(BoardTaskStatus) as string[]).includes(status)) return status;
  throw new Error(`Unsupported board task status "${status}" for ${path}`);
}

function escapeRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse a task checkbox line. Supports two id styles:
 *   - "- [ ] 1.2 Wire login form"    -> id="1.2",     title="Wire login form"
 *   - "- [ ] PAY-001: Wire checkout" -> id="PAY-001", title="Wire checkout"
 * Rule: id = first whitespace-delimited token after the checkbox, trailing ":" stripped.
 * Side states may be a marker ([!]/[-]) or an inline annotation ("Blocked:"/"Cut:").
 */
function parseTaskLine(
  path: string,
  lineNumber: number,
  line: string,
): { id: string; title: string; status: BoardTaskStatus } | undefined {
  const checkboxMatch = /^\s*[-*]\s+\[([^\]])\]\s+(.+)$/u.exec(line);
  if (!checkboxMatch) return undefined;

  const markerChar = checkboxMatch[1];
  const rest = checkboxMatch[2].trim();
  const spaceIdx = rest.search(/\s/u);

  let id: string;
  let title: string;
  if (spaceIdx === -1) {
    id = rest.replace(/:$/u, '');
    title = id;
  } else {
    id = rest.slice(0, spaceIdx).replace(/:$/u, '');
    title = rest.slice(spaceIdx).trim();
  }

  if (id.length === 0) return undefined;

  let status = statusFromMarker(path, lineNumber, markerChar);
  // Documented founder form: side states annotated inline on a "- [ ]" line.
  if (/(^|\s)Cut:/u.test(rest)) {
    status = BoardTaskStatus.Cut;
  } else if (status === BoardTaskStatus.Todo && /(^|\s)Blocked:/u.test(rest)) {
    status = BoardTaskStatus.Blocked;
  }

  return { id, title, status };
}

/** Returns the index of the first line AFTER a leading frontmatter block, else 0. */
function skipFrontmatter(lines: readonly string[]): number {
  if (lines.length === 0 || cleanLine(lines[0]).trim() !== '---') return 0;
  for (let i = 1; i < lines.length; i += 1) {
    if (cleanLine(lines[i]).trim() === '---') return i + 1;
  }
  return 0;
}

type DraftTask = {
  id: string;
  title: string;
  status: BoardTaskStatus;
  startIndex: number;
};

type DraftEpic = {
  name: string;
  startIndex: number;
  firstTaskIndex?: number;
  tasks: BoardTask[];
};

export function parseTasksMarkdown(path: string, raw: string): Board {
  const lines = boardLines(raw);
  const epics: BoardEpic[] = [];
  const seenTaskIds = new Set<string>();
  let currentEpic: DraftEpic | undefined;
  let currentTask: DraftTask | undefined;
  const startLine = skipFrontmatter(lines);

  function finishTask(endIndex: number): void {
    if (!currentTask || !currentEpic) return;
    const rawLines = lines.slice(currentTask.startIndex, endIndex);
    const task: BoardTask = {
      id: currentTask.id,
      title: currentTask.title,
      status: currentTask.status,
      description: rawLines.slice(1).join('\n'),
      raw: rawLines.join('\n'),
      startLine: currentTask.startIndex + 1,
      endLine: endIndex,
    };
    if (seenTaskIds.has(task.id)) {
      throw parseError(path, task.startLine, `duplicate task id "${task.id}"`);
    }
    seenTaskIds.add(task.id);
    currentEpic.firstTaskIndex ??= currentTask.startIndex;
    currentEpic.tasks.push(task);
    currentTask = undefined;
  }

  function finishEpic(endIndex: number): void {
    if (!currentEpic) return;
    finishTask(endIndex);
    const descriptionEnd = currentEpic.firstTaskIndex ?? endIndex;
    epics.push({
      name: currentEpic.name,
      description: lines.slice(currentEpic.startIndex + 1, descriptionEnd).join('\n'),
      tasks: currentEpic.tasks,
      raw: lines.slice(currentEpic.startIndex, endIndex).join('\n'),
      startLine: currentEpic.startIndex + 1,
      endLine: endIndex,
    });
    currentEpic = undefined;
  }

  for (let index = startLine; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = cleanLine(lines[index]);

    const epicMatch = /^##(?!#)\s+(.+?)\s*$/u.exec(line);
    if (epicMatch) {
      finishEpic(index);
      currentEpic = { name: epicMatch[1], startIndex: index, tasks: [] };
      continue;
    }

    if (/^\s*[-*]\s+\[[^\]]\]\s+/u.test(line)) {
      if (!currentEpic) {
        throw parseError(path, lineNumber, 'task appears before any section heading');
      }
      finishTask(index);
      const parsed = parseTaskLine(path, lineNumber, line);
      if (!parsed) throw parseError(path, lineNumber, 'unrecognised task line format');
      currentTask = { ...parsed, startIndex: index };
    }
  }

  finishEpic(lines.length);

  return {
    path,
    raw,
    epics,
    toMarkdown() {
      return raw;
    },
  };
}

// Legacy alias retained for any existing callers.
export { parseTasksMarkdown as parseBoardMarkdown };

// ---------------------------------------------------------------------------
// Multi-change aggregation
// ---------------------------------------------------------------------------

export async function readAllChangeTasks(projectRoot: string): Promise<AggregatedTask[]> {
  const changesDir = join(projectRoot, 'docs', 'spark', 'changes');
  let changeIds: string[];

  try {
    const dirents = await readdir(changesDir, { withFileTypes: true });
    changeIds = dirents
      .filter((d) => d.isDirectory() && d.name !== 'archive')
      .map((d) => d.name)
      .toSorted();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  const allTasks: AggregatedTask[] = [];

  for (const changeId of changeIds) {
    const tasksPath = join(changesDir, changeId, 'tasks.md');
    let raw: string;
    try {
      raw = await readFile(tasksPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
    const board = parseTasksMarkdown(tasksPath, raw);
    for (const epic of board.epics) {
      for (const task of epic.tasks) {
        allTasks.push({ ...task, changeId });
      }
    }
  }

  return allTasks;
}

// ---------------------------------------------------------------------------
// renderBuildStatus — pure, deterministic
// ---------------------------------------------------------------------------

export function renderBuildStatus(tasks: readonly AggregatedTask[]): string {
  const todo = tasks.filter((t) => t.status === BoardTaskStatus.Todo);
  const inProgress = tasks.filter((t) => t.status === BoardTaskStatus.InProgress);
  const done = tasks.filter((t) => t.status === BoardTaskStatus.Done);
  const blocked = tasks.filter((t) => t.status === BoardTaskStatus.Blocked);
  const cut = tasks.filter((t) => t.status === BoardTaskStatus.Cut);

  const lines: string[] = [
    `Todo: ${todo.length} · In progress: ${inProgress.length} · Done: ${done.length} · Blocked: ${blocked.length}`,
  ];

  function renderGroup(label: string, group: readonly AggregatedTask[]): void {
    if (group.length === 0) return;
    lines.push(`\n### ${label}`);
    const sorted = [...group].toSorted((a, b) =>
      a.changeId === b.changeId ? a.id.localeCompare(b.id) : a.changeId.localeCompare(b.changeId),
    );
    for (const task of sorted) {
      lines.push(`- [${task.changeId}] ${task.id}: ${task.title}`);
    }
  }

  renderGroup('In progress', inProgress);
  renderGroup('Blocked', blocked);
  renderGroup('Todo', todo);
  renderGroup('Done', done);
  if (cut.length > 0) renderGroup('Cut', cut);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Pack-install task seeding
// ---------------------------------------------------------------------------

export function packInstallChangeId(date: Date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `pack-install-${yyyy}-${mm}-${dd}`;
}

function changeTasksFilePath(projectRoot: string, changeId: string): string {
  return join(projectRoot, 'docs', 'spark', 'changes', changeId, 'tasks.md');
}

function buildFrontmatter(): string {
  const now = new Date().toISOString();
  return `---\ncreated_at: ${now}\nupdated_at: ${now}\ncompleted_at:\n---\n`;
}

function generatedTaskId(packName: string, index: number): string {
  const prefix = packName
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
  return `${prefix || 'PACK'}-${String(index + 1).padStart(3, '0')}`;
}

function normalizeSeedTask(
  path: string,
  packName: string,
  task: SeedTask,
  index: number,
): Required<SeedTask> {
  if (task.title.trim().length === 0) {
    throw new Error(`Cannot seed board task with an empty title for ${path}`);
  }
  return {
    id: task.id?.trim() || generatedTaskId(packName, index),
    title: task.title.trim(),
    status: assertStatus(task.status ?? BoardTaskStatus.Todo, path),
    description: task.description ?? '',
  };
}

function formatSeedTask(task: Required<SeedTask>, packName: string): string {
  const lines = [`- [${statusMarkers[task.status]}] ${task.id}: ${task.title}`];
  lines.push('  - Status: Clarifying');
  lines.push(`  - requires_pack: ${packName}`);
  const description = task.description.replaceAll(/\r\n/g, '\n').replace(/\n$/u, '');
  if (description.trim().length > 0) {
    lines.push(...description.split('\n').map((l) => `  ${l}`));
  }
  return lines.join('\n');
}

function rawHasTaskId(raw: string, taskId: string): boolean {
  const escaped = escapeRegex(taskId);
  return new RegExp(`(^|\\n)\\s*[-*]\\s+\\[[^\\]]\\]\\s+${escaped}(?::|\\s|$)`, 'u').test(raw);
}

async function readExistingRaw(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw error;
  }
}

function appendPackSection(
  raw: string,
  packName: string,
  tasks: readonly Required<SeedTask>[],
): string {
  const taskBlock = tasks.map((t) => formatSeedTask(t, packName)).join('\n\n');
  const heading = `## ${packName}`;
  const rawLines = raw.split('\n');
  let headingIndex = -1;

  for (let i = 0; i < rawLines.length; i += 1) {
    if (cleanLine(rawLines[i]).trim() === heading) {
      headingIndex = i;
      break;
    }
  }

  if (headingIndex === -1) {
    const sep = raw.endsWith('\n') ? '\n' : '\n\n';
    return `${raw}${sep}${heading}\n\n${taskBlock}\n`;
  }

  // Section exists — insert before the next "## " heading, or at EOF.
  let insertOffset = raw.length;
  let charCount = 0;
  for (let i = 0; i < rawLines.length; i += 1) {
    if (i > headingIndex && /^##(?!#)\s+/u.test(cleanLine(rawLines[i]))) {
      insertOffset = charCount;
      break;
    }
    charCount += rawLines[i].length + 1;
  }

  const before = raw.slice(0, insertOffset);
  const after = raw.slice(insertOffset);
  const sep = before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  const afterSep = after.length > 0 ? '\n' : '';
  return `${before}${sep}${taskBlock}\n${afterSep}${after}`;
}

export async function seedTasks(
  projectRoot: string,
  packName: string,
  tasks: Array<SeedTask>,
): Promise<void> {
  if (tasks.length === 0) return;

  const existingIds = new Set((await readAllChangeTasks(projectRoot)).map((t) => t.id));
  const path = changeTasksFilePath(projectRoot, packInstallChangeId());
  const currentRaw = await readExistingRaw(path);

  const normalizedTasks = tasks
    .map((task, index) => normalizeSeedTask(path, packName, task, index))
    .filter((task) => !existingIds.has(task.id) && !rawHasTaskId(currentRaw, task.id));

  if (normalizedTasks.length === 0) return;

  const base = currentRaw.length > 0 ? currentRaw : buildFrontmatter();
  const next = appendPackSection(base, packName, normalizedTasks);

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, next);
}

// ---------------------------------------------------------------------------
// updateStatus — parameterized by the tasks file path
// ---------------------------------------------------------------------------

export async function updateStatus(
  tasksFile: string,
  taskId: string,
  status: BoardTaskStatus,
): Promise<void> {
  const nextStatus = assertStatus(status, tasksFile);
  const raw = await readFile(tasksFile, 'utf8');
  const lines = raw.split('\n');
  const marker = statusMarkers[nextStatus];
  const checkboxPattern = new RegExp(
    `^(\\s*[-*]\\s+\\[)([^\\]])(\\]\\s+${escapeRegex(taskId)}(?::|\\s).*)$`,
    'u',
  );

  for (let index = 0; index < lines.length; index += 1) {
    const originalLine = lines[index];
    const hasCarriage = originalLine.endsWith('\r');
    const line = cleanLine(originalLine);
    const match = checkboxPattern.exec(line);
    if (match) {
      lines[index] = `${match[1]}${marker}${match[3]}${hasCarriage ? '\r' : ''}`;
      const nextRaw = lines.join('\n');
      if (nextRaw !== raw) await writeFile(tasksFile, nextRaw);
      return;
    }
  }

  throw new Error(`Task "${taskId}" not found in ${tasksFile}`);
}

// ---------------------------------------------------------------------------
// readBoard — reads a single change's tasks.md, or aggregates across changes
// ---------------------------------------------------------------------------

export async function readBoard(projectRoot: string, changeId?: string): Promise<Board> {
  if (changeId) {
    const path = changeTasksFilePath(projectRoot, changeId);
    try {
      const raw = await readFile(path, 'utf8');
      return parseTasksMarkdown(path, raw);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Tasks file not found at ${path}`, { cause: error });
      }
      throw error;
    }
  }

  const allTasks = await readAllChangeTasks(projectRoot);
  return {
    path: join(projectRoot, 'docs', 'spark', 'changes'),
    raw: '',
    epics: [],
    toMarkdown() {
      return renderBuildStatus(allTasks);
    },
  };
}
