import {
  ANYONE_CAN,
  createBuilder,
  createSchema,
  definePermissions,
  number,
  string,
  table,
} from '@rocicorp/zero';
import type { AuthData } from './mutators';

const users = table('user')
  .columns({
    id: string(),
    name: string(),
    email: string(),
    image: string(),
    created_at: number(),
    updated_at: number(),
  })
  .primaryKey('id');

const posts = table('posts')
  .columns({
    id: string(),
    user_id: string(),
    title: string(),
    body: string(),
    created_at: number(),
  })
  .primaryKey('id');

export const schema = createSchema({
  tables: [users, posts],
  // Register ad-hoc `createBuilder(schema)` queries (e.g. the posts panel's
  // `useQuery(zql.posts...)`) as durable server-synced queries against
  // zero-cache. Without this, Zero 1.5 skips the legacy query registration, so
  // an optimistic mutation is rebased on server-ack with no synced snapshot to
  // replace it — and the row silently never appears in the live query.
  enableLegacyQueries: true,
});
export const zql = createBuilder(schema);

export type Schema = typeof schema;

// Permissions are evaluated by zero-cache. v1 of the reference app keeps
// reads wide-open so anyone signed in can subscribe to all rows; writes are
// guarded by the custom mutator in `lib/zero/mutators.ts` (which checks
// `authData.sub` before inserting). Deploy with:
//   bun run zero:permissions
export const permissions = definePermissions<AuthData, Schema>(schema, () => ({
  user: { row: { select: ANYONE_CAN } },
  posts: { row: { select: ANYONE_CAN } },
}));

declare module '@rocicorp/zero' {
  interface DefaultTypes {
    schema: Schema;
  }
}
