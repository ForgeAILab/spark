import { betterAuth } from 'better-auth';

type BetterAuthOptions = Parameters<typeof betterAuth>[0];

export type AuthInstance = ReturnType<typeof betterAuth>;

export type CreateAuthOptions = {
  adapter: BetterAuthOptions['database'];
  basePath?: BetterAuthOptions['basePath'];
  plugins?: BetterAuthOptions['plugins'];
  emailAndPassword?: BetterAuthOptions['emailAndPassword'];
  socialProviders?: BetterAuthOptions['socialProviders'];
  secret?: BetterAuthOptions['secret'];
  baseURL?: BetterAuthOptions['baseURL'];
  trustedOrigins?: string[];
};

export function createAuth({
  adapter,
  basePath,
  plugins,
  emailAndPassword,
  socialProviders,
  secret,
  baseURL,
  trustedOrigins,
}: CreateAuthOptions) {
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
