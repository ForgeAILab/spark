#!/usr/bin/env bun

import { access, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { cancel, confirm, intro, isCancel, outro, select, text } from '@clack/prompts';
import { runAdd } from '@forgeailab/spark/src/commands/add.ts';
import { defineCommand, runMain } from 'citty';
import pc from 'picocolors';
import { copyTemplate } from './copy.ts';
import { loadPackRegistry } from './pack-registry.ts';
import { findMonorepoRoot } from './paths.ts';
import {
  filterAuthByDb,
  filterSyncByDb,
  groupByCategory,
  orderedForCategory,
  parsePacksFlag,
  recommendedFor,
  type DbPick,
  type GroupedPacks,
  type PickerCategory,
} from './picker.ts';
import { applyPreset } from './preset.ts';
import { promptCategory, promptConfirmPlan, promptMultiCategory } from './prompts.ts';
import { loadTemplateRegistry, type TemplateMetadata } from './registry.ts';
import { syncSkills } from './skills.ts';

export const PLANNED_TEMPLATE_MESSAGE = 'planned, not yet implemented';

type CreateAppArgs = {
  appName?: unknown;
  template?: unknown;
  preset?: unknown;
  packs?: unknown;
  noPacks?: unknown;
  'no-packs'?: unknown;
  yes?: unknown;
};

type ScaffoldConfig = {
  appName: string;
  template: string;
  createdAt: string;
};

export function plannedTemplateMessage(templateName: string): string {
  return `Template "${templateName}" is ${PLANNED_TEMPLATE_MESSAGE}. Use "nextjs" for v1 or see docs/spec/changes/add-scaffold-and-pack-registry-2026-05-21/design.md#decision-11.`;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function abortIfCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Operation cancelled.');
    process.exit(1);
  }

  return value;
}

function isPacksFlagProvided(rawArgs: CreateAppArgs): boolean {
  return rawArgs.packs !== undefined;
}

