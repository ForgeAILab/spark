#!/usr/bin/env bun
import { spawn } from 'node:child_process';
import { appDir, e2eEnv, setupE2EStack } from './stack';

await setupE2EStack();

const port = process.env.PORT ?? '3010';
const child = spawn('bun', ['--bun', 'next', 'dev', '-p', port], {
  cwd: appDir,
  env: { ...process.env, ...e2eEnv(), PORT: port },
  stdio: 'inherit',
});

let isStopping = false;

function stop(): void {
  if (isStopping) return;
  isStopping = true;
  child.kill('SIGTERM');
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 0 : 1));
});
