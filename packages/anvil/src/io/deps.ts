export type DependencyCommand = {
  args: string[];
  cwd: string;
};

export type DependencyRunner = (command: DependencyCommand) => Promise<void>;

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export const defaultDependencyRunner: DependencyRunner = async ({ args, cwd }) => {
  const child = Bun.spawn(args, {
    cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const exitCode = await child.exited;
  if (exitCode !== 0) {
    throw new Error(`${args.join(' ')} failed with exit code ${exitCode}`);
  }
};

export async function installDependencies(
  projectRoot: string,
  runtimeDependencies: readonly string[],
  devDependencies: readonly string[],
  runner: DependencyRunner = defaultDependencyRunner,
): Promise<DependencyCommand[]> {
  const commands: DependencyCommand[] = [];
  const runtime = uniqueSorted(runtimeDependencies);
  const dev = uniqueSorted(devDependencies);

  if (runtime.length > 0) {
    const command = {
      args: ['bun', 'add', ...runtime],
      cwd: projectRoot,
    };
    await runner(command);
    commands.push(command);
  }

  if (dev.length > 0) {
    const command = {
      args: ['bun', 'add', '-d', ...dev],
      cwd: projectRoot,
    };
    await runner(command);
    commands.push(command);
  }

  return commands;
}
