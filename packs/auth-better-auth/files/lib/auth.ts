import { createAuth as createBetterAuth } from '@forgeailab/spark-auth-better-auth';

// Wire your database adapter here. Example (drizzle + sqlite):
//
//   import { drizzleAdapter } from '@better-auth/drizzle-adapter';
//   import { db } from '@/lib/db';
//   import * as schema from '@/lib/db/schema';
//   const adapter = drizzleAdapter(db, { provider: 'sqlite', schema });
//
// Then pass the adapter into createAuth({ adapter, ... }).

export const auth = createBetterAuth({
  adapter: undefined as never, // TODO: replace with your drizzle adapter
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
});

export type Auth = typeof auth;
