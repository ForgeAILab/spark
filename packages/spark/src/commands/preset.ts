import { defineCommand } from 'citty';
import { readConfig } from '../config.ts';
import { readRegistry } from '../io/registry.ts';
import { runAdd, type AddResult } from './add.ts';

export async function runPreset(
  presetName: string,
  projectRoot = process.cwd(),
): Promise<AddResult> {
  if (!presetName) {
    throw new Error('preset requires a name');
  }

  const [config, registry] = await Promise.all([readConfig(projectRoot), readRegistry(projectRoot)]);
  const preset = registry.presets.get(presetName);
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  if (!preset.manifest.compatible_scaffolds.includes(config.template)) {
    throw new Error(
      `Preset "${presetName}" is not compatible with scaffold "${config.template}". Compatible scaffolds: ${preset.manifest.compatible_scaffolds.join(', ')}`,
    );
  }

  return runAdd(preset.manifest.packs, {
    projectRoot,
    registry,
    config,
    yes: true,
  });
}

export const presetCommand = defineCommand({
  meta: {
    name: 'preset',
    description: 'Install a named pack preset',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Preset name',
      required: true,
    },
  },
  async run({ args }) {
    const presetName = typeof args.name === 'string' ? args.name : process.argv[3];
    await runPreset(presetName);
  },
});
