import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";

type SkillOutput = {
  name: string;
  content: string;
};

type Diff =
  | { type: "missing"; path: string }
  | { type: "extra"; path: string }
  | { type: "changed"; path: string };

type SyncResult = {
  ok: boolean;
  count: number;
  diffs: Diff[];
};

type TreeEntry = {
  type: "dir" | "file";
  content?: string;
};

const requiredFrontmatterKeys = ["name", "description"] as const;
const codexFrontmatterKeys = ["name", "description", "model"] as const;

export function splitFrontmatter(markdown: string): { frontmatter: string; body: string } {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0] !== "---") {
    throw new Error("SKILL.md must start with YAML frontmatter");
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line === "---");
  if (closingIndex === -1) {
    throw new Error("SKILL.md frontmatter is missing a closing --- delimiter");
  }

  return {
    frontmatter: lines.slice(1, closingIndex).join("\n"),
    body: lines.slice(closingIndex + 1).join("\n"),
  };
}

export function parseFrontmatterBlocks(frontmatter: string): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  let currentKey: string | undefined;

  for (const line of frontmatter.split("\n")) {
    const match = /^([A-Za-z][A-Za-z0-9_-]*):(.*)$/.exec(line);

    if (match) {
      currentKey = match[1];
      if (blocks.has(currentKey)) {
        throw new Error(`Duplicate frontmatter key: ${currentKey}`);
      }
      blocks.set(currentKey, [`${currentKey}:${match[2]}`]);
      continue;
    }

    if (!currentKey) {
      if (line.trim() === "" || line.trim().startsWith("#")) {
        continue;
      }
      throw new Error(`Unexpected frontmatter line before a key: ${line}`);
    }

    blocks.get(currentKey)?.push(line);
  }

  for (const key of requiredFrontmatterKeys) {
    if (!blocks.has(key)) {
      throw new Error(`Missing required frontmatter key: ${key}`);
    }
  }

  return blocks;
}

export function transformSkillMarkdown(markdown: string, skillName: string): string {
  const { frontmatter, body } = splitFrontmatter(markdown);
  const blocks = parseFrontmatterBlocks(frontmatter);
  const outputFrontmatter: string[] = [];

  for (const key of codexFrontmatterKeys) {
    const block = blocks.get(key);
    if (block) {
      outputFrontmatter.push(...block);
    }
  }

  outputFrontmatter.push(
    `# Generated from .claude/skills/${skillName}/SKILL.md — DO NOT EDIT directly`,
  );

  return `---\n${outputFrontmatter.join("\n")}\n---\n${body}`;
}

async function collectSkillOutputs(root: string): Promise<SkillOutput[]> {
  const sourceRoot = join(root, ".claude", "skills");
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  const outputs: SkillOutput[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillName = entry.name;
    const sourceFile = join(sourceRoot, skillName, "SKILL.md");
    if (!existsSync(sourceFile)) {
      continue;
    }

    const source = await readFile(sourceFile, "utf8");
    outputs.push({
      name: skillName,
      content: transformSkillMarkdown(source, skillName),
    });
  }

  return outputs;
}

async function writeOutputs(targetRoot: string, outputs: SkillOutput[]): Promise<void> {
  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(targetRoot, { recursive: true });

  for (const output of outputs) {
    const skillDir = join(targetRoot, output.name);
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), output.content, "utf8");
  }
}

async function collectTree(root: string): Promise<Map<string, TreeEntry>> {
  const tree = new Map<string, TreeEntry>();

  if (!existsSync(root)) {
    return tree;
  }

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const absolutePath = join(dir, entry.name);
      const relativePath = relative(root, absolutePath).split(sep).join("/");

      if (entry.isDirectory()) {
        tree.set(relativePath, { type: "dir" });
        await walk(absolutePath);
        continue;
      }

      if (entry.isFile()) {
        tree.set(relativePath, {
          type: "file",
          content: await readFile(absolutePath, "utf8"),
        });
      }
    }
  }

  await walk(root);
  return tree;
}

async function diffTrees(expectedRoot: string, actualRoot: string): Promise<Diff[]> {
  const expected = await collectTree(expectedRoot);
  const actual = await collectTree(actualRoot);
  const paths = Array.from(new Set([...expected.keys(), ...actual.keys()])).sort();
  const diffs: Diff[] = [];

  for (const path of paths) {
    const expectedEntry = expected.get(path);
    const actualEntry = actual.get(path);

    if (!expectedEntry) {
      diffs.push({ type: "extra", path });
      continue;
    }

    if (!actualEntry) {
      diffs.push({ type: "missing", path });
      continue;
    }

    if (
      expectedEntry.type !== actualEntry.type ||
      (expectedEntry.type === "file" && expectedEntry.content !== actualEntry.content)
    ) {
      diffs.push({ type: "changed", path });
    }
  }

  return diffs;
}

export async function syncSkills(
  targetRoot = process.cwd(),
  options: { check?: boolean } = {},
): Promise<SyncResult> {
  const root = resolve(targetRoot);
  const targetRootPath = join(root, ".codex", "skills");
  const outputs = await collectSkillOutputs(root);

  if (!options.check) {
    await writeOutputs(targetRootPath, outputs);
    return { ok: true, count: outputs.length, diffs: [] };
  }

  const tempRoot = await mkdtemp(join(tmpdir(), "sync-skills-"));
  const expectedRoot = join(tempRoot, "skills");

  try {
    await writeOutputs(expectedRoot, outputs);
    const diffs = await diffTrees(expectedRoot, targetRootPath);
    return { ok: diffs.length === 0, count: outputs.length, diffs };
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

function parseArgs(argv: string[]): { check: boolean; root: string } {
  const positional: string[] = [];
  let check = false;

  for (const arg of argv) {
    if (arg === "--check") {
      check = true;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  if (positional.length > 1) {
    throw new Error("Expected at most one positional argument: target project root");
  }

  return {
    check,
    root: positional[0] ?? process.cwd(),
  };
}

function printDiffs(diffs: Diff[]): void {
  for (const diff of diffs) {
    console.error(`${diff.type}: ${diff.path}`);
  }
}

if (import.meta.main) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = await syncSkills(args.root, { check: args.check });

    if (!result.ok) {
      console.error(".codex/skills is out of sync. Run bun run scripts/sync-skills.ts.");
      printDiffs(result.diffs);
      process.exit(1);
    }

    if (args.check) {
      console.log(`.codex/skills is in sync (${result.count} skills).`);
    } else {
      console.log(`Synced ${result.count} skills into .codex/skills.`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
