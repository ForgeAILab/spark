import { mkdir, readFile, readdir, readlink, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { getTemplatesDir } from './registry.ts';

const placeholderPattern = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

function applyTemplatePlaceholders(content: string, vars: Record<string, string>): string {
  return content.replace(placeholderPattern, (placeholder, key: string) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : placeholder;
  });
}

function isBinaryContent(content: Buffer): boolean {
  return content.includes(0);
}

async function copyTemplateDirectory(
  sourceDir: string,
  targetDir: string,
  vars: Record<string, string>,
): Promise<void> {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  await mkdir(targetDir, { recursive: true });

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.name === 'template.toml') {
        return;
      }

      const sourcePath = join(sourceDir, entry.name);
      const targetPath = join(targetDir, entry.name);

      if (entry.isDirectory()) {
        await copyTemplateDirectory(sourcePath, targetPath, vars);
        return;
      }

      if (entry.isSymbolicLink()) {
        const linkTarget = await readlink(sourcePath);
        await mkdir(dirname(targetPath), { recursive: true });
        await symlink(linkTarget, targetPath);
        return;
      }

      if (!entry.isFile()) {
        return;
      }

      const content = await readFile(sourcePath);
      await mkdir(dirname(targetPath), { recursive: true });

      if (isBinaryContent(content)) {
        await writeFile(targetPath, content);
        return;
      }

      await writeFile(targetPath, applyTemplatePlaceholders(content.toString('utf8'), vars), 'utf8');
    }),
  );
}

export async function copyTemplate(
  templateName: string,
  targetDir: string,
  vars: Record<string, string>,
): Promise<void> {
  await copyTemplateDirectory(join(getTemplatesDir(), templateName), targetDir, vars);
}
