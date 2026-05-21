import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import { readConfig } from '../config.ts';
import { missingBoardTasks } from '../io/board.ts';
import { readState } from '../io/state.ts';

type CheckOutput = Pick<Console, 'log' | 'error'>;

export type DriftReport = {
  missingFiles: string[];
  missingEnv: string[];
  missingTasks: string[];
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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasEnvVar(content: string, key: string): boolean {
  return new RegExp(`^\\s*(?:export\\s+)?${escapeRegex(key)}\\s*=`, 'm').test(content);
}

async function readEnvLocal(projectRoot: string): Promise<string> {
  try {
    return await readFile(join(projectRoot, '.env.local'), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

export async function runCheck(
  projectRoot = process.cwd(),
  output: CheckOutput = console,
): Promise<DriftReport> {
  await readConfig(projectRoot);
  const state = await readState(projectRoot);
  const recordedFiles = [
    ...new Set(state.installed_packs.flatMap((pack) => pack.files)),
  ].sort();
  const recordedEnv = [...new Set(state.installed_packs.flatMap((pack) => pack.env))].sort();
  const recordedTasks = [...new Set(state.installed_packs.flatMap((pack) => pack.tasks))].sort();

  const missingFiles: string[] = [];
  for (const file of recordedFiles) {
    if (!(await fileExists(join(projectRoot, file)))) {
      missingFiles.push(file);
    }
  }

  const envLocal = await readEnvLocal(projectRoot);
  const missingEnv = recordedEnv.filter((key) => !hasEnvVar(envLocal, key));
  const missingTasks = await missingBoardTasks(projectRoot, recordedTasks);

  if (missingFiles.length === 0 && missingEnv.length === 0 && missingTasks.length === 0) {
    output.log(pc.green('OK: app-skills state matches the project filesystem.'));
    return {
      missingFiles,
      missingEnv,
      missingTasks,
    };
  }

  output.error(pc.red('Drift detected. app-skills check does not repair files.'));
  if (missingFiles.length > 0) {
    output.error('drift: missing files');
    for (const file of missingFiles) {
      output.error(`  ${file}`);
    }
    output.error('suggestion: git restore the missing file or re-run the affected pack install');
  }

  if (missingEnv.length > 0) {
    output.error('missing env');
    for (const key of missingEnv) {
      output.error(`  ${key}`);
    }
  }

  if (missingTasks.length > 0) {
    output.error('missing tasks');
    for (const taskId of missingTasks) {
      output.error(`  ${taskId}`);
    }
  }

  return {
    missingFiles,
    missingEnv,
    missingTasks,
  };
}

export const checkCommand = defineCommand({
  meta: {
    name: 'check',
    description: 'Report drift between state.json and the project filesystem',
  },
  async run() {
    const report = await runCheck();
    if (
      report.missingFiles.length > 0 ||
      report.missingEnv.length > 0 ||
      report.missingTasks.length > 0
    ) {
      process.exitCode = 1;
    }
  },
});
