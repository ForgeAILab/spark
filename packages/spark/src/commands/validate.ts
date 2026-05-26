import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import { parseTasksMarkdown } from '../io/board.ts';

export type Violation = { file: string; line: number; message: string };

async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function collectSpecFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name === 'spec.md') {
        results.push(full);
      }
    }
  }
  await walk(dir);
  return results;
}

function isUnderArchive(filePath: string): boolean {
  return filePath.split('/').includes('archive');
}

const DELTA_HEADERS = new Set([
  '## ADDED Requirements',
  '## MODIFIED Requirements',
  '## REMOVED Requirements',
  '## RENAMED Requirements',
]);

function skipFrontmatterLines(lines: string[]): number {
  if (lines.length === 0) return 0;
  if (lines[0].trim() !== '---') return 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') return i + 1;
  }
  return 0;
}

function checkDeltaHeader(relFile: string, lines: string[]): Violation | null {
  const start = skipFrontmatterLines(lines);
  for (let i = start; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length === 0) continue;
    if (!DELTA_HEADERS.has(trimmed)) {
      return {
        file: relFile,
        line: i + 1,
        message: `expected one of "## ADDED|MODIFIED|REMOVED|RENAMED Requirements" as first non-empty line, got: "${trimmed}"`,
      };
    }
    return null;
  }
  return { file: relFile, line: 1, message: 'spec file is empty or has no content after frontmatter' };
}

function checkRequirementsAndScenarios(relFile: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];

  let reqLine = -1;
  let hasDescription = false;
  let hasScenario = false;
  let scenLine = -1;
  let scenHasWhen = false;
  let scenHasThen = false;

  function finishScenario(): void {
    if (scenLine === -1) return;
    if (!scenHasWhen || !scenHasThen) {
      violations.push({
        file: relFile,
        line: scenLine + 1,
        message: 'scenario must have at least one **WHEN** and one **THEN** bullet',
      });
    }
    scenLine = -1;
    scenHasWhen = false;
    scenHasThen = false;
  }

  function finishRequirement(): void {
    if (reqLine === -1) return;
    finishScenario();
    if (!hasDescription || !hasScenario) {
      violations.push({
        file: relFile,
        line: reqLine + 1,
        message:
          'requirement must have at least one descriptive line and one "#### Scenario:" before the next requirement or EOF',
      });
    }
    reqLine = -1;
    hasDescription = false;
    hasScenario = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^#{4}\s+/.test(trimmed)) {
      if (/^#{4}\s+Scenario:/i.test(trimmed)) {
        finishScenario();
        if (reqLine !== -1) hasScenario = true;
        scenLine = i;
        scenHasWhen = false;
        scenHasThen = false;
      } else {
        finishScenario();
      }
      continue;
    }

    if (/^#{3}\s+/.test(trimmed)) {
      finishRequirement();
      if (/^#{3}\s+Requirement:/i.test(trimmed)) {
        reqLine = i;
        hasDescription = false;
        hasScenario = false;
      }
      continue;
    }

    if (/^#{2}\s+/.test(trimmed) || /^#\s+/.test(trimmed)) {
      finishRequirement();
      continue;
    }

    if (scenLine !== -1 && /^\s*[-*]\s+/.test(line)) {
      if (line.includes('**WHEN**')) scenHasWhen = true;
      if (line.includes('**THEN**')) scenHasThen = true;
      continue;
    }

    if (reqLine !== -1 && scenLine === -1 && trimmed.length > 0) {
      hasDescription = true;
    }
  }

  finishRequirement();
  return violations;
}

export async function runValidate(
  targetPath = 'docs/spark',
  projectRoot = process.cwd(),
): Promise<Violation[]> {
  const root = join(projectRoot, targetPath);

  if (!(await dirExists(root))) {
    return [{ file: targetPath, line: 1, message: `workspace path does not exist: ${root}` }];
  }

  const violations: Violation[] = [];
  const changesDir = join(root, 'changes');

  async function getChangeIds(): Promise<string[]> {
    if (!(await dirExists(changesDir))) return [];
    try {
      const dirents = await readdir(changesDir, { withFileTypes: true });
      return dirents.filter((d) => d.isDirectory() && d.name !== 'archive').map((d) => d.name);
    } catch {
      return [];
    }
  }

  const changeIds = await getChangeIds();

  const deltaSpecFiles: string[] = [];
  for (const changeId of changeIds) {
    const specsDir = join(changesDir, changeId, 'specs');
    if (await dirExists(specsDir)) {
      for (const f of await collectSpecFiles(specsDir)) {
        if (!isUnderArchive(f)) deltaSpecFiles.push(f);
      }
    }
  }

  const truthSpecFiles: string[] = [];
  const truthSpecDir = join(root, 'specs');
  if (await dirExists(truthSpecDir)) {
    for (const f of await collectSpecFiles(truthSpecDir)) {
      if (!isUnderArchive(f)) truthSpecFiles.push(f);
    }
  }

  const tasksFiles: string[] = [];
  for (const changeId of changeIds) {
    const tasksPath = join(changesDir, changeId, 'tasks.md');
    try {
      await stat(tasksPath);
      tasksFiles.push(tasksPath);
    } catch {
      // no tasks.md — not an error
    }
  }

  for (const file of deltaSpecFiles) {
    const lines = (await readFile(file, 'utf8')).split('\n');
    const v = checkDeltaHeader(relative(projectRoot, file), lines);
    if (v) violations.push(v);
  }

  for (const file of [...deltaSpecFiles, ...truthSpecFiles]) {
    const lines = (await readFile(file, 'utf8')).split('\n');
    violations.push(...checkRequirementsAndScenarios(relative(projectRoot, file), lines));
  }

  for (const tasksPath of tasksFiles) {
    let raw: string;
    try {
      raw = await readFile(tasksPath, 'utf8');
    } catch (err) {
      violations.push({
        file: relative(projectRoot, tasksPath),
        line: 1,
        message: `could not read tasks file: ${String(err)}`,
      });
      continue;
    }
    try {
      parseTasksMarkdown(tasksPath, raw);
    } catch (err) {
      const msg = String(err instanceof Error ? err.message : err);
      const lineMatch = /:(\d+):/.exec(msg);
      violations.push({
        file: relative(projectRoot, tasksPath),
        line: lineMatch ? parseInt(lineMatch[1], 10) : 1,
        message: msg,
      });
    }
  }

  return violations;
}

export const validateCommand = defineCommand({
  meta: {
    name: 'validate',
    description: 'Lint the docs/spark spec workspace; exit non-zero on any violation',
  },
  args: {
    path: {
      type: 'positional',
      required: false,
      default: 'docs/spark',
      description: 'Workspace path to validate',
    },
  },
  async run({ args }) {
    const p = typeof args.path === 'string' && args.path.length > 0 ? args.path : 'docs/spark';
    const v = await runValidate(p);
    if (v.length > 0) {
      for (const x of v) console.error(pc.red(`${x.file}:${x.line} ${x.message}`));
      console.error(pc.red(`validate: ${v.length} problem(s) found`));
      process.exitCode = 1;
    } else {
      console.log(pc.green('OK: spec workspace is well-formed.'));
    }
  },
});
