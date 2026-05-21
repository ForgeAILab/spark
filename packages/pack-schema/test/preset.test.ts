import { describe, expect, test } from 'bun:test';
import { parsePresetToml } from '../src/parse.ts';

describe('parsePresetToml', () => {
  test('packs array required', () => {
    const result = parsePresetToml(`
compatible_scaffolds = ["nextjs"]
`);

    expect(result.ok).toBe(false);
  });

  test('compatible_scaffolds required', () => {
    const result = parsePresetToml(`
packs = ["db-sqlite"]
`);

    expect(result.ok).toBe(false);
  });

  test('valid preset parses', () => {
    const result = parsePresetToml(`
name = "local-ai-mvp"
description = "Local-first AI MVP stack."
compatible_scaffolds = ["nextjs"]
packs = ["db-sqlite", "ai-openai"]
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.packs).toEqual(['db-sqlite', 'ai-openai']);
    }
  });
});
