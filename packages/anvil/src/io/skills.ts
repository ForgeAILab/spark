import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

type SkillCopyRecord = {
  claudeFiles: string[];
  codexFiles: string[];
};

async function walkFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files.sort();
}

async function directoryExists(path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    return info.isDirectory();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function assertInsideRoot(root: string, path: string): string {
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(root, path);

  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(`Refusing to read skill path outside pack root: ${path}`);
  }

  return resolvedPath;
}

function transformCodexFrontmatter(raw: string): string {
  if (!raw.startsWith('---\n')) {
    return raw;
  }

  const lines = raw.split('\n');
  const closingIndex = lines.findIndex((line, index) => index > 0 && line === '---');
  if (closingIndex === -1) {
    return raw;
  }

  const frontmatter = lines.slice(1, closingIndex);
  const body = lines.slice(closingIndex);
  const transformed: string[] = [];
  let skippingAllowedTools = false;

  for (const line of frontmatter) {
    if (/^allowed-tools:\s*$/u.test(line)) {
      skippingAllowedTools = true;
      continue;
    }

    if (skippingAllowedTools) {
      if (/^\s+-\s+/u.test(line) || /^\s{2,}\S/u.test(line) || line.trim().length === 0) {
        continue;
      }
      skippingAllowedTools = false;
    }

    transformed.push(line);
  }

  return ['---', ...transformed, ...body].join('\n');
}

async function writeIfSafe(path: string, content: string): Promise<void> {
  try {
    const existing = await readFile(path, 'utf8');
    if (existing === content) {
      return;
    }
    throw new Error(`Refusing to overwrite existing skill file with different content: ${path}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

async function copyOneSkill(
  projectRoot: string,
  skillSource: string,
  skillName: string,
): Promise<SkillCopyRecord> {
  const files = await walkFiles(skillSource);
  const record: SkillCopyRecord = {
    claudeFiles: [],
    codexFiles: [],
  };

  for (const sourceFile of files) {
    const relativePath = relative(skillSource, sourceFile);
    const raw = await readFile(sourceFile, 'utf8');
    const claudeTarget = join(projectRoot, '.claude', 'skills', skillName, relativePath);
    const codexTarget = join(projectRoot, '.codex', 'skills', skillName, relativePath);
    const codexContent = basename(sourceFile) === 'SKILL.md' ? transformCodexFrontmatter(raw) : raw;

    await writeIfSafe(claudeTarget, raw);
    await writeIfSafe(codexTarget, codexContent);

    record.claudeFiles.push(relative(projectRoot, claudeTarget));
    record.codexFiles.push(relative(projectRoot, codexTarget));
  }

  return record;
}

export async function copyPackSkills(
  projectRoot: string,
  packRoot: string,
  skillPaths: readonly string[] = [],
): Promise<string[]> {
  const written: string[] = [];

  for (const skillPath of skillPaths) {
    const source = assertInsideRoot(packRoot, skillPath);
    if (!(await directoryExists(source))) {
      throw new Error(`Pack skill directory does not exist: ${skillPath}`);
    }

    const skillName = basename(source);
    const record = await copyOneSkill(projectRoot, source, skillName);
    written.push(...record.claudeFiles, ...record.codexFiles);
  }

  return [...new Set(written)].sort();
}
