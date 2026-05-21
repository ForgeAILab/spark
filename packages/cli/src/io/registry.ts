import { readdir, readFile } from 'node:fs/promises';
import { join, parse as parsePath } from 'node:path';
import {
  parsePackToml,
  parsePresetToml,
  parseTemplateToml,
  type PackManifest,
  type PresetManifest,
  type TemplateManifest,
} from '@app-skills/pack-schema';
import type { PackRegistryEntry, ResolverRegistry } from '../resolver.ts';
import { findMonorepoRoot } from './paths.ts';

export type PresetRegistryEntry = {
  name: string;
  manifest: PresetManifest;
  file: string;
};

export type TemplateRegistryEntry = {
  name: string;
  manifest: TemplateManifest;
  dir: string;
};

export type Registry = ResolverRegistry & {
  root: string;
  presets: Map<string, PresetRegistryEntry>;
  templates: Map<string, TemplateRegistryEntry>;
};

export async function findRegistryRoot(startCwd: string): Promise<string> {
  try {
    return findMonorepoRoot(startCwd);
  } catch {
    return findMonorepoRoot();
  }
}

async function readChildDirectories(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function readToml(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

function unwrapParseResult<T>(result: ReturnType<typeof parsePackToml> | ReturnType<typeof parsePresetToml> | ReturnType<typeof parseTemplateToml>, path: string): T {
  if (result.ok) {
    return result.data as T;
  }

  const details = result.error.issues?.length ? `\n${result.error.issues.join('\n')}` : '';
  throw new Error(`${path}: ${result.error.message}${details}`);
}

async function readTemplates(root: string): Promise<Map<string, TemplateRegistryEntry>> {
  const templates = new Map<string, TemplateRegistryEntry>();
  const templatesRoot = join(root, 'templates');

  for (const dirName of await readChildDirectories(templatesRoot)) {
    const dir = join(templatesRoot, dirName);
    const manifestPath = join(dir, 'template.toml');
    const raw = await readToml(manifestPath);
    if (!raw) {
      continue;
    }

    const manifest = unwrapParseResult<TemplateManifest>(parseTemplateToml(raw), manifestPath);
    if (manifest.name !== dirName) {
      throw new Error(`${manifestPath}: template name "${manifest.name}" must match directory "${dirName}"`);
    }

    templates.set(manifest.name, {
      name: manifest.name,
      manifest,
      dir,
    });
  }

  return templates;
}

async function readPacks(
  root: string,
  templates: ReadonlyMap<string, TemplateRegistryEntry>,
): Promise<Map<string, PackRegistryEntry>> {
  const packs = new Map<string, PackRegistryEntry>();
  const packsRoot = join(root, 'packs');
  const knownTemplates = new Set(templates.keys());

  for (const dirName of await readChildDirectories(packsRoot)) {
    if (dirName.startsWith('_')) {
      continue;
    }

    const dir = join(packsRoot, dirName);
    const manifestPath = join(dir, 'pack.toml');
    const raw = await readToml(manifestPath);
    if (!raw) {
      continue;
    }

    const manifest = unwrapParseResult<PackManifest>(parsePackToml(raw), manifestPath);
    if (manifest.name !== dirName) {
      throw new Error(`${manifestPath}: pack name "${manifest.name}" must match directory "${dirName}"`);
    }

    if (knownTemplates.size > 0) {
      for (const scaffold of manifest.compatible_scaffolds) {
        if (!knownTemplates.has(scaffold)) {
          throw new Error(`${manifestPath}: unknown compatible scaffold "${scaffold}"`);
        }
      }
    }

    packs.set(manifest.name, {
      name: manifest.name,
      manifest,
      dir,
    });
  }

  return packs;
}

async function readPresets(root: string): Promise<Map<string, PresetRegistryEntry>> {
  const presets = new Map<string, PresetRegistryEntry>();
  const presetsRoot = join(root, 'presets');

  try {
    const entries = await readdir(presetsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.toml')) {
        continue;
      }

      const file = join(presetsRoot, entry.name);
      const raw = await readFile(file, 'utf8');
      const manifest = unwrapParseResult<PresetManifest>(parsePresetToml(raw), file);
      const name = manifest.name ?? parsePath(entry.name).name;

      if (manifest.name && manifest.name !== parsePath(entry.name).name) {
        throw new Error(`${file}: preset name "${manifest.name}" must match filename`);
      }

      presets.set(name, {
        name,
        manifest,
        file,
      });
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return presets;
    }
    throw error;
  }

  return presets;
}

export async function readRegistry(startCwd: string): Promise<Registry> {
  const root = await findRegistryRoot(startCwd);
  const templates = await readTemplates(root);
  const packs = await readPacks(root, templates);
  const presets = await readPresets(root);

  return {
    root,
    packs,
    presets,
    templates,
  };
}
