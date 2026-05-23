import { describe, expect, test } from 'bun:test';
import {
  parseSkillFrontmatter,
  serializeSkillFrontmatter,
  toCodexFrontmatter,
} from '../src/index.ts';

const newPackFixture = `---
name: new-pack
description: Scaffold a new local feature-pack directory under \`packs/\` with a minimal manifest, empty files and skills directories, and an empty task stub. Use when a needed capability has no v1 pack.
allowed-tools:
  - Read
  - Write
  - Bash
---

# Skill: new-pack

## Goal

Create a minimal pack skeleton that a human or executor can fill in later.
`;

describe('spark-skill-utils', () => {
  test('parse then serialize keeps the body verbatim', () => {
    const parsed = parseSkillFrontmatter(newPackFixture);
    const roundTrip = `---\n${serializeSkillFrontmatter(parsed.frontmatter)}\n---\n${parsed.body}`;

    expect(roundTrip).toBe(newPackFixture);
    expect(parsed.body).toBe(`\n# Skill: new-pack

## Goal

Create a minimal pack skeleton that a human or executor can fill in later.
`);
  });

  test('transforms Claude frontmatter to the Codex shape', () => {
    const { frontmatter } = parseSkillFrontmatter(newPackFixture);
    const codex = toCodexFrontmatter(frontmatter);

    expect(codex).toEqual({
      name: 'new-pack',
      description:
        'Scaffold a new local feature-pack directory under `packs/` with a minimal manifest, empty files and skills directories, and an empty task stub. Use when a needed capability has no v1 pack.',
    });
    expect(serializeSkillFrontmatter(codex)).toBe(
      'name: new-pack\n' +
        'description: Scaffold a new local feature-pack directory under `packs/` with a minimal manifest, empty files and skills directories, and an empty task stub. Use when a needed capability has no v1 pack.',
    );
  });

  test('malformed frontmatter reports a missing closing delimiter', () => {
    expect(() =>
      parseSkillFrontmatter(`---
name: broken
description: Missing the closing delimiter.
`),
    ).toThrow('SKILL.md frontmatter is missing a closing --- delimiter');
  });
});
