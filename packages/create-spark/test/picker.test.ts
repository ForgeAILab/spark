import { describe, expect, test } from 'bun:test';
import {
  filterAuthByDb,
  filterSyncByDb,
  parsePacksFlag,
  recommendedFor,
  type PickerPack,
} from '../src/picker.ts';

function pack(name: string, category: string, provides: readonly string[] = []): PickerPack {
  return {
    name,
    category,
    description: `${name} description`,
    provides,
    requires: [],
  };
}

const authPacks = [
  pack('auth-better-auth', 'auth', ['auth']),
  pack('auth-better-auth-pg', 'auth', ['auth']),
  pack('auth-supabase', 'auth', ['auth']),
];

const syncPacks = [pack('sync-zero', 'infra', ['sync'])];

describe('pack picker pure helpers', () => {
  test('parsePacksFlag trims comma-separated pack names', () => {
    expect(parsePacksFlag('db-postgres,sync-zero ')).toEqual(['db-postgres', 'sync-zero']);
  });

  test('filterAuthByDb selects sqlite-compatible auth', () => {
    expect(filterAuthByDb(authPacks, 'db-sqlite').map((candidate) => candidate.name)).toEqual([
      'auth-better-auth',
    ]);
  });

  test('filterAuthByDb selects postgres-compatible auth', () => {
    expect(filterAuthByDb(authPacks, 'db-postgres').map((candidate) => candidate.name)).toEqual([
      'auth-better-auth-pg',
    ]);
  });

  test('filterSyncByDb hides sync for sqlite', () => {
    expect(filterSyncByDb(syncPacks, 'db-sqlite')).toEqual([]);
  });

  test('filterSyncByDb offers sync for postgres', () => {
    expect(filterSyncByDb(syncPacks, 'db-postgres').map((candidate) => candidate.name)).toEqual([
      'sync-zero',
    ]);
  });

  test('recommendedFor chooses postgres auth default', () => {
    expect(recommendedFor('auth', 'db-postgres')).toBe('auth-better-auth-pg');
  });
});
