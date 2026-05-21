import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type AppSkillsConfig = {
  appName?: string;
  template: string;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function readConfig(projectRoot: string): Promise<AppSkillsConfig> {
  const configPath = join(projectRoot, 'app-skills.config.json');
  let raw: string;

  try {
    raw = await readFile(configPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error('not in an app-skills project: missing app-skills.config.json');
    }
    throw error;
  }

  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed) || typeof parsed.template !== 'string' || parsed.template.length === 0) {
    throw new Error('app-skills.config.json must include a non-empty "template" field');
  }

  return parsed as AppSkillsConfig;
}
