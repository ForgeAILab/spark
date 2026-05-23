import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import { readConfig, type AppSkillsConfig } from '../config.ts';
import { missingBoardTasks } from '../io/board.ts';
import { readRegistry, type Registry } from '../io/registry.ts';
import { readState } from '../io/state.ts';
import { installedRuntimeHelperSpecifier } from '../runtime-package.ts';

type CheckOutput = Pick<Console, 'log' | 'error'>;

export type DriftReport = {
  missingFiles: string[];
  missingEnv: string[];
  missingTasks: string[];
  missingHelpers: string[];
};

export type CheckOptions = {
  config?: AppSkillsConfig;
  registry?: Registry;
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
  options: CheckOptions = {},
): Promise<DriftReport> {
  const [, registry, state] = await Promise.all([
    options.config ? Promise.resolve(options.config) : readConfig(projectRoot),
    options.registry ? Promise.resolve(options.registry) : readRegistry(projectRoot),
    readState(projectRoot),
  ]);
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
  const missingHelpers: string[] = [];

  for (const pack of state.installed_packs) {
    const runtimePackage = registry.packs.get(pack.name)?.manifest.runtime_package;
    if (!runtimePackage) {
      continue;
    }

    if (!(await installedRuntimeHelperSpecifier(projectRoot, runtimePackage))) {
      missingHelpers.push(
        `${pack.name}: helper package ${runtimePackage.package} missing from package.json`,
      );
    }
  }

  if (
    missingFiles.length === 0 &&
    missingEnv.length === 0 &&
    missingTasks.length === 0 &&
    missingHelpers.length === 0
  ) {
    output.log(pc.green('OK: spark state matches the project filesystem.'));
    return {
      missingFiles,
      missingEnv,
      missingTasks,
      missingHelpers,
    };
  }

  output.error(pc.red('Drift detected. spark check does not repair files.'));
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

  if (missingHelpers.length > 0) {
    output.error('drift: helper packages');
    for (const helper of missingHelpers) {
      output.error(`  ${helper}`);
    }
  }

  return {
    missingFiles,
    missingEnv,
    missingTasks,
    missingHelpers,
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
      report.missingTasks.length > 0 ||
      report.missingHelpers.length > 0
    ) {
      process.exitCode = 1;
    }
  },
});
