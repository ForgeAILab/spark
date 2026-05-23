import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { StateFileSchema, type StateFile, type StateInstalledPack } from '@forgeailab/anvil-schema';

function stateFilePath(projectRoot: string): string {
  return join(projectRoot, '.anvil', 'state.json');
}

function initialState(): StateFile {
  return StateFileSchema.parse({
    schema_version: 1,
  });
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function normalizeInstalledPack(pack: StateInstalledPack): StateInstalledPack {
  return {
    ...pack,
    files: uniqueSorted(pack.files),
    appended_blocks: [...pack.appended_blocks].sort((left, right) =>
      `${left.to}:${left.marker}`.localeCompare(`${right.to}:${right.marker}`),
    ),
    env: uniqueSorted(pack.env),
    tasks: uniqueSorted(pack.tasks),
  };
}

function normalizeState(state: StateFile): StateFile {
  const parsed = StateFileSchema.parse(state);

  return {
    schema_version: 1,
    installed_packs: [...parsed.installed_packs]
      .map(normalizeInstalledPack)
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseStateFile(path: string, raw: string): StateFile {
  try {
    return normalizeState(StateFileSchema.parse(JSON.parse(raw)));
  } catch (error) {
    throw new Error(`Failed to parse state file at ${path}: ${errorMessage(error)}`, {
      cause: error,
    });
  }
}

export async function readState(projectRoot: string): Promise<StateFile> {
  const path = stateFilePath(projectRoot);
  let raw: string;

  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return initialState();
    }
    throw error;
  }

  return parseStateFile(path, raw);
}

export async function writeState(projectRoot: string, state: StateFile): Promise<void> {
  const path = stateFilePath(projectRoot);
  const parsed = normalizeState(state);

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(parsed, null, 2)}\n`);
}

export async function withState(
  projectRoot: string,
  mutator: (state: StateFile) => StateFile | Promise<StateFile>,
): Promise<StateFile> {
  const current = await readState(projectRoot);
  const next = normalizeState(await mutator(current));

  await writeState(projectRoot, next);
  return next;
}
