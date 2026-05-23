import { createAuthHandler } from '@forgeailab/anvil-auth-better-auth';
import { auth } from '@/lib/auth';

export const { GET, POST } = createAuthHandler(auth);
