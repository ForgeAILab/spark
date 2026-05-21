import { createSchema, string, table } from "@rocicorp/zero";

const users = table("users")
  .columns({
    id: string(),
    name: string(),
  })
  .primaryKey("id");

export const schema = createSchema({
  tables: [users],
});

export type Schema = typeof schema;

declare module "@rocicorp/zero" {
  interface DefaultTypes {
    schema: Schema;
  }
}
