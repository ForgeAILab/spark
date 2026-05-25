import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, expect, test } from "bun:test";
import { transformSkillMarkdown } from "./sync-skills";

const scriptPath = join(import.meta.dir, "sync-skills.ts");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

test("frontmatter parse + transform produces expected Codex output", () => {
  const source = `---
name: sample-skill
description: >
  Use this skill for sample work.
  Keep the body unchanged.
allowed-tools:
  - Read
  - Bash
model: opus
---

# Skill: sample-skill

Body text.
`;

  expect(transformSkillMarkdown(source, "sample-skill")).toBe(`---
name: sample-skill
description: >
  Use this skill for sample work.
  Keep the body unchanged.
model: opus
# Generated from .claude/skills/sample-skill/SKILL.md — DO NOT EDIT directly
---

# Skill: sample-skill

Body text.
`);
});

test("--check mode exits non-zero when source has been touched but mirror has not", async () => {
  const root = await createTempProject();
  await writeSkill(root, "sample-skill", "Original description.");
  expect((await runSync(root)).exitCode).toBe(0);

  await writeSkill(root, "sample-skill", "Updated description.");
  const mirrorBeforeCheck = await readFile(
    join(root, ".codex", "skills", "sample-skill", "SKILL.md"),
    "utf8",
  );
  const result = await runSync(root, "--check");
  const mirrorAfterCheck = await readFile(
    join(root, ".codex", "skills", "sample-skill", "SKILL.md"),
    "utf8",
  );

  expect(result.exitCode).not.toBe(0);
  expect(`${result.stdout}\n${result.stderr}`).toContain(".codex/skills is out of sync");
  expect(mirrorAfterCheck).toBe(mirrorBeforeCheck);
});

test("--check mode exits 0 when in sync", async () => {
  const root = await createTempProject();
  await writeSkill(root, "sample-skill", "Synced description.");

  expect((await runSync(root)).exitCode).toBe(0);
  const result = await runSync(root, "--check");

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain(".codex/skills is in sync");
});

test("mirrors non-SKILL.md files in a skill folder verbatim", async () => {
  const root = await createTempProject();
  await writeSkill(root, "sample-skill", "Has references.");
  const refPath = join(root, ".claude", "skills", "sample-skill", "references", "guide.md");
  await mkdir(dirname(refPath), { recursive: true });
  await writeFile(refPath, "# Reference\nVerbatim content.\n", "utf8");

  expect((await runSync(root)).exitCode).toBe(0);

  const mirrored = await readFile(
    join(root, ".codex", "skills", "sample-skill", "references", "guide.md"),
    "utf8",
  );
  expect(mirrored).toBe("# Reference\nVerbatim content.\n");
  expect((await runSync(root, "--check")).exitCode).toBe(0);
});

async function createTempProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "sync-skills-test-"));
  tempRoots.push(root);
  return root;
}

async function writeSkill(root: string, name: string, description: string): Promise<void> {
  const skillDir = join(root, ".claude", "skills", name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(
    join(skillDir, "SKILL.md"),
    `---
name: ${name}
description: ${description}
allowed-tools:
  - Read
---

# ${name}
`,
    "utf8",
  );
}

async function runSync(
  root: string,
  ...args: string[]
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([process.execPath, "run", scriptPath, ...args, root], {
    stderr: "pipe",
    stdout: "pipe",
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  return { exitCode, stdout, stderr };
}
