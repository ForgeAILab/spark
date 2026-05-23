import {
  ANYONE_CAN,
  createBuilder,
  createSchema,
  definePermissions,
  number,
  string,
  table,
} from '@rocicorp/zero';

// Example schema. Replace with your app's tables.
const users = table('user')
  .columns({
    id: string(),
    name: string(),
    email: string(),
    createdAt: number(),
  })
  .primaryKey('id');

export const schema = createSchema({
  tables: [users],
});
export const zql = createBuilder(schema);

export type Schema = typeof schema;

export const permissions = definePermissions<unknown, Schema>(schema, () => ({
  user: { row: { select: ANYONE_CAN } },
}));
