import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, resolve, sep } from 'node:path';
import type { PackManifest } from '@forgeailab/spark-schema';
import type { AppSkillsConfig } from '../config.ts';

type PackFileOperation = NonNullable<PackManifest['files']>[number];

export type FileApplyRecord = {
  to: string;
  mode: PackFileOperation['mode'];
  changed: boolean;
  marker?: string;
  contentHash?: string;
};

export type ApplyFilesOptions = {
  projectRoot: string;
  packRoot: string;
  packName: string;
  config: AppSkillsConfig;
  operations: readonly PackFileOperation[];
};

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

function assertInsideRoot(root: string, path: string): string {
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(root, path);

  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(`Refusing to access path outside project root: ${path}`);
  }

  return resolvedPath;
}

function assertSourceInsidePack(packRoot: string, path: string): string {
  const filesRoot = resolve(packRoot, 'files');
  const resolvedPath = resolve(filesRoot, path);

  if (resolvedPath !== filesRoot && !resolvedPath.startsWith(`${filesRoot}${sep}`)) {
    throw new Error(`Refusing to read pack file outside files/: ${path}`);
  }

  return resolvedPath;
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function commentSyntax(path: string): { start: string; end: string } {
  const extension = extname(path).slice(1).toLowerCase();

  if (['css', 'scss', 'less', 'js', 'cjs', 'mjs', 'ts', 'tsx', 'jsx', 'json5'].includes(extension)) {
    return { start: '/* ', end: ' */' };
  }

  if (['html', 'htm', 'xml', 'svg', 'vue'].includes(extension)) {
    return { start: '<!-- ', end: ' -->' };
  }

  return { start: '# ', end: '' };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMergeJson(base: unknown, patch: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return patch;
  }

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    merged[key] = key in merged ? deepMergeJson(merged[key], value) : value;
  }

  return merged;
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).toSorted()) {
    sorted[key] = sortJson(value[key]);
  }

  return sorted;
}

function lookupTemplateValue(config: AppSkillsConfig, key: string): string {
  const segments = key.split('.');
  let current: unknown = config;

  for (const segment of segments) {
    if (!isPlainObject(current) || !(segment in current)) {
      return '';
    }
    current = current[segment];
  }

  if (current === undefined || current === null) {
    return '';
  }

  switch (typeof current) {
    case 'string':
      return current;
    case 'number':
    case 'boolean':
    case 'bigint':
    case 'symbol':
      return String(current);
    default:
      return JSON.stringify(current) ?? '';
  }
}

export function renderTemplate(template: string, config: AppSkillsConfig): string {
  return template.replaceAll(/{{\s*([A-Za-z0-9_.-]+)\s*}}/g, (_match, key: string) =>
    lookupTemplateValue(config, key),
  );
}

function appendBlock(packName: string, content: string, destinationPath: string): { marker: string; block: string } {
  const marker = `spark:${packName}`;
  const { start, end } = commentSyntax(destinationPath);
  const begin = `${start}>>> ${marker} >>>${end}`.trim();
  const finish = `${start}<<< ${marker} <<<${end}`.trim();
  const trimmedContent = content.replace(/\s+$/u, '');

  return {
    marker,
    block: `${begin}\n${trimmedContent}\n${finish}\n`,
  };
}

async function writeTextIfChanged(path: string, content: string): Promise<boolean> {
  if ((await fileExists(path)) && (await readFile(path, 'utf8')) === content) {
    return false;
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
  return true;
}

export async function preflightFileOperations(options: ApplyFilesOptions): Promise<void> {
  for (const operation of options.operations) {
    const destination = assertInsideRoot(options.projectRoot, operation.to);
    if (operation.mode === 'create' && (await fileExists(destination))) {
      throw new Error(`create mode refuses to overwrite existing file: ${operation.to}`);
    }
  }
}

export async function applyFileOperation(
  options: Omit<ApplyFilesOptions, 'operations'>,
  operation: PackFileOperation,
): Promise<FileApplyRecord> {
  const source = assertSourceInsidePack(options.packRoot, operation.from);
  const destination = assertInsideRoot(options.projectRoot, operation.to);
  const sourceContent = await readFile(source, 'utf8');

  if (operation.mode === 'create') {
    if (await fileExists(destination)) {
      throw new Error(`create mode refuses to overwrite existing file: ${operation.to}`);
    }

    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, sourceContent);
    return {
      to: operation.to,
      mode: operation.mode,
      changed: true,
      contentHash: hashContent(sourceContent),
    };
  }

  if (operation.mode === 'create-or-skip') {
    if (await fileExists(destination)) {
      return {
        to: operation.to,
        mode: operation.mode,
        changed: false,
        contentHash: hashContent(sourceContent),
      };
    }

    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, sourceContent);
    return {
      to: operation.to,
      mode: operation.mode,
      changed: true,
      contentHash: hashContent(sourceContent),
    };
  }

  if (operation.mode === 'append') {
    const { marker, block } = appendBlock(options.packName, sourceContent, destination);
    const current = (await fileExists(destination)) ? await readFile(destination, 'utf8') : '';

    if (current.includes(marker)) {
      return {
        to: operation.to,
        mode: operation.mode,
        changed: false,
        marker,
        contentHash: hashContent(block),
      };
    }

    const separator = current.length === 0 || current.endsWith('\n') ? '' : '\n';
    const next = `${current}${separator}${current.length === 0 ? '' : '\n'}${block}`;
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, next);
    return {
      to: operation.to,
      mode: operation.mode,
      changed: true,
      marker,
      contentHash: hashContent(block),
    };
  }

  if (operation.mode === 'merge-json') {
    const current = (await fileExists(destination))
      ? (JSON.parse(await readFile(destination, 'utf8')) as unknown)
      : {};
    const patch = JSON.parse(sourceContent) as unknown;
    const merged = sortJson(deepMergeJson(current, patch));
    const rendered = `${JSON.stringify(merged, null, 2)}\n`;
    const changed = await writeTextIfChanged(destination, rendered);

    return {
      to: operation.to,
      mode: operation.mode,
      changed,
      contentHash: hashContent(rendered),
    };
  }

  const rendered = renderTemplate(sourceContent, options.config);
  if ((await fileExists(destination)) && (await readFile(destination, 'utf8')) !== rendered) {
    // TODO: If templates later need intentional overwrites, add an explicit manifest flag.
    throw new Error(`template mode refuses to overwrite changed file: ${operation.to}`);
  }

  const changed = await writeTextIfChanged(destination, rendered);
  return {
    to: operation.to,
    mode: operation.mode,
    changed,
    contentHash: hashContent(rendered),
  };
}

export async function applyFileOperations(options: ApplyFilesOptions): Promise<FileApplyRecord[]> {
  await preflightFileOperations(options);

  const records: FileApplyRecord[] = [];
  for (const operation of options.operations) {
    records.push(await applyFileOperation(options, operation));
  }

  return records;
}
