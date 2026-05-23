import { defineZeroSchema, number, string, table } from '@forgeailab/spark-sync-zero';

// Example schema. Replace with your app's tables.
const users = table('user')
  .columns({
    id: string(),
    name: string(),
    email: string(),
    createdAt: number(),
  })
  .primaryKey('id');

export const { schema, zql } = defineZeroSchema({
  tables: [users],
});

export type Schema = typeof schema;
