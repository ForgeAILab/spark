import { access } from 'node:fs/promises';
import { join } from 'node:path';

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function applyPreset(
  targetDir: string,
  presetName: string,
  monorepoRoot: string,
): Promise<void> {
  const cliPath = join(monorepoRoot, 'packages', 'cli', 'src', 'cli.ts');

  // TODO: Replace this subprocess fallback with a direct runPreset import once @app-skills/cli exports it.
  if (!(await exists(cliPath))) {
    throw new Error(`Cannot apply preset "${presetName}" because packages/cli/src/cli.ts does not exist yet.`);
  }

  const proc = Bun.spawn(['bun', '--bun', cliPath, 'preset', presetName], {
    cwd: targetDir,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`Preset "${presetName}" failed with exit code ${exitCode}.`);
  }
}
