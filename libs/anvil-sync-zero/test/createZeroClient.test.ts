import { describe, expect, test } from 'bun:test';
import type { ZeroOptions } from '@rocicorp/zero';
import { createZeroClient } from '../src/createZeroClient.ts';
import { defineZeroSchema, string, table } from '../src/defineZeroSchema.ts';

describe('createZeroClient', () => {
  test('returns a client when given mock options', async () => {
    const users = table('users')
      .columns({
        id: string(),
      })
      .primaryKey('id');
    const { schema } = defineZeroSchema({ tables: [users] });

    const client = createZeroClient({
      cacheURL: 'http://localhost:4848',
      kvStore: 'mem',
      schema,
      userID: 'test-user',
    } satisfies ZeroOptions);

    expect(client).toBeDefined();
    expect(client.schema).toBe(schema);

    await client.close();
  });
});
