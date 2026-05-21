import { describe, expect, test } from 'bun:test';
import { parseTemplateToml } from '../src/parse.ts';

describe('parseTemplateToml', () => {
  test('stable + planned status both valid', () => {
    const stable = parseTemplateToml(`
name = "nextjs"
status = "stable"
provides = ["server", "static"]
description = "Next.js application template."
`);
    const planned = parseTemplateToml(`
name = "vite-react"
status = "planned"
provides = ["react", "static"]
description = "Vite React SPA template."
`);

    expect(stable.ok).toBe(true);
    expect(planned.ok).toBe(true);
  });

  test('unknown template capability rejected', () => {
    const result = parseTemplateToml(`
name = "nextjs"
status = "stable"
provides = ["unknown-template-capability"]
description = "Next.js application template."
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues?.join('\n')).toContain('provides.0');
    }
  });
});
