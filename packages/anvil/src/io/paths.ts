import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const monorepoRootError =
  'Must be run from inside the anvil monorepo or set ANVIL_ROOT env var pointing to it';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      return false;
    }
    throw error;
  }
}

function hasWorkspacePackageJson(dir: string): boolean {
  try {
    const parsed = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as unknown;
    return isRecord(parsed) && Object.hasOwn(parsed, 'workspaces');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function isMonorepoRoot(dir: string): boolean {
  return hasWorkspacePackageJson(dir) && isDirectory(join(dir, 'templates'));
}

export function findMonorepoRoot(startDir: string = import.meta.dir): string {
  const override = process.env.ANVIL_ROOT?.trim();
  if (override) {
    return resolve(override);
  }

  let current = resolve(startDir);
  while (true) {
    if (isMonorepoRoot(current)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      throw new Error(monorepoRootError);
    }
    current = parent;
  }
}
