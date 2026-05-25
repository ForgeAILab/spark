import { confirm, isCancel } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import type { StateInstalledPack } from '@forgeailab/spark-schema';
import { readConfig, type AppSkillsConfig } from '../config.ts';
import {
  resolveInstallPlan,
  type InstallPlan,
  type ResolverError,
  type ResolverRegistry,
  type ResolverTemplate,
} from '../resolver.ts';
import { applyFileOperations, preflightFileOperations, type FileApplyRecord } from '../io/files.ts';
import { appendEnvVars } from '../io/env.ts';
import { installDependencies, type DependencyRunner } from '../io/deps.ts';
import { readRegistry, type Registry } from '../io/registry.ts';
import { addInstalledPack, installedPackNames, readState, writeState } from '../io/state.ts';
import { seedBoardTasks } from '../io/board.ts';
import { copyPackSkills } from '../io/skills.ts';

type AddOutput = Pick<Console, 'log' | 'error'>;

export type AddOptions = {
  projectRoot?: string;
  dryRun?: boolean;
  yes?: boolean;
  registry?: Registry;
  config?: AppSkillsConfig;
  dependencyRunner?: DependencyRunner;
  output?: AddOutput;
};

export type AddResult = {
  status: 'already-installed' | 'dry-run' | 'installed';
  plan: InstallPlan;
};

function formatResolverError(error: ResolverError): string {
  if (error.type === 'missing-capability') {
    const providers =
      error.providers.length > 0 ? ` Providers: ${error.providers.join(', ')}` : ' No providers found.';
    return `${error.pack} requires missing capability "${error.capability}".${providers}`;
  }

  if (error.type === 'exclusive-conflict') {
    const suggestion =
      error.source === 'exclusive-capability'
        ? ' Use git reset or revert the existing pack install before choosing an alternative.'
        : '';
    return `${error.packs[0]} conflicts with ${error.packs[1]} on capability "${error.capability}".${suggestion}`;
  }

  if (error.type === 'scaffold-incompat') {
    return `${error.pack} is not compatible with scaffold "${error.activeScaffold}". Compatible scaffolds: ${error.compatibleScaffolds.join(', ')}`;
  }

  if (error.type === 'runtime-incompat') {
    return `${error.pack} requires runtime "${error.missingRuntime}", but scaffold "${error.activeScaffold}" provides: ${error.providedRuntime.join(', ')}`;
  }

  if (error.type === 'circular') {
    return `Circular pack dependency detected: ${error.cycle.join(' -> ')}`;
  }

  return `Unknown pack: ${error.pack}`;
}

function packRuntimeDependencies(plan: InstallPlan): string[] {
  return plan.packs.flatMap((pack) => pack.manifest.dependencies?.runtime ?? []);
}

function packDevDependencies(plan: InstallPlan): string[] {
  return plan.packs.flatMap((pack) => pack.manifest.dependencies?.dev ?? []);
}

function renderPlan(
  plan: InstallPlan,
  runtimeDependencies: readonly string[],
  devDependencies: readonly string[],
): string {
  if (plan.packs.length === 0) {
    return 'No packs to install.';
  }

  const lines = ['Install plan:'];
  for (const pack of plan.packs) {
    lines.push(`- ${pack.name}`);
    for (const file of pack.manifest.files ?? []) {
      lines.push(`  ${file.mode}: ${file.from} -> ${file.to}`);
    }
    for (const key of pack.manifest.env?.required ?? []) {
      lines.push(`  env: ${key}`);
    }
    for (const skill of pack.manifest.skills?.copy ?? []) {
      lines.push(`  skill: ${skill}`);
    }
    if (pack.manifest.tasks?.file) {
      lines.push(`  tasks: ${pack.manifest.tasks.file}`);
    }
  }

  if (runtimeDependencies.length > 0) {
    lines.push(`runtime deps: ${[...new Set(runtimeDependencies)].sort().join(', ')}`);
  }
  if (devDependencies.length > 0) {
    lines.push(`dev deps: ${[...new Set(devDependencies)].sort().join(', ')}`);
  }

  return lines.join('\n');
}

function activeTemplateFromRegistry(config: AppSkillsConfig, registry: Registry): ResolverTemplate {
  const template = registry.templates.get(config.template);
  if (!template) {
    throw new Error(`Template "${config.template}" is not registered in the spark template registry.`);
  }

  if (template.manifest.status === 'planned') {
    throw new Error(`Template "${config.template}" is planned; template not yet implemented.`);
  }

  return template.manifest;
}

async function preflightPlanFiles(
  projectRoot: string,
  registry: ResolverRegistry,
  config: AppSkillsConfig,
  plan: InstallPlan,
): Promise<void> {
  const createTargets = new Map<string, string>();

  for (const pack of plan.packs) {
    const entry = registry.packs.get(pack.name);
    if (!entry?.dir) {
      throw new Error(`Pack "${pack.name}" has no registry directory.`);
    }

    for (const operation of pack.manifest.files ?? []) {
      if (operation.mode !== 'create') {
        continue;
      }

      const existingPack = createTargets.get(operation.to);
      if (existingPack) {
        throw new Error(
          `create mode conflict: ${pack.name} and ${existingPack} both target ${operation.to}`,
        );
      }
      createTargets.set(operation.to, pack.name);
    }

    await preflightFileOperations({
      projectRoot,
      packRoot: entry.dir,
      packName: pack.name,
      config,
      operations: pack.manifest.files ?? [],
    });
  }
}

