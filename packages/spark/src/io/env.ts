import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type EnvApplyResult = {
  file: string;
  added: string[];
};

async function readExisting(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

function escapeRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasEnvVar(content: string, key: string): boolean {
  return new RegExp(`^\\s*(?:export\\s+)?${escapeRegex(key)}\\s*=`, 'm').test(content);
}

async function appendEnvVarsToFile(
  path: string,
  vars: readonly string[],
  createIfMissing = false,
): Promise<string[]> {
  const existing = await readExisting(path);
  const current = existing === undefined && createIfMissing ? '' : existing;
  if (current === undefined) {
    return [];
  }

  const missing = vars.filter((key) => !hasEnvVar(current, key));
  if (missing.length === 0) {
    return [];
  }

  const prefix = current.length === 0 || current.endsWith('\n') ? '' : '\n';
  const next = `${current}${prefix}${missing.map((key) => `${key}=`).join('\n')}\n`;
  await writeFile(path, next);
  return missing;
}

export async function appendEnvVars(
  projectRoot: string,
  vars: readonly string[],
): Promise<EnvApplyResult[]> {
  const uniqueVars = [...new Set(vars)].toSorted();
  const results: EnvApplyResult[] = [];

  for (const file of ['.env.example', '.env.local']) {
    const added = await appendEnvVarsToFile(join(projectRoot, file), uniqueVars, file === '.env.example');
    results.push({ file, added });
  }

  return results;
}
