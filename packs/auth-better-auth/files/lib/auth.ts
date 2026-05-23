import { betterAuth } from 'better-auth';

type BetterAuthOptions = Parameters<typeof betterAuth>[0];

export type AuthInstance = ReturnType<typeof betterAuth>;

export type CreateBetterAuthOptions = {
  adapter: BetterAuthOptions['database'];
  basePath?: BetterAuthOptions['basePath'];
  plugins?: BetterAuthOptions['plugins'];
  emailAndPassword?: BetterAuthOptions['emailAndPassword'];
  socialProviders?: BetterAuthOptions['socialProviders'];
  secret?: BetterAuthOptions['secret'];
  baseURL?: BetterAuthOptions['baseURL'];
  trustedOrigins?: string[];
};

export function createBetterAuth({
  adapter,
  basePath,
  plugins,
  emailAndPassword,
  socialProviders,
  secret,
  baseURL,
  trustedOrigins,
}: CreateBetterAuthOptions) {
  const authOptions: BetterAuthOptions = {
    database: adapter,
    basePath,
    plugins,
    emailAndPassword,
    socialProviders,
    secret,
    baseURL,
    trustedOrigins: trustedOrigins ?? (typeof baseURL === 'string' ? [baseURL] : undefined),
  };

  return betterAuth(authOptions);
}

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
