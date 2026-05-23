#!/usr/bin/env bun
import postgres from 'postgres';
import { DDL } from '../lib/db/ddl';

const url = process.env.DATABASE_URL ?? 'postgres://anvil:anvil@localhost:5432/anvil_e2e';
const sql = postgres(url, { max: 1 });

await sql.unsafe('DROP TABLE IF EXISTS posts, verification, account, session, "user" CASCADE;');
await sql.unsafe(DDL);
console.log('[e2e] reset database at ' + url);
await sql.end();
