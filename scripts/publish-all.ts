#!/usr/bin/env bun
// Publish every @forgeailab/spark-* package at the version already in its
// package.json.
//
// Two pre-publish transformations are applied per package, snapshotted, then
// restored after the publish completes (so local workspaces stay linked):
//   1) `workspace:*` dependency specifiers are rewritten to `^<version>` —
//      npm publish doesn't resolve the workspace protocol when invoked from
//      a workspace member directory.
//   2) `templates/`, `packs/`, and `presets/` are copied INSIDE the `spark`
//      and `create-spark` package directories so their npm tarballs are
//      self-contained. Consumers `bunx @forgeailab/create-spark` without a
//      surrounding monorepo and the CLI finds the catalog inside its own
//      published package.
//
// Usage:
//   bun run scripts/publish-all.ts          # publishes from current versions
//   bun run scripts/publish-all.ts --dry    # rewrites + tarballs but doesn't publish

import { readFileSync, writeFileSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const DRY = process.argv.includes('--dry');

// Topological order: depended-upon first.
const PACKAGES = [
  'packages/spark-schema',
  'packages/spark',
  'packages/create-spark',
];

// Per-package list of repo paths to copy INTO the package directory before
// publishing. Each entry is `[srcRelToRoot, dstRelToPackage]`. The publish
// script restores (deletes) these after the publish completes.
const CATALOG_BUNDLES: Record<string, Array<readonly [string, string]>> = {
  'packages/spark': [
    ['packs', 'packs'],
    ['presets', 'presets'],
    ['templates', 'templates'],
  ],
  'packages/create-spark': [
    ['packs', 'packs'],
    ['presets', 'presets'],
    ['templates', 'templates'],
    ['.claude/skills', '.claude/skills'],
    ['.codex/skills', '.codex/skills'],
    ['scripts/sync-skills.ts', 'scripts/sync-skills.ts'],
  ],
};

const root = process.cwd();

type Pkg = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  files?: string[];
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

const packageJsonSnapshots = new Map<string, string>();
const copiedCatalogPaths: string[] = [];

function restoreAll(): void {
  for (const [path, original] of packageJsonSnapshots) {
    writeFileSync(path, original);
  }
  for (const path of copiedCatalogPaths) {
    rmSync(path, { recursive: true, force: true });
  }
}

process.on('exit', () => restoreAll());
process.on('SIGINT', () => {
  restoreAll();
  process.exit(130);
});

for (const dir of PACKAGES) {
  const pkgPath = join(root, dir, 'package.json');
  const original = readFileSync(pkgPath, 'utf8');
  packageJsonSnapshots.set(pkgPath, original);

  const pkg = JSON.parse(original) as Pkg;
  const touchedDeps =
    rewriteWorkspaceDeps(pkg.dependencies) ||
    rewriteWorkspaceDeps(pkg.devDependencies) ||
    rewriteWorkspaceDeps(pkg.peerDependencies);

  let touchedFiles = false;
  const bundles = CATALOG_BUNDLES[dir];
  if (bundles) {
    // Copy catalog paths into the package + add them to `files`.
    const addedTopLevel = new Set<string>();
    for (const [srcRel, dstRel] of bundles) {
      const src = join(root, srcRel);
      const dst = join(root, dir, dstRel);
      if (!existsSync(src)) continue;
      cpSync(src, dst, { recursive: true, dereference: false });
      // Track top-level dir under the package so restore cleans the whole
      // subtree (including parent dirs that didn't exist before).
      addedTopLevel.add(dstRel.split('/')[0]);
    }
    for (const top of addedTopLevel) {
      copiedCatalogPaths.push(join(root, dir, top));
    }
    pkg.files = Array.from(new Set([...(pkg.files ?? []), ...addedTopLevel]));
    touchedFiles = true;
  }

  if (touchedDeps || touchedFiles) {
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
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
packageJsonSnapshots.clear();
copiedCatalogPaths.length = 0;
console.log('\nAll packages processed. Workspace deps + catalog dirs restored locally.');