function isNoPacks(rawArgs: CreateAppArgs): boolean {
  return asBoolean(rawArgs.noPacks) || asBoolean(rawArgs['no-packs']);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function promptForAppName(): Promise<string> {
  const answer = abortIfCancel(
    await text({
      message: 'App name',
      placeholder: 'my-app',
      validate(value) {
        return value?.trim().length ? undefined : 'Enter an app name.';
      },
    }),
  );

  return answer.trim();
}

function formatTemplateLabel(template: TemplateMetadata): string {
  return template.status === 'planned' ? `${template.name} (planned)` : template.name;
}

async function promptForTemplate(templates: TemplateMetadata[]): Promise<string> {
  const answer = abortIfCancel(
    await select<string>({
      message: 'Template',
      initialValue: 'vite-react',
      options: templates.map((template) => ({
        value: template.name,
        label: formatTemplateLabel(template),
        hint: template.description,
      })),
    }),
  );

  return answer;
}

async function promptForPreset(skipOptionalPrompts: boolean): Promise<string | undefined> {
  if (skipOptionalPrompts) {
    return undefined;
  }

  const wantsPreset = abortIfCancel(
    await confirm({
      message: 'Apply a preset?',
      initialValue: false,
    }),
  );

  if (!wantsPreset) {
    return undefined;
  }

  const preset = abortIfCancel(
    await text({
      message: 'Preset name',
      placeholder: 'saas-classic',
      validate(value) {
        return value?.trim().length ? undefined : 'Enter a preset name.';
      },
    }),
  );

  return preset.trim();
}

function findTemplate(templates: TemplateMetadata[], templateName: string): TemplateMetadata {
  const template = templates.find((candidate) => candidate.name === templateName);
  if (template !== undefined) {
    return template;
  }

  const registered = templates.map((candidate) => candidate.name).join(', ');
  throw new Error(`Unknown template "${templateName}". Registered templates: ${registered}`);
}

function addPick(picks: string[], pick: string | undefined): void {
  if (pick !== undefined) {
    picks.push(pick);
  }
}

function addPicks(picks: string[], selected: readonly string[] | undefined): void {
  if (selected !== undefined) {
    picks.push(...selected);
  }
}

async function collectInteractivePackPicks(groups: GroupedPacks): Promise<string[]> {
  const picks: string[] = [];

  const dbPick = (await promptCategory(
    'db',
    orderedForCategory('db', groups.db),
    recommendedFor('db'),
  )) as DbPick;
  addPick(picks, dbPick);

  if (dbPick !== undefined) {
    const authPick = await promptCategory(
      'auth',
      filterAuthByDb(groups.auth, dbPick),
      recommendedFor('auth', dbPick),
    );
    addPick(picks, authPick);

    const syncPick = await promptCategory(
      'sync',
      filterSyncByDb(groups.sync, dbPick),
      recommendedFor('sync', dbPick),
    );
    addPick(picks, syncPick);
  }

  addPick(
    picks,
    await promptCategory(
      'ui',
      orderedForCategory('ui', groups.ui),
      recommendedFor('ui', dbPick),
    ),
  );
  addPicks(picks, await promptMultiCategory('ai', orderedForCategory('ai', groups.ai)));

  for (const category of ['email', 'analytics', 'deploy'] as const satisfies readonly PickerCategory[]) {
    addPick(
      picks,
      await promptCategory(
        category,
        orderedForCategory(category, groups[category]),
        recommendedFor(category, dbPick),
      ),
    );
  }

  addPicks(picks, await promptMultiCategory('infra', orderedForCategory('infra', groups.infra)));
  addPicks(
    picks,
    await promptMultiCategory('testing', orderedForCategory('testing', groups.testing), [
      'testing-playwright',
    ]),
  );

  return picks;
}

function recommendedYesPicks(): string[] {
  return ['db-sqlite', 'auth-better-auth', 'testing-playwright'];
}

async function collectPackPicks(rawArgs: CreateAppArgs, presetName: string | undefined): Promise<string[]> {
  const yes = asBoolean(rawArgs.yes);
  const noPacks = isNoPacks(rawArgs);
  const packsFlagProvided = isPacksFlagProvided(rawArgs);

  if (packsFlagProvided && noPacks) {
    throw new Error('--packs cannot be combined with --no-packs.');
  }

  if (presetName !== undefined) {
    return [];
  }

  if (noPacks) {
    return [];
  }

  if (packsFlagProvided) {
    return parsePacksFlag(typeof rawArgs.packs === 'string' ? rawArgs.packs : '');
  }

  if (yes) {
    return recommendedYesPicks();
  }

  const packs = await loadPackRegistry();
  return collectInteractivePackPicks(groupByCategory(packs));
}

async function createApp(rawArgs: CreateAppArgs): Promise<void> {
  intro(pc.cyan('create-spark'));

  const templates = await loadTemplateRegistry();
  const appName = asOptionalString(rawArgs.appName) ?? (await promptForAppName());
  const requestedTemplate = asOptionalString(rawArgs.template) ?? (await promptForTemplate(templates));
  const template = findTemplate(templates, requestedTemplate);

  if (template.status === 'planned') {
    throw new Error(plannedTemplateMessage(template.name));
  }

  const targetDir = resolve(process.cwd(), appName);
  if (await exists(targetDir)) {
    throw new Error(`Target directory already exists: ${targetDir}`);
  }

  const skipPresetPrompt =
    asBoolean(rawArgs.yes) || isPacksFlagProvided(rawArgs) || isNoPacks(rawArgs);
  const presetName =
    asOptionalString(rawArgs.preset) ?? (await promptForPreset(skipPresetPrompt));
  const createdAt = new Date().toISOString();
  const vars: Record<string, string> = {
    appName,
    template: template.name,
    preset: presetName ?? '',
    createdAt,
  };

  await copyTemplate(template.name, targetDir, vars);

  const config: ScaffoldConfig = {
    appName,
    template: template.name,
    createdAt,
  };
  await writeFile(join(targetDir, 'spark.config.json'), `${JSON.stringify(config, null, 2)}\n`);

  const monorepoRoot = findMonorepoRoot();
  await syncSkills(targetDir, monorepoRoot);

  const packPicks = await collectPackPicks(rawArgs, presetName);
  if (presetName === undefined && !asBoolean(rawArgs.yes)) {
    await promptConfirmPlan(packPicks);
  }
  if (presetName === undefined) {
    if (packPicks.length > 0) {
      await runAdd(packPicks, { projectRoot: targetDir, yes: true });
    }
  }

  if (presetName !== undefined) {
    await applyPreset(targetDir, presetName, monorepoRoot);
  }

  outro(pc.green(`Created ${appName}`));
}

const main = defineCommand({
  meta: {
    name: 'create-spark',
    description: 'Create an AI-ready spark project.',
  },
  args: {
    appName: {
      type: 'positional',
      description: 'Application name or target directory.',
      required: false,
    },
    template: {
      type: 'string',
      description: 'Template name.',
      required: false,
    },
    preset: {
      type: 'string',
      description: 'Preset name to apply after scaffolding.',
      required: false,
    },
    packs: {
      type: 'string',
      description: 'Comma-separated pack names to install after scaffolding.',
      required: false,
    },
    'no-packs': {
      type: 'boolean',
      description: 'Skip pack installation after scaffolding.',
      required: false,
    },
    yes: {
      type: 'boolean',
      alias: 'y',
      description: 'Skip optional prompts.',
      required: false,
    },
  },
  async run({ args }) {
    await createApp(args);
  },
});

if (import.meta.main) {
  void runMain(main);
}
