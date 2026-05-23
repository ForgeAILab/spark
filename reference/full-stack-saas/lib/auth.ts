import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { createAuth as createBetterAuth } from '@forgeailab/spark-auth-better-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';

// Mirrors the `auth-better-auth-pg` pack template, with two production-grade
// additions enabled: real schema aliases (we own the schema in this repo) and
// the GitHub OAuth provider.

const DEV_SECRET =
  'reference-dev-secret-change-me-reference-dev-secret-change-me';

function env(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function resolveTrustedOrigins(baseURL: string): string[] {
  const fromEnv = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (fromEnv) {
    return fromEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const origins = new Set<string>([baseURL]);

  if (process.env.NODE_ENV !== 'production') {
    for (const port of [3000, 3001, 3002, 3003, 3010, 4000, 5173, 8080]) {
      origins.add(`http://localhost:${port}`);
      origins.add(`http://127.0.0.1:${port}`);
    }
  }

  return [...origins];
}

export function createAuthDatabase() {
  return drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  });
}

type CreateAuthOptions = {
  database?: ReturnType<typeof createAuthDatabase>;
};

export function createAuth(options: CreateAuthOptions = {}) {
  const baseURL = env('BETTER_AUTH_URL', 'http://localhost:3000');

  return createBetterAuth({
    adapter: options.database ?? createAuthDatabase(),
    baseURL,
    secret: env('BETTER_AUTH_SECRET', DEV_SECRET),
    trustedOrigins: resolveTrustedOrigins(baseURL),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      github: {
        clientId: env('GITHUB_CLIENT_ID', 'github-client-id'),
        clientSecret: env('GITHUB_CLIENT_SECRET', 'github-client-secret'),
      },
    },
  });
}

export const auth = createAuth();
export type Auth = typeof auth;
