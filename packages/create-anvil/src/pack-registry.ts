import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parsePackToml, type ParseError, type RuntimePackageBlock } from '@forgeailab/anvil-schema';
import { findMonorepoRoot } from './paths.ts';
import type { PickerPack } from './picker.ts';

export type PackMetadata = PickerPack;

export function getPacksDir(): string {
  return process.env.CREATE_ANVIL_PACKS_DIR ?? join(findMonorepoRoot(), 'packs');
}

function formatParseError(error: ParseError): string {
  const issues = error.issues?.map((issue) => `  - ${issue}`).join('\n');
  return issues === undefined ? error.message : `${error.message}\n${issues}`;
}

async function readChildDirectories(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();
}

async function readToml(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

export async function loadPackRegistry(packsDir: string = getPacksDir()): Promise<PackMetadata[]> {
  const entries = await Promise.all(
    (await readChildDirectories(packsDir)).map(async (dirName) => {
      const manifestPath = join(packsDir, dirName, 'pack.toml');
      const raw = await readToml(manifestPath);
      if (raw === undefined) {
        return undefined;
      }

      const parsed = parsePackToml(raw);

      if (!parsed.ok) {
        throw new Error(`Invalid pack manifest at ${manifestPath}:\n${formatParseError(parsed.error)}`);
      }

      const manifest = parsed.data;
      if (manifest.name !== dirName) {
        throw new Error(`${manifestPath}: pack name "${manifest.name}" must match directory "${dirName}"`);
      }

      return {
        name: manifest.name,
        category: manifest.category,
        description: manifest.description ?? '',
        provides: manifest.provides,
        requires: manifest.requires,
        runtimePackage: manifest.runtime_package as RuntimePackageBlock | undefined,
      };
    }),
  );

  return entries
    .filter((pack): pack is PackMetadata => pack !== undefined)
    .sort((left, right) => left.name.localeCompare(right.name));
}
