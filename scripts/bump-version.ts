#!/usr/bin/env bun
// Bump all publishable @forgeailab/spark-* packages to the same version.
//
// Usage:
//   bun run scripts/bump-version.ts 0.1.1
//   bun run scripts/bump-version.ts 0.2.0 --tag
//
// With --tag, commits the bump and creates a `v<version>` git tag (you still
// `git push --follow-tags` yourself).

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const version = args.find((a) => !a.startsWith('--'));
const tagFlag = args.includes('--tag');

if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error('usage: bun run scripts/bump-version.ts <semver> [--tag]');
  console.error('example: bun run scripts/bump-version.ts 0.1.1 --tag');
  process.exit(1);
}

const root = process.cwd();
const targets: string[] = [
  join(root, 'packages/spark-schema/package.json'),
  join(root, 'packages/spark/package.json'),
  join(root, 'packages/create-spark/package.json'),
];

let changed = 0;
for (const path of targets) {
  const pkg = JSON.parse(readFileSync(path, 'utf8')) as { name: string; version?: string };
  if (pkg.version === version) {
    console.log(`= ${pkg.name} already at ${version}`);
    continue;
  }
  pkg.version = version;
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`✓ ${pkg.name} -> ${version}`);
  changed += 1;
}

console.log(`\nBumped ${changed} of ${targets.length} package.json files to ${version}.`);

if (!tagFlag) {
  console.log('Next: review the diff, then commit + tag manually:');
  console.log(`  git commit -am 'release v${version}'`);
  console.log(`  git tag v${version}`);
  console.log('  git push --follow-tags');
  process.exit(0);
}

function run(cmd: string, ...rest: string[]): void {
  console.log(`$ ${cmd} ${rest.join(' ')}`);
  const result = spawnSync(cmd, rest, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`Command failed: ${cmd} ${rest.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

run('git', 'add', '-A');
run('git', 'commit', '-m', `release v${version}`);
run('git', 'tag', `v${version}`);
console.log(`\nTagged v${version}. Run \`git push --follow-tags\` to release.`);
