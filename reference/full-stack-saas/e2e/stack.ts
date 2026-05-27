import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const DEFAULT_URL = 'postgres://spark:spark@localhost:5432/spark_e2e';
const DEFAULT_ZERO_URL = 'http://localhost:4848';
const STATE_FILE = '/tmp/full-stack-saas-e2e-stack.json';

const here = dirname(fileURLToPath(import.meta.url));
export const appDir = resolve(here, '..');

type StackState = {
  databaseUrl: string;
  zeroDb: string;
  zeroUrl: string;
  composeFiles: string[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function databaseName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, '') || 'spark_e2e';
  } catch {
    return 'spark_e2e';
  }
}

function composeFiles(): string[] {
  const extraFiles = (process.env.E2E_DOCKER_COMPOSE_FILES ?? '')
    .split(':')
    .map((file) => file.trim())
    .filter(Boolean);

  return [resolve(appDir, 'docker-compose.yml'), ...extraFiles];
}

function composeArgs(args: string[]): string[] {
  return [
    'compose',
    ...composeFiles().flatMap((file) => ['-f', file]),
    ...args,
  ];
}

function stackState(): StackState {
  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_URL;
  const zeroUrl = process.env.NEXT_PUBLIC_ZERO_URL ?? DEFAULT_ZERO_URL;
  const zeroDb = process.env.ZERO_E2E_DB ?? databaseName(databaseUrl);

  return {
    databaseUrl,
    zeroDb,
    zeroUrl,
    composeFiles: composeFiles(),
  };
}

export function e2eEnv(): Record<string, string> {
  const state = stackState();

  return {
    DATABASE_URL: state.databaseUrl,
    NEXT_PUBLIC_ZERO_URL: state.zeroUrl,
    ZERO_E2E_DB: state.zeroDb,
  };
}

function run(command: string, args: string[], env: Record<string, string> = {}): void {
  console.log(`[e2e] $ ${[command, ...args].join(' ')}`);
  execFileSync(command, args, {
    cwd: appDir,
    env: { ...process.env, ...e2eEnv(), ...env },
    stdio: 'inherit',
  });
}

function read(command: string, args: string[]): string {
  return execFileSync(command, args, {
    cwd: appDir,
    env: { ...process.env, ...e2eEnv() },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .toString()
    .trim();
}

async function waitForPostgres(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const status = read('docker', [
        'inspect',
        '-f',
        '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}',
        'spark-ref-postgres',
      ]);
      if (status === 'healthy') {
        console.log('[e2e] postgres is healthy');
        return;
      }
    } catch {
      // Container may not exist yet.
    }

    await sleep(1_000);
  }

  throw new Error('Timed out waiting for spark-ref-postgres to become healthy');
}

async function waitForZero(url: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      console.log(`[e2e] zero-cache is serving at ${url} (${response.status})`);
      return;
    } catch {
      await sleep(1_000);
    }
  }

  throw new Error(`Timed out waiting for zero-cache at ${url}`);
}

// Create the databases zero-cache and the app need, independent of the compose
// `docker-entrypoint-initdb.d` script. That init script only runs on a fresh
// volume AND requires its bind mount to be shareable into the Docker VM — both
// assumptions break easily (reused volumes, repos on unshared mounts). Creating
// them here over TCP keeps the harness self-contained and idempotent.
async function ensureDatabases(): Promise<void> {
  const state = stackState();
  const adminUrl = new URL(state.databaseUrl);
  adminUrl.pathname = '/postgres';

  const required = [state.zeroDb, 'spark_cvr', 'spark_change'];
  const sql = postgres(adminUrl.toString(), { max: 1 });
  try {
    for (const name of required) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        throw new Error(`Refusing to create database with unsafe name: ${name}`);
      }
      const rows = await sql`SELECT 1 FROM pg_database WHERE datname = ${name}`;
      if (rows.length === 0) {
        await sql.unsafe(`CREATE DATABASE "${name}"`);
        console.log(`[e2e] created database "${name}"`);
      }
    }
  } finally {
    await sql.end();
  }
}

function isCurrentState(state: StackState): boolean {
  if (!existsSync(STATE_FILE)) return false;

  try {
    const current = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as StackState;
    return JSON.stringify(current) === JSON.stringify(state);
  } catch {
    return false;
  }
}

export async function setupE2EStack(): Promise<void> {
  const state = stackState();

  process.env.DATABASE_URL = state.databaseUrl;
  process.env.NEXT_PUBLIC_ZERO_URL = state.zeroUrl;
  process.env.ZERO_E2E_DB = state.zeroDb;

  if (isCurrentState(state)) {
    console.log('[e2e] postgres/zero-cache stack already provisioned');
    await waitForZero(state.zeroUrl);
    return;
  }

  run('docker', composeArgs(['down', '-v', '--remove-orphans']));
  run('docker', composeArgs(['up', '-d', 'postgres']));
  await waitForPostgres();
  await ensureDatabases();

  run('bun', [resolve(here, 'reset-db.ts')]);
  run('bunx', [
    'zero-deploy-permissions',
    '--schema-path=./lib/zero/schema.ts',
    `--upstream-db=${state.databaseUrl}`,
  ]);
  run('docker', composeArgs(['up', '-d', 'zero-cache']));
  await waitForZero(state.zeroUrl);

  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function teardownE2EStack(): void {
  run('docker', composeArgs(['down', '-v', '--remove-orphans']));
  rmSync(STATE_FILE, { force: true });
}
