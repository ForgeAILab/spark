import { join } from 'node:path';
import { StateFileSchema, type StateFile, type StateInstalledPack } from '@forgeailab/spark-schema';
export { readState, writeState, withState } from '../internal/state';

export function emptyState(): StateFile {
  return StateFileSchema.parse({
    schema_version: 1,
  });
}

export function stateFilePath(projectRoot: string): string {
  return join(projectRoot, '.spark', 'state.json');
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
  const parsed = StateFileSchema.parse(state);

  return {
    schema_version: 1,
    installed_packs: [...parsed.installed_packs]
      .map(normalizeInstalledPack)
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
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
