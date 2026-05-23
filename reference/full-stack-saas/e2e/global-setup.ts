import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_URL = 'file:./.data/e2e.db';

export default async function globalSetup(): Promise<void> {
  const url = process.env.DATABASE_URL ?? DEFAULT_URL;
  process.env.DATABASE_URL = url;

  // bun:sqlite is bun-only, so we invoke the reset script under bun even when
  // Playwright's test workers run on node.
  const here = dirname(fileURLToPath(import.meta.url));
  const script = resolve(here, 'reset-db.ts');
  execFileSync('bun', [script], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });
}
