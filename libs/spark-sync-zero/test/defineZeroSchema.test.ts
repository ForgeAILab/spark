import { describe, expect, test } from 'bun:test';
import { defineZeroSchema, string, table } from '../src/defineZeroSchema.ts';

describe('defineZeroSchema', () => {
  test('builds a schema object with expected tables shape', () => {
    const projects = table('projects')
      .columns({
        id: string(),
        name: string(),
      })
      .primaryKey('id');

    const { schema, zql } = defineZeroSchema({
      tables: [projects],
    });

    expect(Object.keys(schema.tables)).toEqual(['projects']);
    expect(Object.keys(schema.tables.projects.columns)).toEqual(['id', 'name']);
    expect(zql.projects).toBeDefined();
  });
});
