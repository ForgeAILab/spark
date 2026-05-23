import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PackManifest, TemplateManifest } from '@forgeailab/spark-schema';
import { runAdd } from '../src/commands/add.ts';
import { runCheck } from '../src/commands/check.ts';
import { runInfo } from '../src/commands/info.ts';
import type { DependencyCommand } from '../src/io/deps.ts';
import type { Registry } from '../src/io/registry.ts';

const helperPackage = '@forgeailab/spark-auth-better-auth';

type CapturedOutput = {
  logs: string[];
  errors: string[];
  output: Pick<Console, 'log' | 'error'>;
};

function captureOutput(): CapturedOutput {
  const logs: string[] = [];
  const errors: string[] = [];
  return {
    logs,
    errors,
    output: {
      log(message?: unknown) {
        logs.push(String(message ?? ''));
      },
      error(message?: unknown) {
        errors.push(String(message ?? ''));
      },
    },
  };
}

async function setupHybridFixture(packageJson = '{}\n') {
  const root = await mkdtemp(join(tmpdir(), 'spark-runtime-package-'));
  const projectRoot = join(root, 'project');
  const registryRoot = join(root, 'registry');
  const packRoot = join(registryRoot, 'packs', 'auth-better-auth');

  await mkdir(projectRoot, { recursive: true });
  await mkdir(join(packRoot, 'files', 'lib'), { recursive: true });
  await writeFile(join(projectRoot, 'spark.config.json'), '{"template":"nextjs","appName":"demo"}\n');
  await writeFile(join(projectRoot, 'package.json'), packageJson);
  await writeFile(join(packRoot, 'files', 'lib', 'auth.ts'), 'export const auth = true;\n');

  const manifest: PackManifest = {
    name: 'auth-better-auth',
    version: '1.0.0',
    category: 'auth',
    description: 'Better Auth hybrid pack',
    provides: ['auth'],
    requires: [],
    conflicts: [],
    requires_runtime: ['server'],
    compatible_scaffolds: ['nextjs'],
    dependencies: {
      runtime: ['nanoid'],
      dev: ['tsx'],
    },
    env: {
      required: [],
      optional: [],
    },
    files: [
      {
        mode: 'create',
        from: 'lib/auth.ts',
        to: 'lib/auth.ts',
      },
    ],
    runtime_package: {
      package: helperPackage,
      version: '^0.1',
    },
  };
  const template: TemplateManifest = {
    name: 'nextjs',
    status: 'stable',
    provides: ['server', 'static'],
    description: 'Next.js test template',
  };
  const registry: Registry = {
    root: registryRoot,
    packs: new Map([
      [
        'auth-better-auth',
        {
          name: 'auth-better-auth',
          manifest,
          dir: packRoot,
        },
      ],
    ]),
    presets: new Map(),
    templates: new Map([
      [
        'nextjs',
        {
          name: 'nextjs',
          manifest: template,
          dir: join(registryRoot, 'templates', 'nextjs'),
        },
      ],
    ]),
  };

  return {
    root,
    projectRoot,
    registry,
    config: { template: 'nextjs', appName: 'demo' },
  };
}

async function runHybridAdd(projectRoot: string, registry: Registry): Promise<DependencyCommand[]> {
  const commands: DependencyCommand[] = [];
  const { output } = captureOutput();

  await runAdd(['auth-better-auth'], {
    projectRoot,
    registry,
    config: { template: 'nextjs', appName: 'demo' },
    yes: true,
    output,
    dependencyRunner: async (command) => {
      commands.push(command);
    },
  });

  return commands;
}

describe('runtime packages', () => {
  test('published mode adds the helper package version range to the runtime bun add batch', async () => {
    const originalSparkRoot = process.env.SPARK_ROOT;
    delete process.env.SPARK_ROOT;

    try {
      const { projectRoot, registry } = await setupHybridFixture();
      const commands = await runHybridAdd(projectRoot, registry);
      const runtimeCommand = commands.find((command) => !command.args.includes('-d'));

      expect(runtimeCommand?.args.slice(0, 2)).toEqual(['bun', 'add']);
      expect(runtimeCommand?.args).toContain('nanoid');
      expect(runtimeCommand?.args).toContain(`${helperPackage}@^0.1`);
    } finally {
      if (originalSparkRoot === undefined) {
        delete process.env.SPARK_ROOT;
      } else {
        process.env.SPARK_ROOT = originalSparkRoot;
      }
    }
  });

  test('dev mode adds a file link when SPARK_ROOT points at a local helper package', async () => {
    const originalSparkRoot = process.env.SPARK_ROOT;

    try {
      const { root, projectRoot, registry } = await setupHybridFixture();
      const monorepoRoot = join(root, 'monorepo');
      const helperDir = join(monorepoRoot, 'libs', 'spark-auth-better-auth');
      await mkdir(helperDir, { recursive: true });
      await writeFile(join(helperDir, 'package.json'), '{"name":"@forgeailab/spark-auth-better-auth"}\n');
      process.env.SPARK_ROOT = monorepoRoot;

      const commands = await runHybridAdd(projectRoot, registry);
      const runtimeCommand = commands.find((command) => !command.args.includes('-d'));

      expect(runtimeCommand?.args).toContain(`file:${helperDir}`);
      expect(runtimeCommand?.args).not.toContain(`${helperPackage}@^0.1`);
    } finally {
      if (originalSparkRoot === undefined) {
        delete process.env.SPARK_ROOT;
      } else {
        process.env.SPARK_ROOT = originalSparkRoot;
      }
    }
  });

  test('info prints hybrid mode and the resolved helper specifier from package.json', async () => {
    const packageJson = JSON.stringify(
      {
        dependencies: {
          [helperPackage]: '0.1.4',
        },
      },
      null,
      2,
    );
    const { projectRoot, registry, config } = await setupHybridFixture(`${packageJson}\n`);
    const captured = captureOutput();

    await runInfo('auth-better-auth', projectRoot, captured.output, {
      registry,
      config,
    });

    const output = captured.logs.join('\n');
    expect(output).toContain('Install mode: hybrid');
    expect(output).toContain(
      'Runtime helper: @forgeailab/spark-auth-better-auth (range ^0.1, resolved 0.1.4)',
    );
  });

  test('check reports drift when an installed hybrid pack helper is absent from package.json', async () => {
    const { projectRoot, registry, config } = await setupHybridFixture();
    await runHybridAdd(projectRoot, registry);
    const captured = captureOutput();

    const report = await runCheck(projectRoot, captured.output, {
      registry,
      config,
    });

    expect(report.missingHelpers).toEqual([
      'auth-better-auth: helper package @forgeailab/spark-auth-better-auth missing from package.json',
    ]);
    expect(captured.errors.join('\n')).toContain('drift: helper packages');
    expect(captured.errors.join('\n')).toContain(
      'auth-better-auth: helper package @forgeailab/spark-auth-better-auth missing from package.json',
    );
  });
});
