import {
  getSession as getAuthSession,
  requireSession as requireAuthSession,
} from '@forgeailab/spark-auth-better-auth';
import { auth } from '@/lib/auth';

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;
export type AuthenticatedSession = NonNullable<Session>;

type RequestWithHeaders = {
  headers: Headers;
};

export async function getSession(request?: Request | RequestWithHeaders): Promise<Session> {
  return getAuthSession(auth, request);
}

export async function requireSession(
  request?: Request | RequestWithHeaders,
): Promise<AuthenticatedSession> {
  return requireAuthSession(auth, request);
}
