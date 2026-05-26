import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { runValidate } from '../src/commands/validate.ts';

async function ws(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'spark-validate-'));
}

async function put(root: string, rel: string, body: string): Promise<void> {
  const full = join(root, rel);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, body);
}

const TRUTH_SPEC = `# demo Specification

## Purpose
A demo capability.

## Requirements
### Requirement: Demo Does Something
The system SHALL do something observable.

#### Scenario: It does the thing
- **WHEN** the user triggers it
- **THEN** the thing happens
`;

const DELTA_SPEC = `## ADDED Requirements

### Requirement: New Behavior
The system SHALL add a behavior.

#### Scenario: Added behavior works
- **WHEN** invoked
- **THEN** it works
`;

const TASKS_OK = `---
created_at: x
---

## 1. Section
- [ ] 1.1 A task
- [x] 1.2 Another
`;

describe('spark validate', () => {
  test('valid workspace returns no violations', async () => {
    const root = await ws();
    await put(root, 'docs/spark/specs/demo/spec.md', TRUTH_SPEC);
    await put(root, 'docs/spark/changes/c-2026-05-26/specs/demo/spec.md', DELTA_SPEC);
    await put(root, 'docs/spark/changes/c-2026-05-26/tasks.md', TASKS_OK);
    const v = await runValidate('docs/spark', root);
    expect(v).toEqual([]);
  });

  test('bad delta operation header is a violation', async () => {
    const root = await ws();
    await put(
      root,
      'docs/spark/changes/c-2026-05-26/specs/demo/spec.md',
      `## BOGUS Requirements\n\n### Requirement: X\nThe system SHALL x.\n\n#### Scenario: s\n- **WHEN** a\n- **THEN** b\n`,
    );
    const v = await runValidate('docs/spark', root);
    expect(v.some((x) => x.file.includes('spec.md'))).toBe(true);
  });

  test('requirement without a scenario is a violation', async () => {
    const root = await ws();
    await put(
      root,
      'docs/spark/specs/demo/spec.md',
      `# demo Specification\n\n## Requirements\n### Requirement: No Scenario\nThe system SHALL do a thing.\n`,
    );
    const v = await runValidate('docs/spark', root);
    expect(v.some((x) => /scenario/i.test(x.message))).toBe(true);
  });

  test('malformed tasks.md is a violation', async () => {
    const root = await ws();
    await put(root, 'docs/spark/changes/c-2026-05-26/specs/demo/spec.md', DELTA_SPEC);
    await put(
      root,
      'docs/spark/changes/c-2026-05-26/tasks.md',
      `## 1. Section\n- [ ] 1.1 First\n- [ ] 1.1 Duplicate id\n`,
    );
    const v = await runValidate('docs/spark', root);
    expect(v.some((x) => x.file.endsWith('tasks.md'))).toBe(true);
  });
});
