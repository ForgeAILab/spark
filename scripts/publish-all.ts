#!/usr/bin/env bun
// Publish every @forgeailab/spark-* package at the version already in its
// package.json. Before publishing each one, rewrite `workspace:*` deps to the
// concrete version range (`^<version>`) so consumers can resolve them on npm.
// After all publishes succeed, restores the original package.json files
// (workspace:* preserved on disk for local dev).
//
// Usage:
//   bun run scripts/publish-all.ts          # publishes from current versions
//   bun run scripts/publish-all.ts --dry    # rewrites + tarballs but doesn't publish

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const DRY = process.argv.includes('--dry');

// Topological order: depended-upon first.
const PACKAGES = [
  'packages/spark-schema',
  'libs/spark-skill-utils',
  'libs/spark-state',
  'libs/spark-board',
  'libs/spark-anthropic',
  'libs/spark-auth-better-auth',
  'libs/spark-sync-zero',
  'libs/spark-stripe-helpers',
  'packages/spark',
  'packages/create-spark',
];

const root = process.cwd();

type Pkg = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

function loadPackage(pkgDir: string): Pkg {
  return JSON.parse(readFileSync(join(root, pkgDir, 'package.json'), 'utf8')) as Pkg;
}

// Map every workspace pkg name -> current version for substitution.
const versionByName = new Map<string, string>();
for (const dir of PACKAGES) {
  const pkg = loadPackage(dir);
  versionByName.set(pkg.name, pkg.version);
}

function rewriteWorkspaceDeps(deps: Record<string, string> | undefined): boolean {
  if (!deps) return false;
  let touched = false;
  for (const [name, spec] of Object.entries(deps)) {
    if (spec.startsWith('workspace:')) {
      const target = versionByName.get(name);
      if (!target) {
        throw new Error(`${name} is workspace: but not in our publish set`);
      }
      deps[name] = `^${target}`;
      touched = true;
    }
  }
  return touched;
}

function run(cmd: string, args: string[], cwd: string): { code: number; stdout: string } {
  console.log(`  $ ${cmd} ${args.join(' ')} (in ${cwd})`);
  const result = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
  if (result.stdout) console.log(result.stdout.split('\n').slice(-5).join('\n'));
  if (result.stderr && result.status !== 0) console.error(result.stderr);
  return { code: result.status ?? 1, stdout: result.stdout ?? '' };
}

const snapshots = new Map<string, string>();

function restoreAll(): void {
  for (const [path, original] of snapshots) {
    writeFileSync(path, original);
  }
}

process.on('exit', () => restoreAll());
process.on('SIGINT', () => {
  restoreAll();
  process.exit(130);
});

for (const dir of PACKAGES) {
  const path = join(root, dir, 'package.json');
  const original = readFileSync(path, 'utf8');
  snapshots.set(path, original);

  const pkg = JSON.parse(original) as Pkg;
  const touched =
    rewriteWorkspaceDeps(pkg.dependencies) ||
    rewriteWorkspaceDeps(pkg.devDependencies) ||
    rewriteWorkspaceDeps(pkg.peerDependencies);

  if (touched) {
    writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  console.log(`\n=== ${pkg.name}@${pkg.version} ===`);
  const args = DRY ? ['pack', '--dry-run'] : ['publish'];
  const result = run('npm', args, join(root, dir));

  if (result.code !== 0) {
    if (!DRY && result.stdout.includes('cannot publish over')) {
      console.log('  (already published, skipping)');
      continue;
    }
    console.error(`Failed: ${pkg.name}`);
    process.exit(result.code);
  }
}

restoreAll();
snapshots.clear();
console.log('\nAll packages processed. Workspace deps restored locally.');
