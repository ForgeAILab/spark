import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseTemplateToml, type ParseError, type TemplateManifest } from '@forgeailab/spark-schema';
import { findMonorepoRoot } from './paths.ts';

export type TemplateMetadata = TemplateManifest;

export function getTemplatesDir(): string {
  return process.env.CREATE_SPARK_TEMPLATES_DIR ?? join(findMonorepoRoot(), 'templates');
}

function formatParseError(error: ParseError): string {
  const issues = error.issues?.map((issue) => `  - ${issue}`).join('\n');
  return issues === undefined ? error.message : `${error.message}\n${issues}`;
}

async function findTemplateManifests(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        return findTemplateManifests(entryPath);
      }

      if (entry.isFile() && entry.name === 'template.toml') {
        return [entryPath];
      }

      return [];
    }),
  );

  return nested.flat();
}

export async function loadTemplateRegistry(
  templatesDir: string = getTemplatesDir(),
): Promise<TemplateMetadata[]> {
  const manifestPaths = await findTemplateManifests(templatesDir);
  const templates = await Promise.all(
    manifestPaths.map(async (manifestPath) => {
      const raw = await readFile(manifestPath, 'utf8');
      const parsed = parseTemplateToml(raw);

      if (!parsed.ok) {
        throw new Error(`Invalid template manifest at ${manifestPath}:\n${formatParseError(parsed.error)}`);
      }

      return parsed.data;
    }),
  );

  return templates.toSorted((left, right) => left.name.localeCompare(right.name));
}
