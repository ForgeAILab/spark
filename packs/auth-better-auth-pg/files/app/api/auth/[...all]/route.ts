import { createAuthHandler } from '@forgeailab/spark-auth-better-auth';
import { auth } from '@/lib/auth';

export const { GET, POST } = createAuthHandler(auth);