function stateEntryForPack(
  packName: string,
  version: string,
  fileRecords: readonly FileApplyRecord[],
  envVars: readonly string[],
  taskIds: readonly string[],
  skillFiles: readonly string[],
  touchedEnvFiles: readonly string[],
): StateInstalledPack {
  const now = new Date();
  const packInstallChange = `pack-install-${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  const fileTargets = [
    ...fileRecords.map((record) => record.to),
    ...skillFiles,
    ...touchedEnvFiles,
    ...(taskIds.length > 0 ? [`docs/spark/changes/${packInstallChange}/tasks.md`] : []),
  ];

  return {
    name: packName,
    version,
    files: [...new Set(fileTargets)].sort(),
    appended_blocks: fileRecords
      .filter((record) => record.marker)
      .map((record) => ({
        to: record.to,
        marker: record.marker ?? '',
        content_hash: record.contentHash,
      })),
    env: [...new Set(envVars)].sort(),
    tasks: [...new Set(taskIds)].sort(),
  };
}

export async function runAdd(requestedPacks: readonly string[], options: AddOptions = {}): Promise<AddResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const output = options.output ?? console;
  const requested = requestedPacks.filter((pack) => pack.length > 0);

  if (requested.length === 0) {
    throw new Error('add requires at least one pack name');
  }

  const [config, registry, state] = await Promise.all([
    options.config ? Promise.resolve(options.config) : readConfig(projectRoot),
    options.registry ? Promise.resolve(options.registry) : readRegistry(projectRoot),
    readState(projectRoot),
  ]);
  const activeTemplate = activeTemplateFromRegistry(config, registry);
  const resolution = resolveInstallPlan(requested, installedPackNames(state), registry, activeTemplate);

  if (!resolution.ok) {
    throw new Error(formatResolverError(resolution.error));
  }

  const plan = resolution.data;
  if (plan.packs.length === 0) {
    output.log(`${requested.join(', ')} already installed`);
    return {
      status: 'already-installed',
      plan,
    };
  }

  const runtimeDependencies = packRuntimeDependencies(plan);
  const devDependencies = packDevDependencies(plan);

  if (options.dryRun) {
    output.log(renderPlan(plan, runtimeDependencies, devDependencies));
    return {
      status: 'dry-run',
      plan,
    };
  }

  if (!options.yes) {
    if (!process.stdin.isTTY) {
      throw new Error(
        'spark add needs interactive confirmation but stdin is not a TTY. ' +
          'Re-run with --yes. Non-interactive callers (the /scaffold and /pack-add flows, ' +
          'CI, or any agent-spawned process) must pass --yes — they gate approval before invoking add.',
      );
    }

    const accepted = await confirm({
      message: `Install ${plan.packs.map((pack) => pack.name).join(', ')}?`,
      initialValue: false,
    });

    if (isCancel(accepted) || !accepted) {
      throw new Error('Install cancelled');
    }
  }

  await preflightPlanFiles(projectRoot, registry, config, plan);

  let nextState = state;
  const stateEntries: StateInstalledPack[] = [];
  for (const pack of plan.packs) {
    const entry = registry.packs.get(pack.name);
    if (!entry?.dir) {
      throw new Error(`Pack "${pack.name}" has no registry directory.`);
    }

    const fileRecords = await applyFileOperations({
      projectRoot,
      packRoot: entry.dir,
      packName: pack.name,
      config,
      operations: pack.manifest.files ?? [],
    });
    const envVars = pack.manifest.env?.required ?? [];
    const envResults = await appendEnvVars(projectRoot, envVars);
    const touchedEnvFiles = envResults
      .filter((result) => result.added.length > 0)
      .map((result) => result.file);
    const taskIds = await seedBoardTasks(
      projectRoot,
      pack.name,
      entry.dir,
      pack.manifest.tasks?.file,
    );
    const skillFiles = await copyPackSkills(
      projectRoot,
      entry.dir,
      pack.manifest.skills?.copy ?? [],
    );

    stateEntries.push(
      stateEntryForPack(
        pack.name,
        pack.manifest.version,
        fileRecords,
        envVars,
        taskIds,
        skillFiles,
        touchedEnvFiles,
      ),
    );
  }

  await installDependencies(
    projectRoot,
    runtimeDependencies,
    devDependencies,
    options.dependencyRunner,
  );

  for (const entry of stateEntries) {
    nextState = addInstalledPack(nextState, entry);
  }
  await writeState(projectRoot, nextState);

  output.log(pc.green(`Installed ${plan.packs.map((pack) => pack.name).join(', ')}`));
  return {
    status: 'installed',
    plan,
  };
}

function parseAddArgs(rawArgs: readonly string[]): { packs: string[]; dryRun: boolean; yes: boolean } {
  const packs: string[] = [];
  let dryRun = false;
  let yes = false;

  for (const arg of rawArgs) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--yes' || arg === '-y') {
      yes = true;
    } else if (!arg.startsWith('-')) {
      packs.push(arg);
    }
  }

  return { packs, dryRun, yes };
}

export const addCommand = defineCommand({
  meta: {
    name: 'add',
    description: 'Install one or more spark packs',
  },
  args: {
    dryRun: {
      type: 'boolean',
      description: 'Print the install plan without writing files',
    },
    yes: {
      type: 'boolean',
      alias: 'y',
      description: 'Skip confirmation prompt',
    },
  },
  async run() {
    const parsed = parseAddArgs(process.argv.slice(3));
    await runAdd(parsed.packs, {
      dryRun: parsed.dryRun,
      yes: parsed.yes,
    });
  },
});
