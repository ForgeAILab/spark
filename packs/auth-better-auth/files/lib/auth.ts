import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  // Wire the active db adapter here before production use, for example:
  // database: drizzleAdapter(db, { provider: 'sqlite' }),
});
