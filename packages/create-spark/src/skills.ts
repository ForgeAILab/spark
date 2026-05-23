import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { findMonorepoRoot } from './paths.ts';

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function transformClaudeSkillForCodex(content: string): string {
  if (!content.startsWith('---\n')) {
    return content;
  }

  const endIndex = content.indexOf('\n---', 4);
  if (endIndex === -1) {
    return content;
  }

  const frontmatter = content.slice(4, endIndex).split('\n');
  const filtered: string[] = [];
  let skippingAllowedTools = false;

  for (const line of frontmatter) {
    if (line.startsWith('allowed-tools:')) {
      skippingAllowedTools = true;
      continue;
    }

    if (skippingAllowedTools) {
      if (line.trim() === '' || /^\s+-\s/.test(line)) {
        continue;
      }

      skippingAllowedTools = false;
    }

    filtered.push(line);
  }

  return `---\n${filtered.join('\n').trimEnd()}\n---${content.slice(endIndex + 4)}`;
}

async function copyDirectory(
  sourceDir: string,
  targetDir: string,
  transform?: (relativePath: string, content: Buffer) => Buffer | string,
  relativeBase = '',
): Promise<void> {
  await mkdir(targetDir, { recursive: true });

  const entries = await readdir(sourceDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = join(sourceDir, entry.name);
      const targetPath = join(targetDir, entry.name);
      const relativePath = join(relativeBase, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, targetPath, transform, relativePath);
        return;
      }

      if (!entry.isFile()) {
        return;
      }

      const content = await readFile(sourcePath);
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, transform?.(relativePath, content) ?? content);
    }),
  );
}

async function hasEntries(dir: string): Promise<boolean> {
  try {
    const entries = await readdir(dir);
    return entries.length > 0;
  } catch {
    return false;
  }
}

async function tryRunSyncScript(monorepoRoot: string, targetDir: string): Promise<boolean> {
  const scriptPath = join(monorepoRoot, 'scripts', 'sync-skills.ts');
  if (!(await exists(scriptPath))) {
    return false;
  }

  const proc = Bun.spawn(['bun', 'run', scriptPath, targetDir], {
    cwd: monorepoRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [, , exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return exitCode === 0;
}

async function fallbackSyncCodexSkills(targetDir: string): Promise<void> {
  const claudeSkillsDir = join(targetDir, '.claude', 'skills');
  const codexSkillsDir = join(targetDir, '.codex', 'skills');

  await rm(codexSkillsDir, { recursive: true, force: true });
  await copyDirectory(claudeSkillsDir, codexSkillsDir, (relativePath, content) => {
    if (!relativePath.endsWith('.md')) {
      return content;
    }

    return transformClaudeSkillForCodex(content.toString('utf8'));
  });
}

export async function syncSkills(targetDir: string, monorepoRoot: string = findMonorepoRoot()): Promise<void> {
  const canonicalSkillsDir = join(monorepoRoot, '.claude', 'skills');
  const targetClaudeSkillsDir = join(targetDir, '.claude', 'skills');
  const targetCodexSkillsDir = join(targetDir, '.codex', 'skills');

  await mkdir(targetClaudeSkillsDir, { recursive: true });
  await rm(join(targetClaudeSkillsDir, '.gitkeep'), { force: true });
  await copyDirectory(canonicalSkillsDir, targetClaudeSkillsDir);

  const scriptSucceeded = await tryRunSyncScript(monorepoRoot, targetDir);
  if (!scriptSucceeded || !(await hasEntries(targetCodexSkillsDir))) {
    await fallbackSyncCodexSkills(targetDir);
  }
}
