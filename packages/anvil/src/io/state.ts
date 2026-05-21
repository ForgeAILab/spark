import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { StateFileSchema, type StateFile, type StateInstalledPack } from '@forgeailab/anvil-schema';

export function emptyState(): StateFile {
  return {
    schema_version: 1,
    installed_packs: [],
  };
}

export function stateFilePath(projectRoot: string): string {
  return join(projectRoot, '.anvil', 'state.json');
}

export async function readState(projectRoot: string): Promise<StateFile> {
  const path = stateFilePath(projectRoot);
  let raw: string;

  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return emptyState();
    }
    throw error;
  }

  return StateFileSchema.parse(JSON.parse(raw));
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

export function normalizeState(state: StateFile): StateFile {
  return {
    schema_version: 1,
    installed_packs: [...state.installed_packs]
      .map(normalizeInstalledPack)
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}

export async function writeState(projectRoot: string, state: StateFile): Promise<void> {
  const path = stateFilePath(projectRoot);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(normalizeState(state), null, 2)}\n`);
}

export function installedPackNames(state: StateFile): string[] {
  return state.installed_packs.map((pack) => pack.name);
}

export function hasInstalledPack(state: StateFile, name: string): boolean {
  return state.installed_packs.some((pack) => pack.name === name);
}

export function addInstalledPack(state: StateFile, pack: StateInstalledPack): StateFile {
  if (hasInstalledPack(state, pack.name)) {
    return state;
  }

  return normalizeState({
    schema_version: 1,
    installed_packs: [...state.installed_packs, pack],
  });
}
