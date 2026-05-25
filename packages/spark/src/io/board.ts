import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import {
  BoardTaskStatus,
  readAllChangeTasks,
  seedTasks as seedPackageTasks,
} from '../internal/board';

export {
  BoardTaskStatus,
  parseBoardMarkdown,
  parseTasksMarkdown,
  readAllChangeTasks,
  readBoard,
  renderBuildStatus,
  seedTasks,
  updateStatus,
} from '../internal/board';
export type {
  AggregatedTask,
  Board,
  BoardEpic,
  BoardTask as ParsedBoardTask,
  SeedTask,
} from '../internal/board';

export type BoardTask = {
  id: string;
  title: string;
  epic: string;
  acceptance: string[];
};

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
  if (index === -1) return undefined;
  return {
    key: line.slice(0, index).trim(),
    value: stripYamlValue(line.slice(index + 1)),
  };
}

export function parseTasksYaml(raw: string): BoardTask[] {
  const tasks: BoardTask[] = [];
  let current: BoardTask | undefined;
  let defaultEpic = 'Backlog';
  let inAcceptance = false;

  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;

    if (!trimmed.startsWith('- ') && parseKeyValue(trimmed)?.key === 'epic') {
      defaultEpic = parseKeyValue(trimmed)?.value || defaultEpic;
      continue;
    }

    if (trimmed.startsWith('- id:')) {
      const id = stripYamlValue(trimmed.slice('- id:'.length));
      current = { id, title: id, epic: defaultEpic, acceptance: [] };
      tasks.push(current);
      inAcceptance = false;
      continue;
    }

    if (!current) continue;

    if (trimmed === 'acceptance:' || trimmed === 'acceptance_criteria:') {
      inAcceptance = true;
      continue;
    }

    if (inAcceptance && trimmed.startsWith('- ')) {
      current.acceptance.push(stripYamlValue(trimmed.slice(2)));
      continue;
    }

    const kv = parseKeyValue(trimmed);
    if (!kv) continue;

    if (kv.key === 'title') {
      current.title = kv.value;
    } else if (kv.key === 'epic') {
      current.epic = kv.value || defaultEpic;
    } else if (kv.key === 'acceptance' || kv.key === 'acceptance_criteria') {
      inAcceptance = true;
    } else {
      inAcceptance = false;
    }
  }

  return tasks.filter((task) => task.id.length > 0);
}

function assertInsidePack(packRoot: string, path: string): string {
  const resolvedRoot = resolve(packRoot);
  const resolvedPath = resolve(packRoot, path);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(`Refusing to read tasks file outside pack root: ${path}`);
  }
  return resolvedPath;
}

// The pack-install change's task lines carry "Status: Clarifying" + "requires_pack:"
// (added by internal/board.ts); here we only contribute the acceptance sub-bullets.
function formatTaskDescription(task: BoardTask): string {
  const acceptance =
    task.acceptance.length > 0
      ? task.acceptance.map((item) => `  - ${item}`)
      : ['  - Confirm acceptance criteria for this pack task.'];
  return ['acceptance:', ...acceptance].join('\n');
}

export async function seedBoardTasks(
  projectRoot: string,
  packName: string,
  packRoot: string,
  tasksFile?: string,
): Promise<string[]> {
  if (!tasksFile) return [];

  const rawTasks = await readFile(assertInsidePack(packRoot, tasksFile), 'utf8');
  const tasks = parseTasksYaml(rawTasks);
  if (tasks.length === 0) return [];

  const taskIds = tasks.map((task) => task.id);
  const missingBefore = await missingBoardTasks(projectRoot, taskIds);
  if (missingBefore.length === 0) return [];

  const missing = new Set(missingBefore);
  await seedPackageTasks(
    projectRoot,
    packName,
    tasks
      .filter((task) => missing.has(task.id))
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: BoardTaskStatus.Todo,
        description: formatTaskDescription(task),
      })),
  );

  const missingAfter = new Set(await missingBoardTasks(projectRoot, taskIds));
  return missingBefore.filter((taskId) => !missingAfter.has(taskId)).sort();
}

export async function missingBoardTasks(
  projectRoot: string,
  taskIds: readonly string[],
): Promise<string[]> {
  if (taskIds.length === 0) return [];
  const existingIds = new Set((await readAllChangeTasks(projectRoot)).map((task) => task.id));
  return taskIds.filter((id) => !existingIds.has(id)).sort();
}
