import { defineCommand } from 'citty';
import pc from 'picocolors';
import { readConfig, type AppSkillsConfig } from '../config.ts';
import { readRegistry, type Registry } from '../io/registry.ts';
import { installedPackNames, readState } from '../io/state.ts';

type InfoOutput = Pick<Console, 'log'>;

export type InfoOptions = {
  config?: AppSkillsConfig;
  registry?: Registry;
};

function formatList(values: readonly string[] | undefined): string {
  return values && values.length > 0 ? values.join(', ') : 'none';
}

export async function runInfo(
  packName: string,
  projectRoot = process.cwd(),
  output: InfoOutput = console,
  options: InfoOptions = {},
): Promise<void> {
  if (!packName) {
    throw new Error('info requires a pack name');
  }

  const [config, registry, state] = await Promise.all([
    options.config ? Promise.resolve(options.config) : readConfig(projectRoot),
    options.registry ? Promise.resolve(options.registry) : readRegistry(projectRoot),
    readState(projectRoot),
  ]);
  const entry = registry.packs.get(packName);
  if (!entry) {
    throw new Error(`Unknown pack: ${packName}`);
  }

  const installed = installedPackNames(state).includes(packName);
  const manifest = entry.manifest;
  const template = registry.templates.get(config.template);
  const scaffold =
    manifest.compatible_scaffolds.length > 0
      ? manifest.compatible_scaffolds.join(', ')
      : 'any registered scaffold with required runtime';
  const runtime = template
    ? manifest.requires_runtime.filter((capability) => !template.manifest.provides.includes(capability))
    : manifest.requires_runtime;

  output.log(pc.bold(`${manifest.name}@${manifest.version}`));
  output.log(manifest.description ?? '');
  output.log(`status: ${installed ? 'installed' : 'available'}`);
  output.log('Install mode: copy');
  output.log(`category: ${manifest.category}`);
  output.log(`provides: ${formatList(manifest.provides)}`);
  output.log(`requires: ${formatList(manifest.requires)}`);
  output.log(`conflicts: ${formatList(manifest.conflicts)}`);
  output.log(`compatible_scaffolds: ${scaffold}`);
  output.log(`requires_runtime: ${formatList(manifest.requires_runtime)}`);
  output.log(runtime.length > 0 ? `active scaffold missing runtime: ${runtime.join(', ')}` : 'active scaffold: compatible');
  output.log(`env required: ${formatList(manifest.env?.required)}`);
  output.log(`env optional: ${formatList(manifest.env?.optional)}`);
  output.log(`runtime deps: ${formatList(manifest.dependencies?.runtime)}`);
  output.log(`dev deps: ${formatList(manifest.dependencies?.dev)}`);
  output.log('files:');
  for (const file of manifest.files ?? []) {
    output.log(`  ${file.mode}: ${file.from} -> ${file.to}`);
  }
  if (!manifest.files || manifest.files.length === 0) {
    output.log('  none');
  }
  output.log(`skills: ${formatList(manifest.skills?.copy)}`);
  output.log(`tasks: ${manifest.tasks?.file ?? 'none'}`);
}

export const infoCommand = defineCommand({
  meta: {
    name: 'info',
    description: 'Show pack details and install preview',
  },
  args: {
    pack: {
      type: 'positional',
      description: 'Pack name',
      required: true,
    },
  },
  async run({ args }) {
    const packName = typeof args.pack === 'string' ? args.pack : process.argv[3];
    await runInfo(packName);
  },
});
