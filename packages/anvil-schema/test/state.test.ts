import { describe, expect, test } from 'bun:test';
import { StateFileSchema } from '../src/state.ts';

describe('StateFileSchema', () => {
  test('round-trips a sample state file', () => {
    const sample: ReturnType<typeof StateFileSchema.parse> = {
      schema_version: 1,
      installed_packs: [
        {
          name: 'db-sqlite',
          version: '1.0.0',
          files: ['lib/db.ts'],
          appended_blocks: [
            {
              to: '.env.example',
              marker: 'anvil:db-sqlite:env',
              content_hash: 'sha256:abc123',
            },
          ],
          env: ['DATABASE_URL'],
          tasks: ['DB-001'],
        },
      ],
    };

    const parsed = StateFileSchema.parse(sample);

    expect(parsed).toEqual(sample);
  });
});
