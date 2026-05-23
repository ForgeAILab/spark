import { cancel, confirm, isCancel, multiselect, select } from '@clack/prompts';
import pc from 'picocolors';
import type { PickerCategory, PickerPack } from './picker.ts';

const skipValue = '__skip__';

const categoryLabels: Record<PickerCategory, string> = {
  db: 'Database',
  auth: 'Auth',
  sync: 'Sync',
  ui: 'UI',
  ai: 'AI',
  email: 'Email',
  analytics: 'Analytics',
  deploy: 'Deploy',
  infra: 'Infra',
  testing: 'Testing',
};

function abortIfCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Operation cancelled.');
    process.exit(1);
  }

  return value;
}

function optionLabel(pack: PickerPack, recommended: string | undefined): string {
  return pack.name === recommended ? `${pack.name} (recommended)` : pack.name;
}

export async function promptCategory(
  category: PickerCategory,
  options: readonly PickerPack[],
  recommended?: string,
): Promise<string | undefined> {
  if (options.length === 0) {
    return undefined;
  }

  const answer = abortIfCancel(
    await select<string>({
      message: categoryLabels[category],
      options: [
        ...options.map((pack) => ({
          value: pack.name,
          label: optionLabel(pack, recommended),
          hint: pack.description,
        })),
        {
          value: skipValue,
          label: 'skip',
          hint: `Do not install a ${categoryLabels[category].toLowerCase()} pack.`,
        },
      ],
    }),
  );

  return answer === skipValue ? undefined : answer;
}

export async function promptMultiCategory(
  category: PickerCategory,
  options: readonly PickerPack[],
  defaultChecked: readonly string[] = [],
): Promise<string[] | undefined> {
  if (options.length === 0) {
    return undefined;
  }

  const answer = abortIfCancel(
    await multiselect<string>({
      message: categoryLabels[category],
      options: options.map((pack) => ({
        value: pack.name,
        label: defaultChecked.includes(pack.name) ? `${pack.name} (recommended)` : pack.name,
        hint: pack.description,
      })),
      initialValues: [...defaultChecked],
      required: false,
    }),
  );

  return answer.length > 0 ? answer : undefined;
}

function formatSummary(picks: readonly string[]): string {
  const title = 'Pack plan';
  const rows = picks.length > 0 ? picks.map((pick) => `- ${pick}`) : ['No packs selected.'];
  const width = Math.max(title.length, ...rows.map((row) => row.length));
  const border = `+${'-'.repeat(width + 2)}+`;
  const line = (value: string): string => `| ${value.padEnd(width)} |`;

  return [
    pc.cyan(border),
    pc.cyan(line(title)),
    pc.cyan(border),
    ...rows.map((row) => pc.cyan(line(row))),
    pc.cyan(border),
  ].join('\n');
}

export async function promptConfirmPlan(picks: readonly string[]): Promise<void> {
  console.log(formatSummary(picks));
  const accepted = abortIfCancel(
    await confirm({
      message: 'Looks good?',
      initialValue: true,
    }),
  );

  if (!accepted) {
    cancel('Cancelled');
    process.exit(1);
  }
}
