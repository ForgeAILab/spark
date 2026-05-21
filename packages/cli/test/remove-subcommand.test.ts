import { expect, test } from 'bun:test';

test('remove is an unknown subcommand that points users to git revert', async () => {
  const cliPath = new URL('../src/cli.ts', import.meta.url).pathname;
  const child = Bun.spawn(['bun', cliPath, 'remove', 'db-sqlite'], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  const output = `${stdout}\n${stderr}`;

  expect(exitCode).not.toBe(0);
  expect(output).toContain('unknown subcommand');
  expect(output).toContain('git revert');
});
