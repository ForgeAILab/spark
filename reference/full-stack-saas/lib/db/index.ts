import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/lib/db/schema';

const DEFAULT_URL = 'postgres://anvil:anvil@localhost:5432/anvil';
const url = process.env.DATABASE_URL ?? DEFAULT_URL;

export const sql = postgres(url, { max: 10 });
export const db = drizzle(sql, { schema });
export type Db = typeof db;
