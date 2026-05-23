import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export enum BoardTaskStatus {
  Todo = 'todo',
  InProgress = 'in-progress',
  Done = 'done',
  Blocked = 'blocked',
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

type DraftTask = {
  kind: 'checkbox' | 'yaml';
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

const statusMarkers: Record<BoardTaskStatus, string> = {
  [BoardTaskStatus.Todo]: ' ',
  [BoardTaskStatus.InProgress]: '~',
  [BoardTaskStatus.Done]: 'x',
  [BoardTaskStatus.Blocked]: '!',
};

function boardFilePath(projectRoot: string): string {
  return join(projectRoot, '.ai', 'board.md');
}

function cleanLine(line: string): string {
  return line.endsWith('\r') ? line.slice(0, -1) : line;
}

function boardLines(raw: string): string[] {
  if (raw.length === 0) {
    return [];
  }

  return raw.endsWith('\n') ? raw.slice(0, -1).split('\n') : raw.split('\n');
}

function stripYamlValue(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseKeyValue(line: string): { key: string; value: string } | undefined {
  const index = line.indexOf(':');
  if (index === -1) {
    return undefined;
  }

  return {
    key: line.slice(0, index).trim(),
    value: stripYamlValue(line.slice(index + 1)),
  };
}

function parseError(path: string, line: number, message: string): Error {
  return new Error(`Malformed board at ${path}:${line}: ${message}`);
}

function statusFromMarker(path: string, lineNumber: number, marker: string): BoardTaskStatus {
  if (marker === ' ') {
    return BoardTaskStatus.Todo;
  }
  if (marker === '~' || marker === '/') {
    return BoardTaskStatus.InProgress;
  }
  if (marker === 'x' || marker === 'X') {
    return BoardTaskStatus.Done;
  }
  if (marker === '!') {
    return BoardTaskStatus.Blocked;
  }

  throw parseError(path, lineNumber, `unsupported status marker "${marker}"`);
}

function statusFromValue(value: string): BoardTaskStatus | undefined {
  const normalized = stripYamlValue(value).trim().toLowerCase().replace(/\s+/g, ' ');

  if (
    normalized === BoardTaskStatus.Todo ||
    normalized === 'to do' ||
    normalized === 'clarifying' ||
    normalized === 'approved for planning'
  ) {
    return BoardTaskStatus.Todo;
  }

  if (
    normalized === BoardTaskStatus.InProgress ||
    normalized === 'in progress' ||
    normalized === 'approved for execution' ||
    normalized === 'needs review'
  ) {
    return BoardTaskStatus.InProgress;
  }

  if (normalized === BoardTaskStatus.Done || normalized === 'validated') {
    return BoardTaskStatus.Done;
  }

  if (normalized === BoardTaskStatus.Blocked || normalized === 'cut from mvp') {
    return BoardTaskStatus.Blocked;
  }

  return undefined;
}

function assertStatus(status: BoardTaskStatus, path: string): BoardTaskStatus {
  if (Object.values(BoardTaskStatus).includes(status)) {
    return status;
  }

  throw new Error(`Unsupported board task status "${status}" for ${path}`);
}

function parseCheckboxTask(path: string, lineNumber: number, line: string): DraftTask {
  const match = /^\s*[-*]\s+\[([^\]])\]\s+([^\s:]+)\s*:\s*(.+?)\s*$/u.exec(line);
  if (!match) {
    throw parseError(path, lineNumber, 'expected checkbox task format "- [ ] TASK-ID: Title"');
  }

  return {
    kind: 'checkbox',
    id: match[2],
    title: match[3],
    status: statusFromMarker(path, lineNumber, match[1]),
    startIndex: lineNumber - 1,
  };
}

function parseYamlTaskStart(path: string, lineNumber: number, line: string): DraftTask {
  const match = /^\s*-\s+id:\s*(.*)$/u.exec(line);
  if (!match) {
    throw parseError(path, lineNumber, 'expected YAML task id');
  }

  const id = stripYamlValue(match[1]);
  if (id.length === 0) {
    throw parseError(path, lineNumber, 'task id is required');
  }

  return {
    kind: 'yaml',
    id,
    title: id,
    status: BoardTaskStatus.Todo,
    startIndex: lineNumber - 1,
  };
}

function materializeTask(
  path: string,
  lines: readonly string[],
  draft: DraftTask,
  endIndex: number,
): BoardTask {
  const rawLines = lines.slice(draft.startIndex, endIndex);
  let title = draft.title;
  let status = draft.status;

  if (draft.kind === 'yaml') {
    for (const rawLine of rawLines.slice(1)) {
      const kv = parseKeyValue(cleanLine(rawLine).trim());
      if (!kv) {
        continue;
      }

      if (kv.key === 'title') {
        title = kv.value || title;
      } else if (kv.key === 'status') {
        const parsed = statusFromValue(kv.value);
        if (!parsed) {
          throw parseError(path, draft.startIndex + 1, `unsupported status "${kv.value}"`);
        }
        status = parsed;
      }
    }
  }

  return {
    id: draft.id,
    title,
    status,
    description: rawLines.slice(1).join('\n'),
    raw: rawLines.join('\n'),
    startLine: draft.startIndex + 1,
    endLine: endIndex,
  };
}

function parseBoardMarkdown(path: string, raw: string): Board {
  const lines = boardLines(raw);
  const epics: BoardEpic[] = [];
  const seenTaskIds = new Set<string>();
  let currentEpic: DraftEpic | undefined;
  let currentTask: DraftTask | undefined;

  function finishTask(endIndex: number): void {
    if (!currentTask || !currentEpic) {
      return;
    }

    const task = materializeTask(path, lines, currentTask, endIndex);
    if (seenTaskIds.has(task.id)) {
      throw parseError(path, task.startLine, `duplicate task id "${task.id}"`);
    }

    seenTaskIds.add(task.id);
    currentEpic.firstTaskIndex ??= currentTask.startIndex;
    currentEpic.tasks.push(task);
    currentTask = undefined;
  }

  function finishEpic(endIndex: number): void {
    if (!currentEpic) {
      return;
    }

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

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = cleanLine(lines[index]);
    const epicMatch = /^##(?!#)\s+(.+?)\s*$/u.exec(line);
    if (epicMatch) {
      finishEpic(index);
      currentEpic = {
        name: epicMatch[1],
        startIndex: index,
        tasks: [],
      };
      continue;
    }

    const checkboxLike = /^\s*[-*]\s+\[[^\]]+\]\s+/u.test(line);
    if (checkboxLike) {
      if (!currentEpic) {
        throw parseError(path, lineNumber, 'task appears before any epic heading');
      }

      finishTask(index);
      currentTask = parseCheckboxTask(path, lineNumber, line);
      continue;
    }

    const yamlTaskLike = /^\s*-\s+id:/u.test(line);
    if (yamlTaskLike) {
      if (!currentEpic) {
        throw parseError(path, lineNumber, 'task appears before any epic heading');
      }

      finishTask(index);
      currentTask = parseYamlTaskStart(path, lineNumber, line);
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

async function readExistingBoard(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return '# Board\n';
    }
    throw error;
  }
}

export async function readBoard(projectRoot: string): Promise<Board> {
  const path = boardFilePath(projectRoot);

  try {
    const raw = await readFile(path, 'utf8');
    return parseBoardMarkdown(path, raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Board file not found at ${path}`, { cause: error });
    }
    throw error;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function boardHasTask(board: string, taskId: string): boolean {
  const escaped = escapeRegex(taskId);
  const checkboxPattern = new RegExp(`(^|\\n)\\s*[-*]\\s+\\[[^\\]]+\\]\\s+${escaped}\\s*:`, 'u');
  const yamlPattern = new RegExp(`(^|\\n)\\s*-\\s+id:\\s*["']?${escaped}["']?\\s*(\\n|$)`, 'u');

  return checkboxPattern.test(board) || yamlPattern.test(board);
}

function generatedTaskId(packName: string, index: number): string {
  const prefix = packName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

function formatSeedTask(task: Required<SeedTask>): string {
  const lines = [`- [${statusMarkers[task.status]}] ${task.id}: ${task.title}`];
  const description = task.description.replace(/\r\n/g, '\n').replace(/\n$/u, '');

  if (description.trim().length > 0) {
    lines.push(...description.split('\n').map((line) => `  ${line}`));
  }

  return lines.join('\n');
}

function lineStartOffsets(raw: string): number[] {
  const offsets = [0];
  for (let index = 0; index < raw.length; index += 1) {
    if (raw[index] === '\n') {
      offsets.push(index + 1);
    }
  }

  return offsets;
}

function findSectionInsertIndex(board: string, packName: string): number | undefined {
  const heading = `## ${packName}`;
  const lines = board.split('\n');
  const offsets = lineStartOffsets(board);
  let headingIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (cleanLine(lines[index]).trim() === heading) {
      headingIndex = index;
      break;
    }
  }

  if (headingIndex === -1) {
    return undefined;
  }

  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    if (/^##(?!#)\s+/u.test(cleanLine(lines[index]))) {
      return offsets[index] ?? board.length;
    }
  }

  return board.length;
}

function appendTasks(board: string, packName: string, tasks: readonly Required<SeedTask>[]): string {
  const taskBlock = tasks.map(formatSeedTask).join('\n\n');
  const insertIndex = findSectionInsertIndex(board, packName);

  if (insertIndex === undefined) {
    const separator = board.endsWith('\n') ? '\n' : '\n\n';
    return `${board}${separator}## ${packName}\n\n${taskBlock}\n`;
  }

  const before = board.slice(0, insertIndex);
  const after = board.slice(insertIndex);
  const separator = before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  const afterSeparator = after.length > 0 ? '\n' : '';

  return `${before}${separator}${taskBlock}\n${afterSeparator}${after}`;
}

export async function seedTasks(
  projectRoot: string,
  packName: string,
  tasks: Array<SeedTask>,
): Promise<void> {
  if (tasks.length === 0) {
    return;
  }

  const path = boardFilePath(projectRoot);
  const board = await readExistingBoard(path);
  const normalizedTasks = tasks
    .map((task, index) => normalizeSeedTask(path, packName, task, index))
    .filter((task) => !boardHasTask(board, task.id));

  if (normalizedTasks.length === 0) {
    return;
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, appendTasks(board, packName, normalizedTasks));
}

export async function updateStatus(
  projectRoot: string,
  taskId: string,
  status: BoardTaskStatus,
): Promise<void> {
  const path = boardFilePath(projectRoot);
  const nextStatus = assertStatus(status, path);
  const raw = await readFile(path, 'utf8');
  const lines = raw.split('\n');
  const marker = statusMarkers[nextStatus];
  const checkboxPattern = new RegExp(
    `^(\\s*[-*]\\s+\\[)([^\\]])(\\]\\s+${escapeRegex(taskId)}\\s*:\\s*.+)$`,
    'u',
  );

  for (let index = 0; index < lines.length; index += 1) {
    const originalLine = lines[index];
    const hasCarriage = originalLine.endsWith('\r');
    const line = cleanLine(originalLine);
    const checkboxMatch = checkboxPattern.exec(line);

    if (checkboxMatch) {
      lines[index] = `${checkboxMatch[1]}${marker}${checkboxMatch[3]}${hasCarriage ? '\r' : ''}`;
      const nextRaw = lines.join('\n');
      if (nextRaw !== raw) {
        await writeFile(path, nextRaw);
      }
      return;
    }

    const yamlMatch = /^\s*-\s+id:\s*(.*)$/u.exec(line);
    if (yamlMatch && stripYamlValue(yamlMatch[1]) === taskId) {
      for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
        const candidate = cleanLine(lines[nextIndex]);
        if (/^##(?!#)\s+/u.test(candidate) || /^\s*-\s+id:/u.test(candidate)) {
          break;
        }

        const statusMatch = /^(\s*status:\s*)(.*?)(\s*)$/u.exec(candidate);
        if (!statusMatch) {
          continue;
        }

        const candidateHasCarriage = lines[nextIndex].endsWith('\r');
        lines[nextIndex] =
          `${statusMatch[1]}${nextStatus}${statusMatch[3]}${candidateHasCarriage ? '\r' : ''}`;
        const nextRaw = lines.join('\n');
        if (nextRaw !== raw) {
          await writeFile(path, nextRaw);
        }
        return;
      }

      throw new Error(`Task "${taskId}" has no status marker in ${path}`);
    }
  }

  throw new Error(`Task "${taskId}" not found in ${path}`);
}
