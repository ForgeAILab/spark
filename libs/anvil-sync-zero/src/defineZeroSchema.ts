import {
  boolean,
  createBuilder,
  createSchema,
  enumeration,
  json,
  number,
  relationships,
  string,
  table,
} from '@rocicorp/zero';

export type ZeroSchemaBuilder = Parameters<typeof createSchema>[0];

export function defineZeroSchema<TBuilder extends ZeroSchemaBuilder>(builder: TBuilder) {
  const schema = createSchema(builder);
  const zql = createBuilder(schema);

  return {
    schema,
    zql,
  };
}

export type DefinedZeroSchema = ReturnType<typeof defineZeroSchema>;

export {
  boolean,
  createBuilder,
  createSchema,
  enumeration,
  json,
  number,
  relationships,
  string,
  table,
};
