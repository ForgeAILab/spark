#!/usr/bin/env bun
import postgres from 'postgres';
import { DDL } from '../lib/db/ddl';

const url = process.env.DATABASE_URL ?? 'postgres://anvil:anvil@localhost:5432/anvil';
const sql = postgres(url, { max: 1 });

await sql.unsafe(DDL);
console.log('[init-db] schema applied at ' + url);
await sql.end();
