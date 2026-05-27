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

const newVersion = `${version}`;
const root = process.cwd();
const targets: string[] = [
  join(root, 'packages/spark-schema/package.json'),
  join(root, 'packages/spark/package.json'),
  join(root, 'packages/create-spark/package.json'),
  join(root, '.claude-plugin/plugin.json'),
];

let changed = 0;
let total = 0;
for (const path of targets) {
  const pkg = JSON.parse(readFileSync(path, 'utf8')) as { name: string; version?: string };
  total += 1;
  if (pkg.version === newVersion) {
    console.log(`= ${pkg.name} already at ${newVersion}`);
    continue;
  }
  pkg.version = newVersion;
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`✓ ${pkg.name} -> ${newVersion}`);
  changed += 1;
}

const marketplacePath = join(root, '.claude-plugin/marketplace.json');
const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf8')) as {
  plugins?: Array<{ name?: string; version?: string }>;
};

if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
  throw new Error(`${marketplacePath} must contain a non-empty plugins array.`);
}

let marketplaceChanged = false;
for (const plugin of marketplace.plugins) {
  if (typeof plugin.name !== 'string' || plugin.name.length === 0) {
    throw new Error(`${marketplacePath} contains a plugin without a name.`);
  }

  total += 1;
  if (plugin.version === newVersion) {
    console.log(`= ${plugin.name} already at ${newVersion}`);
    continue;
  }
  plugin.version = newVersion;
  marketplaceChanged = true;
  console.log(`✓ ${plugin.name} -> ${newVersion}`);
  changed += 1;
}

if (marketplaceChanged) {
  writeFileSync(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`);
}

console.log(`\nBumped ${changed} of ${total} version targets to ${newVersion}.`);

if (!tagFlag) {
  console.log('Next: review the diff, then commit + tag manually:');
  console.log(`  git commit -am 'release v${newVersion}'`);
  console.log(`  git tag v${newVersion}`);
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
run('git', 'commit', '-m', `release v${newVersion}`);
// Annotated (not lightweight) so `git push --follow-tags` actually pushes it —
// --follow-tags ignores lightweight tags, which silently skips the release tag.
run('git', 'tag', '-a', `v${newVersion}`, '-m', `release v${newVersion}`);
console.log(`\nTagged v${newVersion}. Run \`git push --follow-tags\` to release.`);
