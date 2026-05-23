import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const catalogRootError =
  'Catalog directories (templates/, packs/) not found. Set SPARK_ROOT to point at the spark monorepo, or install via the published @forgeailab/create-spark npm package.';

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

// A catalog root is any directory containing the `templates/` and `packs/`
// folders we need. Two cases produce one:
//   1) The monorepo root (dev). Also has a `package.json` with `workspaces`.
//   2) The published @forgeailab/create-spark package directory (npm install).
//      The publish script bundles templates/ and packs/ into the tarball.
function isCatalogRoot(dir: string): boolean {
  return isDirectory(join(dir, 'templates')) && isDirectory(join(dir, 'packs'));
}

function isMonorepoRoot(dir: string): boolean {
  return hasWorkspacePackageJson(dir) && isDirectory(join(dir, 'templates'));
}

export function findMonorepoRoot(startDir: string = import.meta.dir): string {
  const override = process.env.SPARK_ROOT?.trim();
  if (override) {
    return resolve(override);
  }

  // Published-package case: this file lives at <package>/src/paths.ts ->
  // walk up one dir to <package>/ which the publish script populates with
  // templates/ and packs/.
  const packageRoot = resolve(import.meta.dir, '..');
  if (isCatalogRoot(packageRoot)) {
    return packageRoot;
  }

  // Dev / monorepo case: walk up from cwd or src looking for the monorepo.
  let current = resolve(startDir);
  while (true) {
    if (isMonorepoRoot(current) || isCatalogRoot(current)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      throw new Error(catalogRootError);
    }
    current = parent;
  }
}
