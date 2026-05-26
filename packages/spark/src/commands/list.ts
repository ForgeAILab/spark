import { defineCommand } from 'citty';
import pc from 'picocolors';
import { readConfig } from '../config.ts';
import { readRegistry, type Registry } from '../io/registry.ts';
import { installedPackNames, readState } from '../io/state.ts';

type ListOutput = Pick<Console, 'log'>;

function scaffoldAnnotation(registry: Registry, templateName: string, packName: string): string {
  const pack = registry.packs.get(packName);
  const template = registry.templates.get(templateName);
  if (!pack) {
    return 'unknown pack';
  }
  if (!template) {
    return `template ${templateName} unknown`;
  }

  if (
    pack.manifest.compatible_scaffolds.length > 0 &&
    !pack.manifest.compatible_scaffolds.includes(templateName)
  ) {
    return `not ${templateName}`;
  }

  const providedRuntime = new Set(template.manifest.provides);
  const missingRuntime = pack.manifest.requires_runtime.filter((capability) => !providedRuntime.has(capability));
  if (missingRuntime.length > 0) {
    return `missing ${missingRuntime.join(',')}`;
  }

  return pack.manifest.compatible_scaffolds.length > 0
    ? `scaffold ${pack.manifest.compatible_scaffolds.join(',')}`
    : 'any scaffold';
}

export async function runList(projectRoot = process.cwd(), output: ListOutput = console): Promise<void> {
  const [config, registry, state] = await Promise.all([
    readConfig(projectRoot),
    readRegistry(projectRoot),
    readState(projectRoot),
  ]);
  const installed = new Set(installedPackNames(state));
  const byCategory = new Map<string, string[]>();

  for (const [name, entry] of registry.packs) {
    const group = byCategory.get(entry.manifest.category) ?? [];
    group.push(name);
    byCategory.set(entry.manifest.category, group);
  }

  if (byCategory.size === 0) {
    output.log('No packs found.');
    return;
  }

  for (const [category, names] of [...byCategory.entries()].toSorted(([left], [right]) =>
    left.localeCompare(right),
  )) {
    output.log(pc.bold(category));
    output.log('pack                 status      scaffold');
    for (const name of names.toSorted()) {
      const status = installed.has(name) ? pc.green('installed') : 'available';
      const annotation = scaffoldAnnotation(registry, config.template, name);
      output.log(`${name.padEnd(20)} ${status.padEnd(11)} ${annotation}`);
    }
    output.log('');
  }
}

export const listCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'List available packs grouped by category',
  },
  async run() {
    await runList();
  },
});
