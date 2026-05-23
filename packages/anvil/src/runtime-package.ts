import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { PackManifest } from '@forgeailab/anvil-schema';

type RuntimePackage = NonNullable<PackManifest['runtime_package']>;

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return Object.fromEntries(entries);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    return info.isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function helperDirectoryName(packageName: string): string {
  return packageName.split('/').at(-1) ?? packageName;
}

function packageNameFromSpecifier(specifier: string): string {
  const trimmed = specifier.trim();
  if (trimmed.startsWith('@')) {
    const slashIndex = trimmed.indexOf('/');
    if (slashIndex === -1) {
      return trimmed;
    }

    const versionIndex = trimmed.indexOf('@', slashIndex + 1);
    return versionIndex === -1 ? trimmed : trimmed.slice(0, versionIndex);
  }

  const versionIndex = trimmed.indexOf('@');
  return versionIndex === -1 ? trimmed : trimmed.slice(0, versionIndex);
}

async function readPackageJson(projectRoot: string): Promise<PackageJson> {
  let raw: string;
  try {
    raw = await readFile(join(projectRoot, 'package.json'), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }

  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) {
    return {};
  }

  return {
    dependencies: stringRecord(parsed.dependencies),
    devDependencies: stringRecord(parsed.devDependencies),
  };
}

export function assertRuntimeHelperNotRedeclared(packName: string, manifest: PackManifest): void {
  const runtimePackage = manifest.runtime_package;
  if (!runtimePackage) {
    return;
  }

  const duplicate = (manifest.dependencies?.runtime ?? []).find(
    (specifier) => packageNameFromSpecifier(specifier) === runtimePackage.package,
  );
  if (!duplicate) {
    return;
  }

  throw new Error(
    `${packName} declares runtime helper ${runtimePackage.package} in both [runtime_package] and [dependencies].runtime (${duplicate}). Decision 6 requires declaring the helper only in [runtime_package].`,
  );
}

export async function resolveRuntimeHelper(manifest: PackManifest): Promise<string | undefined> {
  const runtimePackage = manifest.runtime_package;
  if (!runtimePackage) {
    return undefined;
  }

  const anvilRoot = process.env.ANVIL_ROOT?.trim();
  if (anvilRoot) {
    const helperDir = resolve(anvilRoot, 'libs', helperDirectoryName(runtimePackage.package));
    if (await fileExists(join(helperDir, 'package.json'))) {
      return `file:${helperDir}`;
    }
  }

  return `${runtimePackage.package}@${runtimePackage.version}`;
}

export async function installedRuntimeHelperSpecifier(
  projectRoot: string,
  runtimePackage: RuntimePackage,
): Promise<string | undefined> {
  const packageJson = await readPackageJson(projectRoot);
  return (
    packageJson.dependencies?.[runtimePackage.package] ??
    packageJson.devDependencies?.[runtimePackage.package]
  );
}

export async function formatResolvedRuntimeHelper(
  projectRoot: string,
  runtimePackage: RuntimePackage,
): Promise<string> {
  return (await installedRuntimeHelperSpecifier(projectRoot, runtimePackage)) ?? 'not installed';
}
