#!/usr/bin/env bun

import { access, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { cancel, confirm, intro, isCancel, outro, select, text } from '@clack/prompts';
import { defineCommand, runMain } from 'citty';
import pc from 'picocolors';
import { copyTemplate } from './copy.ts';
import { findMonorepoRoot } from './paths.ts';
import { applyPreset } from './preset.ts';
import { loadTemplateRegistry, type TemplateMetadata } from './registry.ts';
import { syncSkills } from './skills.ts';

export const PLANNED_TEMPLATE_MESSAGE = 'planned, not yet implemented';

type CreateAppArgs = {
  appName?: unknown;
  template?: unknown;
  preset?: unknown;
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

function abortIfCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Operation cancelled.');
    process.exit(1);
  }

  return value;
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

async function createApp(rawArgs: CreateAppArgs): Promise<void> {
  intro(pc.cyan('create-app-skills'));

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

  const presetName =
    asOptionalString(rawArgs.preset) ?? (await promptForPreset(Boolean(rawArgs.yes)));
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
  await writeFile(join(targetDir, 'app-skills.config.json'), `${JSON.stringify(config, null, 2)}\n`);

  const monorepoRoot = findMonorepoRoot();
  await syncSkills(targetDir, monorepoRoot);

  if (presetName !== undefined) {
    await applyPreset(targetDir, presetName, monorepoRoot);
  }

  outro(pc.green(`Created ${appName}`));
}

const main = defineCommand({
  meta: {
    name: 'create-app-skills',
    description: 'Create an AI-ready app-skills project.',
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
  runMain(main);
}
