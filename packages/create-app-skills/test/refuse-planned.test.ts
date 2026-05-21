import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { PLANNED_TEMPLATE_MESSAGE } from '../src/cli.ts';

const plannedTemplates = ['astro', 'astro-starlight', 'vite-react', 'one'] as const;

async function createTemplateRegistry(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'create-app-skills-planned-'));
  const manifests = [
    {
      name: 'nextjs',
      status: 'stable',
      provides: ['server', 'static', 'react'],
      description: 'Next.js application template.',
    },
    {
      name: 'astro',
      status: 'planned',
      provides: ['server', 'static', 'mdx-content'],
      description: 'Astro content site template.',
    },
    {
      name: 'astro-starlight',
      status: 'planned',
      provides: ['static', 'mdx-content'],
      description: 'Astro Starlight documentation template.',
    },
    {
      name: 'vite-react',
      status: 'planned',
      provides: ['static', 'react'],
      description: 'Vite React SPA template.',
    },
    {
      name: 'one',
      status: 'planned',
      provides: ['server', 'static', 'react', 'native'],
      description: 'One full-stack web and native template.',
    },
  ] as const;

  await Promise.all(
    manifests.map(async (template) => {
      const dir = join(root, template.name);
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, 'template.toml'),
        [
          `name = "${template.name}"`,
          `status = "${template.status}"`,
          `provides = [${template.provides.map((capability) => `"${capability}"`).join(', ')}]`,
          `description = "${template.description}"`,
          '',
        ].join('\n'),
      );
    }),
  );

  return root;
}

async function runCli(templateName: string, templatesDir: string): Promise<{
  exitCode: number;
  stderr: string;
  stdout: string;
}> {
  const cliPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'cli.ts');
  const workspace = await mkdtemp(join(tmpdir(), 'create-app-skills-run-'));

  try {
    const proc = Bun.spawn(
      ['bun', '--bun', cliPath, 'my-app', '--template', templateName, '--yes'],
      {
        cwd: workspace,
        env: {
          ...process.env,
          CREATE_APP_SKILLS_TEMPLATES_DIR: templatesDir,
          NO_COLOR: '1',
        },
        stdout: 'pipe',
        stderr: 'pipe',
      },
    );

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    return { exitCode, stderr, stdout };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

describe('planned template refusal', () => {
  for (const templateName of plannedTemplates) {
    test(`${templateName} exits non-zero with the canonical message`, async () => {
      const templatesDir = await createTemplateRegistry();

      try {
        const result = await runCli(templateName, templatesDir);

        expect(result.exitCode).not.toBe(0);
        expect(`${result.stderr}\n${result.stdout}`).toContain(templateName);
        expect(`${result.stderr}\n${result.stdout}`).toContain(PLANNED_TEMPLATE_MESSAGE);
      } finally {
        await rm(templatesDir, { recursive: true, force: true });
      }
    });
  }
});
